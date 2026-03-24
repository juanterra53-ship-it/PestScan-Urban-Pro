import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';

interface Photo {
  id: string;
  url: string;
  timestamp: string;
}

interface InspectionData {
  clientName: string;
  address: string;
  pestType: string;
  severity: string;
  observations: string;
  location: {
    lat: number | null;
    lng: number | null;
  };
  photos: Photo[];
}

export default function App() {
  const [data, setData] = useState<InspectionData>({
    clientName: '',
    address: '',
    pestType: 'Baratas',
    severity: 'Baixa',
    observations: '',
    location: { lat: null, lng: null },
    photos: []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setData(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
        },
        (error) => console.error("Erro GPS:", error)
      );
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhoto: Photo = {
          id: Math.random().toString(36).substr(2, 9),
          url: reader.result as string,
          timestamp: new Date().toLocaleString()
        };
        setData(prev => ({
          ...prev,
          photos: [...prev.photos, newPhoto]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (id: string) => {
    setData(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p.id !== id)
    }));
  };

  const generatePDF = async () => {
    if (!data.clientName) {
      alert("Informe o nome do cliente.");
      return;
    }

    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text("Pest Scan Urban Pro", 10, 20);
      
      doc.setFontSize(12);
      doc.text(`Cliente: ${data.clientName}`, 10, 40);
      doc.text(`Endereço: ${data.address}`, 10, 50);
      doc.text(`Praga: ${data.pestType}`, 10, 60);
      doc.text(`Severidade: ${data.severity}`, 10, 70);
      doc.text(`GPS: ${data.location.lat}, ${data.location.lng}`, 10, 80);
      
      doc.text("Observações:", 10, 100);
      doc.text(data.observations || "Nenhuma", 10, 110);
      
      if (data.photos.length > 0) {
        doc.addPage();
        doc.text("Fotos:", 10, 20);
        let y = 30;
        data.photos.forEach((photo, i) => {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }
          doc.addImage(photo.url, 'JPEG', 10, y, 50, 40);
          y += 50;
        });
      }

      // ANDROID FIX
      const pdfData = doc.output('datauristring');
      const isAndroid = /Android/i.test(navigator.userAgent);

      if (isAndroid) {
        const link = document.createElement('a');
        link.href = pdfData;
        link.download = "relatorio.pdf";
        link.click();
      } else {
        doc.save("relatorio.pdf");
      }

      alert("Relatório gerado com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container">
      <h1>Pest Scan Urban Pro</h1>
      
      <label>Nome do Cliente</label>
      <input 
        type="text" 
        value={data.clientName} 
        onChange={e => setData({...data, clientName: e.target.value})} 
      />

      <label>Endereço</label>
      <input 
        type="text" 
        value={data.address} 
        onChange={e => setData({...data, address: e.target.value})} 
      />

      <label>Tipo de Praga</label>
      <select value={data.pestType} onChange={e => setData({...data, pestType: e.target.value})}>
        <option>Baratas</option>
        <option>Formigas</option>
        <option>Cupins</option>
        <option>Ratos</option>
        <option>Outros</option>
      </select>

      <label>Severidade</label>
      <select value={data.severity} onChange={e => setData({...data, severity: e.target.value})}>
        <option>Baixa</option>
        <option>Média</option>
        <option>Alta</option>
      </select>

      <label>Observações</label>
      <textarea 
        value={data.observations} 
        onChange={e => setData({...data, observations: e.target.value})} 
      />

      <label>Fotos</label>
      <input 
        type="file" 
        accept="image/*" 
        multiple 
        ref={fileInputRef} 
        onChange={handlePhotoUpload} 
      />

      <div className="photo-grid">
        {data.photos.map(photo => (
          <div key={photo.id} className="photo-item">
            <img src={photo.url} alt="foto" />
            <button className="remove-btn" onClick={() => removePhoto(photo.id)}>X</button>
          </div>
        ))}
      </div>

      <button onClick={generatePDF} disabled={isGenerating}>
        {isGenerating ? "Gerando..." : "Gerar Relatório PDF"}
      </button>

      <div style={{marginTop: '20px', fontSize: '12px', color: '#666'}}>
        GPS: {data.location.lat ? `${data.location.lat}, ${data.location.lng}` : "Buscando..."}
      </div>
    </div>
  );
}


import React, { useEffect, useRef, useState } from "react";

const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [flashOn, setFlashOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Erro ao acessar a câmera");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];

    // @ts-ignore
    const capabilities = track.getCapabilities();

    if (capabilities.torch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !flashOn }]
        });
        setFlashOn(!flashOn);
      } catch (err) {
        console.error("Erro ao ativar flash:", err);
      }
    } else {
      alert("Flash não suportado neste dispositivo");
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", background: "#000" }}>
      
      {error && (
        <div style={{ color: "red", position: "absolute", top: 10, left: 10 }}>
          {error}
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      <button
        onClick={toggleFlash}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 999,
          padding: "10px 15px",
          backgroundColor: flashOn ? "#ffd700" : "#333",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 16,
          cursor: "pointer"
        }}
      >
        {flashOn ? "🔦 Flash ON" : "🔦 Flash OFF"}
      </button>

    </div>
  );
};

export default Camera;

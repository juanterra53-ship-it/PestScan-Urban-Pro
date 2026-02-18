import React, { useEffect, useRef, useState } from "react";

const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [flashOn, setFlashOn] = useState(false);
  const [flashAvailable, setFlashAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;

      console.log("Camera Capabilities:", capabilities);

      if (capabilities && capabilities.torch) {
        setFlashAvailable(true);
      } else {
        setFlashAvailable(false);
      }

    } catch (err) {
      console.error("Erro ao iniciar câmera:", err);
      setError("Não foi possível acessar a câmera.");
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

    try {
      await track.applyConstraints({
        advanced: [{ torch: !flashOn }]
      } as any);

      setFlashOn(!flashOn);
    } catch (err) {
      console.error("Torch não suportado:", err);
      alert("Flash não suportado neste navegador.");
    }
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100%",
        backgroundColor: "#000"
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }}
      />

      {flashAvailable && (
        <button
          onClick={toggleFlash}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "none",
            fontSize: 28,
            cursor: "pointer",
            backgroundColor: flashOn ? "#FFD700" : "rgba(255,255,255,0.4)",
            color: "#000",
            boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
            transition: "0.2s"
          }}
        >
          ⚡
        </button>
      )}

      {!flashAvailable && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            color: "white",
            fontSize: 14,
            opacity: 0.7
          }}
        >
          Flash não disponível neste dispositivo
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            bottom: 50,
            left: 20,
            color: "red"
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default Camera;

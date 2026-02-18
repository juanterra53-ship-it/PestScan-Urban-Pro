import React, { useEffect, useRef, useState } from "react";

const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

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

      // Verifica suporte a flash
      const track = stream.getVideoTracks()[0];

      // @ts-ignore
      const capabilities = track.getCapabilities?.();

      if (capabilities && capabilities.torch) {
        setTorchSupported(true);
      }

    } catch (err) {
      console.error(err);
      setError("Erro ao acessar câmera");
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
    const capabilities = track.getCapabilities?.();

    if (capabilities && capabilities.torch) {
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
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        backgroundColor: "black",
        overflow: "hidden"
      }}
    >
      {error && (
        <div
          style={{
            color: "red",
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 1000
          }}
        >
          {error}
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }}
      />

      {torchSupported && (
        <button
          onClick={toggleFlash}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            padding: "16px",
            fontSize: "24px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: flashOn ? "orange" : "yellow",
            cursor: "pointer",
            zIndex: 2000
          }}
        >
          ⚡
        </button>
      )}
    </div>
  );
};

export default Camera;
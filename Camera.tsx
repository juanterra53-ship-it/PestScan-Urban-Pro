import React, { useEffect, useRef, useState } from "react";

const Camera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      if ("torch" in capabilities) {
        setHasTorch(true);
      }
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
  };

  const toggleFlash = async () => {
    if (!stream) return;

    const track = stream.getVideoTracks()[0];

    try {
      await track.applyConstraints({
        advanced: [{ torch: !flashOn }],
      } as any);

      setFlashOn(!flashOn);
    } catch (error) {
      console.log("Flash não suportado nesse dispositivo");
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {hasTorch && (
        <button
          onClick={toggleFlash}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            backgroundColor: flashOn ? "yellow" : "white",
            borderRadius: "50%",
            width: 60,
            height: 60,
            fontSize: 28,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 0 10px rgba(0,0,0,0.3)",
          }}
        >
          ⚡
        </button>
      )}
    </div>
  );
};

export default Camera;

import { useEffect, useRef, useState } from "react";

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [flashOn, setFlashOn] = useState(false);

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
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

    } catch (error) {
      console.error("Erro ao iniciar câmera:", error);
      alert("Não foi possível acessar a câmera.");
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
        advanced: [{ torch: !flashOn } as any]
      });

      setFlashOn(!flashOn);
    } catch (error) {
      console.log("Flash não suportado neste navegador.");
      alert("Flash não suportado neste navegador.");
    }
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        backgroundColor: "#000"
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
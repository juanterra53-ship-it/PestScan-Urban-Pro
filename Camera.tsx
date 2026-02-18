import { useEffect, useRef, useState } from "react";

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [flashOn, setFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);

  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const track = stream.getVideoTracks()[0];
      const capabilities: any = track.getCapabilities();

      if (capabilities.torch) {
        setHasFlash(true);
      }
    } catch (error) {
      console.error("Erro ao iniciar câmera:", error);
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
      console.error("Erro ao ativar flash:", error);
    }
  };

  return (
    <div style={{ position: "relative", height: "100vh", background: "#000" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }}
      />

      {hasFlash && (
        <button
          onClick={toggleFlash}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            fontSize: 28,
            background: flashOn ? "#FFD700" : "rgba(255,255,255,0.4)",
            border: "none",
            borderRadius: "50%",
            width: 60,
            height: 60
          }}
        >
          ⚡
        </button>
      )}
    </div>
  );
}

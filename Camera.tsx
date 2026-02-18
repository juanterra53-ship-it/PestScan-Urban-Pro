import React from "react";
import { useEffect, useRef, useState } from "react";


export default function Camera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [track, setTrack] = useState<MediaStreamTrack | null>(null);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const videoTrack = stream.getVideoTracks()[0];
        setTrack(videoTrack);
      } catch (error) {
        console.error("Erro ao acessar câmera:", error);
      }
    }

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleFlash = async () => {
    if (!track) return;

    try {
      const videoTrack: any = track;

      if (!videoTrack.getCapabilities) {
        alert("Flash não suportado neste dispositivo");
        return;
      }

      const capabilities = videoTrack.getCapabilities();

      if (!capabilities?.torch) {
        alert("Flash não suportado neste dispositivo");
        return;
      }

      const newState = !flashOn;

      await videoTrack.applyConstraints({
        advanced: [{ torch: newState }]
      });

      setFlashOn(newState);
    } catch (err) {
      console.error("Erro ao alternar flash:", err);
    }
  };

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "100%", borderRadius: "12px" }}
      />

      <button
        onClick={toggleFlash}
        style={{
          marginTop: "10px",
          padding: "12px",
          width: "100%",
          background: flashOn ? "#444" : "#111",
          color: "#fff",
          borderRadius: "8px",
          border: "none",
          fontWeight: "bold"
        }}
      >
        {flashOn ? "Desligar Flash 🔦" : "Ligar Flash 🔦"}
      </button>
    </div>
  );
}

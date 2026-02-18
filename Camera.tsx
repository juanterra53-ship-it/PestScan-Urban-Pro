import React, { useEffect, useRef, useState } from "react";

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [track, setTrack] = useState<MediaStreamTrack | null>(null);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    let currentTrack: MediaStreamTrack | null = null;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment"
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const videoTrack = stream.getVideoTracks()[0];
        currentTrack = videoTrack;
        setTrack(videoTrack);

      } catch (error) {
        console.error("Erro ao acessar câmera:", error);
      }
    }

    startCamera();

    return () => {
      if (currentTrack) {
        currentTrack.stop();
      }
    };
  }, []);

  const toggleFlash = async () => {
    if (!track) return;

    try {
      const capabilities = track.getCapabilities();

      if (!("torch" in capabilities)) {
        alert("Flash não suportado neste dispositivo");
        return;
      }

      await track.applyConstraints({
        advanced: [{ torch: !flashOn }]
      });

      setFlashOn(!flashOn);

    } catch (error) {
      console.error("Erro ao ativar flash:", error);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-3xl shadow-lg"
      />

      {/* BOTÃO FLASH */}
      <button
        onClick={toggleFlash}
        className={`absolute top-4 right-4 p-3 rounded-full text-xl shadow-lg transition-all duration-300
        ${flashOn ? "bg-yellow-400 text-black scale-110" : "bg-black/60 text-white"}`}
      >
        ⚡
      </button>

    </div>
  );
}

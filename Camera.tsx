import React, { useEffect, useRef, useState } from "react";

export default function Camera() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setStream(mediaStream);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleFlash = async () => {
    alert("Botão apareceu ✔"); // TESTE VISUAL

    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();

    if (!capabilities.torch) {
      alert("Flash não suportado");
      return;
    }

    await track.applyConstraints({
      advanced: [{ torch: !flashOn }]
    });

    setFlashOn(!flashOn);
  };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100vh",
      backgroundColor: "black"
    }}>
      
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

      {/* BOTÃO SUPER VISÍVEL */}
      <button
        onClick={toggleFlash}
        style={{
          position: "absolute",
          top: 50,
          right: 50,
          width: 100,
          height: 100,
          backgroundColor: "red",
          color: "white",
          fontSize: 30,
          zIndex: 9999,
          borderRadius: "50%"
        }}
      >
        FLASH
      </button>

    </div>
  );
}

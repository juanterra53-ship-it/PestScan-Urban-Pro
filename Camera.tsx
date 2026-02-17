import { useEffect, useRef, useState } from "react";

interface MediaTrackCapabilitiesWithTorch extends MediaTrackCapabilities {
  torch?: boolean;
}

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
  }, []);

  const toggleFlash = async () => {
    if (!track) return;

    try {
      if (typeof track.getCapabilities !== "function") {
        alert("Flash não suportado neste dispositivo");
        return;
      }

      const capabilities =
        track.getCapabilities() as MediaTrackCapabilitiesWithTorch;

      if (!capabilities.torch) {
        alert("Flash não suportado neste dispositivo");
        return;
      }

      const newState = !flashOn;

      await track.applyConstraints({
        advanced: [{ torch: newState } as any]
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
          padding: "10px",
          width: "100%",
          background: "#111",
          color: "#fff",
          borderRadius: "8px"
        }}
      >
        {flashOn ? "Desligar Flash 🔦" : "Ligar Flash 🔦"}
      </button>
    </div>
  );
}

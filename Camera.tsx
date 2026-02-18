const toggleFlash = async () => {
  if (!track) return;

  try {
    const videoTrack: any = track;

    if (!videoTrack.getCapabilities) {
      alert("Flash não suportado neste dispositivo");
      return;
    }

    const capabilities = videoTrack.getCapabilities();

    if (!capabilities || !capabilities.torch) {
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

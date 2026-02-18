const [flashOn, setFlashOn] = useState(false);
const videoRef = useRef<HTMLVideoElement>(null);
const streamRef = useRef<MediaStream | null>(null);

const startCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });

  streamRef.current = stream;

  if (videoRef.current) {
    videoRef.current.srcObject = stream;
  }
};

const toggleFlash = async () => {
  if (!streamRef.current) return;

  const track = streamRef.current.getVideoTracks()[0];

  const capabilities = track.getCapabilities();

  if (capabilities.torch) {
    await track.applyConstraints({
      advanced: [{ torch: !flashOn }]
    });

    setFlashOn(!flashOn);
  } else {
    alert("Flash não suportado neste dispositivo.");
  }
};

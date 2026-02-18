const [flashSupported, setFlashSupported] = useState(false)
const [flashOn, setFlashOn] = useState(false)
const videoRef = useRef<HTMLVideoElement>(null)
const streamRef = useRef<MediaStream | null>(null)

useEffect(() => {
  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    })

    streamRef.current = stream

    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }

    const track = stream.getVideoTracks()[0]
    const capabilities = track.getCapabilities()

    if ("torch" in capabilities) {
      setFlashSupported(true)
    }
  }

  startCamera()
}, [])

const toggleFlash = async () => {
  if (!streamRef.current) return

  const track = streamRef.current.getVideoTracks()[0]

  await track.applyConstraints({
    advanced: [{ torch: !flashOn }]
  })

  setFlashOn(!flashOn)
}

import { useEffect, useRef, useState } from 'react'

const SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight'
]

export default function EasterEgg() {
  const [active, setActive] = useState(false)
  const sequenceTracker = useRef<string[]>([])
  
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  
  const reqIdRef = useRef<number>(0)
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (active) return

      sequenceTracker.current.push(e.key)
      if (sequenceTracker.current.length > SEQUENCE.length) {
        sequenceTracker.current.shift()
      }

      if (sequenceTracker.current.join(',') === SEQUENCE.join(',')) {
        setActive(true)
        sequenceTracker.current = [] // reset
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active])

  useEffect(() => {
    if (!active) return

    // --- SETUP AUDIO (EAR-RAPE JUMPSCARE) ---
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    audioCtxRef.current = audioCtx

    function makeDistortionCurve(amount = 400) {
      const n_samples = 44100
      const curve = new Float32Array(n_samples)
      const deg = Math.PI / 180
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1
        curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
      }
      return curve
    }

    const distortion = audioCtx.createWaveShaper()
    distortion.curve = makeDistortionCurve(1000) // Obliterate speakers
    distortion.oversample = '4x'

    const gainNode = audioCtx.createGain()
    gainNode.gain.setValueAtTime(8, audioCtx.currentTime) // Heavy clipping

    const compressor = audioCtx.createDynamicsCompressor()
    compressor.threshold.setValueAtTime(-50, audioCtx.currentTime)
    compressor.knee.setValueAtTime(40, audioCtx.currentTime)
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime)
    compressor.attack.setValueAtTime(0, audioCtx.currentTime)
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime)

    // Sub bass
    const subOsc = audioCtx.createOscillator()
    subOsc.type = 'square'
    subOsc.frequency.setValueAtTime(45, audioCtx.currentTime)

    // Mid screech
    const midOsc = audioCtx.createOscillator()
    midOsc.type = 'sawtooth'
    midOsc.frequency.setValueAtTime(150, audioCtx.currentTime)
    midOsc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 10)

    // HF screech
    const hfOsc = audioCtx.createOscillator()
    hfOsc.type = 'square'
    hfOsc.frequency.setValueAtTime(2000, audioCtx.currentTime)
    hfOsc.frequency.linearRampToValueAtTime(15000, audioCtx.currentTime + 10)

    // Glitch modulator
    const lfo = audioCtx.createOscillator()
    lfo.type = 'square'
    lfo.frequency.setValueAtTime(15, audioCtx.currentTime)
    const lfoGain = audioCtx.createGain()
    lfoGain.gain.setValueAtTime(500, audioCtx.currentTime)
    lfo.connect(lfoGain)
    lfoGain.connect(hfOsc.frequency)

    subOsc.connect(distortion)
    midOsc.connect(distortion)
    hfOsc.connect(distortion)

    distortion.connect(compressor)
    compressor.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    subOsc.start()
    midOsc.start()
    hfOsc.start()
    lfo.start()

    // --- SETUP VIDEO & CANVAS ---
    const startMs = Date.now()
    const DURATION = 10000 // 10 seconds

    const video = document.createElement('video')
    video.src = '/roach.mp4' // The file we copied over
    video.crossOrigin = 'anonymous'
    video.playsInline = true
    video.muted = true
    video.loop = true
    video.play()
    videoRef.current = video

    const canvas = document.createElement('canvas')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvasRef.current = canvas
    
    // Mount canvas visually
    canvas.style.position = 'fixed'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100vw'
    canvas.style.height = '100vh'
    canvas.style.zIndex = '99999'
    canvas.style.pointerEvents = 'none'
    document.body.appendChild(canvas)

    // Offscreen canvas for chroma keying one frame at a time
    const offCanvas = document.createElement('canvas')
    offCanvas.width = 400
    offCanvas.height = 300
    offscreenCanvasRef.current = offCanvas

    const ctx = canvas.getContext('2d')
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true })

    const renderLoop = () => {
      const elapsed = Date.now() - startMs

      if (elapsed >= DURATION) {
        cleanup()
        return
      }

      if (ctx && offCtx && video.readyState >= 2) {
        if (canvas.width !== window.innerWidth) canvas.width = window.innerWidth
        if (canvas.height !== window.innerHeight) canvas.height = window.innerHeight

        // 1. Draw video to offscreen buffer and chroma key it
        offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height)
        offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height)
        
        try {
          const frame = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height)
          const data = frame.data
          for (let i = 0; i < data.length; i += 4) {
             const r = data[i]
             const g = data[i + 1]
             const b = data[i + 2]
            
             // Chroma key math: if green is highly dominant over red and blue
             if (g > 80 && g > r * 1.2 && g > b * 1.2) {
               data[i + 3] = 0 // Transparent
             }
          }
          offCtx.putImageData(frame, 0, 0)
        } catch (e) {
          // Ignore CORS taint errors if local dev
        }

        // 2. Main canvas drawing - Multiple crazy bouncing spinning roaches
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        const progress = elapsed / DURATION
        const maxRoaches = 1 + Math.floor(progress * 150) // Ramp up to 150 roaches on screen
        
        for (let i = 0; i < maxRoaches; i++) {
          const timeOffset = elapsed * 0.005 + i
          const x = (Math.sin(timeOffset * 1.1 + i * 14.5) * 0.5 + 0.5) * canvas.width
          const y = (Math.cos(timeOffset * 1.3 + i * 29.1) * 0.5 + 0.5) * canvas.height
          const scale = 0.5 + Math.abs(Math.sin(timeOffset * 0.5 + i)) * 1.5
          const rotation = timeOffset * 3 + i
          
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(rotation)
          ctx.scale(scale, scale)
          // Draw the processed chroma keyed roach
          ctx.drawImage(offCanvas, -offCanvas.width / 2, -offCanvas.height / 2)
          ctx.restore()
        }

        // 3. Screen shake & crazy CSS filters
        const shakeIntensity = progress * 40 
        const rx = (Math.random() - 0.5) * shakeIntensity
        const ry = (Math.random() - 0.5) * shakeIntensity
        
        const hue = (elapsed * 0.5) % 360
        const invert = Math.random() < progress * 0.8 ? 100 : 0 
        
        document.body.style.transform = `translate(${rx}px, ${ry}px)`
        document.body.style.filter = `hue-rotate(${hue}deg) saturate(${100 + progress * 500}%) invert(${invert}%)`
      }

      reqIdRef.current = requestAnimationFrame(renderLoop)
    }

    renderLoop()

    const cleanup = () => {
      // Clean up audio
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
        audioCtxRef.current = null
      }
      
      cancelAnimationFrame(reqIdRef.current)
      
      document.body.style.transform = ''
      document.body.style.filter = ''
      
      if (canvasRef.current && document.body.contains(canvasRef.current)) {
        document.body.removeChild(canvasRef.current)
      }
      
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.src = ''
        videoRef.current = null
      }

      setActive(false)
    }

    return cleanup
  }, [active])

  return null
}

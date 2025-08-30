'use client';

import { useState, useRef, useEffect } from 'react';
import { ColorRecommendation } from '../page';
import { FaceLandmarker, FilesetResolver, DrawingUtils, NormalizedLandmark } from '@mediapipe/tasks-vision';

interface LipFilterProps {
  colorRecommendation: ColorRecommendation | null;
  onCapture: (imageData: string) => void;
  onBack: () => void;
}

// Only the 8 Pantone colors from the requirements
const lipstickColors = [
  '#BB5F43', // 01 Barely Peachy
  '#BC494F', // 02 Coral Courage
  '#AA3E4C', // 03 Charming Pink
  '#B04A5A', // 04 Mauve Ambition
  '#A4343A', // 05 Fiery Crimson
  '#8B4513', // 06 Mahogany Mission
  '#A0522D', // 07 Rosewood Blaze
  '#A3473D'  // 08 Brick Era
];

const pantoneNames = [
  'Barely Peachy', 'Coral Courage', 'Charming Pink', 'Mauve Ambition',
  'Fiery Crimson', 'Mahogany Mission', 'Rosewood Blaze', 'Brick Era'
];

// MediaPipe FaceMesh mouth landmark sets (full rings, correct order)
const MOUTH_OUTER = [
  // outer rim (includes upper-lip arc 291 -> 61 to avoid flat top)
  // 61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146
  61, 185, 40, 39, 37, 0, 267, 269, 270, 409,
  291, 375, 321, 405, 314, 17, 84, 181, 91, 146

];

const MOUTH_INNER = [
  // inner rim (mouth opening)
  // 78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82
  78, 95, 88, 178, 87, 14, 317, 402, 318, 324,
  308, 415, 310, 311, 312, 13, 82, 81, 80, 191

];

const START_BRIGHTNESS = 0.1;
const START_LIPSTICK_OPACITY = 0.7; // 70% default opacity

export default function LipFilter({ colorRecommendation, onCapture, onBack }: LipFilterProps) {
  const [selectedColor, setSelectedColor] = useState(colorRecommendation?.color || '#BB5F43');
  const [isRunning, setIsRunning] = useState(false);
  const [lipstickOpacityState, setLipstickOpacityState] = useState(START_LIPSTICK_OPACITY);
  const lipstickOpacityRef = useRef(START_LIPSTICK_OPACITY);
  const [isInitialized, setIsInitialized] = useState(false);
  const [message, setMessage] = useState('');
  const [opacityState, setOpacityState] = useState(START_BRIGHTNESS); // For UI updates only
  const opacityRef = useRef(START_BRIGHTNESS); // For animation frame updates
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawUtilsRef = useRef<DrawingUtils>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const currentColorRef = useRef(colorRecommendation?.color || '#BB5F43');
  const animationFrameRef = useRef<number|null>(null);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Initialize FaceLandmarker
  useEffect(() => {
    const initializeFaceLandmarker = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "./model/face_landmarker.task",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });

        setIsInitialized(true);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          drawUtilsRef.current = new DrawingUtils(ctx);
        }
      } catch (error) {
        console.error("Error initializing FaceLandmarker:", error);
        setMessage("Failed to initialize face detection");
      }
    };

    initializeFaceLandmarker();

    return () => {
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
    };
  }, []);

  // Set recommended color when component mounts
  useEffect(() => {
    if (colorRecommendation?.color) {
      setSelectedColor(colorRecommendation.color);
      currentColorRef.current = colorRecommendation.color;
    }
  }, [colorRecommendation]);

  // Auto-start camera when component mounts
  useEffect(() => {
    const autoStartCamera = async () => {
      // Wait a bit for MediaPipe scripts to load
      setTimeout(() => {
        startCamera();
      }, 1000);
    };

    autoStartCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isRunning && isInitialized) {
      animationFrameRef.current = requestAnimationFrame(detectFace);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isInitialized])

  const resizeCanvas = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const rect = video.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    
    // Set canvas size to match video display size exactly
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  };

  // Cardinal/Catmull-Rom spline to Path2D for smoother cupid's bow
  const smoothClosedPath = (points: [number, number][], tension: number = 0.55): Path2D => {
    const n = points.length;
    const path = new Path2D();
    if (n < 3) {
      path.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < n; i++) path.lineTo(points[i][0], points[i][1]);
      path.closePath();
      return path;
    }
    const wrap = (i: number) => (i + n) % n;
    path.moveTo(points[0][0], points[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = points[wrap(i - 1)];
      const p1 = points[wrap(i)];
      const p2 = points[wrap(i + 1)];
      const p3 = points[wrap(i + 2)];
      const c1x = p1[0] + (p2[0] - p0[0]) * (tension / 6);
      const c1y = p1[1] + (p2[1] - p0[1]) * (tension / 6);
      const c2x = p2[0] - (p3[0] - p1[0]) * (tension / 6);
      const c2y = p2[1] - (p3[1] - p1[1]) * (tension / 6);
      path.bezierCurveTo(c1x, c1y, c2x, c2y, p2[0], p2[1]);
    }
    path.closePath();
    return path;
  };

  const dx = 0;
  const dy = 0;

  // Optimized renderer using even-odd fill and smoothing
  const renderLips = (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], width: number, height: number) => {
    if (!landmarks || !canvasRef.current) return;
    ctx.save();
  
    // Use a local array to avoid array creation in the loop
    const outerPoints: [number, number][] = new Array(MOUTH_OUTER.length);
    const innerPoints: [number, number][] = new Array(MOUTH_INNER.length);

    // drawUtilsRef.current?.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#FF0000" });

    // Pre-compute styles with dynamic opacity
    const opacity = Math.round(lipstickOpacityRef.current * 255).toString(16).padStart(2, '0');
    const strokeOpacity = Math.round(lipstickOpacityRef.current * 0.35 * 255).toString(16).padStart(2, '0');
    const fillStyle = currentColorRef.current + opacity; // Dynamic opacity
    const strokeStyle = currentColorRef.current + strokeOpacity; // 35% of main opacity
    
    // Create paths with optimized point calculation
    for (let i = 0; i < MOUTH_OUTER.length; i++) {
      outerPoints[i] = [
        landmarks[MOUTH_OUTER[i]].x * width + dx,
        landmarks[MOUTH_OUTER[i]].y * height + dy
      ];
    }
    const smoothedOuter = smoothClosedPath(outerPoints);
    
    for (let i = 0; i < MOUTH_INNER.length; i++) {
      innerPoints[i] = [
        landmarks[MOUTH_INNER[i]].x * width + dx,
        landmarks[MOUTH_INNER[i]].y * height + dy
      ];
    }
    const smoothedInner = smoothClosedPath(innerPoints);

    // Combined path for single draw call
    const combined = new Path2D();
    combined.addPath(smoothedOuter);
    combined.addPath(smoothedInner);

    // Single fill operation with even-odd rule
    ctx.fillStyle = fillStyle;
    ctx.fill(combined, 'evenodd');

    // Optimized stroke for outer edge only
    ctx.lineWidth = 1.25;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = strokeStyle;
    ctx.stroke(smoothedOuter);

    ctx.restore();
  };

  const lastProcessedTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // No cache needed, calculating dimensions on demand is fast enough
  const detectFace = async () => {
    if (!videoRef.current || !faceLandmarkerRef.current || !canvasRef.current || !isRunning) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = faceLandmarkerRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });

    // Process every 3rd frame to reduce load
    frameCountRef.current = (frameCountRef.current + 1) % 3;
    if (frameCountRef.current !== 0 || !ctx) {
      animationFrameRef.current = requestAnimationFrame(detectFace);
      return;
    }

    // Skip if video isn't ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(detectFace);
      return;
    }

    // Throttle frame processing to ~30fps
    const currentTimestamp = Date.now();
    const timeSinceLastProcess = currentTimestamp - lastProcessedTimeRef.current;
    if (timeSinceLastProcess < 33) {
      animationFrameRef.current = requestAnimationFrame(detectFace);
      return;
    }

    // clear canvas
    ctx.clearRect(0,0,canvas.width, canvas.height);
    
    // draw webcam
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(video, 0,0, canvas.width, canvas.height);
    

    try {
      
      const results = detector.detectForVideo(video, currentTimestamp);
      const landmarks = results?.faceLandmarks?.[0];

      if (ctx) {
        if (landmarks) {
          ctx.globalCompositeOperation = 'multiply';
          renderLips(ctx, landmarks, canvas.width, canvas.height);
          // drawGlossy(ctx, MOUTH_OUTER, landmarks);
        } 
      }

      lastProcessedTimeRef.current = currentTimestamp;
    } catch (error) {
      if (error instanceof Error && !error.message.includes('timestamp mismatch')) {
        console.error("Error during face detection:", error);
      }
    }

    // whitening
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255,255,255,${opacityRef.current * 0.5})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";

    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(detectFace);
    }
  };

  const startCamera = async () => {
    try {
      setMessage('');
      setIsRunning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) return reject();
          
          const loadedmetadata = () => {
            videoRef.current?.removeEventListener('loadedmetadata', loadedmetadata);
            resizeCanvas();
          };

          const loadeddata = async () => {
            videoRef.current?.removeEventListener('loadeddata', loadeddata);
            resizeCanvas();
            try {
              await videoRef.current?.play();
              resolve();
            } catch (error: unknown) {
              const playError = error as { name: string };
              if (playError.name === 'AbortError') {
                console.log('Video play interrupted, retrying...');
                // Wait a bit and try again
                setTimeout(async () => {
                  try {
                    await videoRef.current?.play();
                    resolve();
                  } catch (retryError) {
                    reject(retryError);
                  }
                }, 100);
              } else {
                reject(playError);
              }
            }
          };

          videoRef.current.addEventListener('loadedmetadata', loadedmetadata);
          videoRef.current.addEventListener('loadeddata', loadeddata);
        });

        // Reset timing references and start detection
        lastProcessedTimeRef.current = 0;
        animationFrameRef.current = requestAnimationFrame(detectFace);
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Camera error:', error);
      setMessage('Camera error: ' + error.message);
      setIsRunning(false);
    }
  };

  const stopCamera = () => {
    try {
      setIsRunning(false);
      
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        videoRef.current.srcObject = null;
      }

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      window.removeEventListener('resize', resizeCanvas);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Stop error:', error);
      setMessage('Stop error: ' + error.message);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Create a temporary canvas to combine video and lipstick overlay
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = videoRef.current.videoWidth;
    tempCanvas.height = videoRef.current.videoHeight;

    // Draw video frame (flipped back to normal)
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(videoRef.current, -tempCanvas.width, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.scale(-1, 1);
    
    // Draw lipstick overlay (flipped back to normal)
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(canvasRef.current, -tempCanvas.width, 0, tempCanvas.width, tempCanvas.height);

    // Get the image data and pass it to the parent
    const imageData = tempCanvas.toDataURL();
    onCapture(imageData);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    currentColorRef.current = color; // Update the ref immediately
    
    // Force a re-render of the lips with the new color
    if (videoRef.current && canvasRef.current) {
      // Clear the canvas first
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="retro-window">
          <div className="retro-titlebar flex items-center justify-between">
            <span>Virtual Lip Filter</span>
            <button onClick={onBack} className="retro-btn text-xs">◀ Back</button>
          </div>
          <div className="retro-content">
            {colorRecommendation && (
              <div className="retro-card p-4 mb-4">
                <p className="font-semibold">Your Recommended Color: {colorRecommendation.name}</p>
                <p className="text-xs opacity-80">{colorRecommendation.description}</p>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
              <button onClick={stopCamera} disabled={!isRunning} className="retro-btn text-sm disabled:opacity-50">Stop Camera</button>
              <button onClick={capturePhoto} disabled={!isRunning} className="retro-btn retro-btn-primary text-sm disabled:opacity-50">📸 Capture & Continue</button>
            </div>

            {/* Camera */}
            <div className="relative retro-card overflow-hidden mb-4">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto transform scale-x-[-1]" />
              <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none transform scale-x-[-1]" />
            </div>

            {message && (
              <div className="text-center text-red-600 mb-3 text-sm">{message}</div>
            )}

            {/* Swatches */}
            {/* Effect Controls */}
            <div className="retro-card p-4 mb-4 space-y-4">
              {/* Brightness Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Lighting Effect</h3>
                  <span className="text-xs">{Math.round(opacityState * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(opacityState * 100)}
                  onChange={(e) => {
                    const newValue = Number(e.target.value) / 100;
                    setOpacityState(newValue);
                    opacityRef.current = newValue;
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Lipstick Opacity Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Lipstick Opacity</h3>
                  <span className="text-xs">{Math.round(lipstickOpacityState * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(lipstickOpacityState * 100)}
                  onChange={(e) => {
                    const newValue = Number(e.target.value) / 100;
                    setLipstickOpacityState(newValue);
                    lipstickOpacityRef.current = newValue;
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
            {/* Swatches */}
            <div className="retro-card p-4">
              <h3 className="font-semibold mb-3">Choose Lipstick Color</h3>
              <div className="grid grid-cols-8 gap-2 mb-3">
                {lipstickColors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorSelect(color)}
                    className={`w-10 h-10 rounded-full retro-swatch transition-transform hover:scale-110 ${selectedColor === color ? 'ring-2 ring-pink-400' : ''}`}
                    style={{ backgroundColor: color }}
                    title={pantoneNames[index]}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Selected Color:</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full retro-swatch" style={{ backgroundColor: selectedColor }}></div>
                  <span className="text-xs">
                    {pantoneNames[lipstickColors.indexOf(selectedColor)] || 'Custom Color'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center mt-4 text-xs opacity-80">
              <p>Position your face in the camera view and the AI will apply lipstick automatically.</p>
              <p className="mt-1">Tip: HTTPS (or localhost) is required for camera access.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

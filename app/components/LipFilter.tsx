/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef, useEffect, RefObject } from 'react';
import { ColorRecommendation } from '../page';
import { FaceLandmarker, FilesetResolver, DrawingUtils, NormalizedLandmark, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

interface LipFilterProps {
  colorRecommendation: ColorRecommendation | null;
  onCapture: (imageData: string) => void;
  onBack: () => void;
  onRecommendationChange?: (rec: ColorRecommendation) => void;
}

interface FrameRef {
  anim: number;
  isVideo: boolean;
}

// Enhanced lipstick data with images
const lipstickData = [
  {
    color: '#BB5F43',
    name: 'Barely Peachy',
    lipImage: '/01-barely-peach-lip.jpg',
    swatchImage: '/01-barely-peach-swatch.png',
    description: 'Peach hangat dan natural, cocok banget buat kulit warm kayak kamu!'
  },
  {
    color: '#BC494F',
    name: 'Coral Courage',
    lipImage: '/02-coral-courage-lip.jpg',
    swatchImage: '/02-coral-courage-swatch.png',
    description: 'Coral cerah yang bikin look kamu makin fresh dan semangat!'
  },
  {
    color: '#AA3E4C',
    name: 'Charming Pink',
    lipImage: '/03-charming-pink-lip.jpg',
    swatchImage: '/03-charming-pink-swatch.png',
    description: 'Pink rose yang elegan, pas banget buat tampil anggun.'
  },
  {
    color: '#B04A5A',
    name: 'Mauve Ambition',
    lipImage: '/04-mauve-ambition-lip.jpg',
    swatchImage: '/04-mauve-ambition-swatch.png',
    description: 'Mauve dusty yang bold tapi tetap classy, siap bikin kamu stand out.'
  },
  {
    color: '#A4343A',
    name: 'Fiery Crimson',
    lipImage: '/05-fiercy-crimson-lip.jpg',
    swatchImage: '/05-fiercy-crimson-swatch.png',
    description: 'Crimson merah yang powerful, cocok buat kamu yang suka jadi pusat perhatian.'
  },
  {
    color: '#8B4513',
    name: 'Mahogany Mission',
    lipImage: '/06-mahogany-mission-lip.jpg',
    swatchImage: '/06-mahogany-mission-swatch.png',
    description: 'Coklat mahogany yang deep, bikin look kamu makin classy dan mature.'
  },
  {
    color: '#A0522D',
    name: 'Rosewood Blaze',
    lipImage: '/07-rosewood-blaze-lip.jpg',
    swatchImage: '/07-rosewood-blaze-swatch.png',
    description: 'Rosewood hangat, natural tapi tetap kelihatan elegan.'
  },
  {
    color: '#A3473D',
    name: 'Brick Era',
    lipImage: '/08-brick-era-lip.jpg',
    swatchImage: '/08-brick-era-swatch.png',
    description: 'Merah bata yang dalem, timeless banget buat semua suasana.'
  },
  {
    color: '#FF66AA',
    name: 'Custom Color',
    lipImage: null,
    swatchImage: null,
    isCustom: true
  },
  {
    color: '#00000000',
    name: 'None',
    lipImage: null,
    swatchImage: null
  }
];

// Legacy arrays for backward compatibility
const lipstickColors = lipstickData.map(item => item.color);
// const pantoneNames = lipstickData.map(item => item.name);

const NONE_INDEX = lipstickColors.length - 1;

// MediaPipe FaceMesh mouth landmark sets (full rings, correct order)
const MOUTH_OUTER = [
  // outer rim (includes upper-lip arc 291 -> 61 to avoid flat top)
  61, 185, 40, 39, 37, 0, 267, 269, 270, 409,
  291, 375, 321, 405, 314, 17, 84, 181, 91, 146
];

const MOUTH_INNER = [
  // inner rim (mouth opening)
  78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82
];

const START_BRIGHTNESS = 0.1;
const START_LIPSTICK_OPACITY = 0.7; // 70% default opacity

export default function LipFilter({ colorRecommendation, onCapture, onBack, onRecommendationChange }: LipFilterProps) {
  const [selectedColor, setSelectedColor] = useState(colorRecommendation?.color || '#BB5F43');
  const [isRunning, setIsRunning] = useState(false);
  const [lipstickOpacityState, setLipstickOpacityState] = useState(START_LIPSTICK_OPACITY);
  const lipstickOpacityRef = useRef(START_LIPSTICK_OPACITY);
  const [isInitialized, setIsInitialized] = useState(false);
  const [message, setMessage] = useState('');
  const [opacityState, setOpacityState] = useState(START_BRIGHTNESS); // For UI updates only
  const opacityRef = useRef(START_BRIGHTNESS); // For animation frame updates
  const [isBeautyEnabled, setIsBeautyEnabled] = useState(false);
  const beautyEnabledRef = useRef(false);
  const [customHex, setCustomHex] = useState('#FF66AA');
  const [customHexError, setCustomHexError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawUtilsRef = useRef<DrawingUtils>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const currentColorRef = useRef(colorRecommendation?.color || '#BB5F43');
  const detectFrameRef = useRef<FrameRef>({ anim: 0, isVideo: false });
  const animRenderCanvasRef = useRef<FrameRef>({ anim: 0, isVideo: false });
  const faceLandmarkResult = useRef<FaceLandmarkerResult | null>(null);
  const IS_SUPPORTED_VIDEO_FRAME = useRef(false);
  const drawAreaRef = useRef<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });
  const dprRef = useRef(1);
  const cameraContainerRef = useRef<HTMLDivElement>(null);

  function cancelAnimFrame({ anim, isVideo }: FrameRef) {
    if (isVideo) {
      videoRef.current?.cancelVideoFrameCallback(anim);
      return;
    }

    cancelAnimationFrame(anim);
  }

  function requestAnimFrame(ref: RefObject<FrameRef>, callback: () => void) {
    if (IS_SUPPORTED_VIDEO_FRAME.current && videoRef.current) {
      ref.current.isVideo = true;
      ref.current.anim = videoRef.current.requestVideoFrameCallback(callback);
    } else {
      ref.current.isVideo = false;
      ref.current.anim = requestAnimationFrame(callback);
    }
  }

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (detectFrameRef.current.anim) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        cancelAnimFrame(detectFrameRef.current);
      }

      if (animRenderCanvasRef.current.anim) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        cancelAnimFrame(animRenderCanvasRef.current);
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
          // outputFacialTransformationMatrixes: false,
        });

        IS_SUPPORTED_VIDEO_FRAME.current = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

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
      requestAnimFrame(detectFrameRef, detectFace);
      requestAnimFrame(animRenderCanvasRef, renderCanvas);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isInitialized])


  const onResizeCanvas = (canvas: HTMLCanvasElement, width: number, height: number, dpr: number) => {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  const resizeCanvas = () => {
    if (!canvasRef.current || !tempCanvasRef.current) return;

    const canvas = canvasRef.current;
    const tempCanvas = tempCanvasRef.current;
    const target = cameraContainerRef.current || canvas;
    const rect = target.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    dprRef.current = dpr;

    // Set canvas size to match video display size exactly
    onResizeCanvas(canvas, rect.width, rect.height, dpr);
    onResizeCanvas(tempCanvas, rect.width, rect.height, dpr);
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

  // Offsets for letterboxed drawing area
  const getDrawOffsets = () => drawAreaRef.current;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderDebug = (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], width: number, height: number) => {
    if (!landmarks) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '5px Arial';
    ctx.fillStyle = 'white';

    const { x: dx, y: dy } = getDrawOffsets();
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * width + dx;
      const y = landmark.y * height + dy;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.fillText(index.toString(), 0, 0);
      ctx.restore();
    });

    ctx.restore();
  };

  const renderHighlight = (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], width: number, height: number) => {
    if (!landmarks) return;
    ctx.clearRect(0, 0, width, height);
    const { x: dx, y: dy } = getDrawOffsets();

    const [[ltx, lty], [ltx2,lty2], [cx1, cy1], [cx2, cy2], [llx, lly], [lrx, lry]] = [
      landmarks[14], landmarks[17], landmarks[16], landmarks[15], landmarks[61], landmarks[291]
    ]
      .map(p => [p.x * width + dx, p.y * height + dy]);

    const lipTick = Math.sqrt((ltx2 - ltx) ** 2 + (lty2 - lty) ** 2) * 0.5;
    const p = [cx1 + (cx2-cx1) * 0.5, cy1 + (cy2-cy1) * 0.5];

    if (lipTick < 1.3) {
      return;
    }

    const lx = (lrx - llx) * width;
    const ly = (lry - lly) * height;
    const angle = Math.atan2(ly, lx);

    // render
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.translate(p[0], p[1] - lipTick * 0.2);
    ctx.rotate(angle);
    const numLight = 6;
    const halfLip = numLight * 0.5;
    for(let i = 0; i < numLight; i++) {
      const x = (i - halfLip) * lipTick * 0.3;
      const y = (Math.random() - 0.5) * lipTick * 0.15;
      const w = Math.random() * lipTick * 1;
      const h = Math.random() * lipTick * 0.25;
      const alpha = 0.05 + Math.random() * 0.15;

      ctx.beginPath();
      ctx.ellipse(x,y, w, h, Math.random() * 0.01, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
    ctx.restore();

    ctx.globalCompositeOperation = "source-over";
  };

  // Optimized renderer using even-odd fill and smoothing
  const renderLips = (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], width: number, height: number) => {
    if (!landmarks) return;
    ctx.clearRect(0, 0, width, height);

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
    const { x: dx, y: dy } = getDrawOffsets();

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

    // Add glossy effect to lower lip using both outer and inner contours
    const lowerOuterPoints = outerPoints.slice(10); // Get lower outer lip points
    const lowerInnerPoints = innerPoints.slice(8); // Get lower inner lip points

    const glossyPath = new Path2D();

    // Start from the first point of outer lip
    const startPoint = lowerOuterPoints[0];
    glossyPath.moveTo(startPoint[0], startPoint[1]);

    // Create curved path for outer lower lip
    for (let i = 1; i < lowerOuterPoints.length; i++) {
      const point = lowerOuterPoints[i];
      const prevPoint = lowerOuterPoints[i - 1];
      const cpX = (prevPoint[0] + point[0]) / 2;
      const cpY = (prevPoint[1] + point[1]) / 2;
      glossyPath.quadraticCurveTo(cpX, cpY, point[0], point[1]);
    }

    // Connect to inner lip points
    const firstInnerPoint = lowerInnerPoints[0];
    glossyPath.lineTo(firstInnerPoint[0], firstInnerPoint[1]);

    // Create curved path for inner lower lip (in reverse)
    for (let i = lowerInnerPoints.length - 2; i >= 0; i--) {
      const point = lowerInnerPoints[i];
      const prevPoint = lowerInnerPoints[i + 1];
      const cpX = (prevPoint[0] + point[0]) / 2;
      const cpY = (prevPoint[1] + point[1]) / 2;
      glossyPath.quadraticCurveTo(cpX, cpY, point[0], point[1]);
    }

    glossyPath.closePath();

    // Create radial gradient for more realistic glossy effect
    const centerX = (startPoint[0] + lowerInnerPoints[0][0]) / 2;
    const centerY = (startPoint[1] + lowerInnerPoints[0][1]) / 2;
    const gradient = ctx.createRadialGradient(
      centerX, centerY - 5, 0,
      centerX, centerY, 30
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    // --- Highlight glossy (specular) ---
    const minY = Math.min(...outerPoints.map(p => p[1]));
    const maxY = Math.max(...outerPoints.map(p => p[1]));

    const gg = ctx.createLinearGradient(0, minY, 0, maxY);
    gg.addColorStop(0.3, "rgba(255,255,255,0.35)");
    gg.addColorStop(0.5, "rgba(255,255,255,0.15)");
    gg.addColorStop(0.7, "rgba(255,255,255,0)");
    ctx.fillStyle = gg;
    ctx.globalCompositeOperation = "screen";
    ctx.fill();


    // Apply glossy effect
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = gradient;
    ctx.fill(glossyPath);
    ctx.restore();

    ctx.restore();

    ctx.globalCompositeOperation = "source-over";
  };

  const lastProcessedTimeRef = useRef<number>(0);

  const renderCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const tempCtx = tempCanvasRef.current?.getContext('2d', { alpha: true });

    if (!tempCtx || !ctx || !canvas || !video) {
      requestAnimFrame(animRenderCanvasRef, renderCanvas);
      return;
    }

    // clear canvas (use CSS pixel space since transform applied)
    const displayWidth = canvas.width / dprRef.current;
    const displayHeight = canvas.height / dprRef.current;
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // draw webcam with cover fit (center crop, no letterbox)
    ctx.globalCompositeOperation = 'source-over';
    const vw = video.videoWidth || 0;
    const vh = video.videoHeight || 0;
    if (vw > 0 && vh > 0) {
      const scale = Math.max(displayWidth / vw, displayHeight / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = (displayWidth - dw) / 2;
      const dy = (displayHeight - dh) / 2;
      drawAreaRef.current = { x: dx, y: dy, width: dw, height: dh };
      ctx.drawImage(video, dx, dy, dw, dh);
    }

    // Apply beauty effects if enabled
    if (beautyEnabledRef.current) {
      // whitening
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = `rgba(255,255,255,${opacityRef.current * 0.5})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
    }

    const landmarks = faceLandmarkResult.current?.faceLandmarks?.[0];
    tempCtx.clearRect(0, 0, displayWidth, displayHeight);
    if (landmarks && currentColorRef.current !== lipstickColors[NONE_INDEX]) {
      tempCtx.filter = 'blur(2px)';
      const { width: dw, height: dh } = drawAreaRef.current;
      // renderDebug(ctx, landmarks, dw, dh);
      renderLips(tempCtx, landmarks, dw, dh);
      ctx.globalCompositeOperation = 'overlay';
      ctx.drawImage(tempCanvasRef.current!, 0, 0, displayWidth, displayHeight);

      tempCtx.filter = 'blur(4px)';
      renderHighlight(tempCtx, landmarks, dw, dh);
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(tempCanvasRef.current!, 0, 0, displayWidth, displayHeight);
    }

    if (beautyEnabledRef.current) {
      tempCtx.filter = 'none';
      tempCtx.clearRect(0, 0, displayWidth, displayHeight);
      tempCtx.drawImage(canvas, 0, 0, displayWidth, displayHeight);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      ctx.filter = 'blur(1.25px)';
      ctx.drawImage(tempCanvasRef.current!, 0, 0, displayWidth, displayHeight);
      tempCtx.filter = 'none';
    }
    
    
    ctx.filter = 'none';
     ctx.globalCompositeOperation = "source-over";

    if (isRunning) {
      requestAnimFrame(animRenderCanvasRef, renderCanvas);
    }
  }

  // No cache needed, calculating dimensions on demand is fast enough
  const detectFace = async () => {
    if (!videoRef.current || !faceLandmarkerRef.current || !canvasRef.current || !isRunning) {
      return;
    }

    const video = videoRef.current;
    const detector = faceLandmarkerRef.current;

    // Skip if video isn't ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimFrame(detectFrameRef, detectFace);
      return;
    }

    // Throttle frame processing to ~30fps
    const currentTimestamp = Math.floor(performance.now());
    if (currentTimestamp - lastProcessedTimeRef.current < 33) {
      requestAnimFrame(detectFrameRef, detectFace);
      return;
    }

    try {
      faceLandmarkResult.current = detector.detectForVideo(video, currentTimestamp);
      lastProcessedTimeRef.current = currentTimestamp;
    } catch (error) {
      if (error instanceof Error && !error.message.includes('timestamp mismatch')) {
        console.error("Error during face detection:", error);
      }
    }

    if (isRunning) {
      requestAnimFrame(detectFrameRef, detectFace);
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
        requestAnimFrame(detectFrameRef, detectFace);
        requestAnimFrame(animRenderCanvasRef, renderCanvas);

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

      if (detectFrameRef.current.anim) {
        cancelAnimFrame(detectFrameRef.current);
      }

      if (animRenderCanvasRef.current.anim) {
        cancelAnimFrame(animRenderCanvasRef.current);
      }

      window.removeEventListener('resize', resizeCanvas);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Stop error:', error);
      setMessage('Stop error: ' + error.message);
    }
  };

  const capturePhoto = () => {
    if (!canvasRef.current) return;
    const imageData = canvasRef.current.toDataURL('image/png');
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

    // Notify parent about recommendation change if handler provided
    const item = lipstickData.find(i => i.color === color) as (typeof lipstickData)[number] | undefined;
    const name = item?.name || 'Custom Color';
    const description = (item as any)?.description || 'Warna custom pilihanmu. Ekspresikan dirimu!';
    if (typeof window !== 'undefined' && (item || color)) {
      const rec: ColorRecommendation = { color, name, description };
      if (typeof onRecommendationChange === 'function') {
        onRecommendationChange(rec);
      }
    }
  };

  const handleCustomHexChange = (value: string) => {
    let v = value.trim();
    if (v && v[0] !== '#') v = '#' + v;
    setCustomHex(v);
    const hex6 = /^#([0-9a-fA-F]{6})$/;
    if (hex6.test(v)) {
      setCustomHexError('');
      setSelectedColor(v);
      currentColorRef.current = v;
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      const rec: ColorRecommendation = { color: v, name: 'Custom Color', description: 'Warna custom pilihanmu. Ekspresikan dirimu!' };
      if (typeof onRecommendationChange === 'function') {
        onRecommendationChange(rec);
      }
    } else {
      setCustomHexError('Use 6-digit hex like #A1B2C3');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        <div className="retro-window">
          <div className="retro-titlebar flex items-center justify-between">
            <span>Fitting Lip Room</span>
            <button onClick={onBack} className="retro-btn text-xs">◀ Back</button>
          </div>
          <div className="retro-content">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(280px,480px)_1fr] gap-4 items-start">
              {/* Left: Camera area (portrait) */}
              <div className="retro-card p-3">
                <div ref={cameraContainerRef} className="relative w-full aspect-square bg-black overflow-hidden">
                  <video ref={videoRef} autoPlay playsInline muted className="hidden" />
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none transform scale-x-[-1]" />
                  <canvas ref={tempCanvasRef} className="hidden" />
                </div>
                {message && (
                  <div className="text-center text-red-600 mt-3 text-sm">{message}</div>
                )}
              </div>

              {/* Right: Settings */}
              <div className="space-y-4">
                {(() => {
                  const item = lipstickData.find(i => i.color === selectedColor);
                  const displayName = item?.name || 'Custom Color';
                  const displayDesc = (item as any)?.description || 'Warna custom pilihanmu. Ekspresikan dirimu!';
                  const displayColor = selectedColor;
                  return (
                    <div className="retro-card retro-card-white p-6 text-center">
                      <div className="flex items-center justify-center gap-4 mb-3">
                        {item?.swatchImage ? (
                          <img
                            src={item.swatchImage}
                            alt={displayName}
                            className="w-14 h-10 object-contain flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full retro-swatch flex-shrink-0" style={{ backgroundColor: displayColor }}></div>
                        )}
                        <div className="text-left">
                          <p className="font-semibold text-sm">Warna Kamu Adalah:</p>
                          <p className="font-bold text-lg">{displayName}</p>
                        </div>
                      </div>
                      <p className="text-sm opacity-80 max-w-md mx-auto">{displayDesc}</p>
                    </div>
                  );
                })()}

                <div className="retro-card p-4">
                  <h3 className="font-semibold mb-3">Coba Warna Lain</h3>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {lipstickData.slice(0, -1).map((item, index) => {
                      const isCustom = (item as any).isCustom === true;
                      const isSelected = isCustom
                        ? ((): boolean => {
                            const base = lipstickData.filter(i => !(i as any).isCustom && i.name !== 'None').map(i => i.color);
                            return selectedColor !== lipstickColors[NONE_INDEX] && !base.includes(selectedColor);
                          })()
                        : selectedColor === item.color;
                      const tileColor = isCustom ? customHex : item.color;
                      return (
                        <button
                          key={index}
                          onClick={() => isCustom ? handleColorSelect(customHex) : handleColorSelect(item.color)}
                          className={`relative rounded-lg overflow-hidden retro-swatch transition-transform hover:scale-105 border-2 ${isSelected ? 'ring-3 ring-pink-400' : ''}`}
                          style={{ borderColor: tileColor }}
                          title={item.name}
                        >
                          {item.lipImage ? (
                            <img
                              src={item.lipImage}
                              alt={item.name}
                              className="w-full h-16 object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-16"
                              style={{ backgroundColor: tileColor }}
                            />
                          )}
                          <div
                            className="absolute bottom-0 left-0 right-0 text-white text-xs py-1 px-2 text-center"
                            style={{ backgroundColor: tileColor }}
                          >
                            {item.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    const base = lipstickData.filter(i => !(i as any).isCustom && i.name !== 'None').map(i => i.color);
                    const isCustomSelected = selectedColor !== lipstickColors[NONE_INDEX] && !base.includes(selectedColor);
                    if (!isCustomSelected) return null;
                    return (
                      <div className="mb-3">
                        <label className="text-sm font-medium">Custom Hex Color</label>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={customHex}
                            onChange={(e) => handleCustomHexChange(e.target.value)}
                            placeholder="#RRGGBB"
                            className="flex-1 h-9 px-2 border rounded retro-input"
                          />
                          <div className="w-9 h-9 rounded border" style={{ backgroundColor: customHex }} />
                        </div>
                        {customHexError && (
                          <p className="text-xs text-red-600 mt-1">{customHexError}</p>
                        )}
                      </div>
                    );
                  })()}
                  {/* <div className="flex items-center justify-between">
                    <span className="text-sm">Selected Color:</span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const selectedItem = lipstickData.find(item => item.color === selectedColor);
                        return selectedItem?.swatchImage ? (
                          <img
                            src={selectedItem.swatchImage}
                            alt={selectedItem.name}
                            className="w-8 h-6 object-contain"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full retro-swatch" style={{ backgroundColor: selectedColor }}></div>
                        );
                      })()}
                      <span className="text-xs">
                        {lipstickData.find(item => item.color === selectedColor)?.name || 'Custom Color'}
                      </span>
                    </div>
                  </div> */}
                </div>
                <div className="retro-card p-4 space-y-4">                  
                  {/* <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Beauty Mode</h3>
                    <button
                      onClick={() => {
                        setIsBeautyEnabled(!isBeautyEnabled);
                        beautyEnabledRef.current = !isBeautyEnabled;
                      }}
                      className={`retro-btn text-sm ${isBeautyEnabled ? 'retro-btn-primary' : ''}`}
                    >
                      {isBeautyEnabled ? '✨ On' : 'Off'}
                    </button>
                  </div>

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
                  </div> */}

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
              </div>
            </div>
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4 mb-2">
              <button onClick={stopCamera} disabled={!isRunning} className="retro-btn text-sm disabled:opacity-50">Stop Camera</button>
              <button onClick={capturePhoto} disabled={!isRunning} className="retro-btn retro-btn-primary text-sm disabled:opacity-50">📸 Capture & Continue</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

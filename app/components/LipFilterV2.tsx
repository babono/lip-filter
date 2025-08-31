'use client';

import { useState, useRef, useEffect } from 'react';
import { ColorRecommendation } from '../page';
import { FaceLandmarker, FilesetResolver, NormalizedLandmark } from '@mediapipe/tasks-vision';
import * as PIXI from 'pixi.js';

interface LipFilterProps {
  colorRecommendation: ColorRecommendation | null;
  onCapture: (imageData: string) => void;
  onBack: () => void;
}

// Only the 8 Pantone colors from the requirements
const lipstickColors: string[] = [
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
  61, 185, 40, 39, 37, 0, 267, 269, 270, 409,
  291, 375, 321, 405, 314, 17, 84, 181, 91, 146
];

const MOUTH_INNER = [
  // inner rim (mouth opening)
  78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82,81
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
  const [opacityState, setOpacityState] = useState(START_BRIGHTNESS);
  const opacityRef = useRef(START_BRIGHTNESS);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const currentColorRef = useRef(colorRecommendation?.color || '#BB5F43');
  const animationFrameRef = useRef<number|null>(null);
  const graphicsRef = useRef<PIXI.Graphics | null>(null);
  const videoSpriteRef = useRef<PIXI.Sprite | null>(null);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Initialize FaceLandmarker and PixiJS
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

        // Initialize PixiJS
        if (containerRef.current && !appRef.current) {
          const app = new PIXI.Application();
          await app.init({
            resizeTo: containerRef.current,
            backgroundAlpha: 0,
            antialias: true,
          })
          containerRef.current.appendChild(app.view as HTMLCanvasElement);
          appRef.current = app;
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          globalThis.__PIXI_APP__ = app;


          // Create graphics object for drawing lips
          graphicsRef.current = new PIXI.Graphics();
          app.stage.addChild(graphicsRef.current);

          // Create video sprite
          const texture = PIXI.Texture.from(videoRef.current as HTMLVideoElement);
          videoSpriteRef.current = new PIXI.Sprite(texture);
          app.stage.addChild(videoSpriteRef.current);
          app.stage.addChild(graphicsRef.current); // Add graphics on top
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing:", error);
        setMessage("Failed to initialize face detection");
      }
    };

    initializeFaceLandmarker();

    return () => {
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
      if (appRef.current) {
        appRef.current.destroy(true);
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
  }, [isRunning, isInitialized]);

  const resizeCanvas = () => {
    if (!videoRef.current || !appRef.current || !containerRef.current || !videoSpriteRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const app = appRef.current;
    const videoSprite = videoSpriteRef.current;
    
    // Update PixiJS app size
    app.renderer.resize(rect.width, rect.height);
    
    // Update video sprite size to match container
    videoSprite.width = rect.width;
    videoSprite.height = rect.height;
    videoSprite.position.x = rect.width; // For mirroring
  };

  const renderLips = (landmarks: NormalizedLandmark[], width: number, height: number) => {
    if (!landmarks || !graphicsRef.current || !appRef.current) return;
    
    const graphics = graphicsRef.current;
    graphics.clear();
  
    // Use a local array to avoid array creation in the loop
    const outerPoints: [number, number][] = new Array(MOUTH_OUTER.length);
    const innerPoints: [number, number][] = new Array(MOUTH_INNER.length);

    // Pre-compute styles with dynamic opacity
    const opacity = lipstickOpacityRef.current;
    const strokeOpacity = lipstickOpacityRef.current * 0.35;
    const color = parseInt(currentColorRef.current.replace('#', '0x'));
    
    // Create paths with optimized point calculation
    for (let i = 0; i < MOUTH_OUTER.length; i++) {
      outerPoints[i] = [
        landmarks[MOUTH_OUTER[i]].x * width,
        landmarks[MOUTH_OUTER[i]].y * height
      ];
    }
    
    for (let i = 0; i < MOUTH_INNER.length; i++) {
      innerPoints[i] = [
        landmarks[MOUTH_INNER[i]].x * width,
        landmarks[MOUTH_INNER[i]].y * height
      ];
    }

    // Draw outer lips
    graphics.lineStyle(1.25, color, strokeOpacity);
    graphics.beginFill(color, opacity);
    
    // Draw outer contour
    graphics.moveTo(outerPoints[0][0], outerPoints[0][1]);
    for (let i = 1; i < outerPoints.length; i++) {
      const curr = outerPoints[i];
      const prev = outerPoints[i - 1];
      
      // Calculate control points for smooth curve
      const cpX = (prev[0] + curr[0]) / 2;
      const cpY = (prev[1] + curr[1]) / 2;
      graphics.bezierCurveTo(
        cpX, cpY,
        cpX, cpY,
        curr[0], curr[1]
      );
    }
    graphics.closePath();

    // Draw inner contour (hole)
    graphics.moveTo(innerPoints[0][0], innerPoints[0][1]);
    for (let i = 1; i < innerPoints.length; i++) {
      const curr = innerPoints[i];
      const prev = innerPoints[i - 1];
      
      // Calculate control points for smooth curve
      const cpX = (prev[0] + curr[0]) / 2;
      const cpY = (prev[1] + curr[1]) / 2;
      graphics.bezierCurveTo(
        cpX, cpY,
        cpX, cpY,
        curr[0], curr[1]
      );
    }
    graphics.closePath();
    graphics.endFill();

    // Add glossy effect
    const lowerOuterPoints = outerPoints.slice(10);
    const lowerInnerPoints = innerPoints.slice(8);
    
    graphics.beginFill(0xFFFFFF, 0.3);
    graphics.moveTo(lowerOuterPoints[0][0], lowerOuterPoints[0][1]);
    
    // Draw lower lip gloss
    for (let i = 1; i < lowerOuterPoints.length; i++) {
      const curr = lowerOuterPoints[i];
      const prev = lowerOuterPoints[i - 1];
      const cpX = (prev[0] + curr[0]) / 2;
      const cpY = (prev[1] + curr[1]) / 2;
      graphics.bezierCurveTo(cpX, cpY, cpX, cpY, curr[0], curr[1]);
    }
    
    graphics.lineTo(lowerInnerPoints[0][0], lowerInnerPoints[0][1]);
    
    for (let i = lowerInnerPoints.length - 2; i >= 0; i--) {
      const curr = lowerInnerPoints[i];
      const prev = lowerInnerPoints[i + 1];
      const cpX = (prev[0] + curr[0]) / 2;
      const cpY = (prev[1] + curr[1]) / 2;
      graphics.bezierCurveTo(cpX, cpY, cpX, cpY, curr[0], curr[1]);
    }
    
    graphics.endFill();
  };

  const lastProcessedTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  const detectFace = async () => {
    if (!videoRef.current || !faceLandmarkerRef.current || !appRef.current || !isRunning || !videoSpriteRef.current || !graphicsRef.current) {
      return;
    }

    const video = videoRef.current;
    const app = appRef.current;
    const detector = faceLandmarkerRef.current;
    const videoSprite = videoSpriteRef.current;

    // Process every 3rd frame to reduce load
    frameCountRef.current = (frameCountRef.current + 1) % 3;
    if (frameCountRef.current !== 0) {
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

    // Update video texture
    if (videoSprite.texture.baseTexture.resource) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (videoSprite.texture.baseTexture.resource as any).source = video;
      videoSprite.texture.update();
    }

    try {
      const results = detector.detectForVideo(video, currentTimestamp);
      const landmarks = results?.faceLandmarks?.[0];

      if (landmarks) {
        // Apply whitening effect
        videoSprite.tint = 0xFFFFFF;
        videoSprite.alpha = 1 - (opacityRef.current * 0.5);
        
        // Render lipstick
        renderLips(landmarks, app.renderer.width, app.renderer.height);
      }

      lastProcessedTimeRef.current = currentTimestamp;
    } catch (error) {
      if (error instanceof Error && !error.message.includes('timestamp mismatch')) {
        console.error("Error during face detection:", error);
      }
    }

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

      if (graphicsRef.current) {
        graphicsRef.current.clear();
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
    if (!videoRef.current || !appRef.current) return;

    // Get the PixiJS app view (canvas)
    const app = appRef.current;
    const imageData = app.view.toDataURL();
    onCapture(imageData);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    currentColorRef.current = color; // Update the ref immediately
    
    // The next frame will automatically re-render with the new color
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
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto"  style={{display: 'none'}}/>
              <div ref={containerRef} className="w-full h-full pointer-events-none transform scale-x-[-1]">
                {/* PixiJS will render here */}
              </div>
            </div>

            {message && (
              <div className="text-center text-red-600 mb-3 text-sm">{message}</div>
            )}

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
                {lipstickColors.map((colorHex: string, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorSelect(colorHex)}
                    className={`w-10 h-10 rounded-full retro-swatch transition-transform hover:scale-110 ${selectedColor === colorHex ? 'ring-2 ring-pink-400' : ''}`}
                    style={{ backgroundColor: colorHex }}
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

'use client';

import { useState, useRef, useEffect } from 'react';
import { ColorRecommendation } from '../page';

// Import MediaPipe types
type MediaPipeLandmark = {
  x: number;
  y: number;
  z: number;
};

type MediaPipeResults = {
  multiFaceLandmarks?: MediaPipeLandmark[][];
};

type FaceMeshInstance = {
  setOptions: (options: {
    maxNumFaces: number;
    refineLandmarks: boolean;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }) => void;
  onResults: (callback: (results: MediaPipeResults) => void) => void;
  send: (data: { image: HTMLVideoElement }) => Promise<void>;
  close?: () => void;
};

type CameraInstance = {
  start: () => void;
  stop: () => void;
};

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
  61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146
];

const MOUTH_INNER = [
  // inner rim (mouth opening)
  78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82
];

export default function LipFilter({ colorRecommendation, onCapture, onBack }: LipFilterProps) {
  const [selectedColor, setSelectedColor] = useState(colorRecommendation?.color || '#BB5F43');
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<FaceMeshInstance | null>(null);
  const cameraRef = useRef<CameraInstance | null>(null);
  const currentColorRef = useRef(colorRecommendation?.color || '#BB5F43');

  // Load MediaPipe scripts
  useEffect(() => {
    const loadScripts = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if already loaded
        if (typeof window !== 'undefined' && (window as Window & typeof globalThis).FaceMesh) {
          resolve();
          return;
        }

        const script1 = document.createElement('script');
        script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.min.js';
        script1.onload = () => {
          const script2 = document.createElement('script');
          script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.min.js';
          script2.onload = () => resolve();
          script2.onerror = () => reject(new Error('Failed to load camera utils'));
          document.head.appendChild(script2);
        };
        script1.onerror = () => reject(new Error('Failed to load face mesh'));
        document.head.appendChild(script1);
      });
    };

    loadScripts().catch(console.error);
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
  }, []);

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

  // New renderer using even-odd fill and smoothing
  const renderLips = (landmarks: MediaPipeLandmark[], width: number, height: number) => {
    if (!landmarks || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // MediaPipe landmarks are normalized (0-1), scale to display dimensions
    const toXY = (i: number): [number, number] => [
      landmarks[i].x * width, 
      landmarks[i].y * height
    ];
    
    const outerPts = MOUTH_OUTER.map(toXY);
    const innerPts = MOUTH_INNER.map(toXY);

    // Fixed opacity and use selected color directly
    const alpha = 0.7; // Fixed opacity at 70%

    const outerPath = smoothClosedPath(outerPts);
    const innerPath = smoothClosedPath(innerPts);

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill outer minus inner using even-odd rule with selected color
    ctx.fillStyle = currentColorRef.current + Math.round(alpha * 255).toString(16).padStart(2, '0');
    const combined = new Path2D();
    combined.addPath(outerPath);
    combined.addPath(innerPath);
    ctx.fill(combined, 'evenodd');

    // Soft edge with slightly darker version of selected color
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = currentColorRef.current + '40'; // 25% opacity for stroke
    ctx.lineWidth = 1.25;
    ctx.stroke(outerPath);

    ctx.restore();
  };

  const createFaceMesh = () => {
    if (typeof window === 'undefined' || !(window as Window & typeof globalThis).FaceMesh) return;

    const FaceMesh = (window as Window & typeof globalThis).FaceMesh;
    faceMeshRef.current = new FaceMesh({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    if (!faceMeshRef.current) return;

    faceMeshRef.current.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMeshRef.current.onResults((results: MediaPipeResults) => {
      resizeCanvas();
      if (!canvasRef.current || !videoRef.current) return;
      
      // Use video's actual dimensions for landmark coordinate transformation
      const width = canvasRef.current.width / (window.devicePixelRatio || 1);
      const height = canvasRef.current.height / (window.devicePixelRatio || 1);
      const landmarks = results.multiFaceLandmarks?.[0];
      
      if (landmarks) {
        renderLips(landmarks, width, height);
      } else {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    });
  };

  const startCamera = async () => {
    try {
      setMessage('');
      setIsRunning(true);

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadeddata = () => {
              resizeCanvas();
              resolve();
            };
            // Also resize when metadata loads (when we know video dimensions)
            videoRef.current.onloadedmetadata = () => {
              resizeCanvas();
            };
            videoRef.current.play();
          }
        });

        // Create FaceMesh if not already created
        if (!faceMeshRef.current) {
          createFaceMesh();
        }

        // Create camera helper
        if (typeof window !== 'undefined' && (window as Window & typeof globalThis).Camera) {
          const Camera = (window as Window & typeof globalThis).Camera;
          cameraRef.current = new Camera(videoRef.current, {
            onFrame: async () => {
              if (faceMeshRef.current && videoRef.current) {
                await faceMeshRef.current.send({ image: videoRef.current });
              }
            },
            width: 1280,
            height: 720,
          });
          if (cameraRef.current) {
            cameraRef.current.start();
          }
        }

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
      if (cameraRef.current && cameraRef.current.stop) {
        cameraRef.current.stop();
      }
      
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

      setIsRunning(false);
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
      
      // Force MediaPipe to process the next frame with the new color
      if (faceMeshRef.current && videoRef.current) {
        faceMeshRef.current.send({ image: videoRef.current });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onBack}
            className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            💄 Virtual Lip Filter
          </h1>
          {colorRecommendation && (
            <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
              <p className="text-lg font-semibold text-gray-800">Your Recommended Color: {colorRecommendation.name}</p>
              <p className="text-sm text-gray-600">{colorRecommendation.description}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
          <button
            onClick={stopCamera}
            disabled={!isRunning}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:opacity-50 rounded-lg font-semibold transition-colors text-white"
          >
            Stop Camera
          </button>
          <button
            onClick={capturePhoto}
            disabled={!isRunning}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:bg-gray-400 disabled:opacity-50 rounded-lg font-semibold transition-colors text-white"
          >
            📸 Capture & Continue
          </button>
        </div>

        {/* Camera and Canvas Container */}
        <div className="relative bg-white rounded-xl overflow-hidden shadow-2xl mb-6 border-4 border-pink-100">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto transform scale-x-[-1]"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none transform scale-x-[-1]"
          />
        </div>

        {/* Status Message */}
        {message && (
          <div className="text-center text-red-500 mb-4 bg-red-50 p-3 rounded-lg">
            {message}
          </div>
        )}

        {/* Color Selector */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-pink-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Choose Lipstick Color</h3>
          <div className="grid grid-cols-8 gap-3 mb-4">
            {lipstickColors.map((color, index) => (
              <button
                key={index}
                onClick={() => handleColorSelect(color)}
                className={`w-12 h-12 rounded-full border-4 transition-all hover:scale-110 relative group ${
                  selectedColor === color
                    ? 'border-pink-400 scale-110 shadow-lg'
                    : 'border-gray-300 hover:border-pink-200'
                }`}
                style={{ backgroundColor: color }}
                title={pantoneNames[index]}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {pantoneNames[index]}
                </div>
              </button>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Selected Color:</span>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full border-2 border-pink-300"
                style={{ backgroundColor: selectedColor }}
              ></div>
              <span className="text-gray-700 text-sm font-medium">
                {pantoneNames[lipstickColors.indexOf(selectedColor)] || 'Custom Color'}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center mt-6 text-gray-600 bg-white p-4 rounded-lg shadow-sm">
          <p className="font-medium">Position your face in the camera view and the AI will automatically detect and apply lipstick!</p>
          <p className="text-sm mt-2 text-gray-500">
            💡 Tip: This requires HTTPS (or localhost) for the camera to work.
          </p>
        </div>
      </div>
    </div>
  );
}

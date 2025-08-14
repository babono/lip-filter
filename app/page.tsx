'use client';

import { useState, useRef, useEffect } from 'react';

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

const lipstickColors = [
  '#FF6B9D', '#FF1744', '#C2185B', '#8E24AA', '#673AB7',
  '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50',
  '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B',
  '#F44336', '#E91E63', '#9C27B0', '#6A1B9A', '#4527A0'
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

// Lip Filter using MediaPipe FaceMesh for accurate lip detection
export default function LipFilterApp() {
  const [selectedColor, setSelectedColor] = useState('#FF1744');
  const [isRunning, setIsRunning] = useState(false);
  const [opacity, setOpacity] = useState(70);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(85);
  const [message, setMessage] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<FaceMeshInstance | null>(null);
  const cameraRef = useRef<CameraInstance | null>(null);

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

    const alpha = opacity / 100;
    const hslHue = hue;
    const sat = saturation;

    const outerPath = smoothClosedPath(outerPts);
    const innerPath = smoothClosedPath(innerPts);

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill outer minus inner using even-odd rule
    ctx.fillStyle = `hsla(${hslHue}, ${sat}%, 45%, ${alpha})`;
    const combined = new Path2D();
    combined.addPath(outerPath);
    combined.addPath(innerPath);
    ctx.fill(combined, 'evenodd');

    // Soft edge
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = `hsla(${hslHue}, ${sat}%, 35%, ${Math.max(0.15, alpha * 0.4)})`;
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

    // Download the image
    const link = document.createElement('a');
    link.download = 'lipstick-filter.png';
    link.href = tempCanvas.toDataURL();
    link.click();
  };

  // Convert hex color to HSL for better control
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    const l = sum / 2;

    let h = 0;
    let s = 0;

    if (diff !== 0) {
      s = l > 0.5 ? diff / (2 - sum) : diff / sum;
      
      switch (max) {
        case r:
          h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / diff + 2) / 6;
          break;
        case b:
          h = ((r - g) / diff + 4) / 6;
          break;
      }
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  };

  // Update HSL when color changes
  useEffect(() => {
    const [h, s] = hexToHsl(selectedColor);
    setHue(h);
    setSaturation(s);
  }, [selectedColor]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8">
          💄 Lip Filter - WebRTC + MediaPipe FaceMesh
        </h1>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
          <button
            onClick={startCamera}
            disabled={isRunning}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 rounded-lg font-semibold transition-colors"
          >
            Start Camera
          </button>
          <button
            onClick={stopCamera}
            disabled={!isRunning}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:opacity-50 rounded-lg font-semibold transition-colors"
          >
            Stop
          </button>
          <button
            onClick={capturePhoto}
            disabled={!isRunning}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 rounded-lg font-semibold transition-colors"
          >
            📸 Capture
          </button>
        </div>

        {/* Sliders */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Opacity</label>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value))}
              className="w-24 accent-pink-500"
            />
            <span className="text-sm w-8">{opacity}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Hue</label>
            <input
              type="range"
              min="0"
              max="360"
              value={hue}
              onChange={(e) => setHue(parseInt(e.target.value))}
              className="w-24 accent-pink-500"
            />
            <span className="text-sm w-8">{hue}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Saturation</label>
            <input
              type="range"
              min="0"
              max="100"
              value={saturation}
              onChange={(e) => setSaturation(parseInt(e.target.value))}
              className="w-24 accent-pink-500"
            />
            <span className="text-sm w-8">{saturation}</span>
          </div>
        </div>

        {/* Camera and Canvas Container */}
        <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl mb-6">
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
          <div className="text-center text-red-400 mb-4">
            {message}
          </div>
        )}

        {/* Color Selector */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Choose Lipstick Color</h3>
          <div className="grid grid-cols-10 gap-3 mb-4">
            {lipstickColors.map((color, index) => (
              <button
                key={index}
                onClick={() => setSelectedColor(color)}
                className={`w-12 h-12 rounded-full border-4 transition-all hover:scale-110 ${
                  selectedColor === color
                    ? 'border-white scale-110 shadow-lg'
                    : 'border-gray-600'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Selected Color:</span>
            <div 
              className="w-8 h-8 rounded-full border-2 border-gray-600"
              style={{ backgroundColor: selectedColor }}
            ></div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center mt-6 text-gray-400">
          <p>Position your face in the camera view and the AI will automatically detect and apply lipstick!</p>
          <p className="text-sm mt-2">
            Tip: This requires HTTPS (or localhost) for the camera to work.
          </p>
        </div>
      </div>
    </div>
  );
}

// MediaPipe TypeScript declarations
interface MediaPipeLandmark {
  x: number;
  y: number;
  z: number;
}

interface MediaPipeResults {
  multiFaceLandmarks?: MediaPipeLandmark[][];
}

interface FaceMeshOptions {
  maxNumFaces: number;
  refineLandmarks: boolean;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
}

interface FaceMeshConfig {
  locateFile: (file: string) => string;
}

interface FaceMeshInstance {
  setOptions: (options: FaceMeshOptions) => void;
  onResults: (callback: (results: MediaPipeResults) => void) => void;
  send: (data: { image: HTMLVideoElement }) => Promise<void>;
  close?: () => void;
}

interface CameraOptions {
  onFrame: () => Promise<void>;
  width: number;
  height: number;
}

interface CameraInstance {
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    FaceMesh: new (config: FaceMeshConfig) => FaceMeshInstance;
    Camera: new (video: HTMLVideoElement, options: CameraOptions) => CameraInstance;
  }
}

export {};

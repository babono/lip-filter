// MediaPipe TypeScript declarations
declare global {
  interface Window {
    FaceMesh: new (config: {
      locateFile: (file: string) => string;
    }) => {
      setOptions: (options: {
        maxNumFaces: number;
        refineLandmarks: boolean;
        minDetectionConfidence: number;
        minTrackingConfidence: number;
      }) => void;
      onResults: (callback: (results: {
        multiFaceLandmarks?: Array<Array<{
          x: number;
          y: number;
          z: number;
        }>>;
      }) => void) => void;
      send: (data: { image: HTMLVideoElement }) => Promise<void>;
      close?: () => void;
    };
    
    Camera: new (video: HTMLVideoElement, options: {
      onFrame: () => Promise<void>;
      width: number;
      height: number;
    }) => {
      start: () => void;
      stop: () => void;
    };
  }
}

export {};

'use client';

import { useMemo, useRef } from 'react';
import { ColorRecommendation } from '../page';

interface CaptureResultProps {
  capturedImage: string | null;
  colorRecommendation: ColorRecommendation | null;
  onTryAgain: () => void;
  onNewQuiz: () => void;
}

export default function CaptureResult({ 
  capturedImage, 
  colorRecommendation, 
  onTryAgain, 
  onNewQuiz 
}: CaptureResultProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const todayLabel = useMemo(() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }, []);

  const shadeName = colorRecommendation?.name || 'Your Shade';
  const shadeHex = colorRecommendation?.color || '#B04A5A';

  const downloadCard = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    const img = new Image();
    // Improve rendering for cross-origin data URLs
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to render SVG'));
      img.src = svgDataUrl;
    });
    const width = svg.viewBox.baseVal.width || svg.width.baseVal.value || 900;
    const height = svg.viewBox.baseVal.height || svg.height.baseVal.value || 1400;
    const canvas = document.createElement('canvas');
    const scale = 2; // export at 2x for better quality
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `lip-id-${shadeName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = dataUrl;
    link.click();
  };

  if (!capturedImage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Image Captured</h1>
          <p className="text-gray-600 mb-6">Please go back and capture an image first.</p>
          <button
            onClick={onTryAgain}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Card dimensions (SVG logical units)
  const W = 900; // width
  const H = 1400; // height

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="retro-window">
          <div className="retro-titlebar">Your Perfect Look!</div>
          <div className="retro-content">
            <div className="grid md:grid-cols-2 gap-4 items-start">
              {/* Preview */}
              <div className="retro-card p-4 flex justify-center">
                <svg
                  ref={svgRef}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox={`0 0 ${W} ${H}`}
                  width="100%"
                  style={{ maxHeight: 700 }}
                >
                  {/* Background */}
                  <rect x="0" y="0" width={W} height={H} fill="#F9E7ED" />

                  {/* Lanyard slot and charm placeholder (simple) */}
                  <rect x={W/2 - 60} y={110} width={120} height={24} rx={12} fill="#E3C6CF" />

                  {/* Card body */}
                  <g transform="translate(90,160)">
                    <rect x="0" y="0" width={W-180} height={H-240} rx="36" fill="#FFFFFF" stroke="#E7CAD2" strokeWidth="6" />

                    {/* Vertical band */}
                    <rect x={W-180-120} y={80} width="100" height={H-240-160} rx="20" fill="#C17B86" />
                    <g transform={`translate(${W-180-70}, ${H/2 - 40}) rotate(-90)`}>
                      <text x="0" y="0" fontSize="44" fontWeight="700" textAnchor="middle" fill="#FFFFFF">
                        HYPERLAST GLAZED LIP VINYL
                      </text>
                    </g>

                    {/* Photo frame */}
                    <clipPath id="photoClip">
                      <rect x="60" y="160" width={W-180-220} height="560" rx="16" />
                    </clipPath>
                    <image
                      href={capturedImage}
                      x="60"
                      y="160"
                      width={W-180-220}
                      height="560"
                      preserveAspectRatio="xMidYMid slice"
                      clipPath="url(#photoClip)"
                    />
                    <rect x="60" y="160" width={W-180-220} height="560" rx="16" fill="none" stroke="#EBD3DA" strokeWidth="6" />

                    {/* Title */}
                    <text x="60" y="770" fontSize="54" fontWeight="700" fill="#A35566">Unbreakable Glaze</text>

                    {/* Shade and swatch */}
                    <g transform="translate(60, 830)">
                      <text x="0" y="0" fontSize="28" fill="#B08996">Shade</text>
                      <text x="0" y="48" fontSize="38" fontWeight="700" fill="#3D2E33">{shadeName}</text>
                      <circle cx={W-180-220-40} cy="24" r="24" fill={shadeHex} />
                    </g>

                    {/* Date row */}
                    <g transform="translate(60, 980)">
                      <text x="0" y="0" fontSize="28" fill="#B08996">Date</text>
                      <text x="0" y="48" fontSize="38" fontWeight="700" fill="#3D2E33">{todayLabel}</text>
                    </g>

                    {/* Brand */}
                    <text x={(W-180)/2} y={H-240-40} fontSize="80" fontWeight="600" textAnchor="middle" fill="#E3C6CF" letterSpacing="8">PIXY</text>
                  </g>
                </svg>
              </div>

              {/* Details and actions */}
              <div className="space-y-4">
                {colorRecommendation && (
                  <div className="retro-card p-4 text-center">
                    <p className="font-semibold">Recommended Color: {colorRecommendation.name}</p>
                    <p className="text-xs opacity-80">{colorRecommendation.description}</p>
                  </div>
                )}

                <div className="retro-card p-4">
                  <h3 className="font-semibold mb-3">Save Your ID Card</h3>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={downloadCard} className="retro-btn retro-btn-primary text-sm">📥 Download ID Card (PNG)</button>
                    <a
                      className="retro-btn text-sm"
                      href={capturedImage}
                      download={`lip-photo-${shadeName.replace(/\s+/g, '-').toLowerCase()}.png`}
                    >📷 Download Photo Only</a>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={onTryAgain} className="retro-btn">🎨 Try Another Color</button>
                  <button onClick={onNewQuiz} className="retro-btn retro-btn-primary">🎯 Take New Quiz</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

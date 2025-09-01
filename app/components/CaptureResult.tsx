'use client';

import { useMemo, useRef } from 'react';
import { ColorRecommendation } from '../page';

// Lipstick data with images (same as in LipFilter)
const lipstickData = [
  { 
    color: '#BB5F43', 
    name: 'Barely Peachy', 
    swatchImage: '/01-barely-peach-swatch.png'
  },
  { 
    color: '#BC494F', 
    name: 'Coral Courage', 
    swatchImage: '/02-coral-courage-swatch.png'
  },
  { 
    color: '#AA3E4C', 
    name: 'Charming Pink', 
    swatchImage: '/03-charming-pink-swatch.png'
  },
  { 
    color: '#B04A5A', 
    name: 'Mauve Ambition', 
    swatchImage: '/04-mauve-ambition-swatch.png'
  },
  { 
    color: '#A4343A', 
    name: 'Fiery Crimson', 
    swatchImage: '/05-fiercy-crimson-swatch.png'
  },
  { 
    color: '#8B4513', 
    name: 'Mahogany Mission', 
    swatchImage: '/06-mahogany-mission-swatch.png'
  },
  { 
    color: '#A0522D', 
    name: 'Rosewood Blaze', 
    swatchImage: '/07-rosewood-blaze-swatch.png'
  },
  { 
    color: '#A3473D', 
    name: 'Brick Era', 
    swatchImage: '/08-brick-era-swatch.png'
  }
];

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
    
    // Helper function to convert image to data URL
    const imageToDataUrl = (src: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL());
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      });
    };

    try {
      // Clone the SVG to avoid modifying the original
      const svgClone = svg.cloneNode(true) as SVGSVGElement;
      
      // Convert all image elements to data URLs
      const images = svgClone.querySelectorAll('image');
      for (const imageEl of images) {
        const href = imageEl.getAttribute('href');
        if (href && !href.startsWith('data:')) {
          try {
            const dataUrl = await imageToDataUrl(href);
            imageEl.setAttribute('href', dataUrl);
          } catch (error) {
            console.warn(`Failed to convert image ${href} to data URL:`, error);
          }
        }
      }

      // Add font definitions to the SVG
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      style.textContent = `
        text {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
      `;
      defs.appendChild(style);
      svgClone.insertBefore(defs, svgClone.firstChild);

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgClone);
      const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
      
      const img = new Image();
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
    } catch (error) {
      console.error('Failed to download card:', error);
      alert('Failed to download the card. Please try again.');
    }
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
                  

                  {/* Card body - moved up and enlarged */}
                  <g>
                    <rect x="0" y="0" width={W} height={H} fill="#FFFFFF" />

                    {/* Vertical band - adjusted for new dimensions */}
                    <rect x={W-140} y={60} width="100" height={H-120} rx="8" fill="#C17B86" />
                    <g transform={`translate(${W-110}, ${H/2 - 10}) rotate(-270)`}>
                      <text x="0" y="0" fontSize="60" letterSpacing="6" fontWeight="400" textAnchor="middle" fill="#FFFFFF" fontFamily="Arial, sans-serif">
                        HYPERLAST GLAZED LIP VINYL
                      </text>
                    </g>

                    {/* Photo frame - Enlarged square aspect ratio */}                    
                    <image
                      href={capturedImage}
                      x="40"
                      y="200"
                      width={W-240}
                      height={W-240}
                      preserveAspectRatio="xMidYMid slice"                      
                    />
                    <rect x="40" y="200" width={W-240} height={W-240} fill="none" stroke="#EBD3DA" strokeWidth="6" />

                    {/* Title - Enlarged */}
                    <text x="40" y={100 + (W-120) + 60} fontSize="64" fontWeight="700" fill="#A35566" fontFamily="Arial, sans-serif">Unbreakable Glaze</text>

                    {/* Shade and swatch - Enlarged */}
                    <g transform={`translate(40, ${100 + (W-130) + 130})`}>
                      <text x="0" y="0" fontSize="32" fill="#B08996" fontFamily="Arial, sans-serif">Shade</text>
                      <text x="0" y="56" fontSize="44" fontWeight="700" fill="#3D2E33" fontFamily="Arial, sans-serif">{shadeName}</text>
                      {(() => {
                        const recommendedItem = lipstickData.find(item => item.color === shadeHex);
                        return recommendedItem?.swatchImage ? (
                          <image
                            href={recommendedItem.swatchImage}
                            x={W-120-200-70}
                            y="-24"
                            width="120"
                            height="120"
                            preserveAspectRatio="xMidYMid meet"
                          />
                        ) : (
                          <circle cx={W-120-200-42} cy="28" r="28" fill={shadeHex} />
                        );
                      })()}
                    </g>

                    {/* Date row - Enlarged */}
                    <g transform={`translate(40, ${100 + (W-140) + 250})`}>
                      <text x="0" y="0" fontSize="32" fill="#B08996" fontFamily="Arial, sans-serif">Date</text>
                      <text x="0" y="56" fontSize="44" fontWeight="700" fill="#3D2E33" fontFamily="Arial, sans-serif">{todayLabel}</text>
                    </g>

                    {/* Brand Logo */}
                    <image
                      href="/logo-pixy-pink.png"
                      x="40"
                      y={H-240}
                      width="300"
                      height="220"
                      preserveAspectRatio="xMidYMid meet"
                    />
                  </g>
                </svg>
              </div>

              {/* Details and actions */}
              <div className="space-y-4">
                {colorRecommendation && (
                  <div className="retro-card retro-card-white p-6 text-center">
                    <div className="flex items-center justify-center gap-4 mb-3">
                      {(() => {
                        const recommendedItem = lipstickData.find(item => item.color === colorRecommendation.color);
                        return recommendedItem?.swatchImage ? (
                          <img 
                            src={recommendedItem.swatchImage} 
                            alt={recommendedItem.name}
                            className="w-14 h-10 object-contain flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full retro-swatch flex-shrink-0" style={{ backgroundColor: colorRecommendation.color }}></div>
                        );
                      })()}
                      <div className="text-left">
                        <p className="font-semibold text-sm">Warna Kamu Adalah:</p>
                        <p className="font-bold text-lg">{colorRecommendation.name}</p>
                      </div>
                    </div>
                    <p className="text-sm opacity-80 max-w-md mx-auto">{colorRecommendation.description}</p>
                  </div>
                )}

                <div className="retro-card p-4">
                  <h3 className="font-semibold mb-3">Simpan dan Bagikan ID Kamu!</h3>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={downloadCard} className="retro-btn retro-btn-primary w-full text-sm">📥 Download ID Card (PNG)</button>
                    {/* <a
                      className="retro-btn text-sm"
                      href={capturedImage}
                      download={`lip-photo-${shadeName.replace(/\s+/g, '-').toLowerCase()}.png`}
                    >📷 Download Photo Only</a> */}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={onTryAgain} className="retro-btn">🎨 Coba Warna Lainnya</button>
                  <button onClick={onNewQuiz} className="retro-btn retro-btn-primary">🎯 Lakukan Quiz Lagi</button>
                </div>

                {/* Official Stores */}
                <div className="retro-card p-4">
                  <h3 className="font-semibold mb-3">Cek Official Stores PIXY</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href="https://shopee.co.id/pixyindonesia"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="retro-btn flex items-center justify-center gap-2 w-full"
                      style={{ background: '#EE4D2D', color: '#ffffff' }}
                    >
                      <img src="https://cdn.simpleicons.org/shopee/FFFFFF" alt="Shopee" className="w-5 h-5" />
                      <span>Shopee</span>
                    </a>
                    <a
                      href="https://www.tokopedia.com/pixyofficial"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="retro-btn flex items-center justify-center gap-2 w-full"
                      style={{ background: '#42B549', color: '#ffffff' }}
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 192 192"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          fill="#FFFFFF"
                          fillRule="evenodd"
                          d="M96 28c-9.504 0-17.78 5.307-22.008 13.127C82.736 42.123 88.89 44 96 47.332c7.11-3.332 13.264-5.209 22.008-6.205C113.781 33.31 105.506 28 96 28Zm0-12c-15.973 0-29.568 10.117-34.754 24.28C52.932 40 42.462 40 28.53 40H28a6 6 0 0 0-6 6v124a6 6 0 0 0 6 6h92c27.614 0 50-22.386 50-50V46a6 6 0 0 0-6-6h-.531c-13.931 0-24.401 0-32.715.28C125.566 26.113 111.97 16 96 16ZM34 52.001V164h86c20.987 0 38-17.013 38-38V52.001c-18.502.009-29.622.098-37.872.966-8.692.915-13.999 2.677-21.445 6.4a6 6 0 0 1-5.366 0c-7.446-3.723-12.753-5.485-21.445-6.4-8.25-.868-19.37-.957-37.872-.966ZM50 96c0-9.941 8.059-18 18-18s18 8.059 18 18-8.059 18-18 18-18-8.059-18-18Zm18-30c-16.569 0-30 13.431-30 30 0 16.569 13.431 30 30 30 1.126 0 2.238-.062 3.332-.183l20.425 20.426a6 6 0 0 0 8.486 0l20.425-20.426c1.094.121 2.206.183 3.332.183 16.569 0 30-13.431 30-30 0-16.569-13.431-30-30-30-12.764 0-23.666 7.971-28 19.207C91.666 73.971 80.764 66 68 66Zm40.082 55.433A30.1 30.1 0 0 1 96 106.793a30.101 30.101 0 0 1-12.082 14.64L96 133.515l12.082-12.082ZM124 78c-9.941 0-18 8.059-18 18s8.059 18 18 18 18-8.059 18-18-8.059-18-18-18ZM76 96a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm48 8a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Tokopedia</span>
                    </a>
                    <a
                      href="https://www.blibli.com/merchant/pixy-store/PTD-60083"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="retro-btn flex items-center justify-center gap-2 w-full"
                      style={{ background: '#0072FF', color: '#ffffff' }}
                    >
                      <img src="https://cdn.simpleicons.org/blibli/FFFFFF" alt="Blibli" className="w-5 h-5" />
                      <span>Blibli</span>
                    </a>
                    <a
                      href="https://www.lazada.co.id/shop/pixy1632881128"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="retro-btn flex items-center justify-center gap-2 w-full"
                      style={{ background: '#0F136A', color: '#ffffff' }}
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 50.8 50.8"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          d="M28.048 14.434c1.041-.555 7.536-4.625 7.772-4.76.02-.012.509-.348 1.156.022.902.486 7.055 4.252 7.31 4.437.439.254.693.717.693 1.225v13.496a1.371 1.371 0 0 1-.786 1.11c-.578.323-15.89 9.936-17.995 11.092-.486.3-1.087.3-1.596.023-2.059-1.202-17.417-10.815-17.995-11.093a1.407 1.407 0 0 1-.786-1.132v-13.52c0-.484.254-.947.647-1.2l7.356-4.46c.37-.209.786-.232 1.156-.024.185.092 6.962 4.53 8.026 4.945 1.573.717 3.539.67 5.042-.161z"
                          style={{ fill: 'none', stroke: '#FFFFFF', strokeWidth: 3.17491, strokeLinecap: 'butt', strokeLinejoin: 'round', strokeMiterlimit: 4 }}
                        />
                      </svg>
                      <span>Lazada</span>
                    </a>
                  </div>
                </div>

                {/* PIXY Social Media */}
                <div className="retro-card p-4">
                  <h3 className="font-semibold mb-3">Stay Updated with PIXY</h3>
                  <div className="grid grid-cols-4 gap-3">
                    <a
                      href="https://wa.me/6281122301000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="retro-btn retro-btn-primary flex items-center justify-center w-full"
                    >
                      <img src="https://cdn.simpleicons.org/whatsapp/000000" alt="WhatsApp" className="w-5 h-5" />
                    </a>
                    <a
                      href="https://www.pixy.co.id/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="retro-btn retro-btn-primary flex items-center justify-center w-full"
                    >
                      <img src="/globe.svg" alt="Website" className="w-5 h-5" />
                    </a>
                    <a
                      href="https://www.instagram.com/pixycosmetics"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="retro-btn retro-btn-primary flex items-center justify-center w-full"
                    >
                      <img src="https://cdn.simpleicons.org/instagram/000000" alt="Instagram" className="w-5 h-5" />
                    </a>
                    <a
                      href="https://www.facebook.com/PIXYIndonesiaOfficial"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="retro-btn retro-btn-primary flex items-center justify-center w-full"
                    >
                      <img src="https://cdn.simpleicons.org/facebook/000000" alt="Facebook" className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

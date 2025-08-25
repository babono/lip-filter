'use client';

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
  const shareToInstagram = () => {
    // Instagram sharing logic
    if (capturedImage) {
      // For Instagram, we can try to open the Instagram app or website
      // Note: Direct sharing to Instagram requires the Instagram app or specific APIs
      window.open('https://www.instagram.com/', '_blank');
      
      // Show instructions to user
      alert('To share to Instagram:\n1. Save the image to your device\n2. Open Instagram\n3. Create a new post\n4. Select the saved image');
    }
  };

  const shareToFacebook = () => {
    if (capturedImage) {
      // Facebook sharing
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`Check out my perfect lipstick shade: ${colorRecommendation?.name || 'Amazing color'}! 💄✨`);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
    }
  };

  const shareToTwitter = () => {
    if (capturedImage) {
      // Twitter sharing
      const text = encodeURIComponent(`Just found my perfect lipstick shade: ${colorRecommendation?.name || 'Amazing color'}! 💄✨ Try it yourself!`);
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    }
  };

  const downloadImage = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.download = `lipstick-filter-${colorRecommendation?.name || 'result'}.png`;
      link.href = capturedImage;
      link.click();
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="retro-window">
          <div className="retro-titlebar">Your Perfect Look!</div>
          <div className="retro-content">
            {colorRecommendation && (
              <div className="retro-card p-4 mb-4 text-center inline-block">
                <p className="font-semibold">Your Recommended Color: {colorRecommendation.name}</p>
                <p className="text-xs opacity-80">{colorRecommendation.description}</p>
              </div>
            )}

            {/* Image */}
            <div className="retro-card p-4 mb-4">
              <div className="text-center mb-3">
                <h2 className="font-semibold mb-1">Your Result</h2>
                <p className="text-xs opacity-80">How amazing does this look on you? 💄</p>
              </div>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <img src={capturedImage} alt="Your lipstick filter result" className="max-w-full h-auto rounded" style={{ maxHeight: '500px' }} />
                  <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1">
                    <div className="w-6 h-6 rounded-full retro-swatch" style={{ backgroundColor: colorRecommendation?.color || '#FF1744' }}></div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <button onClick={downloadImage} className="retro-btn text-sm">📥 Download Image</button>
              </div>
            </div>

            {/* Share */}
            <div className="retro-card p-4 mb-4">
              <h3 className="font-semibold text-center mb-3">Share Your Look! 💫</h3>
              <div className="grid md:grid-cols-3 gap-3 mb-3">
                <button onClick={shareToInstagram} className="retro-btn retro-btn-primary">📷 Instagram</button>
                <button onClick={shareToFacebook} className="retro-btn">📘 Facebook</button>
                <button onClick={shareToTwitter} className="retro-btn">🐦 Twitter</button>
              </div>
              <div className="text-center text-xs opacity-80">Tip: Download first, then share to your favorite platform.</div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={onTryAgain} className="retro-btn">🎨 Try Another Color</button>
              <button onClick={onNewQuiz} className="retro-btn retro-btn-primary">🎯 Take New Quiz</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

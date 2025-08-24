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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            ✨ Your Perfect Look! ✨
          </h1>
          {colorRecommendation && (
            <div className="bg-white p-4 rounded-lg shadow-lg mb-6 inline-block">
              <p className="text-lg font-semibold text-gray-800">
                Your Recommended Color: {colorRecommendation.name}
              </p>
              <p className="text-sm text-gray-600">{colorRecommendation.description}</p>
            </div>
          )}
        </div>

        {/* Captured Image */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-8">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Your Result</h2>
            <p className="text-gray-600">How amazing does this look on you? 💄</p>
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img
                src={capturedImage}
                alt="Your lipstick filter result"
                className="max-w-full h-auto rounded-lg shadow-lg"
                style={{ maxHeight: '500px' }}
              />
              <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-full p-2">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: colorRecommendation?.color || '#FF1744' }}
                ></div>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="text-center mb-6">
            <button
              onClick={downloadImage}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              📥 Download Image
            </button>
          </div>
        </div>

        {/* Social Media Sharing */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            Share Your Look! 💫
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={shareToInstagram}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold"
            >
              <span className="text-2xl">📷</span>
              Share to Instagram
            </button>
            
            <button
              onClick={shareToFacebook}
              className="flex items-center justify-center gap-3 bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold"
            >
              <span className="text-2xl">📘</span>
              Share to Facebook
            </button>
            
            <button
              onClick={shareToTwitter}
              className="flex items-center justify-center gap-3 bg-sky-500 text-white p-4 rounded-lg hover:bg-sky-600 transition-all duration-200 font-semibold"
            >
              <span className="text-2xl">🐦</span>
              Share to Twitter
            </button>
          </div>

          <div className="text-center text-gray-600 text-sm">
            <p>💡 Tip: Download the image first, then share it to your favorite social media platform!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onTryAgain}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            🎨 Try Another Color
          </button>
          
          <button
            onClick={onNewQuiz}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 font-semibold text-lg"
          >
            🎯 Take New Quiz
          </button>
        </div>

        {/* Additional Features */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              What's Next? 🚀
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-2xl mb-2">🛒</div>
                <h4 className="font-semibold text-gray-800 mb-2">Find Similar Products</h4>
                <p className="text-gray-600">Discover real lipstick products in your perfect shade</p>
              </div>
              <div>
                <div className="text-2xl mb-2">👥</div>
                <h4 className="font-semibold text-gray-800 mb-2">Share with Friends</h4>
                <p className="text-gray-600">Let your friends discover their perfect lipstick too</p>
              </div>
              <div>
                <div className="text-2xl mb-2">💾</div>
                <h4 className="font-semibold text-gray-800 mb-2">Save Your Results</h4>
                <p className="text-gray-600">Keep track of your favorite colors and combinations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

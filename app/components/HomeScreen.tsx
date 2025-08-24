'use client';

interface HomeScreenProps {
  onStartQuiz: () => void;
}

export default function HomeScreen({ onStartQuiz }: HomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="text-6xl mb-6">💄</div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Find Your Perfect Lipstick
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Take our personality quiz to discover your ideal lipstick shade, then try it on with our AI-powered virtual lip filter!
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Personalized Quiz</h3>
            <p className="text-gray-600">Answer a few questions about your style and preferences</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-3xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Color Recommendations</h3>
            <p className="text-gray-600">Get expert color suggestions based on your personality</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-3xl mb-4">📸</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Virtual Try-On</h3>
            <p className="text-gray-600">See how the lipstick looks on you with AI technology</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mb-8">
          <button
            onClick={onStartQuiz}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-12 py-4 rounded-full text-xl font-semibold hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Start Your Lipstick Journey ✨
          </button>
        </div>

        {/* Additional Info */}
        <div className="text-gray-500 text-sm">
          <p>Powered by AI • No downloads required • Works on all devices</p>
        </div>
      </div>
    </div>
  );
}

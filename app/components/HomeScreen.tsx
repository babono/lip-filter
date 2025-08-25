'use client';

interface HomeScreenProps {
  onStartQuiz: () => void;
}

export default function HomeScreen({ onStartQuiz }: HomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="retro-window">
          <div className="retro-titlebar">Apple in the Movies</div>
          <div className="retro-content text-center">
            {/* Hero */}
            <div className="mb-8">
              <div className="text-5xl mb-4">💄</div>
              <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-retro), system-ui' }}>
                Find Your Perfect Lipstick
              </h1>
              <p className="text-sm opacity-80 max-w-2xl mx-auto">
                Take our personality quiz to discover your ideal lipstick shade, then try it on with our AI-powered virtual lip filter!
              </p>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="retro-card p-4">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold mb-1">Personalized Quiz</h3>
                <p className="text-xs opacity-80">Answer a few questions about your style and preferences</p>
              </div>
              <div className="retro-card p-4">
                <div className="text-2xl mb-2">🎨</div>
                <h3 className="font-semibold mb-1">Color Recommendations</h3>
                <p className="text-xs opacity-80">Get expert color suggestions based on your personality</p>
              </div>
              <div className="retro-card p-4">
                <div className="text-2xl mb-2">📸</div>
                <h3 className="font-semibold mb-1">Virtual Try-On</h3>
                <p className="text-xs opacity-80">See how the lipstick looks on you with AI technology</p>
              </div>
            </div>

            {/* CTA */}
            <button onClick={onStartQuiz} className="retro-btn retro-btn-primary text-sm">
              Start Your Lipstick Journey ✨
            </button>

            <div className="mt-4 text-xs opacity-70">Powered by AI • No downloads required • Works on all devices</div>
          </div>
        </div>
      </div>
    </div>
  );
}

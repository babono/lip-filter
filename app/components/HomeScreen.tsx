'use client';

interface HomeScreenProps {
  onStartQuiz: () => void;
}

export default function HomeScreen({ onStartQuiz }: HomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="retro-window">
          <div className="retro-titlebar">hyperlast-glazed-lip-vinyl.exe</div>
          <div className="retro-content text-center">
            {/* Hero */}
            <div className="mb-8">
              <h1 className="text-lg mt-4 font-bold mb-3" style={{ fontFamily: 'var(--font-retro), system-ui' }}>
                Find Your Unbreakable Lip Shades
              </h1>
              <p className="text-sm opacity-80 max-w-2xl mx-auto">
                Ikuti kuis kepribadian kami untuk menemukan warna lipstik idealmu, lalu coba langsung dengan filter bibir virtual canggih berbasis AI kami!
              </p>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="retro-card p-4">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold mb-1">Personalized Quiz</h3>
                <p className="text-xs opacity-80">Jawab beberapa pertanyaan tentang gaya dan preferensimu.</p>
              </div>
              <div className="retro-card p-4">
                <div className="text-2xl mb-2">🎨</div>
                <h3 className="font-semibold mb-1">Color Recommendations</h3>
                <p className="text-xs opacity-80">Dapatkan saran shade yang cocok berdasarkan kepribadianmu.</p>
              </div>
              <div className="retro-card p-4">
                <div className="text-2xl mb-2">📸</div>
                <h3 className="font-semibold mb-1">Fitting Lip Room</h3>
                <p className="text-xs opacity-80">Lihat bagaimana tampilan lipstik di wajahmu dengan teknologi AI.</p>
              </div>
            </div>

            {/* CTA */}
            <button onClick={onStartQuiz} className="retro-btn retro-btn-primary text-sm mb-4">
              Mulai Pencarian Lipstik Idealmu ✨
            </button>            
          </div>
        </div>
      </div>
    </div>
  );
}

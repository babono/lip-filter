'use client';

import { useState } from 'react';
import { QuizResult, ColorRecommendation } from '../page';

interface PersonalityQuizProps {
  onComplete: (result: QuizResult, recommendation: ColorRecommendation) => void;
  onBack: () => void;
}

const questions = [
  {
    id: 'outfitStyle',
    question: 'Hari pertama ngantor, harus keren nih! Gimana outfit kerjamu hari ini?',
    options: [
      { value: 'bold', label: 'Bold', emoji: '🔥', codes: ['04', '05', '06'] },
      { value: 'neutral', label: 'Netral', emoji: '⚖️', codes: ['02', '08'] },
      { value: 'soft', label: 'Soft', emoji: '🌸', codes: ['01', '03', '07'] }
    ]
  },
  {
    id: 'priorityList',
    question: 'OK, sekarang kamu udah masuk tempat kerja. Di list kerjaanmu, prioritasnya apa nih?',
    options: [
      { value: 'presentation', label: 'Presentasi ke CEO', emoji: '📊', codes: ['04', '05', '06'] },
      { value: 'daily', label: 'Hmm lagi selo aja si hari ini', emoji: '☕', codes: ['02', '08'] },
      { value: 'meeting', label: 'Pertama kali banget, jadi… meeting sama lead-ku', emoji: '👥', codes: ['01', '03', '07'] }
    ]
  },
  {
    id: 'handleMistake',
    question: 'Duh, ternyata kamu bikin kesalahan kecil… Hmm, baiknya gimana ya?',
    options: [
      { value: 'admit', label: 'Cepetan ngaku aja de biar cepet selesai', emoji: '💪', codes: ['04', '05', '06'] },
      { value: 'ask', label: 'Better keknya nanya temen kali yaa', emoji: '🤔', codes: ['02', '08'] },
      { value: 'tomorrow', label: 'Duh, ga hari ini deh… besok aja bisa ga?', emoji: '😅', codes: ['01', '03', '07'] }
    ]
  },
  {
    id: 'lunchChoice',
    question: 'Udah deket waktunya makan siang. Makan apa yak…',
    options: [
      { value: 'spicy', label: 'Nasi goreng extra pedes enak sih pasti', emoji: '🌶️', codes: ['04', '05', '06'] },
      { value: 'sandwich', label: 'Sandwich aja deh yang cepet', emoji: '🥪', codes: ['02', '08'] },
      { value: 'homemade', label: 'Bawa bekel dari rumah', emoji: '🍱', codes: ['01', '03', '07'] }
    ]
  },
  {
    id: 'girlieBoss',
    question: 'Halu duluuu! Kira-kira, kamu bakal jadi girlie boss yang model gimana?',
    options: [
      { value: 'strong', label: 'Yang strong, stand-out, berani!', emoji: '👑', codes: ['04', '05', '06'] },
      { value: 'mingle', label: 'Harus seru dan deket sama semua tim', emoji: '💬', codes: ['02', '08'] },
      { value: 'kind', label: 'Baik dan diem-diem thoughtful ke semua orang', emoji: '💝', codes: ['01', '03', '07'] }
    ]
  },
  {
    id: 'skinTone',
    question: 'Warna kulitmu adalah warna dirimu. What’s your skin tone?',
    options: [
      { value: 'warm', label: 'Warm', emoji: '🤎', codes: ['01', '06', '08'] },
      { value: 'neutral', label: 'Netral', emoji: '🤍', codes: ['02', '07'] },
      { value: 'cool', label: 'Cool', emoji: '🫒', codes: ['03', '04', '05'] }
    ]
  },
  {
    id: 'accessories',
    question: 'Pake something sparkling biar beda deh. Warna aksesoris yang cocok buat kamu apa?',
    options: [
      { value: 'gold', label: 'Gold warna aku banget!', emoji: '✨', codes: ['01', '06', '08'] },
      { value: 'both', label: 'Bisa banget si dua-duanya', emoji: '💫', codes: ['02', '07'] },
      { value: 'silver', label: 'Silver match sama akuu', emoji: '⚡', codes: ['03', '04', '05'] }
    ]
  },
  {
    id: 'workspace',
    question: 'Dekor area kerja yuk biar makin nyaman <3 apa yang harus ada di meja kerjamu?',
    options: [
      { value: 'heels', label: 'Extra heels merah buat jaga-jaga & parfum', emoji: '👠', codes: ['01', '06', '08'] },
      { value: 'coffee', label: 'Coffee tumbler & cermin mini buat touch-up', emoji: '☕', codes: ['02', '07'] },
      { value: 'plushie', label: 'Bantal empuk & diffusers biar nyaman', emoji: '🧸', codes: ['03', '04', '05'] }
    ]
  }
];

// Pantone color palette based on the provided chart
const pantoneColors = {
  '01': { color: '#BB5F43', name: 'Barely Peachy', description: 'A warm, natural peach that complements warm skin tones' },
  '02': { color: '#BC494F', name: 'Coral Courage', description: 'A vibrant coral that adds energy and warmth' },
  '03': { color: '#AA3E4C', name: 'Charming Pink', description: 'A sophisticated rose pink for elegant looks' },
  '04': { color: '#B04A5A', name: 'Mauve Ambition', description: 'A dusty mauve that\'s both bold and refined' },
  '05': { color: '#A4343A', name: 'Fiery Crimson', description: 'A powerful crimson for making a statement' },
  '06': { color: '#8B4513', name: 'Mahogany Mission', description: 'A rich mahogany brown for sophisticated looks' },
  '07': { color: '#A0522D', name: 'Rosewood Blaze', description: 'A warm rosewood that\'s both natural and elegant' },
  '08': { color: '#A3473D', name: 'Brick Era', description: 'A deep brick red for timeless appeal' }
};

// Color recommendation logic based on quiz results
const getColorRecommendation = (answers: Record<string, string>): ColorRecommendation => {
  // Count the frequency of each code
  const codeCount: Record<string, number> = {};
  
  questions.forEach(q => {
    const answer = answers[q.id];
    const option = q.options.find(opt => opt.value === answer);
    if (option) {
      option.codes.forEach(code => {
        codeCount[code] = (codeCount[code] || 0) + 1;
      });
    }
  });
  
  // Find the most frequent code
  let maxCount = 0;
  let recommendedCode = '01'; // default
  
  Object.entries(codeCount).forEach(([code, count]) => {
    if (count > maxCount) {
      maxCount = count;
      recommendedCode = code;
    }
  });
  
  // Get the color recommendation
  const colorInfo = pantoneColors[recommendedCode as keyof typeof pantoneColors];
  
  return {
    color: colorInfo.color,
    name: colorInfo.name,
    description: colorInfo.description
  };
};

export default function PersonalityQuiz({ onComplete, onBack }: PersonalityQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Quiz completed
      const result: QuizResult = {
        personality: answers.outfitStyle || value,
        skinTone: answers.skinTone || '',
        occasion: answers.priorityList || '',
        style: answers.accessories || ''
      };
      
      // Fill in the last answer
      if (questionId === 'outfitStyle') result.personality = value;
      if (questionId === 'skinTone') result.skinTone = value;
      if (questionId === 'priorityList') result.occasion = value;
      if (questionId === 'accessories') result.style = value;
      
      const recommendation = getColorRecommendation({ ...answers, [questionId]: value });
      onComplete(result, recommendation);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="retro-window">
          <div className="retro-titlebar flex items-center justify-between">
            <span>Pilih yang cocok denganmu nih!</span>
            <button onClick={onBack} className="retro-btn text-xs">◀ Back</button>
          </div>
          <div className="retro-content">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-retro), system-ui' }}>Personality Quiz</h1>
              <p className="text-xs opacity-70">Pertanyaan {currentQuestion + 1} dari {questions.length}</p>
            </div>

            {/* Progress */}
            <div className="retro-progress mb-6"><span style={{ width: `${progress}%` }}></span></div>

            {/* Question */}
            <div className="retro-card p-5 mb-6">
              <h2 className="font-semibold mb-4">{questions[currentQuestion].question}</h2>
              <div className="grid gap-3">
                {questions[currentQuestion].options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(questions[currentQuestion].id, option.value)}
                    className="retro-btn text-left flex items-center gap-3"
                  >
                    <span className="text-xl">{option.emoji}</span>
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  const mockAnswers = {
                    outfitStyle: 'bold',
                    priorityList: 'presentation',
                    handleMistake: 'admit',
                    lunchChoice: 'spicy',
                    girlieBoss: 'strong',
                    skinTone: 'warm',
                    accessories: 'gold',
                    workspace: 'heels'
                  };
                  const mockResult: QuizResult = {
                    personality: 'bold',
                    skinTone: 'warm',
                    occasion: 'presentation',
                    style: 'gold'
                  };
                  const recommendation = getColorRecommendation(mockAnswers);
                  onComplete(mockResult, recommendation);
                }}
                className="text-xs opacity-70 underline"
              >
                Skip to results (for testing)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

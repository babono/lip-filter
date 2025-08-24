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
    question: 'First day, first impression to be made. What\'s your outfit style to work?',
    options: [
      { value: 'bold', label: 'Bold', emoji: '🔥', codes: ['04', '05', '06'] },
      { value: 'neutral', label: 'Neutral', emoji: '⚖️', codes: ['02', '08'] },
      { value: 'soft', label: 'Soft', emoji: '🌸', codes: ['01', '03', '07'] }
    ]
  },
  {
    id: 'priorityList',
    question: 'You finally going to enter your workplace. What\'s on your priority list today?',
    options: [
      { value: 'presentation', label: 'Presentation pitch to CEO', emoji: '📊', codes: ['04', '05', '06'] },
      { value: 'daily', label: 'Nothing much, just daily diddle', emoji: '☕', codes: ['02', '08'] },
      { value: 'meeting', label: 'First timer so... meeting up with seniors?', emoji: '👥', codes: ['01', '03', '07'] }
    ]
  },
  {
    id: 'handleMistake',
    question: 'Oopsie, you made a little mistake. Now, how would you handle it?',
    options: [
      { value: 'admit', label: 'Let\'s just admit it and solve it soon', emoji: '💪', codes: ['04', '05', '06'] },
      { value: 'ask', label: 'Perhaps, asking for opinion would be better', emoji: '🤔', codes: ['02', '08'] },
      { value: 'tomorrow', label: 'Maybe not today, maybe tomorrow', emoji: '😅', codes: ['01', '03', '07'] }
    ]
  },
  {
    id: 'lunchChoice',
    question: 'Lunch time is coming. What would you eat today?',
    options: [
      { value: 'spicy', label: 'That super-spicy nasgor sounds tempting', emoji: '🌶️', codes: ['04', '05', '06'] },
      { value: 'sandwich', label: 'Easy sandwich to get-go', emoji: '🥪', codes: ['02', '08'] },
      { value: 'homemade', label: 'Lunch-box made by myself', emoji: '🍱', codes: ['01', '03', '07'] }
    ]
  },
  {
    id: 'girlieBoss',
    question: 'Dream on! What kind of girlie boss you will be?',
    options: [
      { value: 'strong', label: 'The strong, stand-out one with fiery will', emoji: '👑', codes: ['04', '05', '06'] },
      { value: 'mingle', label: 'Mingle and fun discussion is a must!', emoji: '💬', codes: ['02', '08'] },
      { value: 'kind', label: 'Kindness and thoughtful is a win for me', emoji: '💝', codes: ['01', '03', '07'] }
    ]
  },
  {
    id: 'skinTone',
    question: 'Embrace your shade. What\'s your skin tone?',
    options: [
      { value: 'warm', label: 'Warm', emoji: '🤎', codes: ['01', '06', '08'] },
      { value: 'neutral', label: 'Neutral', emoji: '🤍', codes: ['02', '07'] },
      { value: 'cool', label: 'Cool', emoji: '🫒', codes: ['03', '04', '05'] }
    ]
  },
  {
    id: 'accessories',
    question: 'Little sparkles would add some vibe, obvi. Which accessories suit you most?',
    options: [
      { value: 'gold', label: 'Gold and gold', emoji: '✨', codes: ['01', '06', '08'] },
      { value: 'both', label: 'I can do both', emoji: '💫', codes: ['02', '07'] },
      { value: 'silver', label: 'Silver hits best', emoji: '⚡', codes: ['03', '04', '05'] }
    ]
  },
  {
    id: 'workspace',
    question: 'Let\'s decorate our workspace! Which one is your fave?',
    options: [
      { value: 'heels', label: 'Extra pair of red heels & perfume', emoji: '👠', codes: ['01', '06', '08'] },
      { value: 'coffee', label: 'My coffee tumbler & simple mirror', emoji: '☕', codes: ['02', '07'] },
      { value: 'plushie', label: 'Comfy pastel plushie & reed diffusers', emoji: '🧸', codes: ['03', '04', '05'] }
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onBack}
            className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Personality Quiz</h1>
          <p className="text-gray-600">Question {currentQuestion + 1} of {questions.length}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div 
            className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {questions[currentQuestion].question}
          </h2>
          
          <div className="grid gap-4">
            {questions[currentQuestion].options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(questions[currentQuestion].id, option.value)}
                className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all duration-200 text-left"
              >
                <span className="text-2xl mr-4">{option.emoji}</span>
                <span className="text-lg font-medium text-gray-800">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Skip option for testing */}
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
            className="text-gray-500 hover:text-gray-700 underline"
          >
            Skip to results (for testing)
          </button>
        </div>
      </div>
    </div>
  );
}

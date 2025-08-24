'use client';

import { useState } from 'react';
import { QuizResult, ColorRecommendation } from '../page';

interface PersonalityQuizProps {
  onComplete: (result: QuizResult, recommendation: ColorRecommendation) => void;
  onBack: () => void;
}

const questions = [
  {
    id: 'personality',
    question: 'What best describes your personality?',
    options: [
      { value: 'bold', label: 'Bold & Confident', emoji: '🔥' },
      { value: 'romantic', label: 'Romantic & Feminine', emoji: '💕' },
      { value: 'natural', label: 'Natural & Minimalist', emoji: '🌿' },
      { value: 'creative', label: 'Creative & Artistic', emoji: '🎨' },
      { value: 'professional', label: 'Professional & Sophisticated', emoji: '💼' }
    ]
  },
  {
    id: 'skinTone',
    question: 'What\'s your skin tone?',
    options: [
      { value: 'fair', label: 'Fair/Light', emoji: '🤍' },
      { value: 'medium', label: 'Medium', emoji: '🤎' },
      { value: 'olive', label: 'Olive', emoji: '🫒' },
      { value: 'deep', label: 'Deep/Dark', emoji: '🖤' }
    ]
  },
  {
    id: 'occasion',
    question: 'What occasion are you shopping for?',
    options: [
      { value: 'everyday', label: 'Everyday Wear', emoji: '☀️' },
      { value: 'work', label: 'Work/Professional', emoji: '💼' },
      { value: 'date', label: 'Date Night', emoji: '💕' },
      { value: 'party', label: 'Party/Event', emoji: '🎉' },
      { value: 'special', label: 'Special Occasion', emoji: '✨' }
    ]
  },
  {
    id: 'style',
    question: 'What\'s your preferred lipstick finish?',
    options: [
      { value: 'matte', label: 'Matte', emoji: '🎭' },
      { value: 'glossy', label: 'Glossy', emoji: '💋' },
      { value: 'satin', label: 'Satin', emoji: '🌟' },
      { value: 'metallic', label: 'Metallic', emoji: '✨' }
    ]
  }
];

// Color recommendation logic based on quiz results
const getColorRecommendation = (result: QuizResult): ColorRecommendation => {
  const { personality, skinTone, occasion, style } = result;
  
  // Define color palettes for different combinations
  const colorPalettes = {
    bold: {
      fair: '#FF1744', // Bright Red
      medium: '#C2185B', // Deep Pink
      olive: '#8E24AA', // Purple
      deep: '#4527A0' // Deep Purple
    },
    romantic: {
      fair: '#FF6B9D', // Soft Pink
      medium: '#E91E63', // Pink
      olive: '#9C27B0', // Purple
      deep: '#6A1B9A' // Deep Purple
    },
    natural: {
      fair: '#FFB74D', // Peach
      medium: '#FF8A65', // Coral
      olive: '#A1887F', // Brown
      deep: '#8D6E63' // Dark Brown
    },
    creative: {
      fair: '#FF5722', // Orange
      medium: '#FF9800', // Orange
      olive: '#FFC107', // Amber
      deep: '#FF8F00' // Dark Orange
    },
    professional: {
      fair: '#795548', // Brown
      medium: '#5D4037', // Dark Brown
      olive: '#3E2723', // Very Dark Brown
      deep: '#212121' // Almost Black
    }
  };

  const baseColor = colorPalettes[personality as keyof typeof colorPalettes]?.[skinTone as keyof typeof colorPalettes.bold] || '#FF1744';
  
  const colorNames = {
    '#FF1744': 'Bold Red',
    '#C2185B': 'Deep Pink',
    '#8E24AA': 'Royal Purple',
    '#4527A0': 'Deep Purple',
    '#FF6B9D': 'Soft Pink',
    '#E91E63': 'Vibrant Pink',
    '#9C27B0': 'Rich Purple',
    '#6A1B9A': 'Deep Purple',
    '#FFB74D': 'Peach',
    '#FF8A65': 'Coral',
    '#A1887F': 'Mocha',
    '#8D6E63': 'Dark Brown',
    '#FF5722': 'Vibrant Orange',
    '#FF9800': 'Warm Orange',
    '#FFC107': 'Golden Amber',
    '#FF8F00': 'Deep Orange',
    '#795548': 'Classic Brown',
    '#5D4037': 'Rich Brown',
    '#3E2723': 'Deep Brown',
    '#212121': 'Almost Black'
  };

  const descriptions = {
    bold: 'Perfect for making a statement!',
    romantic: 'Soft and feminine for romantic moments.',
    natural: 'Natural and understated elegance.',
    creative: 'Bold and artistic expression.',
    professional: 'Sophisticated and workplace-appropriate.'
  };

  return {
    color: baseColor,
    name: colorNames[baseColor as keyof typeof colorNames] || 'Perfect Match',
    description: descriptions[personality as keyof typeof descriptions] || 'Tailored just for you!'
  };
};

export default function PersonalityQuiz({ onComplete, onBack }: PersonalityQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizResult>>({});

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Quiz completed
      const result: QuizResult = {
        personality: answers.personality || value,
        skinTone: answers.skinTone || '',
        occasion: answers.occasion || '',
        style: answers.style || ''
      };
      
      // Fill in the last answer
      if (questionId === 'personality') result.personality = value;
      if (questionId === 'skinTone') result.skinTone = value;
      if (questionId === 'occasion') result.occasion = value;
      if (questionId === 'style') result.style = value;
      
      const recommendation = getColorRecommendation(result);
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
              const mockResult: QuizResult = {
                personality: 'bold',
                skinTone: 'medium',
                occasion: 'party',
                style: 'matte'
              };
              const recommendation = getColorRecommendation(mockResult);
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

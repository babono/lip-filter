'use client';

import { useState, useRef, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import PersonalityQuiz from './components/PersonalityQuiz';
import LipFilter from './components/LipFilter';
import CaptureResult from './components/CaptureResult';

// Types for the app state
export type QuizResult = {
  personality: string;
  skinTone: string;
  occasion: string;
  style: string;
};

export type ColorRecommendation = {
  color: string;
  name: string;
  description: string;
};

export type AppState = {
  currentScreen: 'home' | 'quiz' | 'filter' | 'result';
  quizResult: QuizResult | null;
  colorRecommendation: ColorRecommendation | null;
  capturedImage: string | null;
};

// Main App Component
export default function LipFilterApp() {
  const [appState, setAppState] = useState<AppState>({
    currentScreen: 'home',
    quizResult: null,
    colorRecommendation: null,
    capturedImage: null,
  });

  const navigateToScreen = (screen: AppState['currentScreen']) => {
    setAppState(prev => ({ ...prev, currentScreen: screen }));
  };

  const handleQuizComplete = (result: QuizResult, recommendation: ColorRecommendation) => {
    setAppState(prev => ({
      ...prev,
      currentScreen: 'filter',
      quizResult: result,
      colorRecommendation: recommendation,
    }));
  };

  const handleCaptureComplete = (imageData: string) => {
    setAppState(prev => ({
      ...prev,
      currentScreen: 'result',
      capturedImage: imageData,
    }));
  };

  const resetApp = () => {
    setAppState({
      currentScreen: 'home',
      quizResult: null,
      colorRecommendation: null,
      capturedImage: null,
    });
  };

  const renderCurrentScreen = () => {
    switch (appState.currentScreen) {
      case 'home':
        return (
          <HomeScreen 
            onStartQuiz={() => navigateToScreen('quiz')}
          />
        );
      case 'quiz':
        return (
          <PersonalityQuiz 
            onComplete={handleQuizComplete}
            onBack={() => navigateToScreen('home')}
          />
        );
      case 'filter':
        return (
          <LipFilter 
            colorRecommendation={appState.colorRecommendation}
            onCapture={handleCaptureComplete}
            onBack={() => navigateToScreen('quiz')}
          />
        );
      case 'result':
        return (
          <CaptureResult 
            capturedImage={appState.capturedImage}
            colorRecommendation={appState.colorRecommendation}
            onTryAgain={() => navigateToScreen('filter')}
            onNewQuiz={() => resetApp()}
          />
        );
      default:
        return <HomeScreen onStartQuiz={() => navigateToScreen('quiz')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100">
      {renderCurrentScreen()}
    </div>
  );
}

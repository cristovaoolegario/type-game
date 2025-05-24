
import React, { useState, useEffect, useCallback } from 'react';
import { CodeBuilderChallenge, CodeSnippetPart, BlankPart } from '../types';
import { CODE_BUILDER_CHALLENGES, shuffleArray } from '../constants';
import CheckIcon from '../components/icons/CheckIcon';
import XIcon from '../components/icons/XIcon';
import { playSound, SfxType } from '../audioManager';

interface CodeBuilderGameProps {
  onExit: () => void;
}

type GameStatus = 'idle' | 'playing' | 'challengeCompleted' | 'gameOver';

const CodeBuilderGame: React.FC<CodeBuilderGameProps> = ({ onExit }) => {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [challenges, setChallenges] = useState<CodeBuilderChallenge[]>([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [currentChallengeParts, setCurrentChallengeParts] = useState<CodeSnippetPart[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect' | 'neutral', message: string }>({ type: 'neutral', message: '' });
  const [score, setScore] = useState(0);

  const currentChallenge = challenges[currentChallengeIndex];

  const loadChallenges = useCallback(() => {
    setChallenges(shuffleArray([...CODE_BUILDER_CHALLENGES]));
  }, []);

  const setupCurrentChallenge = useCallback(() => {
    if (challenges.length > 0 && currentChallengeIndex < challenges.length) {
      const challenge = challenges[currentChallengeIndex];
      const initialParts = challenge.parts.map(part => 
        part.type === 'blank' ? { ...part, filledContent: undefined } : part
      );
      setCurrentChallengeParts(initialParts);
      setSelectedOption(null);
      setFeedback({ type: 'neutral', message: '' });
    }
  }, [challenges, currentChallengeIndex]);

  useEffect(() => {
    if (status === 'playing' || status === 'challengeCompleted') {
      setupCurrentChallenge();
    }
  }, [status, setupCurrentChallenge]);


  const handleActualStartGame = () => {
    playSound(SfxType.GAME_START);
    loadChallenges();
    setCurrentChallengeIndex(0);
    setScore(0);
    setStatus('playing');
  };

  useEffect(() => {
    if (status === 'playing' && challenges.length > 0 && currentChallengeParts.length === 0) {
      setupCurrentChallenge();
    }
  }, [status, challenges, currentChallengeParts.length, setupCurrentChallenge]);


  const handleOptionClick = (option: string) => {
    playSound(SfxType.UI_CLICK);
    setSelectedOption(option);
    setFeedback({ type: 'neutral', message: 'Opção selecionada. Clique em uma lacuna.' });
  };

  const handleBlankClick = (blankId: string) => {
    playSound(SfxType.UI_CLICK);
    if (!selectedOption) {
      playSound(SfxType.NEGATIVE_FEEDBACK);
      setFeedback({ type: 'incorrect', message: 'Selecione uma opção primeiro!' });
      return;
    }

    const newParts = currentChallengeParts.map(part => {
      if (part.type === 'blank' && part.id === blankId) {
        if (part.expected === selectedOption) {
          playSound(SfxType.POSITIVE_FEEDBACK);
          setFeedback({ type: 'correct', message: 'Correto!' });
          setTimeout(() => setFeedback({ type: 'neutral', message: '' }), 1000);
          return { ...part, filledContent: selectedOption };
        } else {
          playSound(SfxType.NEGATIVE_FEEDBACK);
          setFeedback({ type: 'incorrect', message: `Incorreto. Esperado: ${part.expected}` });
          setTimeout(() => setFeedback({ type: 'neutral', message: '' }), 1500);
          return part;
        }
      }
      return part;
    });

    setCurrentChallengeParts(newParts);
    setSelectedOption(null); 

    const allBlanks = newParts.filter(p => p.type === 'blank') as BlankPart[];
    const allCorrectlyFilled = allBlanks.every(b => b.filledContent === b.expected);

    if (allCorrectlyFilled) {
      playSound(SfxType.POSITIVE_FEEDBACK); // Challenge complete sound
      setScore(s => s + 10);
      setFeedback({ type: 'correct', message: 'Desafio Completo!' });
      setTimeout(() => {
        if (currentChallengeIndex < challenges.length - 1) {
          setCurrentChallengeIndex(prev => prev + 1);
          setStatus('challengeCompleted'); 
        } else {
          setStatus('gameOver');
          playSound(SfxType.POSITIVE_FEEDBACK); // Game finished sound
          setFeedback({ type: 'neutral', message: 'Parabéns! Você completou todos os desafios!'});
        }
      }, 1500);
    }
  };
  
  useEffect(() => {
    if (status === 'challengeCompleted') {
      setStatus('playing');
    }
  }, [status]);

  const handleStartButtonClick = () => {
    playSound(SfxType.UI_CLICK);
    handleActualStartGame();
  };

  const handleExitClick = () => {
    // playSound(SfxType.UI_CLICK); // Handled by App.tsx
    onExit();
  }


  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-slate-100 custom-font-comic">
        <div className="bg-slate-800/70 backdrop-blur-md p-10 rounded-xl shadow-2xl text-center border border-slate-700/50">
          <h2 className="text-4xl font-bold mb-6 text-cyan-400" style={{ textShadow: '0 0 6px theme("colors.cyan.500 / 60%")' }}>Construtor de Código</h2>
          <p className="mb-8 text-lg text-slate-300">Monte os blocos de código corretamente!</p>
          <button
            onClick={handleStartButtonClick}
            className="px-8 py-4 bg-yellow-500 text-slate-900 text-2xl font-semibold rounded-lg shadow-md hover:bg-yellow-400 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-600 focus:ring-opacity-50"
          >
            Começar!
          </button>
          <button onClick={handleExitClick} className="mt-6 block mx-auto px-6 py-2 bg-slate-600 text-slate-200 text-lg rounded-md hover:bg-slate-500 transition">Voltar</button>
        </div>
      </div>
    );
  }

  if (status === 'gameOver') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-slate-100 custom-font-comic">
        <div className="bg-slate-800/70 backdrop-blur-md p-8 rounded-xl shadow-2xl text-center border border-slate-700/50">
          <h2 className="text-5xl font-bold mb-4 text-green-400" style={{ textShadow: '0 0 8px theme("colors.green.400 / 70%")' }}>🎉 Jogo Finalizado! 🎉</h2>
          <p className="text-3xl mb-2 text-slate-200">{feedback.message}</p>
          <p className="text-2xl mb-6">Sua pontuação: <span className="font-bold text-yellow-300" style={{ textShadow: '0 0 4px theme("colors.yellow.400 / 70%")' }}>{score}</span></p>
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleStartButtonClick}
              className="px-8 py-3 bg-yellow-500 text-slate-900 text-xl font-semibold rounded-lg shadow-md hover:bg-yellow-400 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-600 focus:ring-opacity-50"
            >
              Jogar Novamente
            </button>
            <button onClick={handleExitClick} className="px-8 py-3 bg-slate-600 text-slate-200 text-xl font-semibold rounded-lg shadow-md hover:bg-slate-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-slate-700 focus:ring-opacity-50">
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentChallenge || currentChallengeParts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-slate-400 custom-font-comic animate-pulse">
        Carregando desafio...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 custom-font-comic text-slate-100">
      <header className="w-full max-w-4xl p-4 bg-slate-800/60 backdrop-blur-sm rounded-lg shadow-xl mb-6 flex justify-between items-center border border-slate-700/50">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400" style={{ textShadow: '0 0 5px theme("colors.cyan.500 / 50%")' }}>Construtor de Código</h1>
          <p className="text-sm sm:text-md text-slate-300">Desafio: {currentChallengeIndex + 1} de {challenges.length}</p>
          {currentChallenge.title && <p className="text-sm text-slate-400">{currentChallenge.title}</p>}
        </div>
        <div className="text-right">
          <p className="text-xl sm:text-2xl font-semibold">Pontos: <span className="text-yellow-300" style={{ textShadow: '0 0 4px theme("colors.yellow.400 / 70%")' }}>{score}</span></p>
        </div>
      </header>

      <div className="w-full max-w-3xl p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm rounded-xl shadow-2xl mb-6 border border-slate-700">
        <p className="text-lg text-slate-300 mb-3">Complete o código:</p>
        <pre className="text-left text-md sm:text-lg bg-black/60 p-3 sm:p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words min-h-[100px] border border-slate-700/50 shadow-inner">
          {currentChallengeParts.map((part, index) => {
            if (part.type === 'text') {
              return <span key={index} className="text-slate-200">{part.content}</span>;
            }
            return (
              <button
                key={part.id}
                onClick={() => handleBlankClick(part.id)}
                disabled={!!part.filledContent}
                className={`
                  inline-block px-3 py-1.5 mx-1 my-0.5 rounded border-2 min-w-[70px] text-center align-baseline
                  transition-all duration-150
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-pink-500
                  ${part.filledContent 
                      ? 'bg-green-600 border-green-500 text-white font-semibold cursor-default shadow-md' 
                      : `bg-purple-700 hover:bg-purple-600 border-purple-500 text-purple-200 
                         ${selectedOption ? 'cursor-pointer hover:shadow-lg' : 'cursor-not-allowed opacity-70'}`
                  }
                `}
                style={part.filledContent ? {textShadow:'0 0 3px rgba(255,255,255,0.3)'} : {}}
              >
                {part.filledContent || '____'}
              </button>
            );
          })}
        </pre>
      </div>

      <div className="w-full max-w-3xl p-3 sm:p-4 bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-xl mb-6 border border-slate-700/50">
        <p className="text-lg text-slate-300 mb-3 text-center">Banco de Opções:</p>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {shuffleArray(currentChallenge.options).map((option) => (
            <button
              key={option} 
              onClick={() => handleOptionClick(option)} 
              className={`
                px-3 py-2 sm:px-4 sm:py-2.5 rounded-md text-sm sm:text-base font-semibold shadow-md transition-all
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800
                ${selectedOption === option 
                    ? 'bg-pink-600 text-white ring-2 ring-white transform scale-105 shadow-lg' 
                    : 'bg-sky-600 hover:bg-sky-500 text-white hover:shadow-lg'
                }
              `}
            >
              {option} 
            </button>
          ))}
        </div>
      </div>
      
      <div className={`w-full max-w-3xl mt-2 p-3 rounded-md text-lg h-12 flex items-center justify-center transition-all duration-300 border
        ${feedback.type === 'correct' ? 'bg-green-500/80 border-green-400/80 text-white' : ''}
        ${feedback.type === 'incorrect' ? 'bg-red-500/80 border-red-400/80 text-white' : ''}
        ${feedback.type === 'neutral' && feedback.message ? 'bg-sky-600/80 border-sky-500/80 text-white' : 'border-transparent'}
      `}>
        {feedback.type === 'correct' && <CheckIcon className="w-6 h-6 mr-2"/>}
        {feedback.type === 'incorrect' && <XIcon className="w-6 h-6 mr-2"/>}
        {feedback.message}
      </div>

      <button onClick={handleExitClick} className="mt-8 px-6 py-2 bg-slate-700/80 text-slate-300 text-lg rounded-md hover:bg-slate-600/80 transition focus:outline-none focus:ring-2 focus:ring-slate-500">Voltar ao Menu</button>
    </div>
  );
};

export default CodeBuilderGame;

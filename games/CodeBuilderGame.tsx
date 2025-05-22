
import React, { useState, useEffect, useCallback } from 'react';
// Fix: Import CodeBuilderChallenge, CodeSnippetPart, BlankPart from '../types'
import { CodeBuilderChallenge, CodeSnippetPart, BlankPart } from '../types';
// Fix: Import CODE_BUILDER_CHALLENGES and shuffleArray from '../constants'
import { CODE_BUILDER_CHALLENGES, shuffleArray } from '../constants';
import CheckIcon from '../components/icons/CheckIcon';
import XIcon from '../components/icons/XIcon';

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
      // Reset filledContent for blanks when loading a new challenge or restarting
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


  const startGame = () => {
    loadChallenges();
    setCurrentChallengeIndex(0);
    setScore(0);
    setStatus('playing');
  };

  useEffect(() => {
    // This effect runs when `challenges` state is updated by `startGame` -> `loadChallenges`.
    // It ensures that after challenges are loaded and `startGame` sets status to 'playing',
    // the first challenge's parts are correctly initialized.
    if (status === 'playing' && challenges.length > 0 && currentChallengeParts.length === 0) {
      setupCurrentChallenge();
    }
  }, [status, challenges, currentChallengeParts.length, setupCurrentChallenge]);


  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    setFeedback({ type: 'neutral', message: 'Opção selecionada. Clique em uma lacuna.' });
  };

  const handleBlankClick = (blankId: string) => {
    if (!selectedOption) {
      setFeedback({ type: 'incorrect', message: 'Selecione uma opção primeiro!' });
      return;
    }

    const newParts = currentChallengeParts.map(part => {
      if (part.type === 'blank' && part.id === blankId) {
        if (part.expected === selectedOption) {
          setFeedback({ type: 'correct', message: 'Correto!' });
          setTimeout(() => setFeedback({ type: 'neutral', message: '' }), 1000);
          return { ...part, filledContent: selectedOption };
        } else {
          setFeedback({ type: 'incorrect', message: `Incorreto. Esperado: ${part.expected}` });
          setTimeout(() => setFeedback({ type: 'neutral', message: '' }), 1500);
          // Do not fill if incorrect, or briefly show and clear
          return part;
        }
      }
      return part;
    });

    setCurrentChallengeParts(newParts);
    setSelectedOption(null); // Deselect option after attempting to fill

    // Check if all blanks are filled correctly
    const allBlanks = newParts.filter(p => p.type === 'blank') as BlankPart[];
    const allCorrectlyFilled = allBlanks.every(b => b.filledContent === b.expected);

    if (allCorrectlyFilled) {
      setScore(s => s + 10);
      setFeedback({ type: 'correct', message: 'Desafio Completo!' });
      setTimeout(() => {
        if (currentChallengeIndex < challenges.length - 1) {
          setCurrentChallengeIndex(prev => prev + 1);
          setStatus('challengeCompleted'); // Will trigger useEffect to setup next challenge
        } else {
          setStatus('gameOver');
          setFeedback({ type: 'neutral', message: 'Parabéns! Você completou todos os desafios!'});
        }
      }, 1500);
    }
  };
  
  useEffect(() => {
    if (status === 'challengeCompleted') {
      // This ensures that after status becomes 'challengeCompleted', it transitions to 'playing'
      // for the next challenge, which then triggers the setup of that new challenge.
      setStatus('playing');
    }
  }, [status]);


  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-tr from-orange-300 to-red-500 p-6 text-white custom-font-comic">
        <div className="bg-white/20 backdrop-blur-md p-10 rounded-xl shadow-2xl text-center">
          <h2 className="text-4xl font-bold mb-6">Construtor de Código</h2>
          <p className="mb-8 text-lg">Monte os blocos de código corretamente!</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-yellow-500 text-white text-2xl font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300"
          >
            Começar!
          </button>
          <button onClick={onExit} className="mt-4 block mx-auto px-6 py-2 bg-slate-600 text-white text-lg rounded-md hover:bg-slate-700 transition">Voltar</button>
        </div>
      </div>
    );
  }

  if (status === 'gameOver') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-400 to-teal-600 p-6 text-white custom-font-comic">
        <div className="bg-white/30 backdrop-blur-lg p-8 rounded-xl shadow-xl text-center">
          <h2 className="text-5xl font-bold mb-4">🎉 Jogo Finalizado! 🎉</h2>
          <p className="text-3xl mb-2">{feedback.message}</p>
          <p className="text-2xl mb-6">Sua pontuação: <span className="font-bold text-yellow-300">{score}</span></p>
          <button
            onClick={startGame}
            className="mt-4 px-8 py-3 bg-orange-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-orange-600 transition mr-4"
          >
            Jogar Novamente
          </button>
          <button onClick={onExit} className="mt-4 px-8 py-3 bg-slate-600 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-slate-700 transition">Sair</button>
        </div>
      </div>
    );
  }

  if (!currentChallenge || currentChallengeParts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-700 p-6 text-white custom-font-comic">
        Carregando desafio...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 p-4 custom-font-comic text-white">
      <header className="w-full max-w-4xl p-4 bg-white/20 backdrop-blur-md rounded-lg shadow-lg mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-100">Construtor de Código</h1>
          <p className="text-sm sm:text-md text-purple-200">Desafio: {currentChallengeIndex + 1} de {challenges.length}</p>
          {currentChallenge.title && <p className="text-sm text-purple-200">{currentChallenge.title}</p>}
        </div>
        <div className="text-right">
          <p className="text-xl sm:text-2xl font-semibold">Pontos: <span className="text-yellow-300">{score}</span></p>
        </div>
      </header>

      {/* Code Snippet Area */}
      <div className="w-full max-w-3xl p-4 sm:p-6 bg-slate-800/70 backdrop-blur-sm rounded-xl shadow-lg mb-6">
        <p className="text-lg text-purple-200 mb-3">Complete o código:</p>
        <pre className="text-left text-md sm:text-lg bg-black/50 p-3 sm:p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-words min-h-[100px]">
          {currentChallengeParts.map((part, index) => {
            if (part.type === 'text') {
              return <span key={index}>{part.content}</span>;
            }
            // Blank part
            return (
              <button
                key={part.id}
                onClick={() => handleBlankClick(part.id)}
                disabled={!!part.filledContent}
                className={`
                  inline-block px-2 py-1 mx-1 my-0.5 rounded border-2 min-w-[60px] text-center
                  align-baseline focus:outline-none focus:ring-2 focus:ring-pink-400
                  ${part.filledContent 
                      ? 'bg-green-600 border-green-400 text-white cursor-default' 
                      : 'bg-purple-600 hover:bg-purple-500 border-purple-400 text-purple-100 cursor-pointer'
                  }
                `}
              >
                {part.filledContent || '____'}
              </button>
            );
          })}
        </pre>
      </div>

      {/* Options Bank */}
      <div className="w-full max-w-3xl p-3 sm:p-4 bg-white/20 backdrop-blur-md rounded-xl shadow-lg mb-6">
        <p className="text-lg text-purple-100 mb-3 text-center">Banco de Opções:</p>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {shuffleArray(currentChallenge.options).map((option) => (
            <button
              key={option} // option is string, which is a valid React.Key
              onClick={() => handleOptionClick(option)} // option is string, matching expected type
              className={`
                px-3 py-2 sm:px-4 sm:py-2.5 rounded-md text-sm sm:text-base font-semibold shadow-sm transition-all
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-purple-700
                ${selectedOption === option 
                    ? 'bg-pink-500 text-white ring-2 ring-white transform scale-105' 
                    : 'bg-sky-500 hover:bg-sky-400 text-white'
                }
              `}
            >
              {option} {/* option is string, which is a valid ReactNode */}
            </button>
          ))}
        </div>
      </div>
      
      {/* Feedback Area */}
      <div className={`w-full max-w-3xl mt-2 p-3 rounded-md text-lg h-12 flex items-center justify-center transition-all duration-300
        ${feedback.type === 'correct' ? 'bg-green-500/80' : ''}
        ${feedback.type === 'incorrect' ? 'bg-red-500/80' : ''}
        ${feedback.type === 'neutral' && feedback.message ? 'bg-sky-600/80' : ''}
      `}>
        {feedback.type === 'correct' && <CheckIcon className="w-6 h-6 mr-2"/>}
        {feedback.type === 'incorrect' && <XIcon className="w-6 h-6 mr-2"/>}
        {feedback.message}
      </div>

      <button onClick={onExit} className="mt-8 px-6 py-2 bg-slate-200/70 text-slate-800 text-lg rounded-md hover:bg-slate-100/90 transition">Voltar ao Menu</button>
    </div>
  );
};

export default CodeBuilderGame;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChallengeItem, KeyPressExpected } from '../types';
import { PHASE1_KEYS, PHASE2_COMBINATIONS, PHASE3_TERMS, shuffleArray } from '../constants';
import VirtualKeyboard from '../components/VirtualKeyboard';
import CheckIcon from '../components/icons/CheckIcon';
import XIcon from '../components/icons/XIcon';

interface CommandRaceGameProps {
  onExit: () => void;
}

const MODIFIER_KEYS = ["Control", "Shift", "Alt", "Meta"];
const TOTAL_CHALLENGES_TO_WIN = 10; // Number of correct challenges to win
const INITIAL_GAME_TIME_SECONDS = 90; // Total time for the game
const PLAYER_AVATAR = '🚀'; // Player's avatar

const CommandRaceGame: React.FC<CommandRaceGameProps> = ({ onExit }) => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [allChallenges, setAllChallenges] = useState<ChallengeItem[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeItem | null>(null);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0); // Correct challenges completed
  const [timeLeft, setTimeLeft] = useState(INITIAL_GAME_TIME_SECONDS);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'neutral'>('neutral');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [pressedKeyForKeyboard, setPressedKeyForKeyboard] = useState<string | null>(null);
  
  const timerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const loadChallenges = useCallback(() => {
    const combinedChallenges = shuffleArray([...PHASE1_KEYS, ...PHASE2_COMBINATIONS, ...PHASE3_TERMS]);
    setAllChallenges(combinedChallenges);
    return combinedChallenges;
  }, []);

  const nextChallenge = useCallback(() => {
    setFeedback('neutral');
    setFeedbackMessage('');
    setUserInput('');
    setPressedKeyForKeyboard(null);

    if (allChallenges.length > 0) {
      // Simple way: pick a random one. Could also cycle through them.
      const randomIndex = Math.floor(Math.random() * allChallenges.length);
      setCurrentChallenge(allChallenges[randomIndex]);
    } else {
        // This case should ideally not be reached if challenges are loaded.
        // Or could mean all unique challenges are done, and we need to reload/recycle.
        const reloadedChallenges = loadChallenges();
        if (reloadedChallenges.length > 0) {
             setCurrentChallenge(reloadedChallenges[Math.floor(Math.random() * reloadedChallenges.length)]);
        } else {
            // Game cannot continue without challenges
            setFeedbackMessage("Erro: Não há desafios disponíveis!");
            setGameState('lost'); // Or a specific error state
        }
    }
  }, [allChallenges, loadChallenges]);

  const startGame = useCallback(() => {
    loadChallenges(); // Ensure challenges are loaded fresh
    setScore(0);
    setTimeLeft(INITIAL_GAME_TIME_SECONDS);
    setGameState('playing');
    setFeedback('neutral');
    setFeedbackMessage('O jogo começou! Boa sorte!');
    nextChallenge(); // Load the first challenge
  }, [loadChallenges, nextChallenge]);

  useEffect(() => {
    // Initialize challenges on mount
    if(allChallenges.length === 0) {
        loadChallenges();
    }
  }, [loadChallenges, allChallenges.length]);


  useEffect(() => {
    if (gameState === 'playing') {
      nextChallenge(); // Load the first challenge when game starts
    }
  }, [gameState, nextChallenge]); // Removed allChallenges from deps to avoid re-triggering on load


  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft <= 0) {
      setGameState('lost');
      setFeedbackMessage('Tempo esgotado!');
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft]);

  const handleCorrect = useCallback(() => {
    const newScore = score + 1;
    setScore(newScore);
    setFeedback('correct');
    setFeedbackMessage('Correto! Avance!');
    
    if (newScore >= TOTAL_CHALLENGES_TO_WIN) {
      setGameState('won');
      setFeedbackMessage('Parabéns! Você venceu a corrida!');
    } else {
      setTimeout(() => nextChallenge(), 1000);
    }
  }, [score, nextChallenge]);

  const handleIncorrect = useCallback(() => {
    setFeedback('incorrect');
    setFeedbackMessage('Ops! Tente de novo.');
    // Optional: Time penalty
    // setTimeLeft(prev => Math.max(0, prev - 3)); 

    setTimeout(() => {
        setFeedback('neutral');
        setFeedbackMessage('');
        if (currentChallenge && currentChallenge.type === 'term') {
            setUserInput(''); 
        }
    }, 1000);
  }, [currentChallenge]);

  const checkAnswer = useCallback((event: KeyboardEvent) => {
    if (!currentChallenge || gameState !== 'playing') {
      return;
    }

    setPressedKeyForKeyboard(event.key);

    const { type, expected } = currentChallenge;

     if (typeof expected === 'object' && (expected as KeyPressExpected).preventDefault) {
        event.preventDefault();
    }

    if (type === 'key' || type === 'combo') {
      const keyPressDetails = expected as KeyPressExpected;
      if (type === 'combo' && MODIFIER_KEYS.includes(event.key)) {
        return; // Wait for the non-modifier key
      }
      const match =
        keyPressDetails.key.toLowerCase() === event.key.toLowerCase() &&
        (keyPressDetails.ctrlKey === undefined || keyPressDetails.ctrlKey === event.ctrlKey) &&
        (keyPressDetails.shiftKey === undefined || keyPressDetails.shiftKey === event.shiftKey) &&
        (keyPressDetails.altKey === undefined || keyPressDetails.altKey === event.altKey) &&
        (keyPressDetails.metaKey === undefined || keyPressDetails.metaKey === event.metaKey);

      if (match) handleCorrect();
      else handleIncorrect();

    } else if (type === 'term') {
      if (event.key.length === 1 && (event.key.match(/[a-z0-9 ]/i) || currentChallenge.expected === userInput + event.key.toLowerCase() )) {
        const typedChar = event.key.toLowerCase();
        const newUserInput = userInput + typedChar;
        setUserInput(newUserInput);

        if (newUserInput === (expected as string).toLowerCase()) {
          handleCorrect();
        } else if ((expected as string).toLowerCase().startsWith(newUserInput)) {
          setFeedback('neutral');
          setFeedbackMessage('Continue digitando...');
        } else {
          handleIncorrect();
          setUserInput(''); 
        }
      } else if (event.key === 'Backspace') {
         setUserInput(prev => prev.slice(0, -1));
      } else if (event.key === 'Enter' && userInput === (expected as string).toLowerCase()){
        handleCorrect();
      }
    }
  }, [currentChallenge, gameState, userInput, handleCorrect, handleIncorrect]);

  useEffect(() => {
    if (gameState === 'playing') {
      window.addEventListener('keydown', checkAnswer);
      return () => window.removeEventListener('keydown', checkAnswer);
    }
  }, [checkAnswer, gameState]);


  // Game Screens
  if (gameState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 p-6 text-white custom-font-comic">
        <div className="bg-white/20 backdrop-blur-md p-10 rounded-xl shadow-2xl text-center">
          <h2 className="text-4xl font-bold mb-6">Corrida de Comandos!</h2>
          <p className="mb-8 text-lg">Digite rápido para vencer a corrida contra o tempo!</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-green-500 text-white text-2xl font-semibold rounded-lg shadow-md hover:bg-green-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
          >
            Começar Corrida!
          </button>
          <button onClick={onExit} className="mt-4 block mx-auto px-6 py-2 bg-slate-500 text-white text-lg rounded-md hover:bg-slate-600 transition">Voltar ao Menu</button>
        </div>
      </div>
    );
  }

  if (gameState === 'won' || gameState === 'lost') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-6 text-white custom-font-comic">
        <div className="bg-white/30 backdrop-blur-lg p-8 rounded-xl shadow-xl text-center">
          <h2 className="text-5xl font-bold mb-4">
            {gameState === 'won' ? `🎉 Você Venceu! 🎉` : `😭 Fim de Jogo! 😭`}
          </h2>
          <p className="text-3xl mb-2">{feedbackMessage}</p>
          {gameState === 'won' && <p className="text-xl mb-2">Você completou {score} desafios!</p>}
          {gameState === 'won' && <p className="text-xl mb-6">Tempo restante: {timeLeft}s</p>}
          {gameState === 'lost' && score > 0 && <p className="text-xl mb-6">Você acertou {score} de {TOTAL_CHALLENGES_TO_WIN} desafios.</p>}
          
          <button
            onClick={startGame}
            className="mt-4 px-8 py-3 bg-yellow-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition mr-4"
          >
            Jogar Novamente
          </button>
          <button onClick={onExit} className="mt-4 px-8 py-3 bg-slate-600 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-slate-700 transition">Sair</button>
        </div>
      </div>
    );
  }

  // Playing State
  const progressPercentage = (score / TOTAL_CHALLENGES_TO_WIN) * 100;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-600 p-4 custom-font-comic text-white">
      <header className="w-full max-w-4xl p-4 bg-white/20 backdrop-blur-md rounded-lg shadow-lg mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-sky-100">Corrida de Comandos</h1>
          <p className="text-sky-200">Progresso: {score} / {TOTAL_CHALLENGES_TO_WIN}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold">Tempo: <span className="text-yellow-300">{timeLeft}s</span></p>
        </div>
      </header>

      {/* Track and Player Avatar */}
      <div className="w-full max-w-3xl mb-6">
        <div className="h-8 bg-slate-700/50 rounded-full overflow-hidden border-2 border-slate-500/70 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-lime-400 to-green-500 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span className="text-2xl" style={{transform: `translateX(${progressPercentage < 10 ? '50%' : '0%'})`}}>{PLAYER_AVATAR}</span>
          </div>
        </div>
         <p className="text-center text-sm mt-1 text-sky-200">Complete {TOTAL_CHALLENGES_TO_WIN} desafios para vencer!</p>
      </div>


      {currentChallenge ? (
        <div className="w-full max-w-3xl p-6 bg-white/25 backdrop-blur-md rounded-xl shadow-lg text-center mb-6">
          <p className="text-lg text-sky-100 mb-1">Digite o comando:</p>
          <div className="text-5xl font-bold my-6 p-4 bg-white/30 rounded-md text-yellow-300 tracking-wider min-h-[80px] flex items-center justify-center">
            {currentChallenge.type === 'term' ? userInput || currentChallenge.display : currentChallenge.display}
          </div>
          {currentChallenge.description && (
            <p className="text-md text-sky-200 mb-2">(Função: {currentChallenge.description})</p>
          )}
          
          <div className={`mt-4 p-3 rounded-md text-xl h-12 flex items-center justify-center transition-all duration-300
            ${feedback === 'correct' ? 'bg-green-500/80' : ''}
            ${feedback === 'incorrect' ? 'bg-red-500/80' : ''}
            ${feedback === 'neutral' && feedbackMessage ? 'bg-blue-500/80' : ''}
          `}>
            {feedback === 'correct' && <CheckIcon className="w-7 h-7 mr-2"/>}
            {feedback === 'incorrect' && <XIcon className="w-7 h-7 mr-2"/>}
            {feedbackMessage}
          </div>
        </div>
      ) : (
         <div className="w-full max-w-3xl p-6 bg-white/25 backdrop-blur-md rounded-xl shadow-lg text-center mb-6 min-h-[200px] flex items-center justify-center">
            <p className="text-3xl text-sky-100">Carregando desafio...</p>
         </div>
      )}

      <VirtualKeyboard targetKeys={currentChallenge?.keysToHighlight || []} pressedKey={pressedKeyForKeyboard} />
      
      <button onClick={onExit} className="mt-8 px-6 py-2 bg-slate-200/70 text-slate-800 text-lg rounded-md hover:bg-slate-100/90 transition">Voltar ao Menu</button>
    </div>
  );
};

export default CommandRaceGame;

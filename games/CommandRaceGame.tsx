
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChallengeItem, KeyPressExpected } from '../types';
import { PHASE1_KEYS, PHASE2_COMBINATIONS, PHASE3_TERMS, shuffleArray } from '../constants';
import VirtualKeyboard from '../components/VirtualKeyboard';
import CheckIcon from '../components/icons/CheckIcon';
import XIcon from '../components/icons/XIcon';
import { playSound, SfxType } from '../audioManager';

interface CommandRaceGameProps {
  onExit: () => void;
}

const MODIFIER_KEYS = ["Control", "Shift", "Alt", "Meta"];
const TOTAL_CHALLENGES_TO_WIN = 10; 
const INITIAL_GAME_TIME_SECONDS = 90; 
const PLAYER_AVATAR = '🚀'; 

const CommandRaceGame: React.FC<CommandRaceGameProps> = ({ onExit }) => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [allChallenges, setAllChallenges] = useState<ChallengeItem[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeItem | null>(null);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(INITIAL_GAME_TIME_SECONDS);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'neutral'>('neutral');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [pressedKeyForKeyboard, setPressedKeyForKeyboard] = useState<string | null>(null);
  
  const timerRef = useRef<number | null>(null);

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
      const randomIndex = Math.floor(Math.random() * allChallenges.length);
      setCurrentChallenge(allChallenges[randomIndex]);
    } else {
        const reloadedChallenges = loadChallenges();
        if (reloadedChallenges.length > 0) {
             setCurrentChallenge(reloadedChallenges[Math.floor(Math.random() * reloadedChallenges.length)]);
        } else {
            setFeedbackMessage("Erro: Não há desafios disponíveis!");
            playSound(SfxType.NEGATIVE_FEEDBACK);
            setGameState('lost'); 
        }
    }
  }, [allChallenges, loadChallenges]);

  const handleActualStartGame = useCallback(() => {
    playSound(SfxType.GAME_START);
    const loadedChalls = loadChallenges(); 
    setScore(0);
    setTimeLeft(INITIAL_GAME_TIME_SECONDS);
    setGameState('playing');
    setFeedback('neutral');
    setFeedbackMessage('O jogo começou! Boa sorte!');
    if (loadedChalls.length > 0) {
        setCurrentChallenge(loadedChalls[Math.floor(Math.random() * loadedChalls.length)]);
    } else {
        setFeedbackMessage("Erro ao carregar desafios!");
        playSound(SfxType.NEGATIVE_FEEDBACK);
        setGameState('lost');
    }
  }, [loadChallenges]);

  useEffect(() => {
    if(allChallenges.length === 0 && gameState === 'idle') { 
        loadChallenges();
    }
  }, [loadChallenges, allChallenges.length, gameState]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft <= 0) {
      playSound(SfxType.NEGATIVE_FEEDBACK);
      setGameState('lost');
      setFeedbackMessage('Tempo esgotado!');
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft]);

  const handleCorrect = useCallback(() => {
    playSound(SfxType.POSITIVE_FEEDBACK);
    const newScore = score + 1;
    setScore(newScore);
    setFeedback('correct');
    setFeedbackMessage('Correto! Avance!');
    
    if (newScore >= TOTAL_CHALLENGES_TO_WIN) {
      playSound(SfxType.POSITIVE_FEEDBACK); // Extra cheer for winning
      setGameState('won');
      setFeedbackMessage('Parabéns! Você venceu a corrida!');
    } else {
      setTimeout(() => nextChallenge(), 1000);
    }
  }, [score, nextChallenge]);

  const handleIncorrect = useCallback(() => {
    playSound(SfxType.NEGATIVE_FEEDBACK);
    setFeedback('incorrect');
    setFeedbackMessage('Ops! Tente de novo.');
    
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
        return; 
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

  const handleStartButtonClick = () => {
    playSound(SfxType.UI_CLICK);
    handleActualStartGame();
  };

  const handleExitClick = () => {
    // playSound(SfxType.UI_CLICK); // Handled by App.tsx
    onExit();
  }


  if (gameState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-slate-100 custom-font-comic">
        <div className="bg-slate-800/70 backdrop-blur-md p-10 rounded-xl shadow-2xl text-center border border-slate-700/50">
          <h2 className="text-4xl font-bold mb-6 text-cyan-400" style={{ textShadow: '0 0 6px theme("colors.cyan.500 / 60%")' }}>Corrida de Comandos!</h2>
          <p className="mb-8 text-lg text-slate-300">Digite rápido para vencer a corrida contra o tempo!</p>
          <button
            onClick={handleStartButtonClick}
            className="px-8 py-4 bg-green-600 text-white text-2xl font-semibold rounded-lg shadow-md hover:bg-green-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-700 focus:ring-opacity-50"
          >
            Começar Corrida!
          </button>
          <button onClick={handleExitClick} className="mt-6 block mx-auto px-6 py-2 bg-slate-600 text-slate-200 text-lg rounded-md hover:bg-slate-500 transition">Voltar ao Menu</button>
        </div>
      </div>
    );
  }

  if (gameState === 'won' || gameState === 'lost') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-slate-100 custom-font-comic">
        <div className="bg-slate-800/70 backdrop-blur-md p-8 rounded-xl shadow-2xl text-center border border-slate-700/50">
          <h2 className="text-5xl font-bold mb-4" style={{ textShadow: gameState === 'won' ? '0 0 8px theme("colors.green.400 / 70%")' : '0 0 8px theme("colors.red.400 / 70%")' }}>
            {gameState === 'won' ? `🎉 Você Venceu! 🎉` : `😭 Fim de Jogo! 😭`}
          </h2>
          <p className="text-3xl mb-2 text-slate-200">{feedbackMessage}</p>
          {gameState === 'won' && <p className="text-xl mb-2 text-slate-300">Você completou {score} desafios!</p>}
          {gameState === 'won' && <p className="text-xl mb-6 text-slate-300">Tempo restante: <span className="text-yellow-300">{timeLeft}s</span></p>}
          {gameState === 'lost' && score > 0 && <p className="text-xl mb-6 text-slate-300">Você acertou {score} de {TOTAL_CHALLENGES_TO_WIN} desafios.</p>}
          
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

  const progressPercentage = Math.min(100, (score / TOTAL_CHALLENGES_TO_WIN) * 100);

  return (
    <div className="flex flex-col items-center min-h-screen p-4 custom-font-comic text-slate-100">
      <header className="w-full max-w-4xl p-4 bg-slate-800/60 backdrop-blur-sm rounded-lg shadow-xl mb-6 flex justify-between items-center border border-slate-700/50">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400" style={{ textShadow: '0 0 5px theme("colors.cyan.500 / 50%")' }}>Corrida de Comandos</h1>
          <p className="text-slate-300">Progresso: {score} / {TOTAL_CHALLENGES_TO_WIN}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold">Tempo: <span className="text-yellow-300" style={{ textShadow: '0 0 4px theme("colors.yellow.400 / 70%")' }}>{timeLeft}s</span></p>
        </div>
      </header>

      <div className="w-full max-w-3xl mb-6">
        <div className="h-8 bg-slate-700 rounded-full overflow-hidden border-2 border-slate-600 shadow-inner relative">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2 shadow-md"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {/* Avatar positioned relative to the progress bar's current end */}
          </div>
          <span 
            className="absolute text-2xl top-1/2 -translate-y-1/2 transition-all duration-500 ease-out" 
            style={{ left: `calc(${progressPercentage}% - 12px)`, filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))' }}
          >
            {PLAYER_AVATAR}
          </span>
        </div>
         <p className="text-center text-sm mt-1 text-slate-400">Complete {TOTAL_CHALLENGES_TO_WIN} desafios para vencer!</p>
      </div>


      {currentChallenge ? (
        <div className="w-full max-w-3xl p-6 bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-xl text-center mb-6 border border-slate-700/50">
          <p className="text-lg text-slate-300 mb-2">Digite o comando:</p>
          <div 
            className="text-5xl font-bold my-6 p-4 bg-slate-900/70 rounded-md text-yellow-300 tracking-wider min-h-[80px] flex items-center justify-center border border-slate-700"
            style={{ textShadow: '0 0 8px theme("colors.yellow.400 / 50%")' }}
          >
            {currentChallenge.type === 'term' ? userInput || currentChallenge.display : currentChallenge.display}
          </div>
          {currentChallenge.description && (
            <p className="text-md text-slate-400 mb-2">(Função: {currentChallenge.description})</p>
          )}
          
          <div className={`mt-4 p-3 rounded-md text-xl h-12 flex items-center justify-center transition-all duration-300 border
            ${feedback === 'correct' ? 'bg-green-500/80 border-green-400/80 text-white' : ''}
            ${feedback === 'incorrect' ? 'bg-red-500/80 border-red-400/80 text-white' : ''}
            ${feedback === 'neutral' && feedbackMessage ? 'bg-sky-600/80 border-sky-500/80 text-white' : 'border-transparent'}
          `}>
            {feedback === 'correct' && <CheckIcon className="w-7 h-7 mr-2"/>}
            {feedback === 'incorrect' && <XIcon className="w-7 h-7 mr-2"/>}
            {feedbackMessage}
          </div>
        </div>
      ) : (
         <div className="w-full max-w-3xl p-6 bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-xl text-center mb-6 min-h-[200px] flex items-center justify-center border border-slate-700/50">
            <p className="text-3xl text-slate-400 animate-pulse">Carregando desafio...</p>
         </div>
      )}

      <VirtualKeyboard targetKeys={currentChallenge?.keysToHighlight || []} pressedKey={pressedKeyForKeyboard} />
      
      <button onClick={handleExitClick} className="mt-8 px-6 py-2 bg-slate-700/80 text-slate-300 text-lg rounded-md hover:bg-slate-600/80 transition focus:outline-none focus:ring-2 focus:ring-slate-500">Voltar ao Menu</button>
    </div>
  );
};

export default CommandRaceGame;

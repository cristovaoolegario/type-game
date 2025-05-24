
import React, { useState, useEffect, useCallback } from 'react';
import { ChallengeItem, KeyPressExpected } from '../types';
import { CHALLENGES_BY_PHASE, INITIAL_LIVES, CHALLENGES_PER_PHASE, shuffleArray } from '../constants';
import VirtualKeyboard from '../components/VirtualKeyboard';
import CheckIcon from '../components/icons/CheckIcon';
import XIcon from '../components/icons/XIcon';
import { playSound, SfxType } from '../audioManager';

interface HiddenKeyHuntGameProps {
  onExit: () => void;
}

const MODIFIER_KEYS = ["Control", "Shift", "Alt", "Meta"];

const HiddenKeyHuntGame: React.FC<HiddenKeyHuntGameProps> = ({ onExit }) => {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [availableChallenges, setAvailableChallenges] = useState<ChallengeItem[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeItem | null>(null);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'neutral'>('neutral');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [pressedKeyForKeyboard, setPressedKeyForKeyboard] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [challengesCompletedInPhase, setChallengesCompletedInPhase] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const nextChallenge = useCallback(() => { 
    setFeedback('neutral');
    setFeedbackMessage('');
    setUserInput('');
    setPressedKeyForKeyboard(null);

    if (availableChallenges.length === 0 || challengesCompletedInPhase >= CHALLENGES_PER_PHASE) {
      if (currentPhase < Object.keys(CHALLENGES_BY_PHASE).length) {
        setCurrentPhase(prev => prev + 1);
        setChallengesCompletedInPhase(0);
        const phaseChallenges = CHALLENGES_BY_PHASE[currentPhase + 1];
        if (phaseChallenges) {
            setAvailableChallenges(shuffleArray([...phaseChallenges]));
            setCurrentChallenge(null); 
        } else {
            setIsGameOver(true);
            setFeedbackMessage("Erro: Fase não encontrada!");
        }
      } else {
        setFeedbackMessage("Parabéns! Você completou todos os desafios!");
        playSound(SfxType.POSITIVE_FEEDBACK); // Overall win sound
        setIsGameOver(true);
      }
      return;
    }
    
    if (availableChallenges.length > 0) {
        const newChallengeIndex = Math.floor(Math.random() * availableChallenges.length);
        const nextChallengeItem = availableChallenges[newChallengeIndex];
        setCurrentChallenge(nextChallengeItem);
    } else if (challengesCompletedInPhase < CHALLENGES_PER_PHASE && currentPhase <= Object.keys(CHALLENGES_BY_PHASE).length) {
        const phaseChallenges = CHALLENGES_BY_PHASE[currentPhase];
        if (phaseChallenges) {
            setAvailableChallenges(shuffleArray([...phaseChallenges]));
        }
    }

  }, [availableChallenges, currentPhase, challengesCompletedInPhase]);

  useEffect(() => {
    if(gameStarted && !isGameOver) {
        const phaseChallenges = CHALLENGES_BY_PHASE[currentPhase];
        if (phaseChallenges) {
            if(availableChallenges.length === 0 || currentChallenge === null ) {
                 setAvailableChallenges(shuffleArray([...phaseChallenges]));
            }
        }
    }
  }, [currentPhase, gameStarted, isGameOver, availableChallenges.length, currentChallenge]);
  
  useEffect(() => {
    if(gameStarted && !isGameOver && availableChallenges.length > 0 && !currentChallenge) {
        nextChallenge();
    }
  }, [availableChallenges, gameStarted, isGameOver, currentChallenge, nextChallenge]);


  const handleCorrect = useCallback(() => {
    playSound(SfxType.POSITIVE_FEEDBACK);
    setScore(s => s + 10);
    setFeedback('correct');
    setFeedbackMessage('Correto!');
    setChallengesCompletedInPhase(c => c + 1);
    setTimeout(() => nextChallenge(), 1000);
  }, [nextChallenge]);

  const handleIncorrect = useCallback(() => {
    playSound(SfxType.NEGATIVE_FEEDBACK);
    const newLives = lives - 1;
    setLives(newLives);
    setFeedback('incorrect');
    
    if (newLives <= 0) {
      setFeedbackMessage('Fim de Jogo!');
      setIsGameOver(true);
    } else {
      setFeedbackMessage('Ops! Tente de novo.');
    }
    
    setTimeout(() => {
        if (newLives > 0) { 
            setFeedback('neutral');
            setFeedbackMessage('');
        }
        if (currentChallenge && currentChallenge.type === 'term') {
            setUserInput(''); 
        }
    }, 1000);
  }, [lives, currentChallenge]);

  const checkAnswer = useCallback((event: KeyboardEvent) => {
    if (!currentChallenge || isGameOver || !gameStarted) {
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

      if (match) {
        handleCorrect();
      } else {
        handleIncorrect();
      }
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
  }, [currentChallenge, isGameOver, gameStarted, userInput, handleCorrect, handleIncorrect]); 

  useEffect(() => {
    if (!isGameOver && gameStarted) {
      window.addEventListener('keydown', checkAnswer);
      return () => {
        window.removeEventListener('keydown', checkAnswer);
      };
    }
  }, [checkAnswer, isGameOver, gameStarted]); 

  const handleStartGameClick = () => {
    playSound(SfxType.UI_CLICK);
    playSound(SfxType.GAME_START);
    setIsGameOver(false);
    setScore(0);
    setLives(INITIAL_LIVES);
    setCurrentPhase(1);
    setChallengesCompletedInPhase(0);
    setCurrentChallenge(null); 
    setAvailableChallenges([]); 
    setGameStarted(true);
    setFeedback('neutral');
    setFeedbackMessage('O jogo começou! Boa sorte!');
  };
  
  const handleExitClick = () => {
    // playSound(SfxType.UI_CLICK); // This is handled by App.tsx
    onExit();
  }
  
  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-slate-100 custom-font-comic">
        <div className="bg-slate-800/70 backdrop-blur-md p-10 rounded-xl shadow-2xl text-center border border-slate-700/50">
          <h2 className="text-4xl font-bold mb-6 text-cyan-400" style={{ textShadow: '0 0 6px theme("colors.cyan.500 / 60%")' }}>Caça às Teclas Escondidas</h2>
          <p className="mb-8 text-lg text-slate-300">Prepare-se para testar seus conhecimentos sobre o teclado e programação!</p>
          <button
            onClick={handleStartGameClick}
            className="px-8 py-4 bg-green-600 text-white text-2xl font-semibold rounded-lg shadow-md hover:bg-green-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-700 focus:ring-opacity-50"
          >
            Começar Jogo!
          </button>
           <button onClick={handleExitClick} className="mt-6 block mx-auto px-6 py-2 bg-slate-600 text-slate-200 text-lg rounded-md hover:bg-slate-500 transition">Voltar</button>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center min-h-screen p-4 custom-font-comic text-slate-100">
      <header className="w-full max-w-4xl p-4 bg-slate-800/60 backdrop-blur-sm rounded-lg shadow-xl mb-6 flex justify-between items-center border border-slate-700/50">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400" style={{ textShadow: '0 0 5px theme("colors.cyan.500 / 50%")' }}>Fase: {currentPhase}</h1>
          <p className="text-slate-300">Desafios na Fase: {challengesCompletedInPhase} / {CHALLENGES_PER_PHASE}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold">Pontos: <span className="text-yellow-300" style={{ textShadow: '0 0 4px theme("colors.yellow.400 / 70%")' }}>{score}</span></p>
          <p className="text-xl">Vidas: <span className="text-red-400 drop-shadow-[0_0_3px_rgba(248,113,113,0.7)]">{'❤️'.repeat(lives)}</span></p>
        </div>
      </header>

      {isGameOver ? (
        <div className="flex flex-col items-center justify-center bg-slate-800/70 backdrop-blur-md p-8 rounded-xl shadow-2xl text-center border border-slate-700/50">
          <h2 className="text-5xl font-bold mb-4" style={{ textShadow: lives > 0 ? '0 0 8px theme("colors.green.400 / 70%")' : '0 0 8px theme("colors.red.400 / 70%")' }}>
            {lives > 0 ? "🎉 Você Venceu! 🎉" : "😭 Fim de Jogo! 😭"}
          </h2>
          <p className="text-3xl mb-2 text-slate-200">Sua pontuação final: <span className="font-bold text-yellow-300" style={{ textShadow: '0 0 4px theme("colors.yellow.400 / 70%")' }}>{score}</span></p>
          <p className="text-xl mb-6 text-slate-300">{feedbackMessage}</p>
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleStartGameClick}
              className="px-8 py-3 bg-green-600 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-green-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-700 focus:ring-opacity-50"
            >
              Jogar Novamente
            </button>
            <button onClick={handleExitClick} className="px-8 py-3 bg-slate-600 text-slate-200 text-xl font-semibold rounded-lg shadow-md hover:bg-slate-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-slate-700 focus:ring-opacity-50">
              Sair
            </button>
          </div>
        </div>
      ) : currentChallenge ? (
        <div className="w-full max-w-3xl p-6 bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-xl text-center mb-6 border border-slate-700/50">
          <p className="text-lg text-slate-300 mb-2">Pressione a tecla ou digite o termo:</p>
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

      {!isGameOver && <VirtualKeyboard targetKeys={currentChallenge?.keysToHighlight || []} pressedKey={pressedKeyForKeyboard} />}
      
      {!isGameOver && <button onClick={handleExitClick} className="mt-8 px-6 py-2 bg-slate-700/80 text-slate-300 text-lg rounded-md hover:bg-slate-600/80 transition focus:outline-none focus:ring-2 focus:ring-slate-500">Voltar ao Menu</button>}
    </div>
  );
};

export default HiddenKeyHuntGame;

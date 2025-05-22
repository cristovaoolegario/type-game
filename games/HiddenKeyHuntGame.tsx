
import React, { useState, useEffect, useCallback } from 'react';
import { ChallengeItem, KeyPressExpected } from '../types';
import { CHALLENGES_BY_PHASE, INITIAL_LIVES, CHALLENGES_PER_PHASE, shuffleArray } from '../constants';
import VirtualKeyboard from '../components/VirtualKeyboard';
import CheckIcon from '../components/icons/CheckIcon';
import XIcon from '../components/icons/XIcon';

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
         // Ensure new challenges are loaded for the new phase
        const phaseChallenges = CHALLENGES_BY_PHASE[currentPhase + 1];
        if (phaseChallenges) {
            setAvailableChallenges(shuffleArray([...phaseChallenges]));
            setCurrentChallenge(null); // Trigger selection of new challenge from new list
        } else {
             // Should not happen if phases are well defined
            setIsGameOver(true);
            setFeedbackMessage("Erro: Fase não encontrada!");
        }
      } else {
        setFeedbackMessage("Parabéns! Você completou todos os desafios!");
        setIsGameOver(true);
      }
      return;
    }
    
    // If still in the same phase, pick a new challenge
    // Ensure availableChallenges has items before trying to pick one
    if (availableChallenges.length > 0) {
        const newChallengeIndex = Math.floor(Math.random() * availableChallenges.length);
        const nextChallengeItem = availableChallenges[newChallengeIndex];
        setCurrentChallenge(nextChallengeItem);
    } else if (challengesCompletedInPhase < CHALLENGES_PER_PHASE && currentPhase <= Object.keys(CHALLENGES_BY_PHASE).length) {
        // Potentially ran out of unique challenges for this round but phase not complete
        // Reload challenges for current phase to allow repeats if necessary
        const phaseChallenges = CHALLENGES_BY_PHASE[currentPhase];
        if (phaseChallenges) {
            setAvailableChallenges(shuffleArray([...phaseChallenges]));
            // setCurrentChallenge will be set in the useEffect that watches availableChallenges
        }
    }


  }, [availableChallenges, currentPhase, challengesCompletedInPhase]);

  useEffect(() => {
    if(gameStarted && !isGameOver) {
        const phaseChallenges = CHALLENGES_BY_PHASE[currentPhase];
        if (phaseChallenges) {
            // Only set new available challenges if they are different or empty
            // This helps preserve the current set if nextChallenge is called mid-phase without advancing
            if(availableChallenges.length === 0 || currentChallenge === null ) {
                 setAvailableChallenges(shuffleArray([...phaseChallenges]));
            }
        }
    }
  }, [currentPhase, gameStarted, isGameOver, availableChallenges.length, currentChallenge]);
  
  useEffect(() => {
    // If game started, not over, challenges are available, but no current challenge is set (e.g. after phase change)
    if(gameStarted && !isGameOver && availableChallenges.length > 0 && !currentChallenge) {
        nextChallenge();
    }
  }, [availableChallenges, gameStarted, isGameOver, currentChallenge, nextChallenge]);


  const handleCorrect = useCallback(() => {
    setScore(s => s + 10);
    setFeedback('correct');
    setFeedbackMessage('Correto!');
    setChallengesCompletedInPhase(c => c + 1);
    setTimeout(() => nextChallenge(), 1000);
  }, [nextChallenge]);

  const handleIncorrect = useCallback(() => {
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
        // Only reset userInput for terms, as key/combo inputs are not accumulated in userInput state.
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
        // If it's a combo challenge and a modifier key itself is pressed,
        // do nothing yet. Wait for the non-modifier key.
        // The virtual keyboard will show the modifier as pressed.
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

  const startGame = () => {
    setIsGameOver(false);
    setScore(0);
    setLives(INITIAL_LIVES);
    setCurrentPhase(1);
    setChallengesCompletedInPhase(0);
    setCurrentChallenge(null); 
    setAvailableChallenges([]); // Clear available challenges so they are reloaded for phase 1
    setGameStarted(true);
    setFeedback('neutral');
    setFeedbackMessage('O jogo começou! Boa sorte!');
  };
  
  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-tr from-teal-400 to-blue-600 p-6 text-white custom-font-comic">
        <div className="bg-white/20 backdrop-blur-md p-10 rounded-xl shadow-2xl text-center">
          <h2 className="text-4xl font-bold mb-6">Caça às Teclas Escondidas</h2>
          <p className="mb-8 text-lg">Prepare-se para testar seus conhecimentos sobre o teclado e programação!</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-orange-500 text-white text-2xl font-semibold rounded-lg shadow-md hover:bg-orange-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300"
          >
            Começar Jogo!
          </button>
           <button onClick={onExit} className="mt-4 block mx-auto px-6 py-2 bg-slate-500 text-white text-lg rounded-md hover:bg-slate-600 transition">Voltar</button>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-300 via-indigo-400 to-purple-500 p-4 custom-font-comic text-white">
      <header className="w-full max-w-4xl p-4 bg-white/20 backdrop-blur-md rounded-lg shadow-lg mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-indigo-100">Fase: {currentPhase}</h1>
          <p className="text-indigo-200">Desafios Completos na Fase: {challengesCompletedInPhase} / {CHALLENGES_PER_PHASE}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold">Pontos: <span className="text-yellow-300">{score}</span></p>
          <p className="text-xl">Vidas: <span className="text-red-300">{'❤️'.repeat(lives)}</span></p>
        </div>
      </header>

      {isGameOver ? (
        <div className="flex flex-col items-center justify-center bg-white/30 backdrop-blur-lg p-8 rounded-xl shadow-xl text-center">
          <h2 className="text-5xl font-bold mb-4">{lives > 0 ? "🎉 Você Venceu! 🎉" : "😭 Fim de Jogo! 😭"}</h2>
          <p className="text-3xl mb-2">Sua pontuação final: <span className="font-bold text-yellow-300">{score}</span></p>
          { lives === 0 && <p className="text-xl mb-6">{feedbackMessage}</p> }
          { lives > 0 && <p className="text-xl mb-6">{feedbackMessage}</p> }
          <button
            onClick={startGame}
            className="mt-4 px-8 py-3 bg-green-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-green-600 transition mr-4"
          >
            Jogar Novamente
          </button>
          <button onClick={onExit} className="mt-4 px-8 py-3 bg-slate-600 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-slate-700 transition">Sair</button>
        </div>
      ) : currentChallenge ? (
        <div className="w-full max-w-3xl p-6 bg-white/25 backdrop-blur-md rounded-xl shadow-lg text-center mb-6">
          <p className="text-lg text-indigo-100 mb-1">Pressione a tecla ou digite o termo:</p>
          <div className="text-5xl font-bold my-6 p-4 bg-white/30 rounded-md text-yellow-300 tracking-wider min-h-[80px] flex items-center justify-center">
            {currentChallenge.type === 'term' ? userInput || currentChallenge.display : currentChallenge.display}
          </div>
          {currentChallenge.description && (
            <p className="text-md text-indigo-200 mb-2">(Função: {currentChallenge.description})</p>
          )}
          
          <div className={`mt-4 p-3 rounded-md text-xl h-12 flex items-center justify-center transition-all duration-300
            ${feedback === 'correct' ? 'bg-green-500/80' : ''}
            ${feedback === 'incorrect' ? 'bg-red-500/80' : ''}
            ${feedback === 'neutral' && feedbackMessage ? 'bg-sky-500/80' : ''}
          `}>
            {feedback === 'correct' && <CheckIcon className="w-7 h-7 mr-2"/>}
            {feedback === 'incorrect' && <XIcon className="w-7 h-7 mr-2"/>}
            {feedbackMessage}
          </div>
        </div>
      ) : (
         <div className="w-full max-w-3xl p-6 bg-white/25 backdrop-blur-md rounded-xl shadow-lg text-center mb-6 min-h-[200px] flex items-center justify-center">
            <p className="text-3xl text-indigo-100">Carregando desafio...</p>
         </div>
      )}

      {!isGameOver && <VirtualKeyboard targetKeys={currentChallenge?.keysToHighlight || []} pressedKey={pressedKeyForKeyboard} />}
      
      {!isGameOver && <button onClick={onExit} className="mt-8 px-6 py-2 bg-slate-200/70 text-slate-800 text-lg rounded-md hover:bg-slate-100/90 transition">Voltar ao Menu</button>}
    </div>
  );
};

export default HiddenKeyHuntGame;

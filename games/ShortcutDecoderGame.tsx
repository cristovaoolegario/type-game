
import React, { useState, useEffect, useCallback } from 'react';
import { ShortcutDecoderItem, MemoryCardState, MatchItemState } from '../types';
import { SHORTCUT_DECODER_ITEMS, shuffleArray } from '../constants';
import CheckIcon from '../components/icons/CheckIcon';
import XIcon from '../components/icons/XIcon';

interface ShortcutDecoderGameProps {
  onExit: () => void;
}

type SubGameMode = 'memory' | 'matching' | 'selection';
type GameStatus = 'playing' | 'won' | 'idle';

const ITEMS_PER_GAME = 6; // Number of shortcut pairs to use in each game instance

const ShortcutDecoderGame: React.FC<ShortcutDecoderGameProps> = ({ onExit }) => {
  const [subGameMode, setSubGameMode] = useState<SubGameMode>('selection');
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  
  // For Memory Game
  const [memoryCards, setMemoryCards] = useState<MemoryCardState[]>([]);
  const [flippedMemoryCards, setFlippedMemoryCards] = useState<number[]>([]); // Indices of flipped cards
  const [memoryScore, setMemoryScore] = useState(0);

  // For Matching Game
  const [matchShortcuts, setMatchShortcuts] = useState<MatchItemState[]>([]);
  const [matchFunctions, setMatchFunctions] = useState<MatchItemState[]>([]);
  const [selectedMatchShortcut, setSelectedMatchShortcut] = useState<MatchItemState | null>(null);
  const [matchingScore, setMatchingScore] = useState(0);
  
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const prepareGameData = useCallback((numItems: number) => {
    const shuffledItems = shuffleArray([...SHORTCUT_DECODER_ITEMS]);
    return shuffledItems.slice(0, numItems);
  }, []);

  // --- MEMORY GAME LOGIC ---
  const setupMemoryGame = useCallback(() => {
    const gameItems = prepareGameData(ITEMS_PER_GAME);
    const cards: MemoryCardState[] = [];
    gameItems.forEach(item => {
      cards.push({ id: `${item.id}_shortcut`, pairId: item.id, type: 'shortcut', content: item.shortcutDisplay, isFlipped: false, isMatched: false });
      cards.push({ id: `${item.id}_function`, pairId: item.id, type: 'function', content: item.functionDisplay, isFlipped: false, isMatched: false });
    });
    setMemoryCards(shuffleArray(cards));
    setFlippedMemoryCards([]);
    setMemoryScore(0);
    setGameStatus('playing');
    setFeedbackMessage('Encontre os pares!');
  }, [prepareGameData]);

  const handleMemoryCardClick = (index: number) => {
    if (gameStatus !== 'playing' || memoryCards[index].isFlipped || memoryCards[index].isMatched || flippedMemoryCards.length >= 2) {
      return;
    }

    const newFlippedCards = [...flippedMemoryCards, index];
    setFlippedMemoryCards(newFlippedCards);

    const updatedCards = memoryCards.map((card, i) => 
      i === index ? { ...card, isFlipped: true } : card
    );
    setMemoryCards(updatedCards);

    if (newFlippedCards.length === 2) {
      const card1 = updatedCards[newFlippedCards[0]];
      const card2 = updatedCards[newFlippedCards[1]];

      if (card1.pairId === card2.pairId) { // Match!
        setMemoryScore(s => s + 1);
        setFeedbackMessage('Par encontrado!');
        const matchedCards = updatedCards.map(card =>
          card.pairId === card1.pairId ? { ...card, isMatched: true, isFlipped: true } : card
        );
        setTimeout(() => {
          setMemoryCards(matchedCards);
          setFlippedMemoryCards([]);
          if (memoryScore + 1 === ITEMS_PER_GAME) {
            setGameStatus('won');
            setFeedbackMessage('Parabéns! Todos os pares encontrados!');
          } else {
            setFeedbackMessage('Continue...');
          }
        }, 1000);
      } else { // No match
        setFeedbackMessage('Não combinam. Tente de novo.');
        setTimeout(() => {
          const resetCards = updatedCards.map(card =>
            (!card.isMatched) ? { ...card, isFlipped: false } : card
          );
          setMemoryCards(resetCards);
          setFlippedMemoryCards([]);
          setFeedbackMessage('Encontre os pares!');
        }, 1500);
      }
    }
  };

  // --- MATCHING GAME LOGIC ---
  const setupMatchingGame = useCallback(() => {
    const gameItems = prepareGameData(ITEMS_PER_GAME);
    const shortcuts: MatchItemState[] = gameItems.map(item => ({
      id: item.id + "_s", pairId: item.id, type: 'shortcut', content: item.shortcutDisplay, isMatched: false
    }));
    const functions: MatchItemState[] = shuffleArray(gameItems.map((item, index) => ({
      id: item.id + "_f", pairId: item.id, type: 'function', content: item.functionDisplay, isMatched: false, originalOrder: index
    })));
    
    setMatchShortcuts(shortcuts);
    setMatchFunctions(functions);
    setSelectedMatchShortcut(null);
    setMatchingScore(0);
    setGameStatus('playing');
    setFeedbackMessage('Combine o atalho com sua função.');
  }, [prepareGameData]);

  const handleMatchShortcutClick = (item: MatchItemState) => {
    if (gameStatus !== 'playing' || item.isMatched) return;
    setSelectedMatchShortcut(item);
    setMatchShortcuts(prev => prev.map(s => s.id === item.id ? {...s, isSelected: true} : {...s, isSelected: false}));
    setFeedbackMessage(`Selecionado: ${item.content}. Agora clique na função correspondente.`);
  };

  const handleMatchFunctionClick = (funcItem: MatchItemState) => {
    if (gameStatus !== 'playing' || !selectedMatchShortcut || funcItem.isMatched) return;

    if (selectedMatchShortcut.pairId === funcItem.pairId) { // Match!
      setMatchingScore(s => s + 1);
      setFeedbackMessage('Correto!');
      setMatchShortcuts(prev => prev.map(s => s.id === selectedMatchShortcut.id ? {...s, isMatched: true, isSelected: false} : s));
      setMatchFunctions(prev => prev.map(f => f.id === funcItem.id ? {...f, isMatched: true} : f));
      setSelectedMatchShortcut(null);

      if (matchingScore + 1 === ITEMS_PER_GAME) {
        setGameStatus('won');
        setFeedbackMessage('Parabéns! Todas as combinações feitas!');
      } else {
         setTimeout(() => setFeedbackMessage('Continue combinando...'), 1000);
      }
    } else { // No match
      setFeedbackMessage('Combinação incorreta. Tente novamente.');
      setMatchShortcuts(prev => prev.map(s => ({...s, isSelected: false}))); // Deselect shortcut
      setSelectedMatchShortcut(null);
       setTimeout(() => setFeedbackMessage('Combine o atalho com sua função.'), 1500);
    }
  };
  
  const resetAndSelectMode = () => {
    setSubGameMode('selection');
    setGameStatus('idle');
    setFeedbackMessage('');
  }

  // --- UI RENDERING ---
  if (subGameMode === 'selection') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-tr from-purple-400 via-pink-500 to-red-600 p-6 text-white custom-font-comic">
        <div className="bg-white/25 backdrop-blur-md p-10 rounded-xl shadow-2xl text-center max-w-lg">
          <h2 className="text-4xl font-bold mb-8">Decifrador de Atalhos</h2>
          <p className="mb-8 text-lg">Escolha um modo de jogo:</p>
          <button
            onClick={() => { setSubGameMode('memory'); setupMemoryGame(); }}
            className="w-full mb-4 px-8 py-4 bg-sky-500 text-white text-2xl font-semibold rounded-lg shadow-md hover:bg-sky-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-300"
          >
            Modo Memória
          </button>
          <button
            onClick={() => { setSubGameMode('matching'); setupMatchingGame(); }}
            className="w-full px-8 py-4 bg-emerald-500 text-white text-2xl font-semibold rounded-lg shadow-md hover:bg-emerald-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-300"
          >
            Modo Correspondência
          </button>
          <button onClick={onExit} className="mt-10 block mx-auto px-6 py-2 bg-slate-500 text-white text-lg rounded-md hover:bg-slate-600 transition">Voltar ao Menu Principal</button>
        </div>
      </div>
    );
  }
  
  // Common elements for playing/won states
  const renderGameScreen = (title: string, gameContent: React.ReactNode, score: number, totalItems: number) => (
     <div className={`flex flex-col items-center min-h-screen p-4 custom-font-comic text-white 
        ${subGameMode === 'memory' ? 'bg-gradient-to-br from-sky-400 via-cyan-500 to-blue-600' : 'bg-gradient-to-br from-emerald-400 via-green-500 to-lime-600'}`}>
        <header className="w-full max-w-4xl p-4 bg-white/20 backdrop-blur-md rounded-lg shadow-lg mb-6">
          <h1 className="text-3xl font-bold text-center mb-2">{title}</h1>
          <div className="flex justify-between items-center">
            <p className="text-xl">Pares Encontrados: <span className="font-bold text-yellow-300">{score} / {totalItems}</span></p>
             <button onClick={resetAndSelectMode} className="px-4 py-2 bg-slate-200/70 text-slate-800 text-sm rounded-md hover:bg-slate-100/90 transition">Trocar Modo</button>
          </div>
        </header>

        {gameStatus === 'won' ? (
          <div className="flex flex-col items-center justify-center bg-white/30 backdrop-blur-lg p-8 rounded-xl shadow-xl text-center">
            <h2 className="text-5xl font-bold mb-4">🎉 Você Venceu! 🎉</h2>
            <p className="text-3xl mb-6">{feedbackMessage}</p>
            <button
              onClick={subGameMode === 'memory' ? setupMemoryGame : setupMatchingGame}
              className="mt-4 px-8 py-3 bg-yellow-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition mr-4"
            >
              Jogar Novamente ({subGameMode === 'memory' ? "Memória" : "Correspondência"})
            </button>
            <button onClick={resetAndSelectMode} className="mt-4 px-8 py-3 bg-slate-600 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-slate-700 transition">Voltar à Seleção</button>
          </div>
        ) : (
          <>
            <div className="w-full max-w-3xl p-2 sm:p-4 bg-white/25 backdrop-blur-md rounded-xl shadow-lg text-center mb-6 min-h-[60px] flex items-center justify-center">
                <p className={`text-xl transition-all duration-300 ${feedbackMessage.includes("Correto") || feedbackMessage.includes("Par") ? 'text-green-300' : feedbackMessage.includes("Incorreto") || feedbackMessage.includes("Não combinam") ? 'text-red-300' : 'text-yellow-200'}`}>
                    {feedbackMessage || "Carregando..."}
                </p>
            </div>
            {gameContent}
          </>
        )}
        <button onClick={onExit} className="mt-8 px-6 py-2 bg-slate-200/70 text-slate-800 text-lg rounded-md hover:bg-slate-100/90 transition">Menu Principal</button>
      </div>
  );


  if (subGameMode === 'memory') {
    const memoryGameContent = (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 sm:gap-6 max-w-xl sm:max-w-3xl mx-auto">
        {memoryCards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => handleMemoryCardClick(index)}
            disabled={card.isMatched && card.isFlipped}
            className={`
              w-40 h-28 p-2 rounded-lg shadow-lg transition-all duration-300 
              flex items-center justify-center text-center
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-700 focus:ring-white
              ${card.isMatched 
                ? 'bg-green-700/50 text-green-100 border-4 border-green-500 opacity-80 cursor-default' // Matched card style
                : card.isFlipped 
                  ? 'bg-sky-200 text-sky-800 border border-sky-400' // Flipped card style
                  : 'bg-sky-600 hover:bg-sky-500 text-sky-100 border border-sky-700' // Face-down card style
              }
              ${card.isFlipped && !card.isMatched && flippedMemoryCards.includes(index) ? 'ring-2 ring-yellow-300' : ''}
            `}
          >
            <span className="text-sm sm:text-base">
                 {card.isFlipped ? card.content : '🔑'}
            </span>
          </button>
        ))}
      </div>
    );
    return renderGameScreen("Jogo da Memória de Atalhos", memoryGameContent, memoryScore, ITEMS_PER_GAME);
  }

  if (subGameMode === 'matching') {
    const matchingGameContent = (
      <div className="flex flex-col sm:flex-row justify-around w-full max-w-4xl">
        {/* Shortcuts Column */}
        <div className="flex-1 p-2 sm:p-4">
          <h3 className="text-xl font-semibold mb-3 text-center text-emerald-100">Atalhos</h3>
          <div className="space-y-2">
            {matchShortcuts.map(item => (
              <button
                key={item.id}
                onClick={() => handleMatchShortcutClick(item)}
                disabled={item.isMatched}
                className={`
                  w-full p-3 rounded-md shadow-sm text-sm sm:text-base text-left transition-colors
                  ${item.isMatched ? 'bg-emerald-700/70 text-emerald-300 line-through cursor-not-allowed' : 
                   selectedMatchShortcut?.id === item.id ? 'bg-yellow-400 text-black ring-2 ring-white' : 
                   'bg-emerald-600 hover:bg-emerald-500 text-white'}
                `}
              >
                {item.content}
              </button>
            ))}
          </div>
        </div>
        {/* Functions Column */}
        <div className="flex-1 p-2 sm:p-4 mt-4 sm:mt-0">
          <h3 className="text-xl font-semibold mb-3 text-center text-emerald-100">Funções</h3>
          <div className="space-y-2">
            {matchFunctions.map(item => (
              <button
                key={item.id}
                onClick={() => handleMatchFunctionClick(item)}
                disabled={item.isMatched || !selectedMatchShortcut}
                className={`
                  w-full p-3 rounded-md shadow-sm text-sm sm:text-base text-left transition-colors
                  ${item.isMatched ? 'bg-emerald-700/70 text-emerald-300 line-through cursor-not-allowed' :
                   (!selectedMatchShortcut) ? 'bg-gray-500 text-gray-300 cursor-not-allowed' :
                   'bg-emerald-600 hover:bg-emerald-500 text-white'}
                `}
              >
                {item.content}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
     return renderGameScreen("Combine Atalho e Função", matchingGameContent, matchingScore, ITEMS_PER_GAME);
  }

  return <div>Carregando Jogo...</div>; // Fallback
};

export default ShortcutDecoderGame;

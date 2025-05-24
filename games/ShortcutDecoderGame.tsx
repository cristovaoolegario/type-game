
import React, { useState, useEffect, useCallback } from 'react';
import { ShortcutDecoderItem, MemoryCardState, MatchItemState } from '../types';
import { SHORTCUT_DECODER_ITEMS, shuffleArray } from '../constants';
import CheckIcon from '../components/icons/CheckIcon'; 
import XIcon from '../components/icons/XIcon';  
import { playSound, SfxType } from '../audioManager';     

interface ShortcutDecoderGameProps {
  onExit: () => void;
}

type SubGameMode = 'memory' | 'matching' | 'selection';
type GameStatus = 'playing' | 'won' | 'idle';

const ITEMS_PER_GAME = 6; 

const ShortcutDecoderGame: React.FC<ShortcutDecoderGameProps> = ({ onExit }) => {
  const [subGameMode, setSubGameMode] = useState<SubGameMode>('selection');
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  
  const [memoryCards, setMemoryCards] = useState<MemoryCardState[]>([]);
  const [flippedMemoryCards, setFlippedMemoryCards] = useState<number[]>([]); 
  const [memoryScore, setMemoryScore] = useState(0);

  const [matchShortcuts, setMatchShortcuts] = useState<MatchItemState[]>([]);
  const [matchFunctions, setMatchFunctions] = useState<MatchItemState[]>([]);
  const [selectedMatchShortcut, setSelectedMatchShortcut] = useState<MatchItemState | null>(null);
  const [matchingScore, setMatchingScore] = useState(0);
  
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const prepareGameData = useCallback((numItems: number) => {
    const shuffledItems = shuffleArray([...SHORTCUT_DECODER_ITEMS]);
    return shuffledItems.slice(0, numItems);
  }, []);

  const setupMemoryGame = useCallback(() => {
    playSound(SfxType.GAME_START);
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
    playSound(SfxType.UI_CLICK);

    const newFlippedCards = [...flippedMemoryCards, index];
    setFlippedMemoryCards(newFlippedCards);

    const updatedCards = memoryCards.map((card, i) => 
      i === index ? { ...card, isFlipped: true } : card
    );
    setMemoryCards(updatedCards);

    if (newFlippedCards.length === 2) {
      const card1 = updatedCards[newFlippedCards[0]];
      const card2 = updatedCards[newFlippedCards[1]];

      if (card1.pairId === card2.pairId) { 
        playSound(SfxType.POSITIVE_FEEDBACK);
        setMemoryScore(s => s + 1);
        setFeedbackMessage('Par encontrado!');
        const matchedCards = updatedCards.map(card =>
          card.pairId === card1.pairId ? { ...card, isMatched: true, isFlipped: true } : card
        );
        setTimeout(() => {
          setMemoryCards(matchedCards);
          setFlippedMemoryCards([]);
          if (memoryScore + 1 === ITEMS_PER_GAME) {
            playSound(SfxType.POSITIVE_FEEDBACK); // Overall win
            setGameStatus('won');
            setFeedbackMessage('Parabéns! Todos os pares encontrados!');
          } else {
            setFeedbackMessage('Continue...');
          }
        }, 1000);
      } else { 
        playSound(SfxType.NEGATIVE_FEEDBACK);
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

  const setupMatchingGame = useCallback(() => {
    playSound(SfxType.GAME_START);
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
    playSound(SfxType.UI_CLICK);
    setSelectedMatchShortcut(item);
    setMatchShortcuts(prev => prev.map(s => s.id === item.id ? {...s, isSelected: true} : {...s, isSelected: false}));
    setFeedbackMessage(`Selecionado: ${item.content}. Agora clique na função.`);
  };

  const handleMatchFunctionClick = (funcItem: MatchItemState) => {
    if (gameStatus !== 'playing' || !selectedMatchShortcut || funcItem.isMatched) return;
    playSound(SfxType.UI_CLICK);

    if (selectedMatchShortcut.pairId === funcItem.pairId) { 
      playSound(SfxType.POSITIVE_FEEDBACK);
      setMatchingScore(s => s + 1);
      setFeedbackMessage('Correto!');
      setMatchShortcuts(prev => prev.map(s => s.id === selectedMatchShortcut.id ? {...s, isMatched: true, isSelected: false} : s));
      setMatchFunctions(prev => prev.map(f => f.id === funcItem.id ? {...f, isMatched: true} : f));
      setSelectedMatchShortcut(null);

      if (matchingScore + 1 === ITEMS_PER_GAME) {
        playSound(SfxType.POSITIVE_FEEDBACK); // Overall win
        setGameStatus('won');
        setFeedbackMessage('Parabéns! Todas as combinações feitas!');
      } else {
         setTimeout(() => setFeedbackMessage('Continue combinando...'), 1000);
      }
    } else { 
      playSound(SfxType.NEGATIVE_FEEDBACK);
      setFeedbackMessage('Combinação incorreta. Tente novamente.');
      setMatchShortcuts(prev => prev.map(s => ({...s, isSelected: false}))); 
      setSelectedMatchShortcut(null);
       setTimeout(() => setFeedbackMessage('Combine o atalho com sua função.'), 1500);
    }
  };
  
  const handleModeSelectionClick = (mode: SubGameMode) => {
    playSound(SfxType.UI_CLICK);
    setSubGameMode(mode);
    if (mode === 'memory') setupMemoryGame();
    if (mode === 'matching') setupMatchingGame();
  }
  
  const handleResetAndSelectModeClick = () => {
    playSound(SfxType.UI_CLICK);
    setSubGameMode('selection');
    setGameStatus('idle');
    setFeedbackMessage('');
  }

  const handleExitClick = () => {
    // playSound(SfxType.UI_CLICK); // Handled by App.tsx
    onExit();
  }


  if (subGameMode === 'selection') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-slate-100 custom-font-comic">
        <div className="bg-slate-800/70 backdrop-blur-md p-10 rounded-xl shadow-2xl text-center max-w-lg border border-slate-700/50">
          <h2 className="text-4xl font-bold mb-8 text-cyan-400" style={{ textShadow: '0 0 6px theme("colors.cyan.500 / 60%")' }}>Decifrador de Atalhos</h2>
          <p className="mb-8 text-lg text-slate-300">Escolha um modo de jogo:</p>
          <button
            onClick={() => handleModeSelectionClick('memory')}
            className="w-full mb-4 px-8 py-4 bg-sky-600 text-white text-2xl font-semibold rounded-lg shadow-md hover:bg-sky-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-700 focus:ring-opacity-50"
          >
            Modo Memória
          </button>
          <button
            onClick={() => handleModeSelectionClick('matching')}
            className="w-full px-8 py-4 bg-purple-600 text-white text-2xl font-semibold rounded-lg shadow-md hover:bg-purple-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-700 focus:ring-opacity-50"
          >
            Modo Correspondência
          </button>
          <button onClick={handleExitClick} className="mt-10 block mx-auto px-6 py-2 bg-slate-600 text-slate-200 text-lg rounded-md hover:bg-slate-500 transition">Voltar ao Menu Principal</button>
        </div>
      </div>
    );
  }
  
  const renderGameScreen = (title: string, gameContent: React.ReactNode, score: number, totalItems: number) => (
     <div className={`flex flex-col items-center min-h-screen p-4 custom-font-comic text-slate-100`}>
        <header className="w-full max-w-4xl p-4 bg-slate-800/60 backdrop-blur-sm rounded-lg shadow-xl mb-6 border border-slate-700/50">
          <h1 className="text-3xl font-bold text-center mb-2 text-cyan-400" style={{ textShadow: '0 0 5px theme("colors.cyan.500 / 50%")' }}>{title}</h1>
          <div className="flex justify-between items-center">
            <p className="text-xl text-slate-300">Pares Encontrados: <span className="font-bold text-yellow-300" style={{ textShadow: '0 0 3px theme("colors.yellow.400 / 60%")' }}>{score} / {totalItems}</span></p>
             <button onClick={handleResetAndSelectModeClick} className="px-4 py-2 bg-slate-700/80 text-slate-300 text-sm rounded-md hover:bg-slate-600/80 transition focus:outline-none focus:ring-2 focus:ring-slate-500">Trocar Modo</button>
          </div>
        </header>

        {gameStatus === 'won' ? (
          <div className="flex flex-col items-center justify-center bg-slate-800/70 backdrop-blur-md p-8 rounded-xl shadow-2xl text-center border border-slate-700/50">
            <h2 className="text-5xl font-bold mb-4 text-green-400" style={{ textShadow: '0 0 8px theme("colors.green.400 / 70%")' }}>🎉 Você Venceu! 🎉</h2>
            <p className="text-3xl mb-6 text-slate-200">{feedbackMessage}</p>
            <div className="flex gap-4 mt-4">
                <button
                    onClick={() => { 
                        playSound(SfxType.UI_CLICK); 
                        subGameMode === 'memory' ? setupMemoryGame() : setupMatchingGame(); 
                    }}
                    className="px-8 py-3 bg-yellow-500 text-slate-900 text-xl font-semibold rounded-lg shadow-md hover:bg-yellow-400 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-600 focus:ring-opacity-50"
                >
                    Jogar Novamente ({subGameMode === 'memory' ? "Memória" : "Correspondência"})
                </button>
                <button onClick={handleResetAndSelectModeClick} className="px-8 py-3 bg-slate-600 text-slate-200 text-xl font-semibold rounded-lg shadow-md hover:bg-slate-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-slate-700 focus:ring-opacity-50">
                    Voltar à Seleção
                </button>
            </div>
          </div>
        ) : (
          <>
            <div className="w-full max-w-3xl p-2 sm:p-3 bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg text-center mb-6 min-h-[60px] flex items-center justify-center border border-slate-700/50">
                <p className={`text-xl transition-all duration-300 
                    ${feedbackMessage.includes("Correto") || feedbackMessage.includes("Par encontrado") ? 'text-green-400' : 
                      feedbackMessage.includes("Incorreto") || feedbackMessage.includes("Não combinam") ? 'text-red-400' : 
                      'text-yellow-300'}`}
                    style={{ textShadow: `0 0 5px ${
                        feedbackMessage.includes("Correto") || feedbackMessage.includes("Par encontrado") ? 'rgba(74, 222, 128, 0.5)' : 
                        feedbackMessage.includes("Incorreto") || feedbackMessage.includes("Não combinam") ? 'rgba(248, 113, 113, 0.5)' : 
                        'rgba(250, 204, 21, 0.5)' 
                    }`}}
                >
                    {feedbackMessage || "Carregando..."}
                </p>
            </div>
            {gameContent}
          </>
        )}
        <button onClick={handleExitClick} className="mt-8 px-6 py-2 bg-slate-700/80 text-slate-300 text-lg rounded-md hover:bg-slate-600/80 transition focus:outline-none focus:ring-2 focus:ring-slate-500">Menu Principal</button>
      </div>
  );


  if (subGameMode === 'memory') {
    const memoryGameContent = (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 sm:gap-5 md:gap-6 max-w-xl sm:max-w-3xl mx-auto p-4 sm:p-6 bg-slate-900/30 rounded-lg border border-slate-700/50">
        {memoryCards.map((card, index) => {
          let cardStyle = {};
          let contentStyle = {};
          let cardClasses = `
            w-20 h-24 sm:w-24 sm:h-28 md:w-28 md:h-32 p-2 rounded-lg shadow-xl transition-all duration-300 
            flex items-center justify-center text-center border-2 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-400
          `;

          if (card.isMatched) {
            cardClasses += ' bg-green-600/70 backdrop-blur-sm text-white border-green-500/80 opacity-80 cursor-default';
            contentStyle = { textShadow: '0 0 6px #4ade80, 0 0 8px #22c55e99' }; 
          } else if (card.isFlipped) {
            cardClasses += ' bg-indigo-700/80 backdrop-blur-sm text-yellow-300 border-yellow-500/80 transform rotate-y-180';
            contentStyle = { textShadow: '0 0 6px #facc15, 0 0 8px #eab30899' }; 
            if (flippedMemoryCards.includes(index)) {
              cardClasses += ' ring-2 ring-pink-400 border-pink-500/90 shadow-lg shadow-pink-500/30';
            }
          } else {
            cardClasses += ' bg-slate-800 hover:bg-slate-700/80 text-cyan-300 border-slate-600 hover:border-purple-500/70';
            contentStyle = { textShadow: '0 0 7px #06b6d4, 0 0 10px #0891b28c' }; 
          }

          return (
            <button
              key={card.id}
              onClick={() => handleMemoryCardClick(index)}
              disabled={card.isMatched && card.isFlipped}
              className={cardClasses}
              style={cardStyle}
            >
              <span className="text-xs sm:text-sm md:text-base" style={contentStyle}>
                {card.isFlipped ? card.content : '🌌'}
              </span>
            </button>
          );
        })}
      </div>
    );
    return renderGameScreen("Jogo da Memória de Atalhos", memoryGameContent, memoryScore, ITEMS_PER_GAME);
  }

  if (subGameMode === 'matching') {
    const matchingGameContent = (
      <div className="flex flex-col sm:flex-row justify-around w-full max-w-4xl gap-4 sm:gap-6 p-4 bg-slate-900/30 rounded-lg border border-slate-700/50">
        <div className="flex-1 p-2 sm:p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h3 className="text-xl font-semibold mb-3 text-center text-green-400" style={{textShadow:'0 0 4px rgba(74,222,128,0.5)'}}>Atalhos</h3>
          <div className="space-y-2">
            {matchShortcuts.map(item => (
              <button
                key={item.id}
                onClick={() => handleMatchShortcutClick(item)}
                disabled={item.isMatched}
                className={`
                  w-full p-3 rounded-md shadow-md text-sm sm:text-base text-left transition-all duration-150 border
                  ${item.isMatched ? 'bg-green-800/70 text-green-400 line-through border-green-700 cursor-not-allowed opacity-60' : 
                   selectedMatchShortcut?.id === item.id ? 'bg-yellow-500 text-slate-900 ring-2 ring-white border-yellow-400 shadow-lg transform scale-105' : 
                   'bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600 hover:shadow-md'}
                `}
              >
                {item.content}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 p-2 sm:p-4 bg-slate-800/50 rounded-lg border border-slate-700 mt-4 sm:mt-0">
          <h3 className="text-xl font-semibold mb-3 text-center text-purple-400" style={{textShadow:'0 0 4px rgba(192,132,252,0.5)'}}>Funções</h3>
          <div className="space-y-2">
            {matchFunctions.map(item => (
              <button
                key={item.id}
                onClick={() => handleMatchFunctionClick(item)}
                disabled={item.isMatched || !selectedMatchShortcut}
                className={`
                  w-full p-3 rounded-md shadow-md text-sm sm:text-base text-left transition-all duration-150 border
                  ${item.isMatched ? 'bg-green-800/70 text-green-400 line-through border-green-700 cursor-not-allowed opacity-60' :
                   (!selectedMatchShortcut) ? 'bg-slate-600/50 text-slate-400 cursor-not-allowed border-slate-500' :
                   'bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600 hover:shadow-md'}
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

  return <div className="text-slate-400 animate-pulse">Carregando Jogo...</div>; 
};

export default ShortcutDecoderGame;

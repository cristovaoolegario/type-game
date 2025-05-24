
import React from 'react';
import { GameMode } from '../types';
// Removed unused playSound import as it's handled in App.tsx for selection.
// If individual buttons here needed different sounds, we'd import it.

interface GameSelectorProps {
  onSelectGame: (gameMode: GameMode) => void;
}

const GameSelector: React.FC<GameSelectorProps> = ({ onSelectGame }) => {
  // Sound for button clicks is handled by App.tsx's handleSelectGame
  return (
    <div className="flex flex-col items-center min-h-screen p-6 custom-font-comic">
      <div className="bg-slate-800/70 backdrop-blur-md p-8 sm:p-10 rounded-xl shadow-2xl text-center max-w-md sm:max-w-lg w-full border border-slate-700/50">
        <img 
            src="https://picsum.photos/seed/techgame/120/120" 
            alt="Game Logo" 
            className="mx-auto mb-6 rounded-full shadow-lg w-24 h-24 sm:w-32 sm:h-32 border-2 border-cyan-500/70"
            style={{ filter: 'saturate(1.2) contrast(1.1)' }}
        />
        <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400 mb-4" style={{ textShadow: '0 0 8px theme("colors.cyan.500 / 70%")' }}>
            Aventura Teclado Kids!
        </h1>
        <p className="text-slate-300 mb-8 text-md sm:text-lg">
          Aprenda as teclas e termos de programação jogando!
        </p>
        <div className="grid grid-cols-1 gap-5">
          <button
            onClick={() => onSelectGame(GameMode.HIDDEN_KEY_HUNT)}
            className="w-full px-6 py-4 bg-green-600 text-white text-xl sm:text-2xl font-semibold rounded-lg shadow-md hover:bg-green-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-700 focus:ring-opacity-50"
            aria-label={`Jogar ${GameMode.HIDDEN_KEY_HUNT}`}
          >
            {GameMode.HIDDEN_KEY_HUNT}
          </button>
          <button
            onClick={() => onSelectGame(GameMode.COMMAND_RACE)}
            className="w-full px-6 py-4 bg-sky-600 text-white text-xl sm:text-2xl font-semibold rounded-lg shadow-md hover:bg-sky-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-700 focus:ring-opacity-50"
            aria-label={`Jogar ${GameMode.COMMAND_RACE}`}
          >
            {GameMode.COMMAND_RACE}
          </button>
          <button
            onClick={() => onSelectGame(GameMode.CODE_BUILDER)}
            className="w-full px-6 py-4 bg-yellow-500 text-slate-900 text-xl sm:text-2xl font-semibold rounded-lg shadow-md hover:bg-yellow-400 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-600 focus:ring-opacity-50"
            aria-label={`Jogar ${GameMode.CODE_BUILDER}`}
          >
            {GameMode.CODE_BUILDER}
          </button>
          <button
            onClick={() => onSelectGame(GameMode.SHORTCUT_DECODER)}
            className="w-full px-6 py-4 bg-purple-600 text-white text-xl sm:text-2xl font-semibold rounded-lg shadow-md hover:bg-purple-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-700 focus:ring-opacity-50"
            aria-label={`Jogar ${GameMode.SHORTCUT_DECODER}`}
          >
            {GameMode.SHORTCUT_DECODER}
          </button>
          {/* <button
            onClick={() => onSelectGame(GameMode.KEYBOARD_ADVENTURER)}
            className="w-full px-6 py-4 bg-pink-600 text-white text-xl sm:text-2xl font-semibold rounded-lg shadow-md hover:bg-pink-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-700 focus:ring-opacity-50"
            aria-label={`Jogar ${GameMode.KEYBOARD_ADVENTURER}`}
          >
            {GameMode.KEYBOARD_ADVENTURER}
          </button> */}
        </div>
        <p className="mt-10 text-sm text-slate-400">
          Escolha um jogo para começar a diversão cósmica!
        </p>
      </div>
       <footer className="mt-auto py-4 text-slate-500 text-sm">
        Feito com ❤️ para pequenos programadores!
      </footer>
    </div>
  );
};

export default GameSelector;

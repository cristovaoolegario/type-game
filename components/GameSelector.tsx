
import React from 'react';
import { GameMode } from '../types';

interface GameSelectorProps {
  onSelectGame: (gameMode: GameMode) => void;
}

const GameSelector: React.FC<GameSelectorProps> = ({ onSelectGame }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-6 custom-font-comic">
      <div className="bg-white/90 p-8 sm:p-10 rounded-xl shadow-2xl text-center max-w-md sm:max-w-lg w-full">
        <img src="https://picsum.photos/seed/keyboardhero/120/120" alt="Game Logo" className="mx-auto mb-6 rounded-full shadow-lg w-24 h-24 sm:w-32 sm:h-32" />
        <h1 className="text-4xl sm:text-5xl font-bold text-purple-700 mb-4">Aventura Teclado Kids!</h1>
        <p className="text-slate-600 mb-8 text-md sm:text-lg">
          Aprenda as teclas e termos de programação jogando!
        </p>
        <div className="grid grid-cols-1 gap-6">
          <button
            onClick={() => onSelectGame(GameMode.HIDDEN_KEY_HUNT)}
            className="w-full px-6 py-4 bg-green-500 text-white text-xl sm:text-2xl font-semibold rounded-lg shadow-md hover:bg-green-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
            aria-label={`Jogar ${GameMode.HIDDEN_KEY_HUNT}`}
          >
            {GameMode.HIDDEN_KEY_HUNT}
          </button>
          <button
            onClick={() => onSelectGame(GameMode.COMMAND_RACE)}
            className="w-full px-6 py-4 bg-blue-500 text-white text-xl sm:text-2xl font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
            aria-label={`Jogar ${GameMode.COMMAND_RACE}`}
          >
            {GameMode.COMMAND_RACE}
          </button>
          <button
            onClick={() => onSelectGame(GameMode.CODE_BUILDER)}
            className="w-full px-6 py-4 bg-orange-500 text-white text-xl sm:text-2xl font-semibold rounded-lg shadow-md hover:bg-orange-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300"
            aria-label={`Jogar ${GameMode.CODE_BUILDER}`}
          >
            {GameMode.CODE_BUILDER}
          </button>
          <button
            onClick={() => onSelectGame(GameMode.SHORTCUT_DECODER)}
            className="w-full px-6 py-4 bg-teal-500 text-white text-xl sm:text-2xl font-semibold rounded-lg shadow-md hover:bg-teal-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-300"
            aria-label={`Jogar ${GameMode.SHORTCUT_DECODER}`}
          >
            {GameMode.SHORTCUT_DECODER}
          </button>
          <button
            onClick={() => onSelectGame(GameMode.KEYBOARD_ADVENTURER)}
            className="w-full px-6 py-4 bg-purple-600 text-white text-xl sm:text-2xl font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-400"
            aria-label={`Jogar ${GameMode.KEYBOARD_ADVENTURER}`}
          >
            {GameMode.KEYBOARD_ADVENTURER}
          </button>
        </div>
        <p className="mt-10 text-sm text-slate-500">
          Escolha um jogo para começar a diversão!
        </p>
      </div>
       <footer className="absolute bottom-4 text-white/70 text-sm">
        Feito com ❤️ para pequenos programadores!
      </footer>
    </div>
  );
};

export default GameSelector;

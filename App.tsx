
import React, { useState, useEffect } from 'react';
import { GameMode } from './types';
import GameSelector from './components/GameSelector';
import HiddenKeyHuntGame from './games/HiddenKeyHuntGame';
import CommandRaceGame from './games/CommandRaceGame';
import CodeBuilderGame from './games/CodeBuilderGame';
import ShortcutDecoderGame from './games/ShortcutDecoderGame';
import KeyboardAdventurerGame from './games/KeyboardAdventurerGame';
import { playSound, SfxType, preloadCommonSounds } from './audioManager';

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameMode | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (initialLoad) {
      playSound(SfxType.APP_LAUNCH);
      preloadCommonSounds(); // Preload some common sounds
      setInitialLoad(false);
    }
  }, [initialLoad]);

  const handleSelectGame = (gameMode: GameMode) => {
    playSound(SfxType.UI_CLICK);
    setActiveGame(gameMode);
  };

  const handleExitGame = () => {
    playSound(SfxType.UI_CLICK);
    setActiveGame(null);
  };

  if (!activeGame) {
    return <GameSelector onSelectGame={handleSelectGame} />;
  }

  switch (activeGame) {
    case GameMode.HIDDEN_KEY_HUNT:
      return <HiddenKeyHuntGame onExit={handleExitGame} />;
    case GameMode.COMMAND_RACE:
      return <CommandRaceGame onExit={handleExitGame} />;
    case GameMode.CODE_BUILDER:
      return <CodeBuilderGame onExit={handleExitGame} />;
    case GameMode.SHORTCUT_DECODER:
      return <ShortcutDecoderGame onExit={handleExitGame} />;
    // case GameMode.KEYBOARD_ADVENTURER:
    //   return <KeyboardAdventurerGame onExit={handleExitGame} />;
    default:
      return <GameSelector onSelectGame={handleSelectGame} />;
  }
};

export default App;

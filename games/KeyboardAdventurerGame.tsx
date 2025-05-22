
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapCell,
  PlayerState,
  PlayerDirection,
  InteractionProperties,
  ItemDefinition,
  PlayerSubState,
  TileType,
} from '../types';
import {
  INITIAL_GAME_MAP_LAYOUT,
  MAP_CELL_DEFINITIONS,
  LAYOUT_CHAR_TO_DEFINITION_KEY,
  PLAYER_START_X,
  PLAYER_START_Y,
  PLAYER_AVATAR_DISPLAY,
  INTERACTIONS_DATA,
  ITEMS_DATA,
} from '../constants';
import CheckIcon from '../components/icons/CheckIcon';
import XIcon from '../components/icons/XIcon';

interface KeyboardAdventurerGameProps {
  onExit: () => void;
}

type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

const KeyboardAdventurerGame: React.FC<KeyboardAdventurerGameProps> = ({ onExit }) => {
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [mapData, setMapData] = useState<MapCell[][]>([]);
  const [playerState, setPlayerState] = useState<PlayerState>({
    position: { x: PLAYER_START_X, y: PLAYER_START_Y },
    direction: 'right',
    inventory: [],
    subState: 'IDLE',
    messageLog: [],
    commandBuffer: '',
    activeInteraction: null,
    interactionCell: null,
  });

  const commandInputRef = useRef<HTMLInputElement>(null);

  const addMessageToLog = useCallback((message: string) => {
    setPlayerState(prev => ({
      ...prev,
      messageLog: [...prev.messageLog.slice(-4), message], // Keep last 5 messages
      subState: 'SHOWING_MESSAGE',
    }));
  }, []);

  const initializeMap = useCallback(() => {
    const newMapData = INITIAL_GAME_MAP_LAYOUT.map((row, y) =>
      row.map((char, x) => {
        const definitionKey = LAYOUT_CHAR_TO_DEFINITION_KEY[char];
        const definition = MAP_CELL_DEFINITIONS[definitionKey] || MAP_CELL_DEFINITIONS['path_default'];
        return {
          ...definition,
          x,
          y,
          instanceId: `${definition.id}_${x},${y}`, // Unique ID for this cell on the map
        };
      })
    );
    setMapData(newMapData);
    setPlayerState({
        position: { x: PLAYER_START_X, y: PLAYER_START_Y },
        direction: 'right',
        inventory: [],
        subState: 'IDLE',
        messageLog: ["Bem-vindo ao Teclado Aventureiro!"],
        commandBuffer: '',
        activeInteraction: null,
        interactionCell: null,
    });
  }, []);
  
  const startGame = () => {
    initializeMap();
    setGameStatus('playing');
  };

  useEffect(() => {
    if (gameStatus === 'playing' && playerState.subState === 'AWAITING_COMMAND_INPUT' && commandInputRef.current) {
      commandInputRef.current.focus();
    }
  }, [playerState.subState, gameStatus]);


  const handlePlayerMove = useCallback((dx: number, dy: number) => {
    if (gameStatus !== 'playing' || playerState.subState === 'AWAITING_COMMAND_INPUT' || mapData.length === 0) return;

    // Clear previous interaction prompt if player moves away
    if (playerState.subState === 'AWAITING_INTERACTION_PROMPT') {
        setPlayerState(prev => ({...prev, subState: 'IDLE', activeInteraction: null, interactionCell: null}));
    }


    let newDirection: PlayerDirection = playerState.direction;
    if (dx === 1) newDirection = 'right';
    else if (dx === -1) newDirection = 'left';
    else if (dy === 1) newDirection = 'down';
    else if (dy === -1) newDirection = 'up';

    const newX = playerState.position.x + dx;
    const newY = playerState.position.y + dy;

    if (newY >= 0 && newY < mapData.length && newX >= 0 && newX < mapData[0].length) {
      const targetCell = mapData[newY][newX];
      if (targetCell.walkable) {
        setPlayerState(prev => ({ ...prev, position: { x: newX, y: newY }, direction: newDirection }));
        
        // Check for messages or auto-interactions on the new cell
        if (targetCell.messageOnStep && playerState.subState !== 'SHOWING_MESSAGE') {
          addMessageToLog(targetCell.messageOnStep);
        }
        // Future: Auto-trigger interactions if any ('autoWithItem')
      } else {
        // Bumped into a non-walkable tile, just update direction
        setPlayerState(prev => ({ ...prev, direction: newDirection }));
        // Optional: add a "bump" sound or message
      }
    }
  }, [mapData, playerState.position, playerState.direction, playerState.subState, gameStatus, addMessageToLog]);

  const getFacingCell = useCallback(() => {
    if (mapData.length === 0) return null;

    const { x, y } = playerState.position;
    const { direction } = playerState;
    let facingX = x;
    let facingY = y;

    if (direction === 'up') facingY--;
    else if (direction === 'down') facingY++;
    else if (direction === 'left') facingX--;
    else if (direction === 'right') facingX++;

    if (facingY >= 0 && facingY < mapData.length && facingX >= 0 && facingX < mapData[0].length) {
      return mapData[facingY][facingX];
    }
    return null;
  }, [playerState.position, playerState.direction, mapData]);


  const processInteraction = useCallback(() => {
    if (!playerState.activeInteraction || !playerState.interactionCell || gameStatus !== 'playing') return;

    const interaction = playerState.activeInteraction;
    const cell = playerState.interactionCell;
    let success = false;

    if (interaction.type === 'keyPress' && playerState.commandBuffer === interaction.expectedInput) {
        if (interaction.requiredItemId) {
            if (playerState.inventory.some(item => item.id === interaction.requiredItemId)) {
                success = true;
            } else {
                addMessageToLog(interaction.failureMessage || "Você não pode fazer isso agora.");
            }
        } else {
            success = true;
        }
    } else if (interaction.type === 'command' && playerState.commandBuffer.toLowerCase() === interaction.expectedInput?.toLowerCase()) {
        success = true;
    } else if (interaction.type === 'command') { // Incorrect command
        addMessageToLog(interaction.failureMessage || "Comando incorreto.");
    }


    if (success) {
        const result = interaction.successResult;
        let newInventory = [...playerState.inventory];
        let newMap = mapData.map(row => row.map(c => ({ ...c }))); // Deep copy map

        if (result.giveItemId) {
            const itemToAdd = ITEMS_DATA[result.giveItemId];
            if (itemToAdd && !newInventory.some(i => i.id === itemToAdd.id)) {
                newInventory.push(itemToAdd);
            }
        }
        if (result.removeItemId && interaction.consumesItem) { // Ensure consumesItem is checked for requiredItemId
            // The item to remove should be the one specified by requiredItemId if consumesItem is true
            const itemToRemove = interaction.requiredItemId || result.removeItemId;
            if (itemToRemove) {
                 newInventory = newInventory.filter(item => item.id !== itemToRemove);
            }
        }
        if (result.changeTileTo) {
            const targetCellId = result.changeTileTo.targetCellId || cell.instanceId; // Default to current cell if not specified
            let changed = false;
            for (let r = 0; r < newMap.length; r++) {
                for (let c = 0; c < newMap[r].length; c++) {
                    if (newMap[r][c].instanceId === targetCellId) {
                        const newDef = MAP_CELL_DEFINITIONS[result.changeTileTo.newTileId];
                        if (newDef) {
                           newMap[r][c] = { ...newDef, x:c, y:r, instanceId: `${newDef.id}_${c},${r}` }; // Update cell with new definition
                           changed = true;
                           break;
                        }
                    }
                }
                if (changed) break;
            }
            if (changed) setMapData(newMap);
        }

        if (result.displayMessage) {
            addMessageToLog(result.displayMessage);
        }
        if (result.winGame) {
            setGameStatus('won');
        } else if (result.loseGame) {
            setGameStatus('lost');
        }
        
        setPlayerState(prev => ({
            ...prev,
            inventory: newInventory,
            subState: result.displayMessage ? 'SHOWING_MESSAGE' : 'IDLE',
            commandBuffer: '',
            activeInteraction: null,
            interactionCell: null,
        }));

    } else if (interaction.type === 'keyPress' && playerState.commandBuffer !== interaction.expectedInput) {
        // This case for failed keyPress (e.g. wrong key for a non-Enter prompt) is tricky.
        // Usually, failure for keyPress is due to missing item, which is handled above.
        // If it's just "wrong key pressed for a prompt", it's often ignored or implicitly fails by not matching.
        // No specific message here unless it's a puzzle.
    }
    
    // Reset commandBuffer unless we are still awaiting command for the *same* interaction after a failure
    if (!success && playerState.activeInteraction?.type === 'command') {
        // Keep command buffer for re-try if command failed
    } else {
        setPlayerState(prev => ({ ...prev, commandBuffer: ''}));
    }

    if (!success && playerState.subState !== 'SHOWING_MESSAGE') { 
        setPlayerState(prev => ({ ...prev, subState: 'IDLE', activeInteraction: null, interactionCell: null }));
    }

  }, [playerState, mapData, gameStatus, addMessageToLog]);


  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (gameStatus !== 'playing' || mapData.length === 0) return;

    event.preventDefault(); 

    const currentSubState = playerState.subState;

    if (currentSubState === 'SHOWING_MESSAGE') {
        if (event.key === 'Enter' || event.key === 'Escape' || event.key === ' ') {
            setPlayerState(prev => ({ ...prev, subState: 'IDLE', activeInteraction: null, interactionCell: null }));
        }
        return;
    }
    
    if (currentSubState === 'AWAITING_COMMAND_INPUT') {
        if (event.key === 'Enter') {
            processInteraction(); 
        } else if (event.key === 'Escape') {
            setPlayerState(prev => ({ ...prev, subState: 'IDLE', commandBuffer: '', activeInteraction: null, interactionCell: null }));
            addMessageToLog("Comando cancelado.");
        } else if (event.key === 'Backspace') {
            setPlayerState(prev => ({ ...prev, commandBuffer: prev.commandBuffer.slice(0, -1) }));
        } else if (event.key.length === 1) { 
            setPlayerState(prev => ({ ...prev, commandBuffer: prev.commandBuffer + event.key }));
        }
        return;
    }

    // IDLE or AWAITING_INTERACTION_PROMPT states for movement and initiating interaction
    switch (event.key) {
      case 'ArrowUp': handlePlayerMove(0, -1); break;
      case 'ArrowDown': handlePlayerMove(0, 1); break;
      case 'ArrowLeft': handlePlayerMove(-1, 0); break;
      case 'ArrowRight': handlePlayerMove(1, 0); break;
      case 'Enter':
        const currentActiveInteraction = playerState.activeInteraction;
        if (currentActiveInteraction && currentActiveInteraction.type === 'keyPress' && currentActiveInteraction.expectedInput === 'Enter') {
             setPlayerState(prev => ({...prev, commandBuffer: 'Enter'})); 
             processInteraction(); 
        } else {
            const cellToInteract = getFacingCell() || mapData[playerState.position.y][playerState.position.x];
            if (cellToInteract && cellToInteract.interactionId) {
                const interactionDef = INTERACTIONS_DATA[cellToInteract.interactionId];
                if (interactionDef) {
                    setPlayerState(prev => ({
                        ...prev,
                        activeInteraction: interactionDef,
                        interactionCell: cellToInteract,
                        commandBuffer: '', 
                    }));

                    if (interactionDef.type === 'command') {
                        setPlayerState(prev => ({...prev, subState: 'AWAITING_COMMAND_INPUT' }));
                        // Display prompt via message log or a dedicated prompt area
                        addMessageToLog(interactionDef.commandPrompt || "Digite o comando:");
                    } else if (interactionDef.type === 'keyPress') {
                        if (interactionDef.expectedInput === 'Enter') {
                             setPlayerState(prev => ({...prev, commandBuffer: 'Enter'}));
                             processInteraction(); 
                        } else {
                            setPlayerState(prev => ({...prev, subState: 'AWAITING_INTERACTION_PROMPT' }));
                            addMessageToLog(interactionDef.promptMessage || `Pressione ${interactionDef.expectedInput} para interagir.`);
                        }
                    }
                }
            } else {
                 if (playerState.subState !== 'SHOWING_MESSAGE') addMessageToLog("Nada para interagir aqui.");
            }
        }
        break;
      default:
        if (playerState.activeInteraction && playerState.activeInteraction.type === 'keyPress' && event.key.toLowerCase() === playerState.activeInteraction.expectedInput?.toLowerCase()) {
            setPlayerState(prev => ({...prev, commandBuffer: event.key})); // Use actual event.key
            processInteraction();
        }
        break;
    }
  }, [gameStatus, playerState, handlePlayerMove, getFacingCell, mapData, processInteraction, addMessageToLog]);

  useEffect(() => {
    if (gameStatus === 'playing') {
      window.addEventListener('keydown', handleKeyPress);
      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [handleKeyPress, gameStatus]);


  // Render logic
  if (gameStatus === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-tr from-gray-700 via-gray-800 to-black p-6 text-white custom-font-comic">
        <div className="bg-white/10 backdrop-blur-md p-10 rounded-xl shadow-2xl text-center">
          <h2 className="text-4xl font-bold mb-6">Teclado Aventureiro</h2>
          <p className="mb-8 text-lg">Explore, interaja e use comandos para vencer!</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-purple-600 text-white text-2xl font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-400"
          >
            Começar Aventura!
          </button>
          <button onClick={onExit} className="mt-4 block mx-auto px-6 py-2 bg-slate-500/70 text-white text-lg rounded-md hover:bg-slate-600/70 transition">Voltar ao Menu</button>
        </div>
      </div>
    );
  }

  if (gameStatus === 'won' || gameStatus === 'lost') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-400 to-orange-600 p-6 text-white custom-font-comic">
        <div className="bg-white/30 backdrop-blur-lg p-8 rounded-xl shadow-xl text-center">
          <h2 className="text-5xl font-bold mb-4">
            {gameStatus === 'won' ? `🎉 Você Venceu a Aventura! 🎉` : `😭 Fim de Jogo! 😭`}
          </h2>
          <p className="text-3xl mb-6">{playerState.messageLog.slice(-1)[0] || (gameStatus === 'won' ? "Parabéns!" : "Tente novamente!")}</p>
          <button
            onClick={startGame}
            className="mt-4 px-8 py-3 bg-green-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-green-600 transition mr-4"
          >
            Jogar Novamente
          </button>
          <button onClick={onExit} className="mt-4 px-8 py-3 bg-slate-600 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-slate-700 transition">Sair</button>
        </div>
      </div>
    );
  }

  // Playing state
  const renderMap = () => {
    if (mapData.length === 0 || mapData[0].length === 0) return <p>Carregando mapa...</p>;
    return (
      <div className="grid border-2 border-slate-600 bg-slate-800 shadow-lg" style={{ gridTemplateColumns: `repeat(${mapData[0].length}, 2rem)`}}>
        {mapData.flat().map((cell) => ( // Removed index as key was cell.instanceId
          <div
            key={cell.instanceId}
            className="w-8 h-8 flex items-center justify-center text-lg border border-slate-700"
            title={`(${cell.x}, ${cell.y}) - ${cell.tileType}`}
          >
            {playerState.position.x === cell.x && playerState.position.y === cell.y
              ? PLAYER_AVATAR_DISPLAY
              : cell.display}
          </div>
        ))}
      </div>
    );
  };
  
  const getInteractionHint = () => { // Renamed from getInteractionPrompt to avoid confusion with interaction's own promptMessage
    const facingCell = getFacingCell();
    const currentCell = mapData.length > 0 ? mapData[playerState.position.y]?.[playerState.position.x] : null;
    
    let cellForPotentialInteraction: MapCell | null = null;
    
    if (facingCell?.interactionId) {
        cellForPotentialInteraction = facingCell;
    } else if (currentCell?.interactionId && currentCell.walkable) {
        cellForPotentialInteraction = currentCell;
    }

    if(cellForPotentialInteraction?.interactionId && playerState.subState === 'IDLE') {
        const interaction = INTERACTIONS_DATA[cellForPotentialInteraction.interactionId];
        if(interaction) {
            return interaction.promptMessage || interaction.commandPrompt || `Interagir com ${cellForPotentialInteraction.tileType}? (Enter)`;
        }
    }
    return "";
  }


  return (
    <div className="flex flex-col lg:flex-row items-start justify-center min-h-screen bg-gradient-to-b from-slate-800 via-slate-900 to-black p-4 custom-font-comic text-slate-200 gap-4">
      {/* Left Panel: Map and Controls */}
      <div className="flex-grow flex flex-col items-center lg:items-end w-full lg:w-auto">
        <h1 className="text-3xl font-bold text-purple-400 mb-4">Teclado Aventureiro</h1>
        {renderMap()}
        <div className="mt-4 p-3 bg-slate-700/50 rounded-md shadow w-full max-w-md text-sm text-center">
            Use as <span className="text-yellow-400 font-semibold">Setas</span> para mover. <span className="text-yellow-400 font-semibold">Enter</span> para interagir.
            { getInteractionHint() && <p className="mt-1 text-purple-300 animate-pulse">{getInteractionHint()}</p>}
        </div>
      </div>

      {/* Right Panel: Messages, Inventory, Command Input */}
      <div className="w-full lg:w-96 bg-slate-800/70 backdrop-blur-sm p-4 rounded-lg shadow-xl flex flex-col gap-4">
        {/* Message Log */}
        <div>
          <h3 className="text-lg font-semibold text-purple-300 mb-1 border-b border-slate-700 pb-1">Mensagens:</h3>
          <div className="h-32 bg-black/30 p-2 rounded text-sm overflow-y-auto flex flex-col-reverse">
            {playerState.messageLog.length === 0 && <p className="text-slate-400 italic">Nenhuma mensagem.</p>}
            {playerState.messageLog.slice().reverse().map((msg, index) => (
              <p key={index} className={index === 0 ? "text-yellow-300" : "text-slate-300"}>&gt; {msg}</p>
            ))}
          </div>
        </div>

        {/* Inventory */}
        <div>
          <h3 className="text-lg font-semibold text-purple-300 mb-1 border-b border-slate-700 pb-1">Inventário:</h3>
          <div className="min-h-[40px] bg-black/30 p-2 rounded text-sm">
            {playerState.inventory.length === 0 ? (
              <p className="text-slate-400 italic">Vazio</p>
            ) : (
              <ul className="list-disc list-inside">
                {playerState.inventory.map(item => (
                  <li key={item.id} className="text-green-400">
                    {item.display || item.name} <span className="text-xs text-slate-400">({item.description})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Command Input Area */}
        {playerState.subState === 'AWAITING_COMMAND_INPUT' && playerState.activeInteraction && (
          <div className="border-t border-slate-700 pt-3">
            <label htmlFor="commandInput" className="block text-md font-semibold text-yellow-400 mb-1">
              {playerState.activeInteraction?.commandPrompt || "Digite o comando:"}
            </label>
            <div className="flex gap-2">
              <input
                ref={commandInputRef}
                type="text"
                id="commandInput"
                value={playerState.commandBuffer}
                onChange={(e) => setPlayerState(prev => ({ ...prev, commandBuffer: e.target.value }))}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    processInteraction();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setPlayerState(prev => ({ ...prev, subState: 'IDLE', commandBuffer: '', activeInteraction: null, interactionCell: null }));
                    addMessageToLog("Comando cancelado.");
                  }
                }}
                className="flex-grow p-2 bg-slate-900 text-white border border-purple-500 rounded-md focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                placeholder="Seu comando aqui..."
              />
              <button
                onClick={() => processInteraction()}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                title="Enviar Comando (Enter)"
              >
                <CheckIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
         {playerState.subState === 'SHOWING_MESSAGE' && (
             <button 
                onClick={() => handleKeyPress({ key: 'Enter', preventDefault: () => {} } as KeyboardEvent)} // Simulate Enter key press
                className="w-full mt-2 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition"
            >
                Ok (Enter)
            </button>
         )}


        <button onClick={onExit} className="mt-auto w-full px-6 py-3 bg-red-600/80 text-white text-lg rounded-md hover:bg-red-700/80 transition">
          Sair da Aventura
        </button>
      </div>
    </div>
  );
};

export default KeyboardAdventurerGame;

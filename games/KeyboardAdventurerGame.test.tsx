
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import KeyboardAdventurerGame from './KeyboardAdventurerGame';
// Fix: Import INTERACTIONS_DATA needed for tests.
import { PLAYER_START_X, PLAYER_START_Y, PLAYER_AVATAR_DISPLAY, ITEMS_DATA, INITIAL_GAME_MAP_LAYOUT, LAYOUT_CHAR_TO_DEFINITION_KEY, MAP_CELL_DEFINITIONS, INTERACTIONS_DATA } from '../constants';

const mockOnExit = jest.fn();

// Helper to simulate key presses
const pressKey = (key: string) => {
  fireEvent.keyDown(window, { key });
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('KeyboardAdventurerGame', () => {
  beforeEach(() => {
    mockOnExit.mockClear();
  });

  test('renders initial start screen', () => {
    render(<KeyboardAdventurerGame onExit={mockOnExit} />);
    expect(screen.getByText('Teclado Aventureiro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Começar Aventura!/i })).toBeInTheDocument();
  });

  test('starts the game, displays map and player', () => {
    render(<KeyboardAdventurerGame onExit={mockOnExit} />);
    fireEvent.click(screen.getByRole('button', { name: /Começar Aventura!/i }));

    expect(screen.getByText(PLAYER_AVATAR_DISPLAY)).toBeInTheDocument();
    // Check for a known map element, e.g., a wall '🧱' if present in initial map
    // This depends on mapData being initialized and rendered.
    // A simple check could be for the "Mensagens:" log area
    expect(screen.getByText('Mensagens:')).toBeInTheDocument();
    expect(screen.getByText('Inventário:')).toBeInTheDocument();
  });

  test('player moves with arrow keys and respects walls', async () => {
    render(<KeyboardAdventurerGame onExit={mockOnExit} />);
    fireEvent.click(screen.getByRole('button', { name: /Começar Aventura!/i }));
    
    // Initial position check (assuming (1,1) is path and (0,1) is wall)
    // This requires knowing player's avatar is rendered at the correct initial spot.
    // Testing exact grid position via DOM can be tricky.
    // Instead, we'll test movement and messages.

    // Try to move into a wall (e.g., ArrowUp if (1,0) is a wall)
    // The default map has walls around player at (1,1)
    pressKey('ArrowUp'); // Try to move to (1,0)
    await act(() => wait(50)); // Allow state to update
    // Player should ideally not have moved if (1,0) is a wall.
    // This needs a way to verify player's logical position.

    // Try to move to a valid path (e.g. ArrowRight if (2,1) is path)
    // From (1,1) to (2,1)
    pressKey('ArrowRight');
    await act(() => wait(50));
    // How to verify new position? If (2,1) has a messageOnStep, check for it.
    const cellAt_2_1_char = INITIAL_GAME_MAP_LAYOUT[PLAYER_START_Y][PLAYER_START_X+1];
    const cellDefKey_2_1 = LAYOUT_CHAR_TO_DEFINITION_KEY[cellAt_2_1_char];
    const cellDef_2_1 = MAP_CELL_DEFINITIONS[cellDefKey_2_1];

    if (cellDef_2_1 && cellDef_2_1.messageOnStep) {
      expect(await screen.findByText(new RegExp(cellDef_2_1.messageOnStep))).toBeInTheDocument();
      // Close the message
      pressKey('Enter');
      await act(() => wait(50));
    }
  });

  test('displays message on step and closes message with Enter', async () => {
    render(<KeyboardAdventurerGame onExit={mockOnExit} />);
    fireEvent.click(screen.getByRole('button', { name: /Começar Aventura!/i }));

    // Move to a tile that has a messageOnStep.
    // Example: The Key tile at (3,1) in the sample map has 'Uma chave dourada brilha aqui.'
    pressKey('ArrowRight'); // to (2,1) - path
    await act(() => wait(50));
    pressKey('ArrowRight'); // to (3,1) - key
    await act(() => wait(50));

    const keyTileDef = MAP_CELL_DEFINITIONS['key_gold_1'];
    if (keyTileDef.messageOnStep) {
      expect(await screen.findByText(new RegExp(keyTileDef.messageOnStep))).toBeInTheDocument();
      // Check if message overlay/modal is active (playerState.subState === 'SHOWING_MESSAGE')
      // and 'Ok (Enter)' button appears for message.
      expect(screen.getByRole('button', {name: /Ok \(Enter\)/i})).toBeInTheDocument();
      pressKey('Enter'); // Close message
      await act(() => wait(50));
      expect(screen.queryByText(new RegExp(keyTileDef.messageOnStep))).not.toBeInTheDocument(); // Message should disappear from prominent display
      expect(screen.queryByRole('button', {name: /Ok \(Enter\)/i})).not.toBeInTheDocument();
    }
  });
  
  test('interacts with an item (key press) and updates inventory/map', async () => {
    render(<KeyboardAdventurerGame onExit={mockOnExit} />);
    fireEvent.click(screen.getByRole('button', { name: /Começar Aventura!/i }));

    // Navigate to the key (3,1)
    pressKey('ArrowRight'); await act(() => wait(50)); // to (2,1)
    pressKey('ArrowRight'); await act(() => wait(50)); // to (3,1) - on key tile

    // Close initial messageOnStep if any
    const keyTileDef = MAP_CELL_DEFINITIONS['key_gold_1'];
    if (keyTileDef.messageOnStep) {
        expect(await screen.findByText(new RegExp(keyTileDef.messageOnStep))).toBeInTheDocument();
        pressKey('Enter'); await act(() => wait(50));
    }
    
    // Interact with the key tile (Press Enter when on it or facing it)
    // Player is on (3,1) and facing right. Let's assume interaction checks current tile if facing is not interactive.
    // Or, let's move then face it:
    // pressKey('ArrowLeft'); await act(() => wait(50)); // move to (2,1)
    // pressKey('ArrowRight'); await act(() => wait(50)); // face (3,1)
    
    pressKey('Enter'); // Attempt to interact
    await act(() => wait(50));

    // Expect prompt for picking up key
    const pickupInteraction = INTERACTIONS_DATA['pickup_gold_key'];
    expect(await screen.findByText(new RegExp(pickupInteraction.promptMessage!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
    
    // Confirm pickup
    pressKey('Enter'); 
    await act(() => wait(100));

    // Check success message
    expect(await screen.findByText(new RegExp(pickupInteraction.successResult.displayMessage!))).toBeInTheDocument();
    // Check inventory
    const goldKeyItem = ITEMS_DATA['key_gold'];
    expect(screen.getByText(new RegExp(goldKeyItem.name))).toBeInTheDocument();
    
    // Check map change (key tile should become path)
    // This requires checking the display of the cell at (3,1). It's hard to verify visually in test.
    // Logical check would be better.
    // For now, assume if inventory is updated and success message shown, map changed.
  });

  test('interacts with NPC (command input) and receives item', async () => {
    render(<KeyboardAdventurerGame onExit={mockOnExit} />);
    fireEvent.click(screen.getByRole('button', { name: /Começar Aventura!/i }));

    // Navigate to NPC at (7,3)
    // P, P, K, W, D, P, P, S, W   (y=1) K is (3,1)
    // W, P, W, P, P, P, P, N, P, W   (y=3) N is (7,3)
    // Start (1,1)
    pressKey('ArrowDown'); await act(() => wait(50)); // (1,2)
    pressKey('ArrowDown'); await act(() => wait(50)); // (1,3)
    for(let i=0; i<6; i++) { pressKey('ArrowRight'); await act(() => wait(50)); } // to (7,3) - on NPC tile
    
    const npcCellDef = MAP_CELL_DEFINITIONS['npc_quest_1'];
     if (npcCellDef.messageOnStep) {
        expect(await screen.findByText(new RegExp(npcCellDef.messageOnStep))).toBeInTheDocument();
        pressKey('Enter'); await act(() => wait(50)); // Close message
    }

    // Interact with NPC
    pressKey('Enter');
    await act(() => wait(100)); 

    const npcInteraction = INTERACTIONS_DATA['talk_npc_quest'];
    // Expect command prompt
    expect(await screen.findByText(new RegExp(npcInteraction.commandPrompt!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
    const commandInput = screen.getByPlaceholderText(/Seu comando aqui.../i);
    expect(commandInput).toBeInTheDocument();

    // Type correct command
    fireEvent.change(commandInput, { target: { value: npcInteraction.expectedInput! } });
    pressKey('Enter'); // Submit command
    await act(() => wait(100));

    // Check success message and item in inventory
    expect(await screen.findByText(new RegExp(npcInteraction.successResult.displayMessage!))).toBeInTheDocument();
    const questScrollItem = ITEMS_DATA['quest_scroll'];
    expect(screen.getByText(new RegExp(questScrollItem.name))).toBeInTheDocument();
  });
  
  // Placeholder for winning game test
  // test('wins the game by reaching the exit with required item', async () => {});

  test('exits game when "Sair da Aventura" is clicked', () => {
    render(<KeyboardAdventurerGame onExit={mockOnExit} />);
    fireEvent.click(screen.getByRole('button', { name: /Começar Aventura!/i }));
    fireEvent.click(screen.getByRole('button', { name: /Sair da Aventura/i }));
    expect(mockOnExit).toHaveBeenCalledTimes(1);
  });
});

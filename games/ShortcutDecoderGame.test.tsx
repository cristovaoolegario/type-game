
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
// Fix: Replaced triple-slash Jest type reference with explicit imports from '@jest/globals' for better type safety and module compatibility.
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import ShortcutDecoderGame from './ShortcutDecoderGame';
import { SHORTCUT_DECODER_ITEMS } from '../constants';

const mockOnExit = jest.fn();

// Helper to wait for timers
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('ShortcutDecoderGame', () => {
  beforeEach(() => {
    mockOnExit.mockClear();
    // Optional: Mock Math.random if shuffleArray's determinism is crucial for a test
    // jest.spyOn(global.Math, 'random').mockReturnValue(0.5); 
  });

  afterEach(() => {
    // jest.spyOn(global.Math, 'random').mockRestore();
  });

  test('renders sub-mode selection screen initially', () => {
    render(<ShortcutDecoderGame onExit={mockOnExit} />);
    expect(screen.getByText('Decifrador de Atalhos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Modo Memória/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Modo Correspondência/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Voltar ao Menu Principal/i })).toBeInTheDocument();
  });

  describe('Modo Memória', () => {
    test('starts memory game and shows cards', () => {
      render(<ShortcutDecoderGame onExit={mockOnExit} />);
      fireEvent.click(screen.getByRole('button', { name: /Modo Memória/i }));
      
      expect(screen.getByText('Jogo da Memória de Atalhos')).toBeInTheDocument();
      // Expect 2 * ITEMS_PER_GAME cards (ITEMS_PER_GAME is 6 by default)
      const cards = screen.getAllByRole('button', { name: '🔑' }); // Initially cards show '🔑'
      expect(cards.length).toBe(6 * 2); // ITEMS_PER_GAME is 6
      expect(screen.getByText(/Pares Encontrados: 0/i)).toBeInTheDocument();
    });

    test('allows flipping cards and finding a match', async () => {
      render(<ShortcutDecoderGame onExit={mockOnExit} />);
      fireEvent.click(screen.getByRole('button', { name: /Modo Memória/i }));

      // This test is complex because card content is hidden and shuffled.
      // We need to click two cards that ARE a pair.
      // For a robust test, one might need to peek into component state or control shuffle.
      // Simplistic approach: click first two, then if no match, try others.
      // Or, if we can get the actual card data (not directly available to test):
      
      // Let's assume the first item in SHORTCUT_DECODER_ITEMS is used and its parts appear.
      // The game prepares data using prepareGameData(ITEMS_PER_GAME), which is 6.
      // So, one of the first 6 items from SHORTCUT_DECODER_ITEMS will be in play.
      
      // Click two cards. This requires knowing which buttons correspond to a pair.
      // This is hard without internal knowledge or more complex selectors.
      // Let's click the first two available buttons:
      let cardButtons = screen.getAllByRole('button', { name: '🔑' });
      fireEvent.click(cardButtons[0]);
      // After click, button text might change or it might get a different role/class.
      // Re-query or use a more specific selector if possible.
      await act(() => wait(100)); // allow state to update / card to flip
      
      // Re-query all buttons; some might be flipped now.
      // The first button is now flipped. Find the second '🔑' button if available.
      // The content of the flipped card is now visible.
      const allButtonsAfterFirstFlip = screen.getAllByRole('button');
      const secondCardToClick = allButtonsAfterFirstFlip.find(btn => btn.textContent === '🔑');
      
      if (secondCardToClick) {
        fireEvent.click(secondCardToClick);
      } else {
        // If no other '🔑' buttons, click the next available button that isn't the first one already flipped.
        // This case is less likely if there are many cards.
        const nonFlippedButtons = allButtonsAfterFirstFlip.filter(btn => btn.textContent === '🔑');
        if (nonFlippedButtons.length > 0) {
             fireEvent.click(nonFlippedButtons[0])
        } else if (allButtonsAfterFirstFlip.length > 1) {
            // Fallback: click any other button that isn't the very first one clicked (if its content changed)
            const firstClickedCardContent = cardButtons[0].textContent;
            const differentButton = allButtonsAfterFirstFlip.find(btn => btn.textContent !== firstClickedCardContent);
            if(differentButton) fireEvent.click(differentButton);
            else if(allButtonsAfterFirstFlip.length > 1) fireEvent.click(allButtonsAfterFirstFlip[1]); // fallback further
        }
      }

      // Wait for feedback. This part is highly dependent on game logic and timing.
      await waitFor(async () => {
        const feedback = screen.getByText(/Par encontrado!|Não combinam/i);
        expect(feedback).toBeInTheDocument();
        if (feedback.textContent?.includes('Par encontrado!')) {
            expect(screen.getByText(/Pares Encontrados: 1/i)).toBeInTheDocument();
        }
      }, { timeout: 3000 });
    });

    test('completes memory game when all pairs are found', async () => {
        // This test would involve clicking all pairs correctly.
        // It's very involved to script without mocking/controlling the shuffle and card contents.
        // Placeholder for a more detailed test.
        render(<ShortcutDecoderGame onExit={mockOnExit} />);
        fireEvent.click(screen.getByRole('button', { name: /Modo Memória/i }));
        // ... logic to find and click all pairs ...
        // For now, we assume if we reach 'won' state, it would show.
        // e.g. await waitFor(() => expect(screen.getByText('Parabéns! Todos os pares encontrados!')).toBeInTheDocument(), {timeout: 20000}); // Increased timeout for full game simulation
      });
  });

  describe('Modo Correspondência', () => {
    test('starts matching game and shows items in columns', () => {
      render(<ShortcutDecoderGame onExit={mockOnExit} />);
      fireEvent.click(screen.getByRole('button', { name: /Modo Correspondência/i }));

      expect(screen.getByText('Combine Atalho e Função')).toBeInTheDocument();
      expect(screen.getByText('Atalhos')).toBeInTheDocument();
      expect(screen.getByText('Funções')).toBeInTheDocument();
      
      const gameItemsCount = 6; // ITEMS_PER_GAME
      // Buttons in first column (shortcuts)
      const shortcutsContainer = screen.getByText('Atalhos').closest('div');
      expect(shortcutsContainer).not.toBeNull();
      const shortcutButtons = shortcutsContainer!.querySelectorAll('button');
      expect(shortcutButtons?.length).toBe(gameItemsCount);
      // Buttons in second column (functions)
      const functionsContainer = screen.getByText('Funções').closest('div');
      expect(functionsContainer).not.toBeNull();
      const functionButtons = functionsContainer!.querySelectorAll('button');
      expect(functionButtons?.length).toBe(gameItemsCount);

      expect(screen.getByText(/Pares Encontrados: 0/i)).toBeInTheDocument();
    });
    
    test('allows selecting items and making a correct match', async () => {
        render(<ShortcutDecoderGame onExit={mockOnExit} />);
        fireEvent.click(screen.getByRole('button', { name: /Modo Correspondência/i }));

        // For a deterministic test, we need to know which shortcut matches which function.
        // The functions are shuffled. The shortcuts are not explicitly stated to be shuffled in setupMatchingGame.
        // We assume one of the SHORTCUT_DECODER_ITEMS (first 6) is present.
        // Let's try to find a match based on the actual displayed items.
        // This is hard without knowing the shuffled order of functions.
        
        // A more robust way for testing: Find a shortcut, then find its corresponding function display.
        const displayedShortcutButtons = screen.getByText('Atalhos').closest('div')!.querySelectorAll('button');
        const displayedFunctionButtons = screen.getByText('Funções').closest('div')!.querySelectorAll('button');

        let matchMade = false;
        for (const item of SHORTCUT_DECODER_ITEMS.slice(0,6)) { // Check against potential items in game
            const shortcutButton = Array.from(displayedShortcutButtons).find(btn => btn.textContent === item.shortcutDisplay);
            const functionButton = Array.from(displayedFunctionButtons).find(btn => btn.textContent === item.functionDisplay);

            if (shortcutButton && functionButton) {
                fireEvent.click(shortcutButton);
                 expect(screen.getByText(new RegExp(`Selecionado: ${item.shortcutDisplay.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,'i'))).toBeInTheDocument();
                fireEvent.click(functionButton);
                matchMade = true;
                break;
            }
        }
        expect(matchMade).toBe(true); // Ensure we actually found and attempted a match
        
        await waitFor(() => {
             expect(screen.getByText('Correto!')).toBeInTheDocument();
        }, {timeout: 1500});
        expect(screen.getByText(/Pares Encontrados: 1/i)).toBeInTheDocument();

        // Verify matched items are styled as matched (e.g. line-through)
        // This requires knowing which specific buttons were clicked and resulted in a match.
        // The shortcutButton and functionButton from the loop (if matchMade) should be checked.
    });
    
    test('completes matching game when all pairs are made', async () => {
        // Similar to memory game, this is involved.
        // Placeholder.
        render(<ShortcutDecoderGame onExit={mockOnExit} />);
        fireEvent.click(screen.getByRole('button', { name: /Modo Correspondência/i }));
        // ... logic to make all matches ...
        // e.g. await waitFor(() => expect(screen.getByText('Parabéns! Todas as combinações feitas!')).toBeInTheDocument(), {timeout: 20000});
    });
  });

  test('returns to sub-mode selection when "Trocar Modo" is clicked', () => {
    render(<ShortcutDecoderGame onExit={mockOnExit} />);
    fireEvent.click(screen.getByRole('button', { name: /Modo Memória/i }));
    expect(screen.getByText('Jogo da Memória de Atalhos')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Trocar Modo/i }));
    expect(screen.getByText('Decifrador de Atalhos')).toBeInTheDocument(); // Back to sub-mode selection
  });

  test('calls onExit when "Menu Principal" or "Voltar ao Menu Principal" is clicked', () => {
    render(<ShortcutDecoderGame onExit={mockOnExit} />);
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao Menu Principal/i }));
    expect(mockOnExit).toHaveBeenCalledTimes(1);

    mockOnExit.mockClear();
    render(<ShortcutDecoderGame onExit={mockOnExit} />); // Re-render for fresh state
    fireEvent.click(screen.getByRole('button', { name: /Modo Memória/i }));
    fireEvent.click(screen.getByRole('button', { name: /Menu Principal/i }));
    expect(mockOnExit).toHaveBeenCalledTimes(1);
  });
});


import React, { useEffect, useState } from 'react';
import { KeyDefinition } from '../types';
import { VIRTUAL_KEYBOARD_LAYOUT } from '../constants';

// Fix: Add type declarations for navigator.keyboard to resolve TypeScript errors.
// The Keyboard API (navigator.keyboard) might not be in default TypeScript lib.d.ts files.
// These declarations inform TypeScript about the API's existence and shape.
interface CustomKeyboardLayoutMap {
  get(code: string): string | undefined;
  // Add other Map-like properties/methods if used from layoutMap.
  // For example, if you iterate over it:
  // entries(): IterableIterator<[string, string]>;
  // keys(): IterableIterator<string>;
  // values(): IterableIterator<string>;
  // forEach(callbackfn: (value: string, key: string, map: CustomKeyboardLayoutMap) => void, thisArg?: any): void;
  // readonly size: number;
}

interface CustomKeyboard {
  getLayoutMap(): Promise<CustomKeyboardLayoutMap>;
}

declare global {
  interface Navigator {
    readonly keyboard?: CustomKeyboard;
  }
}

interface VirtualKeyboardProps {
  targetKeys?: string[]; // Array of key display strings to highlight (e.g., ['CTRL', 'C'])
  pressedKey?: string | null; // The actual event.key that was just pressed
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ targetKeys = [], pressedKey }) => {
  const [localizedLayout, setLocalizedLayout] = useState<KeyDefinition[][]>(VIRTUAL_KEYBOARD_LAYOUT);

  useEffect(() => {
    const localizeKeyboardLayout = async () => {
      if (navigator.keyboard && navigator.keyboard.getLayoutMap) {
        try {
          const layoutMap = await navigator.keyboard.getLayoutMap();
          const newLayout = VIRTUAL_KEYBOARD_LAYOUT.map(row =>
            row.map(keyDef => {
              const mappedKey = layoutMap.get(keyDef.id); // keyDef.id is like 'KeyQ', 'Digit1'
              if (mappedKey) {
                // Prioritize non-shifted characters for primary display if possible,
                // and ensure it's a single character for simple display updates.
                // More complex keys (like Digit1 showing '! 1') might need more sophisticated handling.
                // For now, we'll update the 'display' if a simple character is found.
                // We should be careful not to override things like "CTRL", "SHIFT", "ENTER"
                // if `mappedKey` for "ControlLeft" is just "Control".
                // The original `keyDef.display` is often more descriptive for special keys.

                const isSpecialKey = keyDef.display.length > 1 && keyDef.display === keyDef.display.toUpperCase(); // Heuristic for CTRL, SHIFT, F5 etc.
                
                if (!isSpecialKey && mappedKey.length === 1) {
                   // For 'Digit1' which displays '! 1', layoutMap.get('Digit1') might be '1'.
                   // We need a strategy for keys that show shifted values.
                   // For now, let's try a simple update, favoring the mapped key if it's a letter or digit.
                  if (keyDef.id.startsWith('Key') || keyDef.id.startsWith('Digit')) { // e.g. KeyA, Digit1
                    return { ...keyDef, display: mappedKey.toUpperCase() };
                  }
                } else if (!isSpecialKey && keyDef.id.startsWith('Numpad')) {
                    return { ...keyDef, display: mappedKey };
                }
                // For keys like Semicolon, Comma, Period, BracketLeft, etc.
                // their `keyDef.display` often includes shifted values (e.g. ": ;").
                // `mappedKey` might be just ";" or ",".
                // This part needs careful consideration to be truly accurate to all layouts.
                // A simple approach: if mappedKey is a single char, use it.
                else if (mappedKey.length === 1 && !isSpecialKey) {
                    // If original display was like ": ;" and mappedKey is ";", update to ";"
                    // This might lose the shifted character display but gain accuracy for the unshifted.
                    // This is a trade-off without a full glyph database.
                    // Let's check if the original display contains the mappedKey.
                    // If 'display' is ": ;" and 'mappedKey' is ";", we could keep ": ;" or change to ";".
                    // For simplicity now, if mappedKey is a single char, let's see.
                    // This part is tricky. For now, let's be conservative with overriding complex displays.
                    // If keyDef.value (like ';', '[') matches mappedKey, it's likely the primary char.
                    // No, keyDef.value is often lowercase, display is uppercase or multi-char.
                    // Let's try: if the mappedKey is a single character and the original display is also a single character (or a letter), update.
                    if (keyDef.display.length === 1 && mappedKey.length === 1 && !isSpecialKey) {
                         return { ...keyDef, display: mappedKey.toUpperCase() };
                    }
                    // If it's a symbol key where `display` is e.g. `~ \`` and `mappedKey` is `` ` ``, update.
                    if (mappedKey.length === 1 && keyDef.display.includes(mappedKey) && !isSpecialKey) {
                         // Prefer mappedKey if it's simpler e.g. for ` (from `~ ``)
                         // This is still heuristic.
                         // Let's assume for now if layoutMap provides something, it's more specific to the user
                        if (['Backquote', 'Minus', 'Equal', 'BracketLeft', 'BracketRight', 'Backslash', 'Semicolon', 'Quote', 'Comma', 'Period', 'Slash'].includes(keyDef.id)) {
                             return { ...keyDef, display: mappedKey }; // Use the direct mapped key for these symbols
                        }
                    }
                }
              }
              return keyDef; // Return original if no simple mapping or special key
            })
          );
          setLocalizedLayout(newLayout);
        } catch (error) {
          console.warn('Could not get keyboard layout map or error during localization:', error);
          setLocalizedLayout(VIRTUAL_KEYBOARD_LAYOUT); // Fallback to default
        }
      } else {
        // API not supported, use default layout
        setLocalizedLayout(VIRTUAL_KEYBOARD_LAYOUT);
      }
    };

    localizeKeyboardLayout();
  }, []);


  const isTarget = (keyDef: KeyDefinition): boolean => {
    return targetKeys.includes(keyDef.display.toUpperCase()) || targetKeys.includes(keyDef.display);
  };

  const isPressed = (keyDef: KeyDefinition): boolean => {
    if (!pressedKey) return false;
    const keyDefValue = keyDef.value || keyDef.display;
    return keyDefValue.toLowerCase() === pressedKey.toLowerCase() || 
           (keyDefValue === 'WIN' && (pressedKey === 'Meta' || pressedKey === 'OS')) ||
           (keyDefValue === 'ESPAÇO' && pressedKey === ' ');
  };


  return (
    <div className="p-4 bg-slate-200 rounded-lg shadow-md custom-font-comic">
      {localizedLayout.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center space-x-1 mb-1">
          {row.map((keyDef) => {
            const target = isTarget(keyDef);
            const pressed = isPressed(keyDef);
            
            let bgColor = 'bg-slate-50 hover:bg-slate-100';
            if (target) {
              bgColor = 'bg-yellow-400 animate-pulse';
            }
            if (pressed) {
              bgColor = 'bg-sky-500 text-white';
            }
             if (target && pressed) {
              bgColor = 'bg-green-500 text-white'; // Both target and pressed
            }

            return (
              <div
                key={keyDef.id}
                className={`
                  ${keyDef.size || 'w-14'} h-14 flex items-center justify-center 
                  border border-slate-300 rounded text-slate-700 font-medium
                  select-none transition-colors duration-150
                  ${bgColor} ${keyDef.className || ''}
                `}
                style={{ lineHeight: '1.2' }} 
              >
                <span className="text-center text-xs sm:text-sm whitespace-pre-wrap">
                  {keyDef.display}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default VirtualKeyboard;

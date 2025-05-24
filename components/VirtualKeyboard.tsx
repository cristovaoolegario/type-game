
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
                const isSpecialKey = keyDef.display.length > 1 && keyDef.display === keyDef.display.toUpperCase(); 
                
                if (!isSpecialKey && mappedKey.length === 1) {
                  if (keyDef.id.startsWith('Key') || keyDef.id.startsWith('Digit')) { 
                    return { ...keyDef, display: mappedKey.toUpperCase() };
                  }
                } else if (!isSpecialKey && keyDef.id.startsWith('Numpad')) {
                    return { ...keyDef, display: mappedKey };
                }
                else if (mappedKey.length === 1 && !isSpecialKey) {
                    if (keyDef.display.length === 1 && mappedKey.length === 1 && !isSpecialKey) {
                         return { ...keyDef, display: mappedKey.toUpperCase() };
                    }
                    if (mappedKey.length === 1 && keyDef.display.includes(mappedKey) && !isSpecialKey) {
                        if (['Backquote', 'Minus', 'Equal', 'BracketLeft', 'BracketRight', 'Backslash', 'Semicolon', 'Quote', 'Comma', 'Period', 'Slash'].includes(keyDef.id)) {
                             return { ...keyDef, display: mappedKey }; 
                        }
                    }
                }
              }
              return keyDef; 
            })
          );
          setLocalizedLayout(newLayout);
        } catch (error) {
          console.warn('Could not get keyboard layout map or error during localization:', error);
          setLocalizedLayout(VIRTUAL_KEYBOARD_LAYOUT); 
        }
      } else {
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
    <div className="p-3 sm:p-4 bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-xl border border-slate-700/70 custom-font-comic">
      {localizedLayout.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center space-x-1 mb-1">
          {row.map((keyDef) => {
            const target = isTarget(keyDef);
            const pressed = isPressed(keyDef);
            
            let keyClasses = 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600/50';
            let textShadow = '';

            if (target) {
              keyClasses = 'bg-yellow-500 text-slate-900 animate-pulse border-yellow-400';
              textShadow = '0 0 6px rgba(234, 179, 8, 0.7)'; // Yellow glow
            }
            if (pressed) {
              keyClasses = 'bg-sky-500 text-white border-sky-400';
              textShadow = '0 0 6px rgba(14, 165, 233, 0.7)'; // Sky glow
            }
             if (target && pressed) {
              keyClasses = 'bg-green-500 text-white border-green-400'; 
              textShadow = '0 0 6px rgba(34, 197, 94, 0.7)'; // Green glow
            }

            return (
              <div
                key={keyDef.id}
                className={`
                  ${keyDef.size || 'w-12 sm:w-14'} h-12 sm:h-14 flex items-center justify-center 
                  border rounded text-xs sm:text-sm font-medium
                  select-none transition-all duration-150
                  ${keyClasses} ${keyDef.className || ''}
                `}
                style={{ lineHeight: '1.1', textShadow: textShadow, boxShadow: pressed || target ? `0 0 8px 1px ${ textShadow ? textShadow.replace('0 0 6px ','').replace(')',' / 0.5)') : 'rgba(255,255,255,0.1)'}` : 'none'  }} 
              >
                <span className="text-center whitespace-pre-wrap break-all">
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

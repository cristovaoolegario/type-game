
import { ChallengeItem, KeyDefinition, CodeBuilderChallenge, ShortcutDecoderItem, TileType, MapCellDefinition, ItemDefinition, InteractionProperties } from './types';

// Helper to generate keysToHighlight for terms
const termToHighlightKeys = (term: string): string[] => term.toUpperCase().split('');

export const PHASE1_KEYS: ChallengeItem[] = [
  { type: 'key', id: 'ctrl', display: 'Ctrl', expected: { key: 'Control' }, keysToHighlight: ['CTRL'] },
  { type: 'key', id: 'shift', display: 'Shift', expected: { key: 'Shift' }, keysToHighlight: ['SHIFT'] },
  { type: 'key', id: 'alt', display: 'Alt', expected: { key: 'Alt' }, keysToHighlight: ['ALT'] },
  { type: 'key', id: 'tab', display: 'Tab', expected: { key: 'Tab', preventDefault: true }, keysToHighlight: ['TAB'] },
  { type: 'key', id: 'esc', display: 'Esc', expected: { key: 'Escape' }, keysToHighlight: ['ESC'] },
  { type: 'key', id: 'enter', display: 'Enter', expected: { key: 'Enter' }, keysToHighlight: ['ENTER'] },
  { type: 'key', id: 'backspace', display: 'Backspace', expected: { key: 'Backspace' }, keysToHighlight: ['BACKSPACE'] },
  { type: 'key', id: 'delete', display: 'Delete', expected: { key: 'Delete' }, keysToHighlight: ['DEL'] },
  { type: 'key', id: 'f5', display: 'F5', expected: { key: 'F5', preventDefault: true }, keysToHighlight: ['F5'] },
];

export const PHASE2_COMBINATIONS: ChallengeItem[] = [
  { type: 'combo', id: 'ctrl_c', display: 'Ctrl + C', expected: { key: 'c', ctrlKey: true }, description: "Copiar", keysToHighlight: ['CTRL', 'C']},
  { type: 'combo', id: 'ctrl_v', display: 'Ctrl + V', expected: { key: 'v', ctrlKey: true }, description: "Colar", keysToHighlight: ['CTRL', 'V']},
  { type: 'combo', id: 'ctrl_z', display: 'Ctrl + Z', expected: { key: 'z', ctrlKey: true }, description: "Desfazer", keysToHighlight: ['CTRL', 'Z']},
  { type: 'combo', id: 'ctrl_s', display: 'Ctrl + S', expected: { key: 's', ctrlKey: true, preventDefault: true }, description: "Salvar", keysToHighlight: ['CTRL', 'S']},
  { type: 'combo', id: 'ctrl_f', display: 'Ctrl + F', expected: { key: 'f', ctrlKey: true, preventDefault: true }, description: "Buscar", keysToHighlight: ['CTRL', 'F']},
  { type: 'combo', id: 'shift_arrowup', display: 'Shift + ↑', expected: { key: 'ArrowUp', shiftKey: true }, description: "Selecionar para cima", keysToHighlight: ['SHIFT', '↑']},
];

export const PHASE3_TERMS: ChallengeItem[] = [
  { type: 'term', id: 'if', display: 'if', expected: 'if', keysToHighlight: termToHighlightKeys('if') },
  { type: 'term', id: 'else', display: 'else', expected: 'else', keysToHighlight: termToHighlightKeys('else') },
  { type: 'term', id: 'for', display: 'for', expected: 'for', keysToHighlight: termToHighlightKeys('for') },
  { type: 'term', id: 'while', display: 'while', expected: 'while', keysToHighlight: termToHighlightKeys('while') },
  { type: 'term', id: 'print', display: 'print', expected: 'print', keysToHighlight: termToHighlightKeys('print') },
  { type: 'term', id: 'variable', display: 'variable', expected: 'variable', keysToHighlight: termToHighlightKeys('variable') },
  { type: 'term', id: 'function', display: 'function', expected: 'function', keysToHighlight: termToHighlightKeys('function') },
  { type: 'term', id: 'loop', display: 'loop', expected: 'loop', keysToHighlight: termToHighlightKeys('loop') },
  { type: 'term', id: 'array', display: 'array', expected: 'array', keysToHighlight: termToHighlightKeys('array') },
  { type: 'term', id: 'string', display: 'string', expected: 'string', keysToHighlight: termToHighlightKeys('string') },
  { type: 'term', id: 'integer', display: 'integer', expected: 'integer', keysToHighlight: termToHighlightKeys('integer') },
  { type: 'term', id: 'boolean', display: 'boolean', expected: 'boolean', keysToHighlight: termToHighlightKeys('boolean') },
  { type: 'term', id: 'syntax', display: 'syntax', expected: 'syntax', keysToHighlight: termToHighlightKeys('syntax') },
  { type: 'term', id: 'debug', display: 'debug', expected: 'debug', keysToHighlight: termToHighlightKeys('debug') },
];

export const CHALLENGES_BY_PHASE: Record<number, ChallengeItem[]> = {
  1: PHASE1_KEYS,
  2: PHASE2_COMBINATIONS,
  3: PHASE3_TERMS,
};

export const INITIAL_LIVES = 5;
export const CHALLENGES_PER_PHASE = 5; // Number of challenges to complete a phase

// Simplified Virtual Keyboard Layout for relevant keys
export const VIRTUAL_KEYBOARD_LAYOUT: KeyDefinition[][] = [
  [
    { id: 'Escape', display: 'ESC', value: 'Escape', size: 'w-14' },
    { id: 'F1', display: 'F1', value: 'F1', size: 'w-14' }, { id: 'F2', display: 'F2', value: 'F2', size: 'w-14' },
    { id: 'F3', display: 'F3', value: 'F3', size: 'w-14' }, { id: 'F4', display: 'F4', value: 'F4', size: 'w-14' },
    { id: 'F5', display: 'F5', value: 'F5', size: 'w-14' }, { id: 'F6', display: 'F6', value: 'F6', size: 'w-14' },
    // ... more F keys if needed
  ],
  [
    { id: 'Backquote', display: '~ `', value: '`', size: 'w-14' }, { id: 'Digit1', display: '! 1', value: '1', size: 'w-14' },
    { id: 'Digit2', display: '@ 2', value: '2', size: 'w-14' }, { id: 'Digit3', display: '# 3', value: '3', size: 'w-14' },
    { id: 'Digit4', display: '$ 4', value: '4', size: 'w-14' }, { id: 'Digit5', display: '% 5', value: '5', size: 'w-14' },
    { id: 'Digit6', display: '^ 6', value: '6', size: 'w-14' }, { id: 'Digit7', display: '& 7', value: '7', size: 'w-14' },
    { id: 'Digit8', display: '* 8', value: '8', size: 'w-14' }, { id: 'Digit9', display: '( 9', value: '9', size: 'w-14' },
    { id: 'Digit0', display: ') 0', value: '0', size: 'w-14' }, { id: 'Minus', display: '_ -', value: '-', size: 'w-14' },
    { id: 'Equal', display: '+ =', value: '=', size: 'w-14' }, { id: 'Backspace', display: 'BACKSPACE', value: 'Backspace', size: 'w-28' },
  ],
  [
    { id: 'Tab', display: 'TAB', value: 'Tab', size: 'w-20' }, { id: 'KeyQ', display: 'Q', value: 'q', size: 'w-14' },
    { id: 'KeyW', display: 'W', value: 'w', size: 'w-14' }, { id: 'KeyE', display: 'E', value: 'e', size: 'w-14' },
    { id: 'KeyR', display: 'R', value: 'r', size: 'w-14' }, { id: 'KeyT', display: 'T', value: 't', size: 'w-14' },
    { id: 'KeyY', display: 'Y', value: 'y', size: 'w-14' }, { id: 'KeyU', display: 'U', value: 'u', size: 'w-14' },
    { id: 'KeyI', display: 'I', value: 'i', size: 'w-14' }, { id: 'KeyO', display: 'O', value: 'o', size: 'w-14' },
    { id: 'KeyP', display: 'P', value: 'p', size: 'w-14' }, { id: 'BracketLeft', display: '{ [', value: '[', size: 'w-14' },
    { id: 'BracketRight', display: '} ]', value: ']', size: 'w-14' }, { id: 'Backslash', display: '| \\', value: '\\', size: 'w-20' },
  ],
  [
    { id: 'CapsLock', display: 'CAPS LOCK', value: 'CapsLock', size: 'w-24' }, { id: 'KeyA', display: 'A', value: 'a', size: 'w-14' },
    { id: 'KeyS', display: 'S', value: 's', size: 'w-14' }, { id: 'KeyD', display: 'D', value: 'd', size: 'w-14' },
    { id: 'KeyF', display: 'F', value: 'f', size: 'w-14' }, { id: 'KeyG', display: 'G', value: 'g', size: 'w-14' },
    { id: 'KeyH', display: 'H', value: 'h', size: 'w-14' }, { id: 'KeyJ', display: 'J', value: 'j', size: 'w-14' },
    { id: 'KeyK', display: 'K', value: 'k', size: 'w-14' }, { id: 'KeyL', display: 'L', value: 'l', size: 'w-14' },
    { id: 'Semicolon', display: ': ;', value: ';', size: 'w-14' }, { id: 'Quote', display: '" \'', value: '\'', size: 'w-14' },
    { id: 'Enter', display: 'ENTER', value: 'Enter', size: 'w-24' },
  ],
  [
    { id: 'ShiftLeft', display: 'SHIFT', value: 'Shift', size: 'w-32' }, { id: 'KeyZ', display: 'Z', value: 'z', size: 'w-14' },
    { id: 'KeyX', display: 'X', value: 'x', size: 'w-14' }, { id: 'KeyC', display: 'C', value: 'c', size: 'w-14' },
    { id: 'KeyV', display: 'V', value: 'v', size: 'w-14' }, { id: 'KeyB', display: 'B', value: 'b', size: 'w-14' },
    { id: 'KeyN', display: 'N', value: 'n', size: 'w-14' }, { id: 'KeyM', display: 'M', value: 'm', size: 'w-14' },
    { id: 'Comma', display: '< ,', value: ',', size: 'w-14' }, { id: 'Period', display: '> .', value: '.', size: 'w-14' },
    { id: 'Slash', display: '? /', value: '/', size: 'w-14' }, { id: 'ShiftRight', display: 'SHIFT', value: 'Shift', size: 'w-32' },
  ],
  [
    { id: 'ControlLeft', display: 'CTRL', value: 'Control', size: 'w-20' }, { id: 'MetaLeft', display: 'WIN', value: 'Meta', size: 'w-16' },
    { id: 'AltLeft', display: 'ALT', value: 'Alt', size: 'w-16' }, { id: 'Space', display: 'ESPAÇO', value: ' ', size: 'w-[28rem]' }, // approx 7 * w-14 + 6 * space
    { id: 'AltRight', display: 'ALT', value: 'Alt', size: 'w-16' }, { id: 'ControlRight', display: 'CTRL', value: 'Control', size: 'w-20' },
    { id: 'ArrowLeft', display: '←', value: 'ArrowLeft', size: 'w-14', className: "ml-2" }, { id: 'ArrowUp', display: '↑', value: 'ArrowUp', size: 'w-14' },
    { id: 'ArrowDown', display: '↓', value: 'ArrowDown', size: 'w-14' }, { id: 'ArrowRight', display: '→', value: 'ArrowRight', size: 'w-14' },
    { id: 'Delete', display: 'DEL', value: 'Delete', size: 'w-14', className: "ml-2" },
  ],
];

// Helper function to shuffle an array
export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Challenges for CodeBuilderGame
export const CODE_BUILDER_CHALLENGES: CodeBuilderChallenge[] = [
  {
    id: 'cb1',
    title: 'Imprimir Olá Mundo',
    parts: [
      { type: 'blank', id: 'b1_1', expected: 'print' },
      { type: 'text', content: '(' },
      { type: 'blank', id: 'b1_2', expected: '"Olá Mundo!"' },
      { type: 'text', content: ')' },
    ],
    options: ['print', '"Olá Mundo!"', 'if', 'input', '()'],
  },
  {
    id: 'cb2',
    title: 'Declaração IF simples',
    parts: [
      { type: 'blank', id: 'b2_1', expected: 'if' },
      { type: 'text', content: ' ' },
      { type: 'blank', id: 'b2_2', expected: 'idade' },
      { type: 'text', content: ' ' },
      { type: 'blank', id: 'b2_3', expected: '>=' },
      { type: 'text', content: ' ' },
      { type: 'blank', id: 'b2_4', expected: '18' },
      { type: 'blank', id: 'b2_5', expected: ':' },
      { type: 'text', content: '\n  print("Adulto")' }, // Using \n for newline, display needs to handle it
    ],
    options: ['if', 'idade', '>=', '18', ':', 'else', '<', '21', '():'],
  },
  {
    id: 'cb3',
    title: 'Loop FOR básico',
    parts: [
      { type: 'blank', id: 'b3_1', expected: 'for' },
      { type: 'text', content: ' item ' },
      { type: 'blank', id: 'b3_2', expected: 'in' },
      { type: 'text', content: ' ' },
      { type: 'blank', id: 'b3_3', expected: 'lista' },
      { type: 'blank', id: 'b3_4', expected: ':' },
      { type: 'text', content: '\n  print(item)'},
    ],
    options: ['for', 'in', 'lista', ':', 'while', 'of', 'colecao', '();'],
  },
  {
    id: 'cb4',
    title: 'Definir uma Função',
    parts: [
        { type: 'blank', id: 'b4_1', expected: 'def' },
        { type: 'text', content: ' ' },
        { type: 'blank', id: 'b4_2', expected: 'saudacao' },
        { type: 'blank', id: 'b4_3', expected: '(' },
        { type: 'blank', id: 'b4_4', expected: 'nome' },
        { type: 'blank', id: 'b4_5', expected: ')' },
        { type: 'blank', id: 'b4_6', expected: ':' },
        { type: 'text', content: '\n  print(f"Olá, {nome}!")' },
    ],
    options: ['def', 'saudacao', '(', 'nome', ')', ':', 'function', 'params', '{}'],
  },
];

// Data for ShortcutDecoderGame
export const SHORTCUT_DECODER_ITEMS: ShortcutDecoderItem[] = [
  { id: 'copy', shortcutDisplay: 'Ctrl + C', functionDisplay: 'Copiar seleção', keysToHighlight: ['CTRL', 'C'] },
  { id: 'paste', shortcutDisplay: 'Ctrl + V', functionDisplay: 'Colar da área de transferência', keysToHighlight: ['CTRL', 'V'] },
  { id: 'cut', shortcutDisplay: 'Ctrl + X', functionDisplay: 'Recortar seleção', keysToHighlight: ['CTRL', 'X'] },
  { id: 'undo', shortcutDisplay: 'Ctrl + Z', functionDisplay: 'Desfazer última ação', keysToHighlight: ['CTRL', 'Z'] },
  { id: 'redo', shortcutDisplay: 'Ctrl + Y', functionDisplay: 'Refazer última ação desfeita', keysToHighlight: ['CTRL', 'Y'] },
  { id: 'save', shortcutDisplay: 'Ctrl + S', functionDisplay: 'Salvar arquivo atual', keysToHighlight: ['CTRL', 'S'] },
  { id: 'find', shortcutDisplay: 'Ctrl + F', functionDisplay: 'Buscar no documento', keysToHighlight: ['CTRL', 'F'] },
  { id: 'select_all', shortcutDisplay: 'Ctrl + A', functionDisplay: 'Selecionar tudo', keysToHighlight: ['CTRL', 'A'] },
  { id: 'new_file', shortcutDisplay: 'Ctrl + N', functionDisplay: 'Novo arquivo/janela', keysToHighlight: ['CTRL', 'N'] },
  { id: 'open_file', shortcutDisplay: 'Ctrl + O', functionDisplay: 'Abrir arquivo', keysToHighlight: ['CTRL', 'O'] },
  { id: 'print_doc', shortcutDisplay: 'Ctrl + P', functionDisplay: 'Imprimir documento', keysToHighlight: ['CTRL', 'P'] },
  { id: 'f5_refresh', shortcutDisplay: 'F5', functionDisplay: 'Atualizar página', keysToHighlight: ['F5'] },
  { id: 'esc_cancel', shortcutDisplay: 'Esc', functionDisplay: 'Cancelar/Fechar diálogo', keysToHighlight: ['ESC'] },
  { id: 'enter_confirm', shortcutDisplay: 'Enter', functionDisplay: 'Confirmar/Nova Linha', keysToHighlight: ['ENTER'] },
  { id: 'shift_caps', shortcutDisplay: 'Shift', functionDisplay: 'Letras maiúsculas/Selecionar', keysToHighlight: ['SHIFT'] },
];

// --- Constants for KeyboardAdventurerGame ---
export const PLAYER_START_X = 1;
export const PLAYER_START_Y = 1;
export const PLAYER_AVATAR_DISPLAY = '🤠';

export const TILE_DISPLAYS: Record<TileType, string> = {
  PATH: ' ',
  WALL: '🧱',
  DOOR_CLOSED_GENERIC: '🚪',
  DOOR_OPEN: '🟢', // Using a green circle for an open door/passage
  ITEM_GENERIC: '✨',
  NPC_GENERIC: '🧍',
  EXIT_PORTAL: '🌀',
  INFO_SIGN: '팻', // Sign in Korean, can be changed
  KEY_GOLD: '🔑',
  DOOR_LOCKED_GOLD: '🚪', // Visually same as generic, but different type
  NPC_QUEST_GIVER: '❓', // NPC with a quest
  ITEM_QUEST_SCROLL: '📜',
};

export const ITEMS_DATA: Record<string, ItemDefinition> = {
  'key_gold': { id: 'key_gold', name: 'Chave Dourada', description: 'Abre uma porta dourada trancada.', display: '🔑' },
  'quest_scroll': { id: 'quest_scroll', name: 'Pergaminho da Missão', description: 'Um pergaminho com instruções importantes.', display: '📜' },
};

export const INTERACTIONS_DATA: Record<string, InteractionProperties> = {
  'pickup_gold_key': {
    id: 'pickup_gold_key',
    type: 'keyPress',
    expectedInput: 'Enter',
    promptMessage: 'Pegar Chave Dourada? (Pressione Enter)',
    successResult: {
      giveItemId: 'key_gold',
      changeTileTo: { newTileId: 'path_default' }, // Changes the key tile to a path tile
      displayMessage: 'Você pegou a Chave Dourada!',
    },
  },
  'open_gold_door': {
    id: 'open_gold_door',
    type: 'keyPress',
    expectedInput: 'Enter',
    requiredItemId: 'key_gold',
    consumesItem: true,
    promptMessage: 'Abrir Porta Dourada? (Requer Chave Dourada - Pressione Enter)',
    successResult: {
      changeTileTo: { newTileId: 'door_open_gold_instance' }, // Specific instance of an open door
      displayMessage: 'A porta dourada se abriu!',
      removeItemId: 'key_gold',
    },
    failureMessage: 'Você precisa da Chave Dourada para abrir esta porta.',
  },
  'talk_npc_quest': {
    id: 'talk_npc_quest',
    type: 'command',
    commandPrompt: 'O Mago diz: "Olá, aventureiro! Diga a palavra mágica para provar seu valor." (Digite "ajuda")',
    expectedInput: 'ajuda', // lowercase
    successResult: {
      giveItemId: 'quest_scroll',
      displayMessage: 'O Mago entrega um Pergaminho da Missão: "Leve isto ao portal!"',
      // Optionally change NPC interaction after quest item is given
      // changeTileTo: { newTileId: 'npc_quest_giver_done' } // Example of changing NPC state
    },
    failureMessage: 'O Mago resmunga: "Não foi isso que eu pedi..."',
  },
  'use_exit_portal': {
    id: 'use_exit_portal',
    type: 'keyPress',
    expectedInput: 'Enter',
    requiredItemId: 'quest_scroll', // Requires the scroll from NPC
    promptMessage: 'Entrar no Portal? (Requer Pergaminho da Missão - Pressione Enter)',
    successResult: {
      winGame: true,
      displayMessage: 'Você usou o Pergaminho e ativou o portal! Você venceu!',
    },
    failureMessage: 'O portal parece inativo. Você precisa do Pergaminho da Missão.',
  },
  'info_sign_generic': {
    id: 'info_sign_generic',
    type: 'keyPress',
    expectedInput: 'Enter',
    promptMessage: 'Ler placa? (Pressione Enter)',
    successResult: {
      displayMessage: 'A placa diz: "Cuidado com os desafios à frente!"',
    },
  },
};

// Define the base properties of your map cell types
export const MAP_CELL_DEFINITIONS: Record<string, MapCellDefinition> = {
  // Default walkable path
  'path_default': { id: 'path_default', tileType: 'PATH', display: TILE_DISPLAYS.PATH, walkable: true },
  // Default wall
  'wall_default': { id: 'wall_default', tileType: 'WALL', display: TILE_DISPLAYS.WALL, walkable: false },
  // Specific instances referenced by the map layout
  'key_gold_1': { id: 'key_gold_1', tileType: 'KEY_GOLD', display: TILE_DISPLAYS.KEY_GOLD, walkable: true, interactionId: 'pickup_gold_key', messageOnStep: 'Uma chave dourada brilha aqui.' },
  'door_locked_gold_1': { id: 'door_locked_gold_1', tileType: 'DOOR_LOCKED_GOLD', display: TILE_DISPLAYS.DOOR_LOCKED_GOLD, walkable: false, interactionId: 'open_gold_door', messageOnStep: 'Uma porta dourada, firmemente trancada.' },
  'door_open_gold_instance': { id: 'door_open_gold_instance', tileType: 'DOOR_OPEN', display: TILE_DISPLAYS.DOOR_OPEN, walkable: true, messageOnStep: 'A porta dourada está aberta.' },
  'npc_quest_1': { id: 'npc_quest_1', tileType: 'NPC_QUEST_GIVER', display: TILE_DISPLAYS.NPC_QUEST_GIVER, walkable: false, interactionId: 'talk_npc_quest', messageOnStep: 'Um mago misterioso observa você.' },
  'exit_portal_1': { id: 'exit_portal_1', tileType: 'EXIT_PORTAL', display: TILE_DISPLAYS.EXIT_PORTAL, walkable: false, interactionId: 'use_exit_portal', messageOnStep: 'Um portal pulsante. Parece ser a saída.'},
  'info_sign_1': { id: 'info_sign_1', tileType: 'INFO_SIGN', display: TILE_DISPLAYS.INFO_SIGN, walkable: false, interactionId: 'info_sign_generic', messageOnStep: 'Uma placa antiga está aqui.'}
};

// Represents the initial layout using IDs from MAP_CELL_DEFINITIONS
export const INITIAL_GAME_MAP_LAYOUT: string[][] = [
// 0    1    2    3    4    5    6    7    8    9
  ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'], // 0
  ['W', 'P', 'P', 'K', 'W', 'D', 'P', 'P', 'S', 'W'], // 1 (P=Path, K=Key, W=Wall, D=Door, S=Sign)
  ['W', 'P', 'W', 'P', 'W', 'P', 'W', 'W', 'P', 'W'], // 2
  ['W', 'P', 'W', 'P', 'P', 'P', 'P', 'N', 'P', 'W'], // 3 (N=NPC)
  ['W', 'P', 'W', 'W', 'W', 'W', 'P', 'W', 'P', 'W'], // 4
  ['W', 'P', 'P', 'P', 'P', 'P', 'P', 'W', 'E', 'W'], // 5 (E=Exit)
  ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'], // 6
];

// Map characters in INITIAL_GAME_MAP_LAYOUT to MAP_CELL_DEFINITIONS keys
export const LAYOUT_CHAR_TO_DEFINITION_KEY: Record<string, string> = {
  'P': 'path_default',
  'W': 'wall_default',
  'K': 'key_gold_1',
  'D': 'door_locked_gold_1',
  'N': 'npc_quest_1',
  'E': 'exit_portal_1',
  'S': 'info_sign_1',
  // 'O': 'door_open_gold_instance' // This is a result of interaction, not initial layout
};
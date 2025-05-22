
export enum GameMode {
  HIDDEN_KEY_HUNT = "Caça às Teclas Escondidas",
  COMMAND_RACE = "Corrida de Comandos",
  CODE_BUILDER = "Construtor de Código",
  SHORTCUT_DECODER = "Decifrador de Atalhos",
  KEYBOARD_ADVENTURER = "Teclado Aventureiro",
}

export interface KeyPressExpected {
  key: string; // Expected event.key value (e.g., "Control", "c", "F5")
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  preventDefault?: boolean; // If true, call event.preventDefault()
}

export interface ChallengeItem {
  id: string;
  type: 'key' | 'combo' | 'term';
  display: string; // What to show the user, e.g., "Ctrl", "Ctrl + C", "if"
  expected: KeyPressExpected | string; // KeyPressExpected for key/combo, string for term (lowercase)
  description?: string; // For combos, e.g., "Copiar"
  keysToHighlight: string[]; // For virtual keyboard, e.g. ['CTRL', 'C'] or ['I', 'F'] (uppercase for keycaps)
}

// For VirtualKeyboard component
export interface KeyDefinition {
  id: string; // Unique ID, can be event.code or custom like 'KeyA'
  display: string; // Text on the key cap (e.g., 'A', 'CTRL', 'F5')
  value?: string; // The value this key represents (e.g., 'a', 'Control', 'F5') - for matching highlights
  size?: string; // Tailwind width class like 'w-12', 'w-full'
  rowSpan?: number;
  colSpan?: number;
  className?: string; // Additional classes
}

// Types for CodeBuilderGame
export interface TextPart {
  type: 'text';
  content: string;
}

export interface BlankPart {
  type: 'blank';
  id: string; // Unique ID for the blank
  expected: string; // The correct word/symbol for this blank
  filledContent?: string; // What the user has filled in
}

export type CodeSnippetPart = TextPart | BlankPart;

export interface CodeBuilderChallenge {
  id: string;
  title?: string; // Optional title/description for the challenge
  parts: CodeSnippetPart[];
  options: string[]; // Available options for the blanks (includes correct and distractor items)
}

// Types for ShortcutDecoderGame
export interface ShortcutDecoderItem {
  id: string; // Unique identifier for the pair, e.g., "copy"
  shortcutDisplay: string; // How the shortcut is shown, e.g., "Ctrl + C"
  functionDisplay: string; // Description of the function, e.g., "Copiar Texto"
  keysToHighlight?: string[]; // Optional: for highlighting on virtual keyboard if ever used here e.g. ['CTRL', 'C']
}

export interface MemoryCardState {
  id: string; // Unique ID for this card instance, e.g., "copy_shortcut" or "copy_function"
  pairId: string; // ID of the original ShortcutDecoderItem (e.g., "copy")
  type: 'shortcut' | 'function';
  content: string; // What's displayed on the card (shortcutDisplay or functionDisplay)
  isFlipped: boolean;
  isMatched: boolean;
}

export interface MatchItemState {
  id: string; // Unique ID for this item instance (can be same as pairId for one column)
  pairId: string; // ID of the original ShortcutDecoderItem
  type: 'shortcut' | 'function';
  content: string;
  isMatched: boolean;
  isSelected?: boolean; // For UI indication when clicked
  originalOrder?: number; // To keep functionDisplay items from being too easily matched by original order if needed
}

// Types for KeyboardAdventurerGame
export type TileType = 
  | 'PATH' 
  | 'WALL' 
  | 'DOOR_CLOSED_GENERIC' // A generic closed door
  | 'DOOR_OPEN'           // A generic open door
  | 'ITEM_GENERIC'        // A generic item to pick up
  | 'NPC_GENERIC'         // A generic NPC
  | 'EXIT_PORTAL'         // Goal to win the game
  | 'INFO_SIGN'           // A sign with a message
  | 'KEY_GOLD'            // Specific item: Gold Key
  | 'DOOR_LOCKED_GOLD'    // Specific door: Locked Gold Door
  | 'NPC_QUEST_GIVER'     // Specific NPC: Quest Giver
  | 'ITEM_QUEST_SCROLL';  // Specific item: Quest Scroll


export interface ItemDefinition {
  id: string; // e.g., 'key_gold', 'quest_scroll'
  name: string; // e.g., "Chave Dourada", "Pergaminho da Missão"
  description: string; // e.g., "Abre portas douradas.", "Um pergaminho antigo."
  display?: string; // Emoji/char for inventory, if different from map display
}

export type InteractionType = 
  | 'keyPress'      // Requires a specific key press (e.g., Enter)
  | 'command'       // Requires typing a specific command
  | 'autoWithItem'; // Triggers automatically if player has a specific item (not fully implemented yet, usually handled by keyPress with requiredItem)

export interface ChangeTileAction {
  targetCellId?: string; // ID of the cell to change (if not the current cell player is on/facing)
                          // If undefined, assumes the cell being interacted with.
  newTileId: string; // The ID of the new MapCellDefinition to replace the old one
}
export interface GiveItemAction {
  itemId: string; // ID of the ItemDefinition to give
}
export interface RemoveItemAction {
  itemId: string; // ID of the ItemDefinition to remove
}

export interface ActionResult {
  changeTileTo?: ChangeTileAction; 
  giveItemId?: string;           // ID of the item to give to player (from ITEMS_DATA)
  removeItemId?: string;         // ID of the item to remove from player's inventory
  displayMessage?: string;       // Message to show the player
  winGame?: boolean;
  loseGame?: boolean;
  // Future: triggerSound, startDialogue, etc.
}

export interface InteractionProperties {
  id: string; // Unique ID for this interaction definition
  type: InteractionType;
  promptMessage?: string;   // Initial message when interaction becomes available (e.g., "Press Enter to open")
  commandPrompt?: string;   // Message for command input (e.g., "Type 'activate':")
  expectedInput?: string;   // Expected event.key for 'keyPress' (e.g., "Enter") or command string for 'command' (lowercase)
  requiredItemId?: string;  // ID of an item required in inventory
  consumesItem?: boolean;   // If the requiredItem is consumed upon successful interaction
  successResult: ActionResult;
  failureMessage?: string;  // Message if interaction fails (e.g., wrong command, missing item)
}

export interface MapCellDefinition {
  id: string; // Unique identifier for this type of cell/object definition (e.g., "wall_stone", "door_locked_gold_1")
  tileType: TileType; // General category of the tile
  display: string; // Character/emoji for rendering
  walkable: boolean;
  messageOnStep?: string; // Message displayed when player steps on/near this cell
  interactionId?: string; // ID of an InteractionProperties from INTERACTIONS_DATA
}

export interface MapCell extends MapCellDefinition {
  x: number; // For convenience, though map is 2D array
  y: number;
  instanceId: string; // Unique ID for this specific instance on the map, e.g. "door_A_3,5"
}

export type PlayerDirection = 'up' | 'down' | 'left' | 'right';

export type PlayerSubState = 
  | 'IDLE'                      // Default state, exploring
  | 'SHOWING_MESSAGE'           // Displaying a message (e.g., from messageOnStep or interaction result)
  | 'AWAITING_INTERACTION_PROMPT' // Player is near an interactive object, prompt shown (e.g., "Press Enter")
  | 'AWAITING_COMMAND_INPUT';   // Waiting for player to type a command

export interface PlayerState {
  position: { x: number; y: number };
  direction: PlayerDirection;
  inventory: ItemDefinition[];
  subState: PlayerSubState;
  messageLog: string[]; // For displaying messages to the player
  commandBuffer: string; // For command input
  activeInteraction?: InteractionProperties | null; // The interaction currently being prompted/processed
  interactionCell?: MapCell | null; // The cell being interacted with
}


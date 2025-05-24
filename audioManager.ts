
// audioManager.ts

export enum SfxType {
  APP_LAUNCH = 'SFX_01_APP_LAUNCH',
  UI_CLICK = 'SFX_02_UI_CLICK',
  UI_HOVER = 'SFX_03_UI_HOVER',
  POSITIVE_FEEDBACK = 'SFX_04_POSITIVE_FEEDBACK',
  NEGATIVE_FEEDBACK = 'SFX_05_NEGATIVE_FEEDBACK',
  // Add more specific sounds if needed
  GAME_START = 'SFX_GAME_START', // Could be same as APP_LAUNCH or different
}

const SFX_PATHS: Record<SfxType, string> = {
  [SfxType.APP_LAUNCH]: '/assets/sounds/sfx_01_app_launch.mp3',
  [SfxType.UI_CLICK]: '/assets/sounds/sfx_02_ui_click.mp3',
  [SfxType.UI_HOVER]: '/assets/sounds/sfx_03_ui_hover.mp3',
  [SfxType.POSITIVE_FEEDBACK]: '/assets/sounds/sfx_04_positive_feedback.mp3',
  [SfxType.NEGATIVE_FEEDBACK]: '/assets/sounds/sfx_05_negative_feedback.mp3',
  [SfxType.GAME_START]: '/assets/sounds/sfx_01_game_start.mp3', // Potentially a distinct sound
};

const activeAudioInstances: Record<SfxType, HTMLAudioElement | null> = {
  [SfxType.APP_LAUNCH]: null,
  [SfxType.UI_CLICK]: null,
  [SfxType.UI_HOVER]: null,
  [SfxType.POSITIVE_FEEDBACK]: null,
  [SfxType.NEGATIVE_FEEDBACK]: null,
  [SfxType.GAME_START]: null,
};

export const playSound = (sfx: SfxType): void => {
  try {
    // Stop and reset current instance if playing, to allow rapid re-triggering (e.g. fast clicks)
    if (activeAudioInstances[sfx]) {
      activeAudioInstances[sfx]!.pause();
      activeAudioInstances[sfx]!.currentTime = 0;
    }

    const audio = new Audio(SFX_PATHS[sfx]);
    activeAudioInstances[sfx] = audio;
    audio.play().catch(error => {
      // Autoplay was prevented or other error
      console.warn(`Could not play sound ${sfx}:`, error);
      // This is common if user hasn't interacted with the page yet.
      // We might want a global flag to enable sounds only after first user interaction.
    });
  } catch (error) {
    // console.error(`Error playing sound ${sfx}:`, error);
  }
};

export const preloadSound = (sfx: SfxType): void => {
  try {
    const audio = new Audio(SFX_PATHS[sfx]);
    audio.load(); // Prepares the audio file for playing
  } catch (error) {
    // console.error(`Error preloading sound ${sfx}:`, error);
  }
};

// Example: Preload common sounds (optional, call this early in your app)
export const preloadCommonSounds = (): void => {
  preloadSound(SfxType.UI_CLICK);
  preloadSound(SfxType.POSITIVE_FEEDBACK);
  preloadSound(SfxType.NEGATIVE_FEEDBACK);
};

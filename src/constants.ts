import type { WithSpringConfig } from 'react-native-reanimated';

export const DEFAULT_HEIGHT = 60;
export const DEFAULT_PADDING = 6;
export const DEFAULT_THRESHOLD = 0.9;
export const DEFAULT_RESET_DELAY = 1000;

/** Extra px around the thumb that still count as "grabbing the thumb". */
export const THUMB_GRAB_SLOP = 12;

/** Progress at which the title has fully faded out. */
export const TITLE_FADE_END = 0.6;

export const DEFAULT_SPRING: WithSpringConfig = {
  damping: 18,
  stiffness: 200,
  mass: 0.7,
};

export const COLORS = {
  track: '#E9EDF2',
  fill: '#2F6FED',
  thumb: '#FFFFFF',
  title: '#4A5568',
  icon: '#2F6FED',
} as const;

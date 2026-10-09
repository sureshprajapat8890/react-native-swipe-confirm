import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { Gesture } from 'react-native-gesture-handler';
import type { SharedValue, WithSpringConfig } from 'react-native-reanimated';

/**
 * The pan gesture builder handed to `gestureConfig`. Taken from `Gesture.Pan()`
 * so it tracks whichever Gesture Handler major version is installed.
 */
export type PanGestureBuilder = ReturnType<typeof Gesture.Pan>;

/** Direction the thumb travels to confirm. */
export type SwipeDirection = 'left-to-right' | 'right-to-left';

/**
 * Snapshot handed to every render prop. `progress`, `offset` and `maxOffset`
 * are Reanimated shared values, so children can animate on the UI thread
 * without re-rendering.
 */
export interface SwipeConfirmRenderState {
  /** Drag completion, 0 (start) to 1 (fully swiped). */
  progress: SharedValue<number>;
  /** Thumb travel in px, always positive regardless of `direction`. */
  offset: SharedValue<number>;
  /** Maximum thumb travel in px. 0 until the track has been measured. */
  maxOffset: SharedValue<number>;
  /** True once a swipe has been confirmed, until the slider is reset. */
  confirmed: boolean;
  /** True while a finger is down on the thumb. */
  dragging: boolean;
  disabled: boolean;
  direction: SwipeDirection;
}

/** Imperative handle exposed through `ref`. */
export interface SwipeConfirmRef {
  /** Send the thumb back to the start and clear the confirmed state. */
  reset: (animated?: boolean) => void;
  /** Drive the thumb to the end and fire `onSwipeSuccess`. */
  complete: (animated?: boolean) => void;
}

export interface SwipeConfirmProps {
  // ---------------------------------------------------------------- behaviour

  /** Fired once the thumb settles at the end of the track. */
  onSwipeSuccess?: () => void;
  /** Fired when the thumb is released before `threshold` and springs back. */
  onSwipeFail?: () => void;
  /** Fired when the user grabs the thumb. */
  onSwipeStart?: () => void;
  /** Fired when the user lets go, with the outcome of the gesture. */
  onSwipeEnd?: (confirmed: boolean) => void;
  /** Fired on every frame of the drag with progress from 0 to 1. */
  onProgress?: (progress: number) => void;
  /** Fired once each time the drag crosses `threshold`. Good place for haptics. */
  onThresholdReached?: () => void;

  /** Fraction of the track that must be covered to confirm. Default `0.9`. */
  threshold?: number;
  /** Blocks the gesture and dims the slider. Default `false`. */
  disabled?: boolean;
  /** Defaults to `right-to-left` in RTL locales, `left-to-right` otherwise. */
  direction?: SwipeDirection;
  /** Let the drag start anywhere on the track, not just on the thumb. Default `false`. */
  swipeFromAnywhere?: boolean;
  /** Automatically reset after a successful swipe. Default `false`. */
  resetAfterSuccess?: boolean;
  /** Delay in ms before the automatic reset. Default `1000`. */
  resetDelay?: number;
  /** Spring used for snap-back, completion and reset animations. */
  springConfig?: WithSpringConfig;
  /** Escape hatch to configure the underlying pan gesture (e.g. inside a ScrollView). */
  gestureConfig?: (gesture: PanGestureBuilder) => PanGestureBuilder;

  // ------------------------------------------------------------------- layout

  /** Track height in px. Default `60`. */
  height?: number;
  /** Track width. Defaults to filling the parent. */
  width?: number | `${number}%`;
  /** Inset between the track edge and the thumb. Default `6`. */
  padding?: number;
  /** Track corner radius. Defaults to a fully rounded pill. */
  borderRadius?: number;
  /** Thumb size in px. Defaults to `height - padding * 2`. */
  thumbSize?: number;
  /** Thumb corner radius. Defaults to a circle. */
  thumbBorderRadius?: number;

  // ------------------------------------------------------------------ colours

  /** Track background. Default `#E9EDF2`. */
  trackColor?: string;
  /** Colour of the bar that follows the thumb. Default `#2F6FED`. */
  fillColor?: string;
  /** Thumb background. Default `#FFFFFF`. */
  thumbColor?: string;
  /** Title colour. Default `#4A5568`. */
  titleColor?: string;
  /** Built-in arrow/check colour. Default `#2F6FED`. */
  iconColor?: string;

  // ------------------------------------------------------------------ content

  /** Label shown on the track. Default `'Swipe to confirm'`. */
  title?: ReactNode;
  /** Label shown after a successful swipe. Falls back to `title`. */
  confirmedTitle?: ReactNode;
  /** Replaces the built-in arrow inside the thumb. */
  icon?: ReactNode;
  /** Replaces the built-in check mark after a successful swipe. */
  confirmedIcon?: ReactNode;
  /** Fade the title out as the thumb advances. Default `true`. */
  fadeTitleOnProgress?: boolean;
  /** Draw the coloured bar behind the thumb. Default `true`. */
  showFill?: boolean;

  // ------------------------------------------------------------------- styles

  /** Style for the track. Overrides `height`, colours and radius. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Style for the bar that follows the thumb. */
  fillStyle?: StyleProp<ViewStyle>;
  /** Style for the thumb. */
  thumbStyle?: StyleProp<ViewStyle>;
  /** Style for the layer the title is centred in. */
  titleContainerStyle?: StyleProp<ViewStyle>;
  /** Style for the title text. Ignored when `title` is not a string. */
  titleStyle?: StyleProp<TextStyle>;

  // -------------------------------------------------------------- render prop

  /** Replaces the whole thumb. */
  renderThumb?: (state: SwipeConfirmRenderState) => ReactNode;
  /** Replaces the content inside the default thumb. */
  renderThumbIcon?: (state: SwipeConfirmRenderState) => ReactNode;
  /** Replaces the whole title layer. */
  renderTitle?: (state: SwipeConfirmRenderState) => ReactNode;
  /** Replaces the bar that follows the thumb. */
  renderFill?: (state: SwipeConfirmRenderState) => ReactNode;

  // ------------------------------------------------------------ accessibility

  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

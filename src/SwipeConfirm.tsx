import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  I18nManager,
  StyleSheet,
  Text,
  View,
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  type WithSpringConfig,
} from 'react-native-reanimated';

import { ArrowIcon, CheckIcon } from './components/Icons';
import {
  COLORS,
  DEFAULT_HEIGHT,
  DEFAULT_PADDING,
  DEFAULT_RESET_DELAY,
  DEFAULT_SPRING,
  DEFAULT_THRESHOLD,
  THUMB_GRAB_SLOP,
  TITLE_FADE_END,
} from './constants';
import type {
  SwipeConfirmProps,
  SwipeConfirmRef,
  SwipeConfirmRenderState,
} from './types';

function clampWorklet(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

export const SwipeConfirm = forwardRef<SwipeConfirmRef, SwipeConfirmProps>(
  function SwipeConfirm(props, ref) {
    const {
      onSwipeSuccess,
      onSwipeFail,
      onSwipeStart,
      onSwipeEnd,
      onProgress,
      onThresholdReached,
      threshold = DEFAULT_THRESHOLD,
      disabled = false,
      direction: directionProp,
      swipeFromAnywhere = false,
      resetAfterSuccess = false,
      resetDelay = DEFAULT_RESET_DELAY,
      springConfig,
      gestureConfig,
      height = DEFAULT_HEIGHT,
      width,
      padding = DEFAULT_PADDING,
      borderRadius,
      thumbSize: thumbSizeProp,
      thumbBorderRadius,
      trackColor = COLORS.track,
      fillColor = COLORS.fill,
      thumbColor = COLORS.thumb,
      titleColor = COLORS.title,
      iconColor = COLORS.icon,
      title = 'Swipe to confirm',
      confirmedTitle,
      icon,
      confirmedIcon,
      fadeTitleOnProgress = true,
      showFill = true,
      containerStyle,
      fillStyle,
      thumbStyle,
      titleContainerStyle,
      titleStyle,
      renderThumb,
      renderThumbIcon,
      renderTitle,
      renderFill,
      accessibilityLabel,
      accessibilityHint,
      testID = 'swipe-confirm',
    } = props;

    const direction =
      directionProp ?? (I18nManager.isRTL ? 'right-to-left' : 'left-to-right');
    const isReversed = direction === 'right-to-left';
    const thumbSize = thumbSizeProp ?? height - padding * 2;
    const trackRadius = borderRadius ?? height / 2;
    // The cast keeps TypeScript from widening the merge of two branches of
    // Reanimated's discriminated spring config union.
    const spring = useMemo(
      () => ({ ...DEFAULT_SPRING, ...springConfig }) as WithSpringConfig,
      [springConfig]
    );

    const [confirmed, setConfirmed] = useState(false);
    const [dragging, setDragging] = useState(false);

    /** Thumb travel in px, always positive; the sign is applied at render time. */
    const offset = useSharedValue(0);
    const maxOffset = useSharedValue(0);
    const trackWidth = useSharedValue(0);
    const gestureStart = useSharedValue(0);
    const grabbed = useSharedValue(false);
    const dragActive = useSharedValue(false);
    // Lets the progress reaction skip the JS hop when nobody is listening.
    const wantsProgress = useSharedValue(onProgress != null);
    useEffect(() => {
      wantsProgress.value = onProgress != null;
    }, [onProgress, wantsProgress]);

    const progress = useDerivedValue(() =>
      maxOffset.value > 0 ? offset.value / maxOffset.value : 0
    );

    // Handlers are read through a ref so the gesture never has to be rebuilt
    // when a parent re-renders with fresh inline callbacks.
    const handlers = useRef({
      onSwipeSuccess,
      onSwipeFail,
      onSwipeStart,
      onSwipeEnd,
      onProgress,
      onThresholdReached,
      resetAfterSuccess,
      resetDelay,
    });
    handlers.current = {
      onSwipeSuccess,
      onSwipeFail,
      onSwipeStart,
      onSwipeEnd,
      onProgress,
      onThresholdReached,
      resetAfterSuccess,
      resetDelay,
    };

    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearResetTimer = useCallback(() => {
      if (resetTimer.current != null) {
        clearTimeout(resetTimer.current);
        resetTimer.current = null;
      }
    }, []);
    useEffect(() => clearResetTimer, [clearResetTimer]);

    const springTo = useCallback(
      (target: number, animated: boolean, onDone?: () => void) => {
        if (!animated) {
          offset.value = target;
          onDone?.();
          return;
        }
        offset.value = withSpring(target, spring, (finished) => {
          'worklet';
          if (finished && onDone) {
            runOnJS(onDone)();
          }
        });
      },
      [offset, spring]
    );

    const handleReset = useCallback(
      (animated = true) => {
        clearResetTimer();
        setConfirmed(false);
        springTo(0, animated);
      },
      [clearResetTimer, springTo]
    );

    const handleSuccess = useCallback(() => {
      setConfirmed(true);
      handlers.current.onSwipeSuccess?.();
      if (handlers.current.resetAfterSuccess) {
        clearResetTimer();
        resetTimer.current = setTimeout(
          () => handleReset(true),
          handlers.current.resetDelay
        );
      }
    }, [clearResetTimer, handleReset]);

    const handleComplete = useCallback(
      (animated = true) => {
        clearResetTimer();
        springTo(maxOffset.value, animated, handleSuccess);
      },
      [clearResetTimer, handleSuccess, maxOffset, springTo]
    );

    const handleFail = useCallback(() => {
      handlers.current.onSwipeFail?.();
    }, []);

    const emitStart = useCallback(() => {
      setDragging(true);
      handlers.current.onSwipeStart?.();
    }, []);

    const emitEnd = useCallback((didConfirm: boolean) => {
      setDragging(false);
      handlers.current.onSwipeEnd?.(didConfirm);
    }, []);

    const emitProgress = useCallback((value: number) => {
      handlers.current.onProgress?.(value);
    }, []);

    const emitThreshold = useCallback(() => {
      handlers.current.onThresholdReached?.();
    }, []);

    useImperativeHandle(
      ref,
      () => ({ reset: handleReset, complete: handleComplete }),
      [handleReset, handleComplete]
    );

    useAnimatedReaction(
      () => (wantsProgress.value ? progress.value : -1),
      (current, previous) => {
        if (current >= 0 && current !== previous) {
          runOnJS(emitProgress)(current);
        }
      }
      // No dependency array: Reanimated rebuilds the worklet from its captures.
    );

    useAnimatedReaction(
      () => maxOffset.value > 0 && progress.value >= threshold,
      (current, previous) => {
        // `previous` is null on the reaction's first run, so test it loosely:
        // only a transition into the threshold should emit.
        if (current && !previous) {
          runOnJS(emitThreshold)();
        }
      }
      // No dependency array: Reanimated rebuilds the worklet from its captures.
    );

    const onLayout = useCallback(
      (event: LayoutChangeEvent) => {
        const measured = event.nativeEvent.layout.width;
        trackWidth.value = measured;
        const nextMax = Math.max(0, measured - padding * 2 - thumbSize);
        const previousMax = maxOffset.value;
        maxOffset.value = nextMax;
        // Keep the thumb pinned to the end if the track is re-measured
        // (rotation, split view) while it sits there.
        if (previousMax > 0 && offset.value >= previousMax) {
          offset.value = nextMax;
        } else {
          offset.value = Math.min(offset.value, nextMax);
        }
      },
      [maxOffset, offset, padding, thumbSize, trackWidth]
    );

    const gesture = useMemo(() => {
      const pan = Gesture.Pan()
        // Lets consumers drive the gesture from tests with
        // `getByGestureTestId(`${testID}-pan`)`.
        .withTestId(`${testID}-pan`)
        .enabled(!disabled)
        .minDistance(0)
        .shouldCancelWhenOutside(false)
        .onBegin((event) => {
          'worklet';
          // event.x is relative to the track's left edge; mirror it so the
          // maths below is identical for both directions.
          const localX = isReversed ? trackWidth.value - event.x : event.x;
          const thumbStart = padding + offset.value;
          const onThumb =
            localX >= thumbStart - THUMB_GRAB_SLOP &&
            localX <= thumbStart + thumbSize + THUMB_GRAB_SLOP;
          grabbed.value = swipeFromAnywhere || onThumb;
          if (grabbed.value && !onThumb) {
            offset.value = clampWorklet(
              localX - padding - thumbSize / 2,
              0,
              maxOffset.value
            );
          }
        })
        .onStart(() => {
          'worklet';
          if (!grabbed.value) {
            return;
          }
          dragActive.value = true;
          gestureStart.value = offset.value;
          runOnJS(emitStart)();
        })
        .onUpdate((event) => {
          'worklet';
          if (!grabbed.value) {
            return;
          }
          const travelled = isReversed
            ? -event.translationX
            : event.translationX;
          offset.value = clampWorklet(
            gestureStart.value + travelled,
            0,
            maxOffset.value
          );
        })
        .onEnd((_event, success) => {
          'worklet';
          // A cancelled gesture also lands here; onFinalize undoes that one.
          if (!dragActive.value || !success) {
            return;
          }
          const didConfirm =
            maxOffset.value > 0 && offset.value / maxOffset.value >= threshold;
          runOnJS(emitEnd)(didConfirm);
          offset.value = withSpring(
            didConfirm ? maxOffset.value : 0,
            spring,
            (finished) => {
              'worklet';
              if (!finished) {
                return;
              }
              runOnJS(didConfirm ? handleSuccess : handleFail)();
            }
          );
        })
        .onFinalize((_event, success) => {
          'worklet';
          const wasDragging = dragActive.value;
          grabbed.value = false;
          dragActive.value = false;
          // The gesture was cancelled mid-drag (a parent scroll view took
          // over, say), so onEnd never ran. Put the thumb back.
          if (wasDragging && !success) {
            runOnJS(emitEnd)(false);
            offset.value = withSpring(0, spring, (finished) => {
              'worklet';
              if (finished) {
                runOnJS(handleFail)();
              }
            });
          }
        });

      return gestureConfig ? gestureConfig(pan) : pan;
    }, [
      disabled,
      dragActive,
      emitEnd,
      emitStart,
      gestureConfig,
      gestureStart,
      grabbed,
      handleFail,
      handleSuccess,
      isReversed,
      maxOffset,
      offset,
      padding,
      spring,
      swipeFromAnywhere,
      testID,
      threshold,
      thumbSize,
      trackWidth,
    ]);

    const thumbAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: isReversed ? -offset.value : offset.value }],
    }));

    const fillAnimatedStyle = useAnimatedStyle(() => ({
      width: thumbSize + offset.value,
    }));

    const titleAnimatedStyle = useAnimatedStyle(() => ({
      opacity: fadeTitleOnProgress
        ? 1 - Math.min(1, progress.value / TITLE_FADE_END)
        : 1,
    }));

    const renderState: SwipeConfirmRenderState = {
      progress,
      offset,
      maxOffset,
      confirmed,
      dragging,
      disabled,
      direction,
    };

    const edge = isReversed ? { right: padding } : { left: padding };

    const thumbContent =
      renderThumbIcon?.(renderState) ??
      (confirmed
        ? (confirmedIcon ?? <CheckIcon size={thumbSize} color={iconColor} />)
        : (icon ?? (
            <View style={isReversed ? styles.mirrored : undefined}>
              <ArrowIcon size={thumbSize} color={iconColor} />
            </View>
          )));

    const activeTitle = confirmed ? (confirmedTitle ?? title) : title;

    return (
      <GestureDetector gesture={gesture}>
        <Animated.View
          testID={testID}
          onLayout={onLayout}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={
            accessibilityLabel ??
            (typeof activeTitle === 'string' ? activeTitle : 'Swipe to confirm')
          }
          accessibilityHint={
            accessibilityHint ?? 'Double tap and hold, then swipe to confirm'
          }
          accessibilityState={{ disabled, checked: confirmed }}
          accessibilityValue={{ min: 0, max: 100, now: confirmed ? 100 : 0 }}
          accessibilityActions={[
            { name: 'activate', label: 'Confirm' },
            { name: 'increment', label: 'Confirm' },
            { name: 'decrement', label: 'Reset' },
          ]}
          onAccessibilityAction={(event: AccessibilityActionEvent) => {
            if (disabled) {
              return;
            }
            if (event.nativeEvent.actionName === 'decrement') {
              handleReset();
            } else {
              handleComplete();
            }
          }}
          style={[
            styles.track,
            {
              height,
              // Spread conditionally: an explicit `undefined` would clobber
              // the `width: '100%'` default when flattened.
              ...(width !== undefined ? { width } : null),
              padding,
              borderRadius: trackRadius,
              backgroundColor: trackColor,
              opacity: disabled ? 0.5 : 1,
            },
            containerStyle,
          ]}
        >
          {renderFill
            ? renderFill(renderState)
            : showFill && (
                <Animated.View
                  testID={`${testID}-fill`}
                  pointerEvents="none"
                  style={[
                    styles.fill,
                    edge,
                    {
                      top: padding,
                      bottom: padding,
                      borderRadius: thumbBorderRadius ?? thumbSize / 2,
                      backgroundColor: fillColor,
                    },
                    fillAnimatedStyle,
                    fillStyle,
                  ]}
                />
              )}

          {renderTitle ? (
            renderTitle(renderState)
          ) : (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.titleContainer,
                { paddingHorizontal: thumbSize + padding },
                titleAnimatedStyle,
                titleContainerStyle,
              ]}
            >
              {typeof activeTitle === 'string' ? (
                <Text
                  testID={`${testID}-title`}
                  numberOfLines={1}
                  style={[styles.title, { color: titleColor }, titleStyle]}
                >
                  {activeTitle}
                </Text>
              ) : (
                activeTitle
              )}
            </Animated.View>
          )}

          {renderThumb ? (
            <Animated.View
              testID={`${testID}-thumb`}
              style={[styles.thumb, edge, { top: padding }, thumbAnimatedStyle]}
            >
              {renderThumb(renderState)}
            </Animated.View>
          ) : (
            <Animated.View
              testID={`${testID}-thumb`}
              style={[
                styles.thumb,
                edge,
                {
                  top: padding,
                  width: thumbSize,
                  height: thumbSize,
                  borderRadius: thumbBorderRadius ?? thumbSize / 2,
                  backgroundColor: thumbColor,
                },
                thumbAnimatedStyle,
                thumbStyle,
              ]}
            >
              {thumbContent}
            </Animated.View>
          )}
        </Animated.View>
      </GestureDetector>
    );
  }
);

const styles = StyleSheet.create({
  track: {
    width: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
  },
  titleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  thumb: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
});

export default SwipeConfirm;

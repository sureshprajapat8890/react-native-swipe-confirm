import { createRef } from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  fireGestureHandler,
  getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';

import { SwipeConfirm } from '../SwipeConfirm';
import type { SwipeConfirmProps, SwipeConfirmRef } from '../types';

const TRACK_WIDTH = 300;
const HEIGHT = 60;
const PADDING = 6;
const THUMB = HEIGHT - PADDING * 2;
/** 300 - 12 - 48 = 240px of travel. */
const MAX_OFFSET = TRACK_WIDTH - PADDING * 2 - THUMB;

/** The thumb cannot move until the track has measured itself. */
async function layout(element: TestInstance) {
  await fireEvent(element, 'layout', {
    nativeEvent: { layout: { width: TRACK_WIDTH, height: HEIGHT, x: 0, y: 0 } },
  });
}

/** Grabs the thumb at rest and drags it `distance` px along the track. */
async function swipe(distance: number, startX = PADDING + THUMB / 2) {
  await act(async () => {
    fireGestureHandler(getByGestureTestId('swipe-confirm-pan'), [
      { state: 2, x: startX, translationX: 0 },
      { state: 4, translationX: distance * 0.5 },
      { state: 4, translationX: distance },
      { state: 5, translationX: distance },
    ]);
  });
}

type SliderProps = SwipeConfirmProps & { ref?: React.Ref<SwipeConfirmRef> };

async function setup(props: SliderProps = {}) {
  const utils = await render(
    <SwipeConfirm height={HEIGHT} padding={PADDING} {...props} />,
    // Gesture Handler v3 refuses to mount a detector outside a root view.
    { wrapper: GestureHandlerRootView }
  );
  await layout(utils.getByTestId(props.testID ?? 'swipe-confirm'));
  return utils;
}

describe('SwipeConfirm', () => {
  it('renders the default title, thumb and fill', async () => {
    const { getByTestId, getByText } = await setup();

    expect(getByText('Swipe to confirm')).toBeTruthy();
    expect(getByTestId('swipe-confirm-thumb')).toBeTruthy();
    expect(getByTestId('swipe-confirm-fill')).toBeTruthy();
  });

  it('confirms when the thumb is dragged past the threshold', async () => {
    const onSwipeSuccess = jest.fn();
    const onSwipeEnd = jest.fn();
    await setup({ onSwipeSuccess, onSwipeEnd });

    await swipe(MAX_OFFSET);

    expect(onSwipeEnd).toHaveBeenCalledWith(true);
    await waitFor(() => expect(onSwipeSuccess).toHaveBeenCalledTimes(1));
  });

  it('springs back and reports a failure when released early', async () => {
    const onSwipeSuccess = jest.fn();
    const onSwipeFail = jest.fn();
    const onSwipeEnd = jest.fn();
    await setup({ onSwipeSuccess, onSwipeFail, onSwipeEnd });

    await swipe(MAX_OFFSET * 0.3);

    expect(onSwipeEnd).toHaveBeenCalledWith(false);
    await waitFor(() => expect(onSwipeFail).toHaveBeenCalledTimes(1));
    expect(onSwipeSuccess).not.toHaveBeenCalled();
  });

  it('returns the thumb when the gesture is cancelled mid-drag', async () => {
    const onSwipeFail = jest.fn();
    const onSwipeEnd = jest.fn();
    const onSwipeSuccess = jest.fn();
    await setup({ onSwipeFail, onSwipeEnd, onSwipeSuccess });

    await act(async () => {
      fireGestureHandler(getByGestureTestId('swipe-confirm-pan'), [
        { state: 2, x: PADDING + THUMB / 2, translationX: 0 },
        { state: 4, translationX: MAX_OFFSET },
        // 3 is CANCELLED: a parent handler took the gesture over.
        { state: 3, translationX: MAX_OFFSET },
      ]);
    });

    expect(onSwipeEnd).toHaveBeenCalledWith(false);
    await waitFor(() => expect(onSwipeFail).toHaveBeenCalledTimes(1));
    expect(onSwipeSuccess).not.toHaveBeenCalled();
  });

  it('honours a custom threshold', async () => {
    const onSwipeSuccess = jest.fn();
    await setup({ threshold: 0.4, onSwipeSuccess });

    await swipe(MAX_OFFSET * 0.5);

    await waitFor(() => expect(onSwipeSuccess).toHaveBeenCalledTimes(1));
  });

  it('reports the start of a gesture and live progress', async () => {
    const onSwipeStart = jest.fn();
    const onProgress = jest.fn();
    await setup({ onSwipeStart, onProgress });

    await swipe(MAX_OFFSET);

    expect(onSwipeStart).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onProgress).toHaveBeenCalled());
    const values = onProgress.mock.calls.map(([value]) => value as number);
    expect(values.every((value) => value >= 0 && value <= 1)).toBe(true);
  });

  it('fires onThresholdReached once per crossing', async () => {
    const onThresholdReached = jest.fn();
    await setup({ onThresholdReached });

    await swipe(MAX_OFFSET);

    await waitFor(() => expect(onThresholdReached).toHaveBeenCalledTimes(1));
  });

  it('swaps in the confirmed title after a successful swipe', async () => {
    const { getByText } = await setup({
      title: 'Slide to pay',
      confirmedTitle: 'Paid',
    });

    await swipe(MAX_OFFSET);

    await waitFor(() => expect(getByText('Paid')).toBeTruthy());
  });

  it('ignores gestures while disabled', async () => {
    const onSwipeSuccess = jest.fn();
    const onSwipeStart = jest.fn();
    await setup({ disabled: true, onSwipeSuccess, onSwipeStart });

    await swipe(MAX_OFFSET);

    expect(onSwipeStart).not.toHaveBeenCalled();
    expect(onSwipeSuccess).not.toHaveBeenCalled();
  });

  it('ignores drags that do not start on the thumb', async () => {
    const onSwipeStart = jest.fn();
    await setup({ onSwipeStart });

    await swipe(-100, TRACK_WIDTH - 20);

    expect(onSwipeStart).not.toHaveBeenCalled();
  });

  it('accepts drags anywhere on the track with swipeFromAnywhere', async () => {
    const onSwipeStart = jest.fn();
    await setup({ swipeFromAnywhere: true, onSwipeStart });

    await swipe(20, TRACK_WIDTH / 2);

    expect(onSwipeStart).toHaveBeenCalledTimes(1);
  });

  it('confirms a right-to-left slider when dragged the other way', async () => {
    const onSwipeSuccess = jest.fn();
    await setup({ direction: 'right-to-left', onSwipeSuccess });

    await swipe(-MAX_OFFSET, TRACK_WIDTH - PADDING - THUMB / 2);

    await waitFor(() => expect(onSwipeSuccess).toHaveBeenCalledTimes(1));
  });

  it('completes and resets through the ref', async () => {
    const onSwipeSuccess = jest.fn();
    const ref = createRef<SwipeConfirmRef>();
    const { getByText } = await setup({
      ref,
      title: 'Hold',
      confirmedTitle: 'Released',
      onSwipeSuccess,
    });

    await act(async () => ref.current?.complete(false));
    await waitFor(() => expect(getByText('Released')).toBeTruthy());
    expect(onSwipeSuccess).toHaveBeenCalledTimes(1);

    await act(async () => ref.current?.reset(false));
    await waitFor(() => expect(getByText('Hold')).toBeTruthy());
  });

  it('resets itself after a success when resetAfterSuccess is set', async () => {
    const { getByText } = await setup({
      title: 'Again',
      confirmedTitle: 'Done',
      resetAfterSuccess: true,
      resetDelay: 10,
    });

    await swipe(MAX_OFFSET);

    await waitFor(() => expect(getByText('Done')).toBeTruthy());
    await waitFor(() => expect(getByText('Again')).toBeTruthy());
  });

  it('confirms from an accessibility action', async () => {
    const onSwipeSuccess = jest.fn();
    const { getByTestId } = await setup({ onSwipeSuccess });

    await fireEvent(getByTestId('swipe-confirm'), 'accessibilityAction', {
      nativeEvent: { actionName: 'activate' },
    });

    await waitFor(() => expect(onSwipeSuccess).toHaveBeenCalledTimes(1));
  });

  it('does not react to accessibility actions while disabled', async () => {
    const onSwipeSuccess = jest.fn();
    const { getByTestId } = await setup({ disabled: true, onSwipeSuccess });

    await fireEvent(getByTestId('swipe-confirm'), 'accessibilityAction', {
      nativeEvent: { actionName: 'activate' },
    });

    expect(onSwipeSuccess).not.toHaveBeenCalled();
  });

  it('uses render props in place of the built-in layers', async () => {
    const { getByText, queryByTestId } = await setup({
      renderThumb: () => <Text>custom-thumb</Text>,
      renderTitle: () => <Text>custom-title</Text>,
      renderFill: () => <Text>custom-fill</Text>,
    });

    expect(getByText('custom-thumb')).toBeTruthy();
    expect(getByText('custom-title')).toBeTruthy();
    expect(getByText('custom-fill')).toBeTruthy();
    expect(queryByTestId('swipe-confirm-fill')).toBeNull();
  });

  it('hides the fill when showFill is false', async () => {
    const { queryByTestId } = await setup({ showFill: false });

    expect(queryByTestId('swipe-confirm-fill')).toBeNull();
  });

  it('scopes test IDs to a custom testID', async () => {
    const { getByTestId } = await setup({ testID: 'pay-slider' });

    expect(getByTestId('pay-slider')).toBeTruthy();
    expect(getByTestId('pay-slider-thumb')).toBeTruthy();
  });
});

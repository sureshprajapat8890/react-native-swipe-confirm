# react-native-swipe-confirm

A swipe-to-confirm ("slide to unlock", "swipe to pay") button for React Native, built on
[Reanimated](https://docs.swmansion.com/react-native-reanimated/) and
[Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/). The drag runs
entirely on the UI thread, so it stays smooth while your JavaScript thread is busy.

Every layer — track, fill, thumb, icon and title — is styleable, and each one can be replaced
outright with a render prop.

- Zero runtime dependencies beyond the two peer libraries you already have
- TypeScript types for every prop, plus an imperative `reset()` / `complete()` handle
- Left-to-right and right-to-left, with automatic RTL locale support
- `accessibilityRole="adjustable"` with actions, so screen-reader users can confirm too
- Works on iOS, Android and Expo (old and new architecture)

## Installation

```sh
npm install @lazydev/react-native-swipe-confirm
```

The package declares these as peer dependencies — install them if your app does not have them
already:

```sh
npx expo install react-native-reanimated react-native-gesture-handler
# or, in a bare React Native app:
npm install react-native-reanimated react-native-gesture-handler
```

Both Gesture Handler 2.x and 3.x work; this package is exercised against Reanimated 4.5–4.7 with
Gesture Handler 2.32 and 3.3.

Follow Reanimated's [installation guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started)
(it needs a Babel plugin) and wrap your app once in `GestureHandlerRootView`:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* ... */}
    </GestureHandlerRootView>
  );
}
```

## Usage

```tsx
import { SwipeConfirm } from '@lazydev/react-native-swipe-confirm';

export function Checkout() {
  return <SwipeConfirm title="Slide to pay" onSwipeSuccess={placeOrder} />;
}
```

That is the whole API for the common case. Everything below is optional.

### Styled

```tsx
<SwipeConfirm
  title="Slide to pay $42.00"
  confirmedTitle="Payment sent"
  height={64}
  trackColor="#101828"
  fillColor="#12B76A"
  thumbColor="#FFFFFF"
  titleColor="#F2F4F7"
  iconColor="#12B76A"
  resetAfterSuccess
  resetDelay={1200}
  onSwipeSuccess={placeOrder}
/>
```

### Haptics on the threshold

`onThresholdReached` fires once each time the drag crosses the confirmation point — the natural
moment for a tap of feedback.

```tsx
import * as Haptics from 'expo-haptics';

<SwipeConfirm
  onThresholdReached={() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }
  onSwipeSuccess={() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }
/>;
```

### Imperative control

```tsx
const slider = useRef<SwipeConfirmRef>(null);

<SwipeConfirm ref={slider} onSwipeSuccess={submit} />;

// Later — after a failed request, for example:
slider.current?.reset();
```

### Inside a ScrollView

By default the slider claims the touch immediately. Inside a scrollable parent, ask the gesture
to wait until the drag is clearly horizontal:

```tsx
<SwipeConfirm
  gestureConfig={(gesture) =>
    gesture.activeOffsetX([-10, 10]).failOffsetY([-12, 12])
  }
/>
```

### Replacing a layer

Render props receive the live [shared values](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/glossary#shared-value),
so custom layers can animate on the UI thread without re-rendering. A custom thumb still travels
according to the `thumbSize` prop, so set that to your thumb's real width.

```tsx
<SwipeConfirm
  renderThumb={({ confirmed, dragging }) => (
    <View style={[styles.thumb, confirmed && styles.thumbDone]}>
      <Icon
        name={
          confirmed ? 'check' : dragging ? 'chevrons-right' : 'chevron-right'
        }
      />
    </View>
  )}
  renderTitle={({ progress }) => <FadingLabel progress={progress} />}
/>
```

```tsx
function FadingLabel({ progress }: { progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.center, style]}>
      <Text>Unlock the vault</Text>
    </Animated.View>
  );
}
```

## Props

### Behaviour

| Prop                 | Type                                          | Default       | Description                                                          |
| -------------------- | --------------------------------------------- | ------------- | -------------------------------------------------------------------- |
| `onSwipeSuccess`     | `() => void`                                  | —             | Fired once the thumb settles at the end of the track.                |
| `onSwipeFail`        | `() => void`                                  | —             | Fired when the thumb is released early and springs back.             |
| `onSwipeStart`       | `() => void`                                  | —             | Fired when the user grabs the thumb.                                 |
| `onSwipeEnd`         | `(confirmed: boolean) => void`                | —             | Fired when the user lets go, before the settle animation finishes.   |
| `onProgress`         | `(progress: number) => void`                  | —             | Fired on every frame of the drag with a value from `0` to `1`.       |
| `onThresholdReached` | `() => void`                                  | —             | Fired once per crossing of `threshold`. Use it for haptics.          |
| `threshold`          | `number`                                      | `0.9`         | Fraction of the track that must be covered to confirm.               |
| `disabled`           | `boolean`                                     | `false`       | Blocks the gesture and dims the track.                               |
| `direction`          | `'left-to-right' \| 'right-to-left'`          | RTL-aware     | Defaults to `right-to-left` when `I18nManager.isRTL` is set.         |
| `swipeFromAnywhere`  | `boolean`                                     | `false`       | Start the drag anywhere on the track; the thumb jumps to the finger. |
| `resetAfterSuccess`  | `boolean`                                     | `false`       | Slide back to the start after a successful swipe.                    |
| `resetDelay`         | `number`                                      | `1000`        | Delay in ms before that automatic reset.                             |
| `springConfig`       | `WithSpringConfig`                            | damped spring | Spring used for snap-back, completion and reset.                     |
| `gestureConfig`      | `(g: PanGestureBuilder) => PanGestureBuilder` | —             | Escape hatch to configure the underlying pan gesture.                |

### Layout

| Prop                | Type                     | Default              | Description                         |
| ------------------- | ------------------------ | -------------------- | ----------------------------------- |
| `height`            | `number`                 | `60`                 | Track height in px.                 |
| `width`             | `number \| '${number}%'` | fills the parent     | Track width.                        |
| `padding`           | `number`                 | `6`                  | Inset between track edge and thumb. |
| `borderRadius`      | `number`                 | `height / 2`         | Track corner radius.                |
| `thumbSize`         | `number`                 | `height - padding*2` | Thumb size in px.                   |
| `thumbBorderRadius` | `number`                 | `thumbSize / 2`      | Thumb corner radius.                |

### Appearance

| Prop                  | Type        | Default               | Description                               |
| --------------------- | ----------- | --------------------- | ----------------------------------------- |
| `trackColor`          | `string`    | `#E9EDF2`             | Track background.                         |
| `fillColor`           | `string`    | `#2F6FED`             | Bar that follows the thumb.               |
| `thumbColor`          | `string`    | `#FFFFFF`             | Thumb background.                         |
| `titleColor`          | `string`    | `#4A5568`             | Title colour.                             |
| `iconColor`           | `string`    | `#2F6FED`             | Built-in arrow and check colour.          |
| `title`               | `ReactNode` | `'Swipe to confirm'`  | Label on the track.                       |
| `confirmedTitle`      | `ReactNode` | falls back to `title` | Label after a successful swipe.           |
| `icon`                | `ReactNode` | arrow                 | Replaces the arrow in the thumb.          |
| `confirmedIcon`       | `ReactNode` | check mark            | Replaces the check mark after success.    |
| `fadeTitleOnProgress` | `boolean`   | `true`                | Fade the title out as the thumb advances. |
| `showFill`            | `boolean`   | `true`                | Draw the coloured bar behind the thumb.   |

### Styles and render props

| Prop                                                               | Type                                            |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| `containerStyle`, `fillStyle`, `thumbStyle`, `titleContainerStyle` | `StyleProp<ViewStyle>`                          |
| `titleStyle`                                                       | `StyleProp<TextStyle>`                          |
| `renderThumb`, `renderThumbIcon`, `renderTitle`, `renderFill`      | `(state: SwipeConfirmRenderState) => ReactNode` |

`SwipeConfirmRenderState` carries `progress`, `offset` and `maxOffset` (Reanimated shared values)
plus `confirmed`, `dragging`, `disabled` and `direction`.

### Accessibility

| Prop                 | Type     | Default                                        |
| -------------------- | -------- | ---------------------------------------------- |
| `accessibilityLabel` | `string` | the current title                              |
| `accessibilityHint`  | `string` | `'Double tap and hold, then swipe to confirm'` |
| `testID`             | `string` | `'swipe-confirm'`                              |

The track is exposed as an `adjustable` element with `activate`, `increment` and `decrement`
actions, so VoiceOver and TalkBack users can confirm without performing the drag.

### Ref

```ts
interface SwipeConfirmRef {
  reset: (animated?: boolean) => void;
  complete: (animated?: boolean) => void;
}
```

`complete()` runs the confirmation animation and fires `onSwipeSuccess`, exactly as a real swipe
would.

## Testing

The component sets a gesture test ID of `` `${testID}-pan` ``, so you can drive it from Jest with
Gesture Handler's test utilities:

```tsx
import {
  fireGestureHandler,
  getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';

fireGestureHandler(getByGestureTestId('swipe-confirm-pan'), [
  { state: 2, x: 30, translationX: 0 },
  { state: 4, translationX: 240 },
  { state: 5, translationX: 240 },
]);
```

Fire a `layout` event on the track first — the thumb cannot move until the component has measured
itself — and render inside a `GestureHandlerRootView`, which Gesture Handler v3 requires. See
[`src/__tests__/SwipeConfirm.test.tsx`](src/__tests__/SwipeConfirm.test.tsx) together with
[`jest.setup.js`](jest.setup.js) for a complete setup.

## Troubleshooting

**Nothing moves when I drag.** The track has not been measured, or the component is not under a
`GestureHandlerRootView`. Check both.

**The gesture fights with a parent ScrollView.** Use `gestureConfig` with `activeOffsetX`, as
shown above.

**`Reanimated failed to create a worklet`.** The Reanimated Babel plugin is missing from your
app's `babel.config.js`. It must be the last entry in `plugins`.

## Example app

```sh
cd example
npm install
npm start
```

The example resolves the library straight from `../src`, so changes hot-reload.

## Contributing

```sh
npm install      # then:
npm test         # jest
npm run typecheck
npm run lint
npm run build    # bob build -> lib/
```

## Publishing

This package ships under a placeholder name. Before your first publish:

```sh
node scripts/rename.js @your-npm-user/react-native-swipe-confirm your-github-user/your-repo
```

Then set `author` in `package.json`, update the copyright line in `LICENSE`, and run:

```sh
npm login
npm publish     # prepublishOnly runs typecheck, tests and the build
```

## License

MIT

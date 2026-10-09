import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  SwipeConfirm,
  type SwipeConfirmRef,
} from '@sureshprajapat8890/react-native-swipe-confirm';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
      {children}
    </View>
  );
}

function Demo() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const [log, setLog] = useState('Nothing confirmed yet');
  const [progress, setProgress] = useState(0);
  const ref = useRef<SwipeConfirmRef>(null);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 48 },
      ]}
    >
      <Text style={styles.heading}>react-native-swipe-confirm</Text>
      <Text style={styles.status}>{log}</Text>

      <Section title="Default" description="Zero configuration.">
        <SwipeConfirm onSwipeSuccess={() => setLog('Default: confirmed')} />
      </Section>

      <Section
        title="Branded"
        description="Colours, copy and an automatic reset one second later."
      >
        <SwipeConfirm
          title="Slide to pay $42.00"
          confirmedTitle="Payment sent"
          trackColor="#101828"
          fillColor="#12B76A"
          thumbColor="#FFFFFF"
          titleColor="#F2F4F7"
          iconColor="#12B76A"
          height={64}
          resetAfterSuccess
          resetDelay={1200}
          onSwipeSuccess={() => setLog('Branded: payment sent')}
        />
      </Section>

      <Section
        title="Right to left"
        description="Swipe the other way, square corners, no fill."
      >
        <SwipeConfirm
          direction="right-to-left"
          title="Slide left to cancel"
          confirmedTitle="Cancelled"
          showFill={false}
          borderRadius={12}
          thumbBorderRadius={8}
          trackColor="#FEE4E2"
          thumbColor="#D92D20"
          iconColor="#FFFFFF"
          titleColor="#912018"
          onSwipeSuccess={() => setLog('RTL: cancelled')}
        />
      </Section>

      <Section
        title="Swipe from anywhere"
        description="The thumb jumps to your finger, with a lower threshold."
      >
        <SwipeConfirm
          swipeFromAnywhere
          threshold={0.75}
          title="Grab anywhere"
          trackColor="#EEF4FF"
          fillColor="#6172F3"
          iconColor="#6172F3"
          onSwipeSuccess={() => setLog('Anywhere: confirmed')}
        />
      </Section>

      <Section
        title="Live progress"
        description={`onProgress fires on every frame — currently ${Math.round(
          progress * 100
        )}%`}
      >
        <SwipeConfirm
          title="Hold and drag me"
          fadeTitleOnProgress={false}
          onProgress={setProgress}
          onThresholdReached={() => setLog('Threshold crossed (haptics here)')}
          onSwipeFail={() => setLog('Released too early')}
          onSwipeSuccess={() => setLog('Progress demo: confirmed')}
        />
      </Section>

      <Section
        title="Fully custom"
        description="Render props replace the thumb, the fill and the title."
      >
        <CustomSlider onDone={() => setLog('Custom: unlocked')} />
      </Section>

      <Section
        title="Imperative control"
        description="complete() and reset() through a ref."
      >
        <SwipeConfirm
          ref={ref}
          title="Driven from the buttons"
          confirmedTitle="Done"
          onSwipeSuccess={() => setLog('Imperative: confirmed')}
        />
        <View style={styles.row}>
          <Pressable
            style={styles.button}
            onPress={() => ref.current?.complete()}
          >
            <Text style={styles.buttonText}>complete()</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => ref.current?.reset()}>
            <Text style={styles.buttonText}>reset()</Text>
          </Pressable>
        </View>
      </Section>

      <Section title="Disabled" description="Gesture off, track dimmed.">
        <SwipeConfirm disabled title="Not available" />
      </Section>

      {/* <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} /> */}
    </ScrollView>
  );
}

/** Shows how far the render props can be taken: every layer is replaced. */
function CustomSlider({ onDone }: { onDone: () => void }) {
  return (
    <SwipeConfirm
      height={72}
      padding={8}
      borderRadius={20}
      trackColor="#1D2939"
      threshold={0.85}
      onSwipeSuccess={onDone}
      renderFill={(state) => <Bars progress={state.progress} />}
      renderThumb={(state) => (
        <View
          style={[
            styles.customThumb,
            state.confirmed && styles.customThumbDone,
          ]}
        >
          <Image source={require('./assets/arrow-right.png')} style={{width: 40, height: 40}} />
          {/* <Text style={styles.customThumbText}>
            {state.confirmed ? 'OK' : state.dragging ? '>>' : '->'}
          </Text> */}
        </View>
      )}
      renderTitle={(state) => <FloatingTitle progress={state.progress} />}
    />
  );
}

function Bars({ progress }: { progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: 0.25 + progress.value * 0.75,
    transform: [{ scaleX: 0.2 + progress.value * 0.8 }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.bars, style]} />;
}

function FloatingTitle({ progress }: { progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ translateX: progress.value * 40 }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.customTitle, style]}>
      <Text style={styles.customTitleText}>Unlock the vault</Text>
    </Animated.View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Demo />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingHorizontal: 20, gap: 28 },
  heading: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  status: {
    fontSize: 14,
    color: '#475569',
    backgroundColor: '#E2E8F0',
    padding: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  sectionDescription: { fontSize: 13, color: '#64748B' },
  row: { flexDirection: 'row', gap: 12, marginTop: 4 },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
  customThumb: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
  },
  customThumbDone: { backgroundColor: '#12B76A' },
  customThumbText: { color: '#1D2939', fontWeight: '800', fontSize: 16 },
  bars: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 8,
    bottom: 8,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
  },
  customTitle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTitleText: { color: '#E4E7EC', fontWeight: '700', letterSpacing: 0.5 },
});

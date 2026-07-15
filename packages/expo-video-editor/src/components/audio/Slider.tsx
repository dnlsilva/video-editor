import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useTheme } from '../../theme';

const THUMB = 18;

/** Minimal 0..1 slider (avoids a slider dependency). */
export function Slider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const theme = useTheme();
  const [w, setW] = useState(0);
  const x = useSharedValue(0);
  const start = useSharedValue(0);

  useEffect(() => {
    if (w > 0) x.value = Math.max(0, Math.min(1, value)) * w;
  }, [value, w, x]);

  const commit = (px: number) => {
    if (w > 0) onChange(Math.max(0, Math.min(1, px / w)));
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      start.value = x.value;
    })
    .onUpdate((e) => {
      x.value = Math.max(0, Math.min(w, start.value + e.translationX));
      runOnJS(commit)(x.value);
    })
    .onEnd(() => runOnJS(commit)(x.value));

  const fill = useAnimatedStyle(() => ({ width: x.value }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value - THUMB / 2 }] }));

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.track} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <View style={styles.bg} />
        <Animated.View style={[styles.fill, { backgroundColor: theme.accent }, fill]} />
        <Animated.View style={[styles.thumb, { backgroundColor: theme.accent }, thumb]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: { height: THUMB + 12, justifyContent: 'center' },
  bg: { position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  fill: { position: 'absolute', left: 0, height: 4, borderRadius: 2 },
  thumb: { width: THUMB, height: THUMB, borderRadius: THUMB / 2 },
});

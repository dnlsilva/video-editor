import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useEditorStore } from '../../state/store';
import { useTheme } from '../../theme';
import { ThumbnailStrip } from './ThumbnailStrip';

const HANDLE_W = 22;
const TRACK_H = 60;
const MIN_GAP_S = 0.5;

/**
 * Trim bar: thumbnail strip + two draggable handles + playhead.
 * Handle positions live in Reanimated shared values (UI thread) during a drag and
 * commit to the store on release, so a drag never re-renders React (perf rule #3).
 */
export function TrimTimeline() {
  const uri = useEditorStore((s) => s.source.uri);
  const duration = useEditorStore((s) => s.meta?.duration ?? 0);
  const trimStart = useEditorStore((s) => s.trim.start);
  const trimEnd = useEditorStore((s) => s.trim.end);
  const setTrim = useEditorStore((s) => s.setTrim);
  const requestSeek = useEditorStore((s) => s.requestSeek);
  const theme = useTheme();

  const [w, setW] = useState(0);
  const startX = useSharedValue(0);
  const endX = useSharedValue(0);
  const baseStart = useSharedValue(0);
  const baseEnd = useSharedValue(0);
  const draggingRef = useRef(false);

  const pxPerSec = duration > 0 && w > 0 ? w / duration : 0;
  const minGapPx = MIN_GAP_S * pxPerSec;

  // Sync handles from the store while not dragging (e.g. initial full-clip window).
  useEffect(() => {
    if (draggingRef.current || pxPerSec === 0) return;
    startX.value = trimStart * pxPerSec;
    endX.value = trimEnd * pxPerSec;
  }, [trimStart, trimEnd, pxPerSec, startX, endX]);

  const setDragging = (v: boolean) => {
    draggingRef.current = v;
  };
  const commit = () => {
    if (pxPerSec > 0) setTrim(startX.value / pxPerSec, endX.value / pxPerSec);
  };
  // ponytail: live scrub-seek on every frame; if native seek proves heavy, throttle here.
  const seekToPx = (px: number) => {
    if (pxPerSec > 0) requestSeek(px / pxPerSec);
  };

  const startPan = Gesture.Pan()
    .onStart(() => {
      baseStart.value = startX.value;
      runOnJS(setDragging)(true);
    })
    .onUpdate((e) => {
      let x = baseStart.value + e.translationX;
      x = Math.max(0, Math.min(x, endX.value - minGapPx));
      startX.value = x;
      runOnJS(seekToPx)(x);
    })
    .onEnd(() => {
      runOnJS(commit)();
      runOnJS(setDragging)(false);
    });

  const endPan = Gesture.Pan()
    .onStart(() => {
      baseEnd.value = endX.value;
      runOnJS(setDragging)(true);
    })
    .onUpdate((e) => {
      let x = baseEnd.value + e.translationX;
      x = Math.min(w, Math.max(x, startX.value + minGapPx));
      endX.value = x;
      runOnJS(seekToPx)(x);
    })
    .onEnd(() => {
      runOnJS(commit)();
      runOnJS(setDragging)(false);
    });

  const selStyle = useAnimatedStyle(() => ({
    left: startX.value,
    width: Math.max(0, endX.value - startX.value),
  }));
  const leftHandleStyle = useAnimatedStyle(() => ({ left: startX.value - HANDLE_W }));
  const rightHandleStyle = useAnimatedStyle(() => ({ left: endX.value }));
  const leftDimStyle = useAnimatedStyle(() => ({ left: 0, width: startX.value }));
  const rightDimStyle = useAnimatedStyle(() => ({ left: endX.value, width: Math.max(0, w - endX.value) }));

  return (
    <View style={[styles.track, { height: TRACK_H }]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <ThumbnailStrip uri={uri} duration={duration} />

      <Animated.View style={[styles.dim, leftDimStyle]} pointerEvents="none" />
      <Animated.View style={[styles.dim, rightDimStyle]} pointerEvents="none" />

      <Animated.View style={[styles.selection, { borderColor: theme.accent }, selStyle]} pointerEvents="none" />

      <Playhead duration={duration} width={w} />

      <GestureDetector gesture={startPan}>
        <Animated.View style={[styles.handle, { backgroundColor: theme.accent }, leftHandleStyle]}>
          <View style={styles.grip} />
        </Animated.View>
      </GestureDetector>
      <GestureDetector gesture={endPan}>
        <Animated.View style={[styles.handle, { backgroundColor: theme.accent }, rightHandleStyle]}>
          <View style={styles.grip} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/** Isolated so playhead re-renders never touch the gesture-holding parent. */
function Playhead({ duration, width }: { duration: number; width: number }) {
  const playhead = useEditorStore((s) => s.playhead);
  if (duration <= 0 || width <= 0) return null;
  const left = Math.max(0, Math.min(width, (playhead / duration) * width));
  return <View style={[styles.playhead, { left }]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  track: { width: '100%', justifyContent: 'center' },
  dim: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8 },
  selection: { position: 'absolute', top: 0, bottom: 0, borderWidth: 2, borderRadius: 8 },
  handle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: HANDLE_W,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  grip: { width: 3, height: 20, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.9)' },
  playhead: { position: 'absolute', top: -2, bottom: -2, width: 2, backgroundColor: '#fff' },
});

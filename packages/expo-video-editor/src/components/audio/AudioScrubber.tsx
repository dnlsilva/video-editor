import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useEditorStore } from '../../state/store';
import { useTheme } from '../../theme';

const HANDLE_W = 20;
const TRACK_H = 56;
const MIN_GAP_S = 0.5;

/** Full-audio ruler with a draggable start/end window and solo pre-listen of the selection. */
export function AudioScrubber() {
  const audio = useEditorStore((s) => s.audio);
  const updateAudio = useEditorStore((s) => s.updateAudio);
  const theme = useTheme();

  const player = useAudioPlayer(audio ? { uri: audio.uri } : null);
  const status = useAudioPlayerStatus(player);
  const [playing, setPlaying] = useState(false);
  const [w, setW] = useState(0);

  const duration = audio?.duration && audio.duration > 0 ? audio.duration : status.duration || 0;

  // backfill the total duration once the player reports it
  useEffect(() => {
    if (audio && (!audio.duration || audio.duration <= 0) && status.duration > 0) {
      updateAudio({
        duration: status.duration,
        trimEnd: audio.trimEnd > 0 ? audio.trimEnd : status.duration,
      });
    }
  }, [status.duration, audio, updateAudio]);

  const startX = useSharedValue(0);
  const endX = useSharedValue(0);
  const baseStart = useSharedValue(0);
  const baseEnd = useSharedValue(0);
  const draggingRef = useRef(false);

  const pxPerSec = duration > 0 && w > 0 ? w / duration : 0;
  const minGapPx = MIN_GAP_S * pxPerSec;

  useEffect(() => {
    if (draggingRef.current || pxPerSec === 0 || !audio) return;
    startX.value = audio.trimStart * pxPerSec;
    endX.value = audio.trimEnd * pxPerSec;
  }, [audio, pxPerSec, startX, endX]);

  const setDragging = (v: boolean) => {
    draggingRef.current = v;
  };
  const commit = () => {
    if (pxPerSec > 0) updateAudio({ trimStart: startX.value / pxPerSec, trimEnd: endX.value / pxPerSec });
  };
  const seekSolo = (px: number) => {
    if (pxPerSec > 0) {
      try {
        player.seekTo(px / pxPerSec);
      } catch {}
    }
  };

  const startPan = Gesture.Pan()
    .onStart(() => {
      baseStart.value = startX.value;
      runOnJS(setDragging)(true);
    })
    .onUpdate((e) => {
      let v = baseStart.value + e.translationX;
      v = Math.max(0, Math.min(v, endX.value - minGapPx));
      startX.value = v;
      runOnJS(seekSolo)(v);
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
      let v = baseEnd.value + e.translationX;
      v = Math.min(w, Math.max(v, startX.value + minGapPx));
      endX.value = v;
    })
    .onEnd(() => {
      runOnJS(commit)();
      runOnJS(setDragging)(false);
    });

  // loop the selection while pre-listening
  useEffect(() => {
    if (!playing || !audio) return;
    const id = setInterval(() => {
      try {
        if (player.currentTime >= audio.trimEnd || player.currentTime < audio.trimStart - 0.1) {
          player.seekTo(audio.trimStart);
        }
      } catch {}
    }, 150);
    return () => clearInterval(id);
  }, [playing, audio, player]);

  useEffect(
    () => () => {
      try {
        player.pause();
      } catch {}
    },
    [player],
  );

  const togglePlay = () => {
    try {
      if (playing) {
        player.pause();
        setPlaying(false);
      } else {
        player.seekTo(audio?.trimStart ?? 0);
        player.play();
        setPlaying(true);
      }
    } catch {}
  };

  const selStyle = useAnimatedStyle(() => ({ left: startX.value, width: Math.max(0, endX.value - startX.value) }));
  const leftHandle = useAnimatedStyle(() => ({ left: startX.value - HANDLE_W }));
  const rightHandle = useAnimatedStyle(() => ({ left: endX.value }));

  return (
    <View style={styles.row}>
      <Pressable onPress={togglePlay} style={[styles.playBtn, { backgroundColor: theme.accent }]}>
        <Text style={styles.playIcon}>{playing ? '❚❚' : '▶'}</Text>
      </Pressable>
      <View style={[styles.track, { backgroundColor: theme.surface }]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <Animated.View
          style={[styles.selection, { borderColor: theme.accent, backgroundColor: 'rgba(124,92,255,0.18)' }, selStyle]}
          pointerEvents="none"
        />
        <GestureDetector gesture={startPan}>
          <Animated.View style={[styles.handle, { backgroundColor: theme.accent }, leftHandle]} />
        </GestureDetector>
        <GestureDetector gesture={endPan}>
          <Animated.View style={[styles.handle, { backgroundColor: theme.accent }, rightHandle]} />
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#fff', fontSize: 16 },
  track: { flex: 1, height: TRACK_H, borderRadius: 8, justifyContent: 'center' },
  selection: { position: 'absolute', top: 0, bottom: 0, borderWidth: 2, borderRadius: 8 },
  handle: { position: 'absolute', top: 0, bottom: 0, width: HANDLE_W, borderRadius: 6 },
});

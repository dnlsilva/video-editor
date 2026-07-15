import { useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

import { useEditorStore } from '../state/store';

export function useAudioPreview() {
  const audioUri = useEditorStore((s) => s.audio?.uri ?? null);
  const volume = useEditorStore((s) => s.audio?.volume ?? 1);
  const loop = useEditorStore((s) => s.audio?.loop ?? false);
  const audioTrimStart = useEditorStore((s) => s.audio?.trimStart ?? 0);
  const videoTrimStart = useEditorStore((s) => s.trim.start);
  const paused = useEditorStore((s) => s.paused);
  const playhead = useEditorStore((s) => s.playhead);
  const seekNonce = useEditorStore((s) => s.seekNonce);
  const activePanel = useEditorStore((s) => s.activePanel);

  const player = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  const active = !!audioUri && activePanel !== 'audio';

  useEffect(() => {
    try {
      player.volume = volume;
    } catch {}
  }, [player, volume]);

  useEffect(() => {
    try {
      player.loop = loop;
    } catch {}
  }, [player, loop]);

  useEffect(() => {
    try {
      if (!active) player.pause();
      else if (paused) player.pause();
      else player.play();
    } catch {}
  }, [active, paused, player]);

  useEffect(() => {
    if (!active) return;
    try {
      player.seekTo(audioTrimStart + Math.max(0, playhead - videoTrimStart));
    } catch {}
  }, [seekNonce]);
}

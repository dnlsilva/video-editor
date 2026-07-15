import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useEditorStore } from '../../state/store';
import { useTheme } from '../../theme';
import { AudioScrubber } from './AudioScrubber';
import { Slider } from './Slider';

export function AudioPanel() {
  const activePanel = useEditorStore((s) => s.activePanel);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const audio = useEditorStore((s) => s.audio);
  const originalVolume = useEditorStore((s) => s.originalVolume);
  const updateAudio = useEditorStore((s) => s.updateAudio);
  const clearAudio = useEditorStore((s) => s.clearAudio);
  const setOriginalVolume = useEditorStore((s) => s.setOriginalVolume);
  const theme = useTheme();

  if (activePanel !== 'audio' || !audio) return null;
  const close = () => setActivePanel('none');

  return (
    <Modal transparent visible animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={styles.topbar}>
            <Pressable hitSlop={12} onPress={clearAudio}>
              <Text style={[styles.action, { color: theme.danger }]}>Remove</Text>
            </Pressable>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {audio.title ?? 'Audio'}
            </Text>
            <Pressable hitSlop={12} onPress={close}>
              <Text style={[styles.action, { color: theme.accent }]}>Done</Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: theme.textMuted }]}>Selection</Text>
          <AudioScrubber />

          <Text style={[styles.label, { color: theme.textMuted }]}>Music volume</Text>
          <Slider value={audio.volume} onChange={(v) => updateAudio({ volume: v })} />

          <Text style={[styles.label, { color: theme.textMuted }]}>Original video volume</Text>
          <Slider value={originalVolume} onChange={setOriginalVolume} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { padding: 20, paddingBottom: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 10 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 15, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 12 },
  action: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 12, marginTop: 8 },
});

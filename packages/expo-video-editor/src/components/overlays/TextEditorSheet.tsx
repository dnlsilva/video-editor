import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useEditorStore } from '../../state/store';
import { useTheme } from '../../theme';

const COLORS = ['#ffffff', '#000000', '#ff5c7c', '#7c5cff', '#4cd964', '#ffd60a', '#5ac8fa', '#ff9f0a'];
const ALIGNS = ['left', 'center', 'right'] as const;

export function TextEditorSheet() {
  const activePanel = useEditorStore((s) => s.activePanel);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const overlay = useEditorStore((s) => s.overlays.find((o) => o.id === s.selectedOverlayId));
  const updateOverlay = useEditorStore((s) => s.updateOverlay);
  const removeOverlay = useEditorStore((s) => s.removeOverlay);
  const theme = useTheme();

  if (activePanel !== 'text' || !overlay || overlay.type !== 'text') return null;
  const close = () => setActivePanel('none');
  const cycleAlign = () => {
    const next = ALIGNS[(ALIGNS.indexOf(overlay.align) + 1) % ALIGNS.length];
    updateOverlay(overlay.id, { align: next });
  };
  const toggleBg = () =>
    updateOverlay(overlay.id, { backgroundColor: overlay.backgroundColor ? undefined : 'rgba(0,0,0,0.5)' });

  return (
    <Modal transparent visible animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.topbar}>
          <Pressable
            hitSlop={12}
            onPress={() => {
              removeOverlay(overlay.id);
              close();
            }}
          >
            <Text style={[styles.action, { color: theme.danger }]}>Delete</Text>
          </Pressable>
          <Pressable hitSlop={12} onPress={close}>
            <Text style={[styles.action, { color: theme.accent }]}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.center}>
          <TextInput
            autoFocus
            multiline
            value={overlay.text}
            onChangeText={(t) => updateOverlay(overlay.id, { text: t })}
            placeholder="Type…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={[styles.input, { color: overlay.color, textAlign: overlay.align }]}
          />
        </View>

        <View style={styles.tools}>
          <Pressable style={styles.toolChip} onPress={cycleAlign}>
            <Text style={styles.toolChipText}>{overlay.align}</Text>
          </Pressable>
          <Pressable style={[styles.toolChip, overlay.backgroundColor ? { backgroundColor: theme.accent } : null]} onPress={toggleBg}>
            <Text style={styles.toolChipText}>BG</Text>
          </Pressable>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatches}>
            {COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => updateOverlay(overlay.id, { color: c })}
                style={[styles.swatch, { backgroundColor: c, borderColor: overlay.color === c ? theme.accent : 'rgba(255,255,255,0.3)' }]}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60 },
  action: { fontSize: 16, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  input: { fontSize: 32, fontWeight: '700', minHeight: 60 },
  tools: { paddingHorizontal: 16, paddingBottom: 40, gap: 12, flexDirection: 'row', alignItems: 'center' },
  toolChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)' },
  toolChipText: { color: '#fff', fontWeight: '600', fontSize: 13, textTransform: 'capitalize' },
  swatches: { gap: 10, alignItems: 'center', paddingRight: 12 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
});

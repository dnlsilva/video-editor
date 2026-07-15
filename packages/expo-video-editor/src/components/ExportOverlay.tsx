import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useEditorStore } from '../state/store';
import { useTheme } from '../theme';

export function ExportOverlay({ onCancel }: { onCancel: () => void }) {
  const exporting = useEditorStore((s) => s.exporting);
  const progress = useEditorStore((s) => s.exportProgress);
  const theme = useTheme();

  if (!exporting) return null;
  const pct = Math.round(progress * 100);

  return (
    <View style={styles.overlay}>
      <ActivityIndicator color={theme.accent} size="large" />
      <Text style={[styles.pct, { color: theme.text }]}>{pct}%</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: theme.accent }]} />
      </View>
      <Pressable onPress={onCancel} hitSlop={12}>
        <Text style={[styles.cancel, { color: theme.textMuted }]}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  pct: { fontSize: 28, fontWeight: '700' },
  barBg: { width: '60%', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  barFill: { height: 4, borderRadius: 2 },
  cancel: { fontSize: 15, marginTop: 8 },
});

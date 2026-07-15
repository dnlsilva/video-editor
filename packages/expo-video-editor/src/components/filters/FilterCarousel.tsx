import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { FILTER_PRESETS } from '../../filters/presets';
import { useEditorStore } from '../../state/store';
import { useTheme } from '../../theme';

export function FilterCarousel() {
  const filter = useEditorStore((s) => s.filter);
  const setFilter = useEditorStore((s) => s.setFilter);
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {FILTER_PRESETS.map((p) => {
        const active = p.key === filter;
        return (
          <Pressable
            key={p.key}
            onPress={() => setFilter(p.key)}
            style={[
              styles.chip,
              {
                backgroundColor: theme.surface,
                borderColor: active ? theme.accent : 'transparent',
              },
            ]}>
            <Text style={[styles.label, { color: active ? theme.accent : theme.textMuted }]}>
              {p.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 4, paddingVertical: 2 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 2 },
  label: { fontSize: 13, fontWeight: '600' },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useExport, type ExportCallbacks } from '../hooks/useExport';
import { useEditorStore } from '../state/store';
import { useTheme } from '../theme';
import type { ExportOptions } from '../types';
import { ExportOverlay } from './ExportOverlay';
import { PreviewSurface } from './PreviewSurface';
import { TrimTimeline } from './timeline/TrimTimeline';

type Props = {
  exportOptions: ExportOptions;
  callbacks: ExportCallbacks;
  onCancel?: () => void;
};

export function EditorRoot({ exportOptions, callbacks, onCancel }: Props) {
  const theme = useTheme();
  const paused = useEditorStore((s) => s.paused);
  const togglePlay = useEditorStore((s) => s.togglePlay);
  const hasMeta = useEditorStore((s) => s.meta != null);
  const { run, cancel } = useExport(exportOptions, callbacks);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.preview}>
        <PreviewSurface />
        <Pressable style={styles.tapLayer} onPress={togglePlay}>
          {paused ? <Text style={styles.playIcon}>▶</Text> : null}
        </Pressable>
      </View>

      <View style={styles.bottom}>
        {hasMeta ? <TrimTimeline /> : null}
        <Pressable style={[styles.exportBtn, { backgroundColor: theme.accent }]} onPress={() => run()}>
          <Text style={styles.exportText}>Export</Text>
        </Pressable>
      </View>

      <ExportOverlay
        onCancel={() => {
          cancel();
          onCancel?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  preview: { flex: 1 },
  tapLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: 'rgba(255,255,255,0.9)', fontSize: 56 },
  bottom: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, gap: 16 },
  exportBtn: { alignSelf: 'center', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 24 },
  exportText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

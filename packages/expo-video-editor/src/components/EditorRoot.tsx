import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useExport, type ExportCallbacks } from '../hooks/useExport';
import { type ActivePanel, useEditorStore } from '../state/store';
import { type EditorTheme, useTheme } from '../theme';
import type { ExportOptions } from '../types';
import { ExportOverlay } from './ExportOverlay';
import { FilterCarousel } from './filters/FilterCarousel';
import { GiphyPicker } from './giphy/GiphyPicker';
import { TextEditorSheet } from './overlays/TextEditorSheet';
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
  const activePanel = useEditorStore((s) => s.activePanel);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const addTextOverlay = useEditorStore((s) => s.addTextOverlay);
  const giphyApiKey = useEditorStore((s) => s.giphyApiKey);
  const { run, cancel } = useExport(exportOptions, callbacks);

  const toggle = (panel: ActivePanel) => setActivePanel(activePanel === panel ? 'none' : panel);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.preview}>
        <PreviewSurface />
        <Pressable style={styles.tapLayer} onPress={togglePlay}>
          {paused ? <Text style={styles.playIcon}>▶</Text> : null}
        </Pressable>
      </View>

      <View style={styles.bottom}>
        {activePanel === 'filter' ? <FilterCarousel /> : null}
        {hasMeta ? <TrimTimeline /> : null}

        <View style={styles.toolbar}>
          <View style={styles.tools}>
            <ToolButton label="Filters" active={activePanel === 'filter'} onPress={() => toggle('filter')} theme={theme} />
            <ToolButton label="Text" active={false} onPress={() => addTextOverlay()} theme={theme} />
            {giphyApiKey ? (
              <ToolButton label="GIF" active={activePanel === 'giphy'} onPress={() => setActivePanel('giphy')} theme={theme} />
            ) : null}
          </View>
          <Pressable style={[styles.exportBtn, { backgroundColor: theme.accent }]} onPress={() => run()}>
            <Text style={styles.exportText}>Export</Text>
          </Pressable>
        </View>
      </View>

      <TextEditorSheet />
      <GiphyPicker />

      <ExportOverlay
        onCancel={() => {
          cancel();
          onCancel?.();
        }}
      />
    </View>
  );
}

function ToolButton({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: EditorTheme;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.toolBtn, { backgroundColor: active ? theme.accent : theme.surface }]}
    >
      <Text style={[styles.toolText, { color: active ? '#fff' : theme.textMuted }]}>{label}</Text>
    </Pressable>
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
  bottom: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, gap: 14 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tools: { flexDirection: 'row', gap: 10 },
  toolBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  toolText: { fontSize: 14, fontWeight: '600' },
  exportBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 },
  exportText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

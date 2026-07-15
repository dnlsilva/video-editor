import { StyleSheet, View } from 'react-native';

import { getFilterMatrix, isIdentityFilter } from '../filters/presets';
import EditorVideoView from '../native/EditorVideoView';
import { useEditorStore } from '../state/store';
import { OverlayLayer } from './overlays/OverlayLayer';

export function PreviewSurface() {
  const source = useEditorStore((s) => s.source);
  const paused = useEditorStore((s) => s.paused);
  const trimStart = useEditorStore((s) => s.trim.start);
  const trimEnd = useEditorStore((s) => s.trim.end);
  const filter = useEditorStore((s) => s.filter);
  const seekNonce = useEditorStore((s) => s.seekNonce);
  const seekTarget = useEditorStore((s) => s.seekTarget);
  const setMeta = useEditorStore((s) => s.setMeta);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);
  const setPreviewSize = useEditorStore((s) => s.setPreviewSize);

  const colorMatrix = isIdentityFilter(filter) ? [] : getFilterMatrix(filter);

  if (!source.uri) return <View style={styles.container} />;

  return (
    <View
      style={styles.container}
      onLayout={(e) => setPreviewSize(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}>
      <EditorVideoView
        style={StyleSheet.absoluteFill}
        source={source}
        paused={paused}
        loopStartMs={Math.round(trimStart * 1000)}
        loopEndMs={Math.round(trimEnd * 1000)}
        seek={{ seq: seekNonce, positionMs: Math.round(seekTarget * 1000) }}
        colorMatrix={colorMatrix}
        onLoad={(e) => {
          const { durationMs, width, height, rotationDeg } = e.nativeEvent;
          setMeta({ duration: durationMs / 1000, width, height, rotation: rotationDeg });
        }}
        onProgress={(e) => setPlayhead(e.nativeEvent.positionMs / 1000)}
      />
      <OverlayLayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
});

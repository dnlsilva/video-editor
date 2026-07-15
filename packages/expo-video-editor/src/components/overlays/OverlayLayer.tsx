import { StyleSheet, View } from 'react-native';

import { GifOverlayView } from './GifOverlayView';
import { TextOverlayView } from './TextOverlayView';
import { useEditorStore } from '../../state/store';

export function OverlayLayer() {
  const overlays = useEditorStore((s) => s.overlays);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {overlays.map((o) =>
        o.type === 'text' ? (
          <TextOverlayView key={o.id} overlay={o} />
        ) : (
          <GifOverlayView key={o.id} overlay={o} />
        )
      )}
    </View>
  );
}

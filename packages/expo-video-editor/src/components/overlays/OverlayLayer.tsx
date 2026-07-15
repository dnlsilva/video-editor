import { StyleSheet, View } from 'react-native';

import { useEditorStore } from '../../state/store';
import { TextOverlayView } from './TextOverlayView';

/** Interactive overlays layered over the preview. Burned into pixels only at export. */
export function OverlayLayer() {
  const overlays = useEditorStore((s) => s.overlays);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {overlays.map((o) => (o.type === 'text' ? <TextOverlayView key={o.id} overlay={o} /> : null))}
    </View>
  );
}

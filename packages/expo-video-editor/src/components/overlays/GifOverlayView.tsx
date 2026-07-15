import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { useOverlayGestures } from '../../hooks/useOverlayGestures';
import { useEditorStore } from '../../state/store';
import { useTheme } from '../../theme';
import type { StickerOverlay } from '../../types';

const BASE_WIDTH = 120;

export function GifOverlayView({ overlay }: { overlay: StickerOverlay }) {
  const { gesture, animatedStyle } = useOverlayGestures(overlay);
  const updateOverlay = useEditorStore((s) => s.updateOverlay);
  const selectOverlay = useEditorStore((s) => s.selectOverlay);
  const selected = useEditorStore((s) => s.selectedOverlayId === overlay.id);
  const theme = useTheme();

  const width = BASE_WIDTH;
  const height = BASE_WIDTH / (overlay.aspectRatio || 1);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.wrapper, animatedStyle]}>
        <View
          collapsable={false}
          onLayout={(e) => {
            const { width: w, height: h } = e.nativeEvent.layout;
            if (
              Math.abs((overlay.baseWidth ?? 0) - w) > 0.5 ||
              Math.abs((overlay.baseHeight ?? 0) - h) > 0.5
            ) {
              updateOverlay(overlay.id, { baseWidth: w, baseHeight: h });
            }
          }}
          onTouchEnd={() => selectOverlay(overlay.id)}
          style={[styles.content, selected && { borderColor: theme.accent }]}
        >
          <Image
            source={{ uri: overlay.previewUri }}
            style={{ width, height }}
            contentFit="contain"
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', top: 0, left: 0 },
  content: { borderWidth: 1, borderColor: 'transparent', borderRadius: 6 },
});

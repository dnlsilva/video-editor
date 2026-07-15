import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { useOverlayGestures } from '../../hooks/useOverlayGestures';
import { registerOverlayRef } from '../../overlays/captureRegistry';
import { useEditorStore } from '../../state/store';
import { useTheme } from '../../theme';
import type { TextOverlay } from '../../types';

export function TextOverlayView({ overlay }: { overlay: TextOverlay }) {
  const { gesture, animatedStyle } = useOverlayGestures(overlay);
  const updateOverlay = useEditorStore((s) => s.updateOverlay);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const selectOverlay = useEditorStore((s) => s.selectOverlay);
  const selected = useEditorStore((s) => s.selectedOverlayId === overlay.id);
  const theme = useTheme();

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.wrapper, animatedStyle]}>
        <View
          ref={(v) => registerOverlayRef(overlay.id, v)}
          collapsable={false}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (
              Math.abs((overlay.baseWidth ?? 0) - width) > 0.5 ||
              Math.abs((overlay.baseHeight ?? 0) - height) > 0.5
            ) {
              updateOverlay(overlay.id, { baseWidth: width, baseHeight: height });
            }
          }}
          onTouchEnd={() => {
            selectOverlay(overlay.id);
            setActivePanel('text');
          }}
          style={[
            styles.content,
            selected && { borderColor: theme.accent },
            overlay.backgroundColor ? { backgroundColor: overlay.backgroundColor } : null,
          ]}>
          <Text
            style={{
              color: overlay.color,
              fontSize: overlay.fontSize,
              fontFamily: overlay.fontFamily,
              textAlign: overlay.align,
            }}>
            {overlay.text || ' '}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', top: 0, left: 0 },
  content: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});

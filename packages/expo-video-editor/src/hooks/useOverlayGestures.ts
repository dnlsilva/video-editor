import { useEffect } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useEditorStore } from '../state/store';
import type { Overlay } from '../types';

export function useOverlayGestures(overlay: Overlay) {
  const previewW = useEditorStore((s) => s.previewSize.width);
  const previewH = useEditorStore((s) => s.previewSize.height);
  const updateOverlay = useEditorStore((s) => s.updateOverlay);
  const selectOverlay = useEditorStore((s) => s.selectOverlay);

  const baseW = overlay.baseWidth ?? 0;
  const baseH = overlay.baseHeight ?? 0;

  const cx = useSharedValue(overlay.transform.x * previewW);
  const cy = useSharedValue(overlay.transform.y * previewH);
  const scale = useSharedValue(overlay.transform.scale);
  const rot = useSharedValue(overlay.transform.rotation);

  const startCx = useSharedValue(0);
  const startCy = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startRot = useSharedValue(0);

  useEffect(() => {
    cx.value = overlay.transform.x * previewW;
    cy.value = overlay.transform.y * previewH;
    scale.value = overlay.transform.scale;
    rot.value = overlay.transform.rotation;
  }, [overlay.transform, previewW, previewH, cx, cy, scale, rot]);

  const commit = () => {
    if (previewW > 0 && previewH > 0) {
      updateOverlay(overlay.id, {
        transform: {
          x: cx.value / previewW,
          y: cy.value / previewH,
          scale: scale.value,
          rotation: rot.value,
        },
      });
    }
  };
  const select = () => selectOverlay(overlay.id);

  const pan = Gesture.Pan()
    .onStart(() => {
      startCx.value = cx.value;
      startCy.value = cy.value;
      runOnJS(select)();
    })
    .onUpdate((e) => {
      cx.value = startCx.value + e.translationX;
      cy.value = startCy.value + e.translationY;
    })
    .onEnd(() => runOnJS(commit)());

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.max(0.2, startScale.value * e.scale);
    })
    .onEnd(() => runOnJS(commit)());

  const rotation = Gesture.Rotation()
    .onStart(() => {
      startRot.value = rot.value;
    })
    .onUpdate((e) => {
      rot.value = startRot.value + e.rotation;
    })
    .onEnd(() => runOnJS(commit)());

  const gesture = Gesture.Simultaneous(pan, pinch, rotation);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cx.value - baseW / 2 },
      { translateY: cy.value - baseH / 2 },
      { scale: scale.value },
      { rotate: `${rot.value}rad` },
    ],
  }));

  return { gesture, animatedStyle };
}

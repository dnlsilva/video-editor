import { requireNativeView } from 'expo';
import type { StyleProp, ViewStyle } from 'react-native';

export type NativeLoadEvent = {
  durationMs: number;
  width: number;
  height: number;
  rotationDeg: number;
};
export type NativeProgressEvent = { positionMs: number };

/**
 * Raw native player view (ms-based). Playback is prop-driven so it stays in sync
 * with the React tree; seeking is triggered by bumping `seekSeq`.
 */
export type EditorVideoNativeProps = {
  source: { uri: string };
  paused: boolean;
  /** loop window start, ms */
  loopStartMs: number;
  /** loop window end, ms; <= 0 means "to end of clip" */
  loopEndMs: number;
  /** seek request: bumping `seq` re-triggers a jump to `positionMs` even if unchanged */
  seek: { seq: number; positionMs: number };
  /** 4×5 color matrix (20 numbers) applied live on the GPU; empty = no filter */
  colorMatrix: number[];
  onLoad?: (event: { nativeEvent: NativeLoadEvent }) => void;
  onProgress?: (event: { nativeEvent: NativeProgressEvent }) => void;
  onEnded?: (event: { nativeEvent: Record<string, never> }) => void;
  style?: StyleProp<ViewStyle>;
};

const EditorVideoView = requireNativeView<EditorVideoNativeProps>('ExpoVideoEditor');

export default EditorVideoView;

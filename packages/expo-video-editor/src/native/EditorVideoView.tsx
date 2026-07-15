import { requireNativeView } from 'expo';
import type { StyleProp, ViewStyle } from 'react-native';

export type NativeLoadEvent = {
  durationMs: number;
  width: number;
  height: number;
  rotationDeg: number;
};
export type NativeProgressEvent = { positionMs: number };

export type EditorVideoNativeProps = {
  source: { uri: string };
  paused: boolean;
  loopStartMs: number;
  loopEndMs: number;
  seek: { seq: number; positionMs: number };
  colorMatrix: number[];
  onLoad?: (event: { nativeEvent: NativeLoadEvent }) => void;
  onProgress?: (event: { nativeEvent: NativeProgressEvent }) => void;
  onEnded?: (event: { nativeEvent: Record<string, never> }) => void;
  style?: StyleProp<ViewStyle>;
};

const EditorVideoView = requireNativeView<EditorVideoNativeProps>('ExpoVideoEditor');

export default EditorVideoView;

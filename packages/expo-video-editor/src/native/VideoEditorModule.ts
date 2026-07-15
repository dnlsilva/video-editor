import { NativeModule, requireNativeModule } from 'expo';

export type NativeOverlay = {
  uri: string;
  animated: boolean;
  centerX: number;
  centerY: number;
  widthFraction: number;
  heightFraction: number;
  rotationDeg: number;
};

export type NativeAudio = {
  uri: string;
  trimStartMs: number;
  trimEndMs: number;
  volume: number;
  loop: boolean;
};

export type NativeExportPayload = {
  sourceUri: string;
  startMs: number;
  endMs: number;
  resolution: number;
  bitrate: number;
  colorMatrix: number[];
  overlays: NativeOverlay[];
  audio: NativeAudio | null;
  originalVolume: number;
};

export type NativeExportResult = {
  uri: string;
  width: number;
  height: number;
  durationMs: number;
};

type VideoEditorModuleEvents = {
  onExportProgress: (event: { progress: number }) => void;
};

declare class VideoEditorNativeModule extends NativeModule<VideoEditorModuleEvents> {
  exportVideo(payload: NativeExportPayload): Promise<NativeExportResult>;
  cancelExport(): void;
  ping(): Promise<string>;
}

export default requireNativeModule<VideoEditorNativeModule>('ExpoVideoEditor');

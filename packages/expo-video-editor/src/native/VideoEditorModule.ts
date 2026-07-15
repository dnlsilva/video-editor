import { NativeModule, requireNativeModule } from 'expo';

/** Payload crossing the bridge for an export. Extended per phase (filter, overlays, audio). */
export type NativeExportPayload = {
  sourceUri: string;
  startMs: number;
  endMs: number;
  /** 0 = keep source height; otherwise cap the longer/height side to this (e.g. 720, 1080) */
  resolution: number;
  /** 0 = auto (derive from resolution) */
  bitrate: number;
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
  /** Runs a single-pass native export. Emits `onExportProgress` (0..1) while running. */
  exportVideo(payload: NativeExportPayload): Promise<NativeExportResult>;
  /** Cancels an in-flight export; the pending `exportVideo` promise rejects with code CANCELLED. */
  cancelExport(): void;
  /** Phase 0 liveness probe. */
  ping(): Promise<string>;
}

export default requireNativeModule<VideoEditorNativeModule>('ExpoVideoEditor');

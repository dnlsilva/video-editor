import { NativeModule, requireNativeModule } from 'expo';

/** Payload crossing the bridge for an export. Extended per phase (filter, overlays, audio). */
/** An overlay burned into the video at export. */
export type NativeOverlay = {
  /** file uri: a rasterized PNG when static, or a local GIF file when animated */
  uri: string;
  /** true → decode GIF frames natively and animate over the clip; false → static bitmap */
  animated: boolean;
  /** center of the overlay, normalized 0..1 relative to the video frame */
  centerX: number;
  centerY: number;
  /** overlay size as a fraction of the video frame */
  widthFraction: number;
  heightFraction: number;
  /** clockwise degrees */
  rotationDeg: number;
};

export type NativeAudio = {
  /** local file uri (remote sources are downloaded before export) */
  uri: string;
  trimStartMs: number;
  trimEndMs: number;
  /** 0..1 */
  volume: number;
  loop: boolean;
};

export type NativeExportPayload = {
  sourceUri: string;
  startMs: number;
  endMs: number;
  /** 0 = keep source height; otherwise cap the longer/height side to this (e.g. 720, 1080) */
  resolution: number;
  /** 0 = auto (derive from resolution) */
  bitrate: number;
  /** 4×5 color matrix (20 numbers); empty = no filter → passthrough */
  colorMatrix: number[];
  /** overlays burned in at export (empty = none) */
  overlays: NativeOverlay[];
  /** background music to mix, or null */
  audio: NativeAudio | null;
  /** volume of the source's own audio, 0..1 */
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
  /** Runs a single-pass native export. Emits `onExportProgress` (0..1) while running. */
  exportVideo(payload: NativeExportPayload): Promise<NativeExportResult>;
  /** Cancels an in-flight export; the pending `exportVideo` promise rejects with code CANCELLED. */
  cancelExport(): void;
  /** Phase 0 liveness probe. */
  ping(): Promise<string>;
}

export default requireNativeModule<VideoEditorNativeModule>('ExpoVideoEditor');

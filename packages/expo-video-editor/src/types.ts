import type { StyleProp, ViewStyle } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Geometry
// ─────────────────────────────────────────────────────────────────────────────

/** Overlay placement, normalized to the video frame (0..1), resolution-independent. */
export type Transform = {
  /** center x, 0..1 */
  x: number;
  /** center y, 0..1 */
  y: number;
  scale: number;
  /** radians */
  rotation: number;
};

export const IDENTITY_TRANSFORM: Transform = { x: 0.5, y: 0.5, scale: 1, rotation: 0 };

// ─────────────────────────────────────────────────────────────────────────────
// Overlays (modeled now; text UI lands in Phase 3, GIF in Phase 4)
// ─────────────────────────────────────────────────────────────────────────────

/** Unscaled rendered size in preview px, measured at runtime — used for export rasterization. */
export type OverlayBaseSize = { baseWidth?: number; baseHeight?: number };

export type TextOverlay = OverlayBaseSize & {
  id: string;
  type: 'text';
  text: string;
  fontFamily?: string;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  align: 'left' | 'center' | 'right';
  transform: Transform;
  /** [start, end] in seconds; omit = whole clip */
  timeRange?: [number, number];
};

export type StickerOverlay = OverlayBaseSize & {
  id: string;
  type: 'gif' | 'sticker';
  previewUri: string;
  exportUri: string;
  /** width / height of the source asset */
  aspectRatio: number;
  transform: Transform;
  timeRange?: [number, number];
};

export type Overlay = TextOverlay | StickerOverlay;

// ─────────────────────────────────────────────────────────────────────────────
// Audio (agnostic: any local/remote URI; Phase 5 wires the panel + mix)
// ─────────────────────────────────────────────────────────────────────────────

export type AudioTrack = {
  uri: string;
  title?: string;
  /** seconds into the source where the chosen segment starts */
  trimStart: number;
  /** seconds into the source where it ends */
  trimEnd: number;
  /** 0..1 */
  volume: number;
  loop: boolean;
};

export type AudioSource = { uri: string; title?: string; duration?: number };

// ─────────────────────────────────────────────────────────────────────────────
// Video
// ─────────────────────────────────────────────────────────────────────────────

export type VideoSource = { uri: string };

export type VideoMeta = {
  /** seconds */
  duration: number;
  width: number;
  height: number;
  /** degrees */
  rotation: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Filters (Phase 2 fills the presets; a matrix is 4×5 = 20 numbers, row-major)
// ─────────────────────────────────────────────────────────────────────────────

export type ColorMatrix = number[];

// ─────────────────────────────────────────────────────────────────────────────
// The serializable edit — the single JS↔native contract (and future drafts)
// ─────────────────────────────────────────────────────────────────────────────

export type EditorState = {
  source: VideoSource;
  meta: VideoMeta | null;
  /** seconds */
  trim: { start: number; end: number };
  /** preset key; 'normal' = identity */
  filter: string;
  overlays: Overlay[];
  audio: AudioTrack | null;
  /** volume of the video's own audio, 0..1 */
  originalVolume: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export type ExportResolution = 720 | 1080 | 'source';

export type ExportOptions = {
  resolution?: ExportResolution;
  /** bits per second; omit = derive from resolution */
  bitrate?: number;
};

export type ExportResult = {
  uri: string;
  width: number;
  height: number;
  /** seconds */
  duration: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Public component props
// ─────────────────────────────────────────────────────────────────────────────

export type GiphyConfig = { apiKey: string };
export type AudioConfig = { onPickAudio?: () => Promise<AudioSource | null> };

export type VideoEditorProps = {
  source: VideoSource;
  giphy?: GiphyConfig;
  audio?: AudioConfig;
  export?: ExportOptions;
  /** partial override of the editor color theme */
  theme?: Partial<import('./theme').EditorTheme>;
  style?: StyleProp<ViewStyle>;
  onExportStart?: () => void;
  onExportProgress?: (progress: number) => void;
  onExportComplete?: (result: ExportResult) => void;
  onExportError?: (error: unknown) => void;
  onCancel?: () => void;
};

import type { StyleProp, ViewStyle } from 'react-native';

export type Transform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

export const IDENTITY_TRANSFORM: Transform = { x: 0.5, y: 0.5, scale: 1, rotation: 0 };

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
  timeRange?: [number, number];
};

export type StickerOverlay = OverlayBaseSize & {
  id: string;
  type: 'gif' | 'sticker';
  previewUri: string;
  exportUri: string;
  aspectRatio: number;
  transform: Transform;
  timeRange?: [number, number];
};

export type Overlay = TextOverlay | StickerOverlay;

export type AudioTrack = {
  uri: string;
  title?: string;
  duration: number;
  trimStart: number;
  trimEnd: number;
  volume: number;
  loop: boolean;
};

export type AudioSource = { uri: string; title?: string; duration?: number };

export type VideoSource = { uri: string };

export type VideoMeta = {
  duration: number;
  width: number;
  height: number;
  rotation: number;
};

export type ColorMatrix = number[];

export type EditorState = {
  source: VideoSource;
  meta: VideoMeta | null;
  trim: { start: number; end: number };
  filter: string;
  overlays: Overlay[];
  audio: AudioTrack | null;
  originalVolume: number;
};

export type ExportResolution = 720 | 1080 | 'source';

export type ExportOptions = {
  resolution?: ExportResolution;
  bitrate?: number;
};

export type ExportResult = {
  uri: string;
  width: number;
  height: number;
  duration: number;
};

export type GiphyConfig = { apiKey: string };
export type AudioConfig = { onPickAudio?: () => Promise<AudioSource | null> };

export type VideoEditorProps = {
  source: VideoSource;
  giphy?: GiphyConfig;
  audio?: AudioConfig;
  export?: ExportOptions;
  theme?: Partial<import('./theme').EditorTheme>;
  style?: StyleProp<ViewStyle>;
  onExportStart?: () => void;
  onExportProgress?: (progress: number) => void;
  onExportComplete?: (result: ExportResult) => void;
  onExportError?: (error: unknown) => void;
  onCancel?: () => void;
};

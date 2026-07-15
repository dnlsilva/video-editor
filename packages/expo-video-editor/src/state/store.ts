import { create } from 'zustand';

import {
  IDENTITY_TRANSFORM,
  type AudioSource,
  type AudioTrack,
  type EditorState,
  type Overlay,
  type StickerOverlay,
  type TextOverlay,
  type VideoMeta,
  type VideoSource,
} from '../types';

let overlayCounter = 0;
const nextOverlayId = () => `ov_${Date.now().toString(36)}_${overlayCounter++}`;

export type ActivePanel = 'none' | 'trim' | 'filter' | 'text' | 'giphy' | 'audio';

export type EditorStore = {
  source: VideoSource;
  meta: VideoMeta | null;
  trim: { start: number; end: number };
  filter: string;
  overlays: Overlay[];
  audio: AudioTrack | null;
  originalVolume: number;

  playhead: number;
  paused: boolean;
  activePanel: ActivePanel;
  exporting: boolean;
  exportProgress: number;
  seekTarget: number;
  seekNonce: number;
  previewSize: { width: number; height: number };
  selectedOverlayId: string | null;
  giphyApiKey: string | null;
  audioPicker: (() => Promise<AudioSource | null>) | null;

  init: (source: VideoSource) => void;
  setMeta: (meta: VideoMeta) => void;
  setTrim: (start: number, end: number) => void;
  setFilter: (key: string) => void;
  setPlayhead: (t: number) => void;
  requestSeek: (t: number) => void;
  setPaused: (paused: boolean) => void;
  togglePlay: () => void;
  setActivePanel: (panel: ActivePanel) => void;
  setExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;
  setPreviewSize: (width: number, height: number) => void;
  addTextOverlay: () => string;
  addGifOverlay: (item: { previewUri: string; exportUri: string; aspectRatio: number }) => string;
  updateOverlay: (id: string, patch: Partial<Overlay>) => void;
  removeOverlay: (id: string) => void;
  selectOverlay: (id: string | null) => void;
  setGiphyApiKey: (key: string | null) => void;
  setAudioPicker: (picker: (() => Promise<AudioSource | null>) | null) => void;
  setAudioFromSource: (source: AudioSource) => void;
  updateAudio: (patch: Partial<AudioTrack>) => void;
  clearAudio: () => void;
  setOriginalVolume: (v: number) => void;
  getEditorState: () => EditorState;
};

const initialEdit = {
  meta: null as VideoMeta | null,
  trim: { start: 0, end: 0 },
  filter: 'normal',
  overlays: [] as Overlay[],
  audio: null as AudioTrack | null,
  originalVolume: 1,
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  source: { uri: '' },
  ...initialEdit,

  playhead: 0,
  paused: false,
  activePanel: 'none',
  exporting: false,
  exportProgress: 0,
  seekTarget: 0,
  seekNonce: 0,
  previewSize: { width: 0, height: 0 },
  selectedOverlayId: null,
  giphyApiKey: null,
  audioPicker: null,

  init: (source) =>
    set({
      source,
      ...initialEdit,
      playhead: 0,
      paused: false,
      activePanel: 'none',
      exporting: false,
      exportProgress: 0,
      seekTarget: 0,
      seekNonce: 0,
      selectedOverlayId: null,
    }),

  setMeta: (meta) =>
    set((s) => ({
      meta,
      trim: s.trim.end > 0 ? s.trim : { start: 0, end: meta.duration },
    })),

  setTrim: (start, end) => set({ trim: { start, end } }),
  setFilter: (key) => set({ filter: key }),
  setPlayhead: (t) => set({ playhead: t }),
  requestSeek: (t) => set((s) => ({ seekTarget: t, seekNonce: s.seekNonce + 1, playhead: t })),
  setPaused: (paused) => set({ paused }),
  togglePlay: () => set((s) => ({ paused: !s.paused })),
  setActivePanel: (activePanel) => set({ activePanel }),
  setExporting: (exporting) => set({ exporting }),
  setExportProgress: (exportProgress) => set({ exportProgress }),
  setPreviewSize: (width, height) => set({ previewSize: { width, height } }),

  addTextOverlay: () => {
    const id = nextOverlayId();
    const overlay: TextOverlay = {
      id,
      type: 'text',
      text: '',
      fontSize: 32,
      color: '#ffffff',
      align: 'center',
      transform: { ...IDENTITY_TRANSFORM },
    };
    set((s) => ({
      overlays: [...s.overlays, overlay],
      selectedOverlayId: id,
      activePanel: 'text',
    }));
    return id;
  },
  addGifOverlay: (item) => {
    const id = nextOverlayId();
    const overlay: StickerOverlay = {
      id,
      type: 'gif',
      previewUri: item.previewUri,
      exportUri: item.exportUri,
      aspectRatio: item.aspectRatio > 0 ? item.aspectRatio : 1,
      transform: { ...IDENTITY_TRANSFORM },
    };
    set((s) => ({
      overlays: [...s.overlays, overlay],
      selectedOverlayId: id,
      activePanel: 'none',
    }));
    return id;
  },
  updateOverlay: (id, patch) =>
    set((s) => ({
      overlays: s.overlays.map((o) => (o.id === id ? ({ ...o, ...patch } as Overlay) : o)),
    })),
  removeOverlay: (id) =>
    set((s) => ({
      overlays: s.overlays.filter((o) => o.id !== id),
      selectedOverlayId: s.selectedOverlayId === id ? null : s.selectedOverlayId,
    })),
  selectOverlay: (selectedOverlayId) => set({ selectedOverlayId }),
  setGiphyApiKey: (giphyApiKey) => set({ giphyApiKey }),

  setAudioPicker: (audioPicker) => set({ audioPicker }),
  setAudioFromSource: (source) =>
    set({
      audio: {
        uri: source.uri,
        title: source.title,
        duration: source.duration && source.duration > 0 ? source.duration : 0,
        trimStart: 0,
        trimEnd: source.duration && source.duration > 0 ? source.duration : 0,
        volume: 1,
        loop: true,
      },
      activePanel: 'audio',
    }),
  updateAudio: (patch) => set((s) => ({ audio: s.audio ? { ...s.audio, ...patch } : s.audio })),
  clearAudio: () => set({ audio: null, activePanel: 'none' }),
  setOriginalVolume: (originalVolume) => set({ originalVolume }),

  getEditorState: () => {
    const s = get();
    return {
      source: s.source,
      meta: s.meta,
      trim: s.trim,
      filter: s.filter,
      overlays: s.overlays,
      audio: s.audio,
      originalVolume: s.originalVolume,
    };
  },
}));

import { create } from 'zustand';

import type { AudioTrack, EditorState, Overlay, VideoMeta, VideoSource } from '../types';

export type ActivePanel = 'none' | 'trim' | 'filter' | 'text' | 'giphy' | 'audio';

export type EditorStore = {
  // ── serializable edit (mirrors EditorState) ───────────────────────────────
  source: VideoSource;
  meta: VideoMeta | null;
  trim: { start: number; end: number };
  filter: string;
  overlays: Overlay[];
  audio: AudioTrack | null;
  originalVolume: number;

  // ── ephemeral UI (never exported) ─────────────────────────────────────────
  playhead: number; // seconds
  paused: boolean;
  activePanel: ActivePanel;
  exporting: boolean;
  exportProgress: number; // 0..1
  /** seconds; where a consumer asked the player to jump to */
  seekTarget: number;
  /** bumped on every seek request so the player re-seeks even to the same target */
  seekNonce: number;

  // ── actions ───────────────────────────────────────────────────────────────
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
    }),

  setMeta: (meta) =>
    set((s) => ({
      meta,
      // default the trim window to the whole clip on first load
      trim: s.trim.end > 0 ? s.trim : { start: 0, end: meta.duration },
    })),

  setTrim: (start, end) => set({ trim: { start, end } }),
  setFilter: (key) => set({ filter: key }),
  setPlayhead: (t) => set({ playhead: t }),
  requestSeek: (t) =>
    set((s) => ({ seekTarget: t, seekNonce: s.seekNonce + 1, playhead: t })),
  setPaused: (paused) => set({ paused }),
  togglePlay: () => set((s) => ({ paused: !s.paused })),
  setActivePanel: (activePanel) => set({ activePanel }),
  setExporting: (exporting) => set({ exporting }),
  setExportProgress: (exportProgress) => set({ exportProgress }),

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

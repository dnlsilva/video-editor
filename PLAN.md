# expo-video-editor — Plan & Mapping

> Stories-style video editor for Expo/React Native, focused on **performance**, with **agnostic audio** (any external lib provides the source) and GIFs via **Giphy**.
>
> Reference: [faeizfurqan17/expo-react-native-video-editor](https://github.com/faeizfurqan17/expo-react-native-video-editor) — we replicate the features, not the architecture.

**Status:** Phase 0 complete (monorepo scaffolded, native module + example wired, `ping()` bridge verified headless). Phase 1 next. Pinned: Expo SDK 57, React Native 0.86, React 19.2.

---

## 1. Why not use/copy the reference

The reference lib works, but carries structural debt:

| Problem | Consequence |
|---|---|
| Export via `ffmpeg-kit` fork (project **retired in Jan/2025**, official binaries removed) | Dead dependency, license risk (GPL/patents), ~30MB extra binary in the app |
| **Software** encoding (FFmpeg) | Slow exports, battery drain, heat |
| `@azzapp/react-native-skia-video` **pinned at 0.9.0** + mandatory `patch-package` | Fragile install, breaks on every ecosystem update |
| Divergent preview: native on iOS, Skia on Android | Two rendering pipelines to maintain, filters can diverge visually |
| Audio coupled to internal `expo-audio` + `expo-document-picker` | Impossible to plug an external audio source (your pain point) |
| ~13 peer dependencies | Heavy setup for the lib consumer |

**Our answer:** 100% native platform pipeline (no FFmpeg, no Skia), URI-based audio contract, and the minimum of peer deps.

---

## 2. Architecture decisions (settled)

| Decision | Choice | Rationale |
|---|---|---|
| Export engine | **Native**: Media3 Transformer (Android) + AVFoundation (iOS), via Expo Modules | **Hardware** encoding (fast, efficient), zero extra binaries, zero license risk |
| Preview | Own native player with real-time effects: `ExoPlayer.setVideoEffects()` (Android) + `AVPlayer` with `videoComposition`/CIFilter (iOS) | **Same effect graph in preview and export** → what you see is what exports; everything on GPU |
| Color filters | 4×5 color matrix **shared** across platforms (`CIColorMatrix` on iOS, `RgbMatrix`/GlEffect on Android) | A single array of numbers per preset = visual parity between iOS/Android and between preview/export |
| Overlays (text/GIF) while editing | RN views with `react-native-gesture-handler` + `reanimated` on top of the player | 60fps gestures on the UI thread, zero bridge; no Skia canvas |
| Overlays at export | Rasterization + native burn-in (`OverlayEffect`/`BitmapOverlay` on Android, `AVVideoCompositionCoreAnimationTool` on iOS) | Overlay is data (bitmap + transform + timing), not a view — video resolution, not screen resolution |
| Audio | **URI-based agnostic API** — any external lib resolves the source; the editor only does preview sync, trim, volume and mix at export | Your core requirement; the editor knows no music player at all |
| GIFs | **Giphy REST API** + `expo-image` for rendering | No native Giphy SDK = one less native dep; own UI consistent with the editor |
| State | `zustand` | Lightweight, no provider hell, same as the reference (the one thing it got right by keeping simple) |
| Delivery | Monorepo: `packages/expo-video-editor` (publishable lib) + `apps/example` | Developed and tested in practice; consumer installs one package |
| JS↔native contract | `EditorState` — **serializable** JSON object describing the entire edit | A single contract for export, and for free: persistable drafts in the future |

### The core insight

```
┌─────────────────────  EDITING (real time)  ─────────────────────┐
│                                                                 │
│   RN: interactive overlays (text/GIF) — gestures via Reanimated │
│   ────────────────────────────────────────────────────────────  │
│   Native: EditorVideoView                                       │
│     Android: ExoPlayer + setVideoEffects([colorMatrix])         │
│     iOS:     AVPlayer + AVVideoComposition (CIColorMatrix)      │
│   + external audio in synchronized preview (expo-audio)         │
│                                                                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │  EditorState (JSON)
                               ▼
┌─────────────────────  EXPORT (single pass)  ────────────────────┐
│                                                                 │
│   Android: Media3 Transformer                                   │
│     trim → GPU effects (same matrix) → overlays (BitmapOverlay  │
│     animated by timestamp) → audio mix → MediaCodec (HW)        │
│   iOS: AVMutableComposition + AVAssetExportSession              │
│     trim → CIFilter (same matrix) → CoreAnimationTool           │
│     (text/GIF layers) → AVMutableAudioMix → HW encode           │
│                                                                 │
│   → .mp4 file (H.264 + AAC) + progress callbacks                │
└─────────────────────────────────────────────────────────────────┘
```

While editing, overlays are **views** (interactive). At export, they become **data** (bitmap + normalized transform + time window) burned in at video resolution. Never a screen screenshot.

---

## 3. v1 scope (settled)

1. **Trim/cut** video
2. **Text overlay** (font, color, background, alignment, drag/pinch/rotate)
3. **Giphy GIFs + stickers** (search, trending, animated overlay with gestures)
4. **Color filters** (presets via shared matrix)
5. **Background music** (1 track, external source by URI, trim + volumes + mix)

Out of v1 (v2 candidates): still image as source, multi-clip, voice-over/multi-track, freehand drawing, crop/speed, adjustable filter intensity.

---

## 4. Feature mapping

### 4.1 Trim

- **UI:** thumbnail strip + two handles (in/out) + playhead. Gestures via Reanimated.
- **Thumbnails:** `expo-video-thumbnails` (N evenly spaced frames). If measured slow on long videos, migrate to generation in our native module (batch, single pass) — optimize only with evidence.
- **Preview:** player seek constrained to the window; loop within the range.
- **Export:** range becomes the composition trim (no extra re-decode; it's just the time interval).
- **Edge cases:** video < 1s; minimum trim (e.g. 0.5s); long videos (thumbs on demand); metadata rotation (camera video comes rotated — normalize in player and export).

### 4.2 Text overlay

- **UI:** tap to add, keyboard opens inline; toolbar with font, color, background color, alignment. Drag/pinch/rotate as a composed gesture.
- **Model:** `{ text, fontFamily, fontSize, color, backgroundColor, align, transform: {x, y, scale, rotation}, timeRange? }` — position **normalized (0–1)** relative to the video, never in screen px.
- **Export (the critical point):** rasterize the text view with `react-native-view-shot` at a `pixelRatio` computed for the video resolution (e.g. 1080p video, 390pt-wide preview → capture at ~2.8×). Custom fonts and emoji come out faithful because the real view is being rasterized.
- **Edge cases:** text past the edge (allow partial), emoji, multiple texts, fonts loaded by the host app (`expo-font` — work for free since the view renders inside the app).

### 4.3 Giphy GIFs + stickers

- **Search:** Giphy REST (`/v1/gifs/trending`, `/v1/gifs/search`) with pagination + debounce. API key provided by the host app (prop). Grid with `expo-image` (decodes/animates GIF natively, with cache).
- **Network performance:** `fixed_width` rendition (small) in the grid and the preview overlay; `original` downloaded only at export time (`expo-file-system` for local cache).
- **Model:** `{ type: 'gif' | 'sticker', previewUri, exportUri, transform, timeRange? }`.
- **Animated GIF export (the critical point):**
  - **Android:** custom `BitmapOverlay` — `getBitmap(presentationTimeUs)` returns the correct frame of the decoded GIF (`ImageDecoder`/`Movie`), honoring frame delays and looping.
  - **iOS:** decode frames via `CGImageSource` → `CAKeyframeAnimation` of `contents` on a `CALayer` inside `AVVideoCompositionCoreAnimationTool`, with real frame timing and looping.
- **Static sticker:** same path with a single bitmap (degenerate case of the animated one).
- **Edge cases:** heavy GIFs (cap the export rendition dimension), Giphy attribution (their ToS requirement — show "Powered by GIPHY" in the search UI), offline (search fails with an error state; editing continues).

### 4.4 Color filters

- **Definition:** each preset = one 4×5 matrix (RGBA + bias) in a shared TS file. Port the reference's 11 presets (normal, bw, vintage, warm, cool, retro, neon, sunset, film, fade, norway).
- **Preview:** the matrix goes to the native player (`setVideoEffects` / `CIColorMatrix`). Switching filters = swapping a uniform, no player rebuild.
- **Carousel:** video thumbnail (middle frame) with each matrix applied — generate the N filtered thumbs at once in the native module (one texture, N draws, cheap).
- **Export:** same matrix in the Transformer/CIFilter effect graph.
- **Controlled risk:** iOS×Android visual parity — manual test with side-by-side screenshots of the 11 presets in the example app (Phase 2 checklist).

### 4.5 Audio (agnostic API)

- **Contract:** `AudioTrack = { uri, title?, trimStart, trimEnd, volume (0–1), loop }` + `originalVolume (0–1)` for the video's own audio. **Any local or remote URI** — coming from react-native-track-player, own download, recording, host's file picker, whatever. The editor never imports a music lib.
- **UI — segment selection panel (Instagram/TikTok style):** the host app provides the URI (`onPickAudio` callback or prop); the editor opens a panel with:
  - horizontal ruler of the **full** audio with time markers;
  - **selection window with two draggable handles** (segment start and end);
  - **solo pre-listen:** play/pause inside the panel plays only the selected segment (looping it), updating as handles are dragged (debounced seek);
  - volume sliders for the music and for the video's original audio;
  - on confirm, the segment becomes the `AudioTrack`'s `trimStart`/`trimEnd`.
  - Segment shorter than the video → `loop` (existing flag) or silence for the rest; longer → cut at video end.
  - Real waveform (amplitudes) is a Phase 5 improvement: requires PCM decode + downsample in the native module (`AVAssetReader` / `MediaCodec`). v1 uses a ruler with markers — pre-listen already solves finding the segment.
- **Preview in the editor:** after confirming, `expo-audio` plays the selected segment synchronized to the video player, with volumes applied (sync via play/pause/seek events + resync if drift > ~80ms) — you hear the mix before exporting. The export is the final truth.
- **Export:**
  - **iOS:** `AVMutableAudioMix` — original track at `originalVolume`, music at `volume`, trim/offset via composition. Mature.
  - **Android:** Media3 `Composition` with a parallel audio sequence (`EditedMediaItemSequence`) + per-track volume. **Newest area of Media3** — validate early (Phase 1 already tests a simple mix); documented fallback: decode+mix PCM manually with `MediaCodec`+`AudioMixer` if the Transformer API doesn't cover some case.
- **Edge cases:** music shorter than the video (optional loop), longer (auto trim), video without an audio track, remote URI (download before export via `expo-file-system`).

---

## 5. Public API (proposed shape)

```ts
// Main component — full-screen, handles everything
<VideoEditor
  source={{ uri: string }}
  giphy={{ apiKey: string }}                    // omit = hides the GIF button
  audio={{ onPickAudio?: () => Promise<AudioSource | null> }}  // host resolves the source
  export={{ resolution?: 720 | 1080 | 'source', bitrate?: number }}
  theme?: Partial<EditorTheme>
  onExportStart={() => void}
  onExportProgress={(p: number) => void}        // 0–1
  onExportComplete={(result: { uri, width, height, duration }) => void}
  onExportError={(e: EditorError) => void}
  onCancel={() => void}
/>

// Advanced / headless
useVideoEditor()                                 // state access (zustand)
exportVideo(state: EditorState, opts): Promise<ExportResult>   // imperative, cancelable
FILTER_PRESETS                                   // exported matrices
type EditorState                                 // serializable JSON (drafts for free)
```

Consumer peer deps (target: **7**, vs the reference's 13 — full list in section 6.1). Requires a **dev build** (expo prebuild / EAS) — unavoidable with a native module, same as the reference.

---

## 6. Stack, patterns and file map

### 6.1 Dependencies (all — versions pinned in Phase 0, latest stable)

**Lib-internal dependencies** (installed along, invisible to the consumer):

| Lib | Role |
|---|---|
| `zustand` | Editor store |
| `expo-modules-core` | Native module base (Expo Modules API) |

**Peer dependencies** (consumer installs — 7):

| Lib | Used for |
|---|---|
| `react-native-gesture-handler` | Overlay drag/pinch/rotate, trim handles |
| `react-native-reanimated` | UI-thread animations/gestures |
| `expo-image` | GIF rendering (Giphy grid + preview overlay) with cache |
| `expo-audio` | Audio track preview (pre-listen + mix preview) |
| `expo-file-system` | Original-GIF cache / remote audio download / export path |
| `expo-video-thumbnails` | Trim ruler frames |
| `react-native-view-shot` | Text overlay rasterization at export |

(`react`, `react-native`, `expo` — implicit peers of any expo module.)

**Android native** (lib's gradle, invisible to the consumer):

| Dep | Role |
|---|---|
| `androidx.media3:media3-transformer` | Export (composition + HW encode) |
| `androidx.media3:media3-effect` | GPU effects (color matrix, overlays) |
| `androidx.media3:media3-exoplayer` | Preview player with `setVideoEffects` |

**iOS native:** system frameworks only (AVFoundation, CoreImage, CoreGraphics/ImageIO) — zero external pods.

**Example app:** `expo-dev-client`, `expo-image-picker` (pick video), `expo-media-library` (save export), `expo-document-picker` (demonstrate external audio via URI).

**Dev/tooling:** TypeScript strict, `expo-module-scripts` (standard expo module build/lint/test).

What does **not** go in (and why): FFmpeg (dead, slow, heavy), Skia / `@azzapp/react-native-skia-video` (source of the reference's fragility), native Giphy SDK (REST + `expo-image` covers it), `expo-video` (our `EditorVideoView` is the player — two players would be a double stack).

### 6.2 Project patterns

**Layers with a dependency rule (downward only):**

```
components/ (presentation, dumb)
    ↓ uses
hooks/ (all UI logic: gestures, trim, audio sync, export)
    ↓ uses
state/ (zustand) + services/ (giphy, export, cache — pure/async functions)
    ↓ uses
native/ (typed bindings — the ONLY place importing requireNativeModule/View)
    ↓ bridge
android/ · ios/ (Kotlin/Swift mirrored 1:1 in responsibility and name)
```

- **Single store with slices** (`video`, `filter`, `overlays`, `audio`, `ui`). `EditorState` (serializable, export/drafts contract) = the store minus the `ui` slice (ephemeral: open panel, keyboard, selection).
- **Gestures don't re-render:** transforms live in shared values (Reanimated) during the gesture; committed to the store only on `onEnd`. Zero React re-renders per drag frame — performance rule #3 in practice.
- **Dumb components, logic in hooks:** `useOverlayGestures`, `useTrim`, `useAudioPreview`, `useExport`. Component = layout + bind.
- **1:1 native parity:** every Kotlin file has a Swift twin with the same name and same responsibility (`ExportRunner`, `ColorMatrixEffect/Filter`, `GifOverlay/GifLayerBuilder`, `AudioMixBuilder`). Found it on Android, you know where it lives on iOS.
- **Typed errors:** `EditorError { code: 'EXPORT_FAILED' | 'AUDIO_LOAD' | 'GIPHY_NETWORK' | 'CANCELLED' | ..., cause }` — native promises reject with these codes.
- **Style:** TS strict; no classes on the JS side (functions + hooks); named exports through a single `index.ts` (public API = what the index exports, the rest is internal); async/await with coroutines (Kotlin) and Swift concurrency on the native side.

### 6.3 File map

```
video-editor/                             # monorepo root (npm workspaces — see question 7)
├── PLAN.md
├── package.json                          # workspaces: packages/*, apps/*
├── packages/
│   └── expo-video-editor/                # scaffold: create-expo-module
│       ├── package.json
│       ├── expo-module.config.json
│       ├── src/
│       │   ├── index.ts                  # public API: VideoEditor, useVideoEditor,
│       │   │                             #   exportVideo, FILTER_PRESETS, types
│       │   ├── VideoEditor.tsx           # root component (mounts providers + EditorRoot)
│       │   ├── types.ts                  # EditorState, Overlay, AudioTrack, ExportOptions...
│       │   ├── errors.ts                 # EditorError + codes
│       │   ├── theme.ts                  # default EditorTheme + merge with prop
│       │   ├── state/
│       │   │   ├── store.ts              # createStore + slice composition
│       │   │   ├── selectors.ts          # derived selectors (effective duration, export payload)
│       │   │   └── slices/
│       │   │       ├── videoSlice.ts     # source, trim in/out, playhead, metadata
│       │   │       ├── filterSlice.ts    # active preset
│       │   │       ├── overlaySlice.ts   # text/gif CRUD, z-order, transforms
│       │   │       ├── audioSlice.ts     # AudioTrack, volumes, segment selection
│       │   │       └── uiSlice.ts        # active panel, keyboard, selected overlay (ephemeral)
│       │   ├── hooks/
│       │   │   ├── useOverlayGestures.ts # drag/pinch/rotate (shared values → commit at end)
│       │   │   ├── useTrim.ts            # handles + preview seek
│       │   │   ├── useAudioPreview.ts    # solo pre-listen + mix sync ↔ player
│       │   │   └── useExport.ts          # orchestrates exportService + progress + cancel
│       │   ├── components/
│       │   │   ├── EditorRoot.tsx        # overall layout, toolbar, routes panels
│       │   │   ├── PreviewSurface.tsx    # EditorVideoView + OverlayLayer on top
│       │   │   ├── ExportOverlay.tsx     # progress + cancel
│       │   │   ├── timeline/
│       │   │   │   ├── TrimTimeline.tsx  # ruler + handles + playhead
│       │   │   │   └── ThumbnailStrip.tsx
│       │   │   ├── overlays/
│       │   │   │   ├── OverlayLayer.tsx  # z-order, renders the overlay list
│       │   │   │   ├── TextOverlay.tsx
│       │   │   │   ├── GifOverlay.tsx    # animated expo-image
│       │   │   │   └── TextEditorSheet.tsx # input + font/color/bg/align toolbar
│       │   │   ├── filters/
│       │   │   │   └── FilterCarousel.tsx  # filtered thumbs + selection
│       │   │   ├── audio/
│       │   │   │   ├── AudioPanel.tsx    # panel: scrubber + volumes + confirm
│       │   │   │   └── AudioScrubber.tsx # ruler + 2-handle window + pre-listen
│       │   │   └── giphy/
│       │   │       ├── GiphyPicker.tsx   # sheet: search, gif/sticker tabs, attribution
│       │   │       └── GiphyGrid.tsx     # paginated grid (FlatList + expo-image)
│       │   ├── services/
│       │   │   ├── giphyClient.ts        # pure REST fetch (trending/search, renditions)
│       │   │   ├── exportService.ts      # EditorState → native payload:
│       │   │   │                         #   rasterizes texts (view-shot), resolves URIs,
│       │   │   │                         #   normalizes transforms → calls native/
│       │   │   └── mediaCache.ts         # download/cache (original gif, remote audio)
│       │   ├── filters/
│       │   │   └── presets.ts            # 11 4×5 matrices (single source for iOS+Android)
│       │   └── native/
│       │       ├── VideoEditorModule.ts  # requireNativeModule: export(), cancelExport(),
│       │       │                         #   filteredThumbnails(), progress events
│       │       └── EditorVideoView.tsx   # requireNativeView: uri, trim, matrix, play/seek
│       ├── android/
│       │   ├── build.gradle              # media3 deps
│       │   └── src/main/java/expo/modules/videoeditor/
│       │       ├── VideoEditorModule.kt  # module definition (funcs + events)
│       │       ├── EditorVideoView.kt    # ExoPlayer + setVideoEffects(matrix)
│       │       ├── ExportRunner.kt       # Media3 Transformer: composition → mp4 + progress
│       │       ├── ColorMatrixEffect.kt  # 4×5 array → RgbMatrix/GlEffect
│       │       ├── GifOverlay.kt         # animated BitmapOverlay: getBitmap(timestamp)
│       │       └── AudioMixBuilder.kt    # parallel audio sequence + volumes
│       └── ios/
│           ├── ExpoVideoEditor.podspec
│           ├── VideoEditorModule.swift   # twin of the .kt
│           ├── EditorVideoView.swift     # AVPlayer + AVVideoComposition(CIColorMatrix)
│           ├── ExportRunner.swift        # AVMutableComposition + AVAssetExportSession
│           ├── ColorMatrixFilter.swift   # 4×5 array → CIColorMatrix
│           ├── GifLayerBuilder.swift     # CGImageSource → CAKeyframeAnimation layer
│           └── AudioMixBuilder.swift     # AVMutableAudioMix
└── apps/
    └── example/
        ├── package.json                  # expo + dev-client + pickers
        ├── app.json
        └── App.tsx                       # flow: pick video → <VideoEditor> →
                                          #   save/share the exported mp4
```

No custom config plugin in v1 (Media3/AVFoundation require nothing in Info.plist/manifest beyond media permissions the **host app** already declares to pick the video).

---

## 7. Performance — design guarantees

The reason this lib exists. Rules that apply to all future code:

1. **Decode/encode always in hardware** (MediaCodec / VideoToolbox via the high-level APIs). Never software.
2. **Effects always on the GPU** (GlEffect / CIFilter). Never pixel-by-pixel on CPU/JS.
3. **Bridge-free gestures:** Reanimated worklets; JS thread free during drag/pinch.
4. **Zero frame copies to JS.** Video frames never cross to the JS side at any point.
5. **Single-pass export** (trim + filter + overlays + mix in one encode).
6. **Passthrough when possible:** trim with no filter/overlay → Transformer transmuxes without re-encoding (near-instant). iOS equivalent with the passthrough preset.
7. **Frugal networking:** small Giphy renditions in preview; original only at export; disk cache.
8. **Heavy work off the mount path:** thumbs and waveform in background, UI opens immediately.

Measurable targets (validated in the example app, mid-range device): editor opens < 500ms; stable 60fps preview with filter + 3 overlays; 1080p/30s export ≲ clip duration; filter switch < 16ms.

---

## 8. Risks & mitigations

| Risk | Prob. | Mitigation |
|---|---|---|
| Media3 Transformer audio mixing immature for our case | Medium | Test a simple mix as early as Phase 1 (spike); fallback: documented manual PCM mixer |
| iOS×Android filter visual parity | Medium | Single matrix + screenshot checklist of the 11 presets (Phase 2) |
| Text rasterization fidelity (scale/fonts/emoji) | Medium | view-shot with computed pixelRatio; test with custom font + emoji in Phase 3 |
| GIF timing at export (frame delays, loop) | Medium | Native decoder honoring frame delays; test GIF with variable delays |
| `ExoPlayer.setVideoEffects` rough edges on old devices | Low | Fallback: preview without real-time filter (applied only at export) behind a flag |
| Audio↔video drift in preview | Low | Event-based resync; 80ms tolerance; export is the truth |
| Versions (Expo SDK / Media3 / New Arch) | Low | Pin latest stable versions at the start of Phase 0; new-arch-first lib |

---

## 9. Execution phases

Each phase ends with an acceptance criterion verifiable in the example app. **Phase 1 proves the entire pipeline end to end before any rich feature** — kills the native risks first.

| Phase | Deliverable | Acceptance |
|---|---|---|
| **0 — Scaffold** | Monorepo, `create-expo-module`, example app running dev builds on iOS+Android | App opens, native module answers "ping" |
| **1 — Core pipeline** | `EditorVideoView` (play/pause/seek) + trim UI + **native export with trim** + Android audio-mix spike | Trimmed video exports correctly on both platforms, with progress; passthrough works |
| **2 — Filters** | 11 presets, real-time preview, carousel with thumbs, burn at export | Equivalent iOS×Android screenshots; instant filter switching |
| **3 — Text** | Overlay with gestures, toolbar, rasterization and burn-in | Text with custom font + emoji comes out faithful in 1080p video |
| **4 — Giphy** | Search/trending, animated overlay, burn-in with real timing, attribution | GIF animates in the export same as preview; cache works offline for already-used GIFs |
| **5 — Audio** | Agnostic contract, segment selection panel (start/end handles + solo pre-listen), synced mix preview, mix at export | Segment chosen via pre-listen sounds identical in the mixed preview and the exported file; local and remote URIs; independent volumes. Stretch: real waveform |
| **6 — Polish** | Quality presets, export cancellation, typed errors, README, npm publish | `npm i` in a clean app works following the README alone |

---

## 10. Decisions (defaulted at Phase 0 — change any before it's expensive)

1. **npm package name:** `expo-video-editor` (unscoped). Android package `expo.modules.videoeditor`. → revisit before first publish (Phase 6) if a scoped/brand name is wanted; rename is a small sweep.
2. **Still image as source:** out of v1.
3. **Codec:** H.264 + AAC in v1 (max compatibility). HEVC deferred.
4. **Default export resolution:** 1080p cap; `resolution: 'source'` opt-in.
5. **Time-windowed overlays:** always visible in v1; `timeRange` stays in the model, UI in v2.
6. **i18n:** English UI strings + `theme`/label override prop. No pt-BR bundle in v1.
7. **Monorepo manager:** **npm workspaces** (no bun installed; pnpm's strict linking breaks RN autolinking).
8. **Expo SDK:** **57** (RN 0.86, React 19.2) — latest stable at scaffold time.

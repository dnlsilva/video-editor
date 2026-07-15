# expo-video-editor

High-performance, Stories-style video editor for Expo / React Native. Trim, color
filters, draggable text and Giphy GIF overlays, and a background-music mix — exported
in a **single hardware-encoded pass** with **no FFmpeg** (Media3 Transformer on Android,
AVFoundation on iOS).

- **Fast:** hardware decode/encode, GPU effects, gesture work on the UI thread.
- **What you see is what you export:** the same color matrix drives the live preview and
  the export.
- **Agnostic audio:** any local or remote URI — you resolve the source, the editor mixes it.

> Requires a **dev build** (custom native module — not Expo Go), Expo SDK **57+**, and the
> New Architecture (default on SDK 57).

---

## Install

```sh
npx expo install expo-video-editor \
  react-native-gesture-handler react-native-reanimated react-native-worklets \
  react-native-view-shot expo-image expo-audio expo-file-system expo-video-thumbnails
```

Then build a dev client:

```sh
npx expo run:ios      # or run:android
```

### Peer dependencies

| Package | Why |
|---|---|
| `react-native-gesture-handler`, `react-native-reanimated` (+ `react-native-worklets`) | Overlay drag/pinch/rotate, trim + audio handles |
| `react-native-view-shot` | Rasterizes text overlays at export |
| `expo-image` | GIF rendering (Giphy grid + preview) |
| `expo-audio` | Music preview + segment pre-listen |
| `expo-file-system` | Downloads remote GIF/audio before export |
| `expo-video-thumbnails` | Trim-timeline frames |

The host app declares its own media permissions (to pick the video/audio). No custom
config plugin is required by this library.

---

## Usage

```tsx
import { VideoEditor } from 'expo-video-editor';

<VideoEditor
  source={{ uri: pickedVideoUri }}
  giphy={{ apiKey: process.env.GIPHY_KEY }}          // omit to hide the GIF button
  audio={{ onPickAudio: pickAudioFile }}             // omit to hide the Music button
  export={{ resolution: 1080 }}
  onExportComplete={(result) => save(result.uri)}
  onExportError={(err) => console.warn(err)}
  onCancel={() => goBack()}
/>
```

`onPickAudio` returns any audio URI you resolve — a file picker, a music SDK, a recording:

```ts
async function pickAudioFile() {
  const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
  return res.canceled ? null : { uri: res.assets[0].uri, title: res.assets[0].name };
}
```

---

## API

### `<VideoEditor>` props

| Prop | Type | Notes |
|---|---|---|
| `source` | `{ uri: string }` | The video to edit (required) |
| `giphy` | `{ apiKey: string }` | Enables the GIF button |
| `audio` | `{ onPickAudio?: () => Promise<AudioSource \| null> }` | Enables the Music button |
| `export` | `{ resolution?: 720 \| 1080 \| 'source'; bitrate?: number }` | Export options |
| `theme` | `Partial<EditorTheme>` | Color overrides |
| `onExportStart / Progress / Complete / Error` | callbacks | `Progress` is `0..1` |
| `onCancel` | `() => void` | Fired when the user cancels |

### Also exported

- `exportVideo(state, options, onProgress)` — imperative, headless export.
- `useVideoEditor()` — the Zustand store (advanced/headless control).
- `FILTER_PRESETS`, `getFilterMatrix(key)` — the shared color-matrix presets.
- `EditorError` (with `code`), and all `types`.

---

## How export works

Overlays are interactive **React Native views** while editing. At export they become
**data** — text is rasterized (view-shot) to the video resolution; GIFs are decoded
natively and the frame matching each timestamp is drawn. Everything (trim, color matrix,
overlays, audio mix) is applied in one encode. Trim with no effects **transmuxes** (no
re-encode, near-instant).

## Known limitations (v1)

- `export.resolution` / `bitrate` are plumbed but not yet applied — exports use the source
  resolution. (Downscaling on re-encode is planned.)
- Overlays are always visible for the whole clip (`timeRange` is modeled; per-overlay
  timing UI is planned).
- Filter looks are hand-tuned approximations; fine-tune the matrices in `filters/presets`.
- Android audio mixing uses the newest Media3 APIs — validate on device.

## License

MIT

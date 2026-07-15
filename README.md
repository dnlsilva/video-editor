# video-editor

Monorepo for **expo-video-editor** — a high-performance, Stories-style video editor for
Expo / React Native (native pipeline, no FFmpeg; agnostic audio; Giphy GIFs).

```
packages/expo-video-editor   # the publishable library  (→ its README for usage)
apps/example                 # dev-client app to develop and try it
PLAN.md                      # architecture + phase-by-phase build plan
```

## Develop

```sh
npm install                                    # install the workspace
npm run build --workspace expo-video-editor    # build the library (tsc)

cd apps/example
npx expo run:ios                               # or run:android  (needs a dev build)
```

The example lets you pick a video, edit it (trim, filters, text, GIF, music), and export.
Add a GIPHY key in `apps/example/App.tsx` to enable the GIF button.

See [`packages/expo-video-editor/README.md`](packages/expo-video-editor/README.md) for the
library API and [`PLAN.md`](PLAN.md) for the design.

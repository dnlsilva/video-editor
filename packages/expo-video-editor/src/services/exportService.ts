import { captureRef } from 'react-native-view-shot';

import { toEditorError } from '../errors';
import { getFilterMatrix, isIdentityFilter } from '../filters/presets';
import Native, { type NativeExportPayload, type NativeOverlay } from '../native/VideoEditorModule';
import { getOverlayRef } from '../overlays/captureRegistry';
import { useEditorStore } from '../state/store';
import type { EditorState, ExportOptions, ExportResult } from '../types';
import { downloadToCache } from './mediaCache';

async function buildOverlayPayload(state: EditorState): Promise<NativeOverlay[]> {
  if (!state.meta || state.overlays.length === 0) return [];
  const { width: pw, height: ph } = useEditorStore.getState().previewSize;
  if (pw <= 0 || ph <= 0) return [];

  const result: NativeOverlay[] = [];
  for (const ov of state.overlays) {
    const baseW = ov.baseWidth ?? 0;
    const baseH = ov.baseHeight ?? 0;
    if (baseW <= 0 || baseH <= 0) continue;

    let uri: string;
    let animated: boolean;
    if (ov.type === 'text') {
      const ref = getOverlayRef(ov.id);
      if (!ref) continue;
      try {
        uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
      } catch {
        continue;
      }
      animated = false;
    } else {
      try {
        uri = await downloadToCache(ov.exportUri);
      } catch {
        continue;
      }
      animated = true;
    }

    result.push({
      uri,
      animated,
      centerX: ov.transform.x,
      centerY: ov.transform.y,
      widthFraction: (baseW * ov.transform.scale) / pw,
      heightFraction: (baseH * ov.transform.scale) / ph,
      rotationDeg: (ov.transform.rotation * 180) / Math.PI,
    });
  }
  return result;
}

function resolutionToHeight(resolution: ExportOptions['resolution']): number {
  if (resolution === 'source') return 0;
  if (resolution === 720) return 720;
  return 1080;
}

export async function exportVideo(
  state: EditorState,
  options: ExportOptions = {},
  onProgress?: (progress: number) => void
): Promise<ExportResult> {
  const overlays = await buildOverlayPayload(state);

  let audio: NativeExportPayload['audio'] = null;
  if (state.audio) {
    let uri = state.audio.uri;
    if (/^https?:/i.test(uri)) {
      try {
        uri = await downloadToCache(uri);
      } catch (e) {
        throw toEditorError(e, 'AUDIO_LOAD');
      }
    }
    audio = {
      uri,
      trimStartMs: Math.round(state.audio.trimStart * 1000),
      trimEndMs: Math.round(state.audio.trimEnd * 1000),
      volume: state.audio.volume,
      loop: state.audio.loop,
    };
  }

  const payload: NativeExportPayload = {
    sourceUri: state.source.uri,
    startMs: Math.round(state.trim.start * 1000),
    endMs: Math.round(state.trim.end * 1000),
    resolution: resolutionToHeight(options.resolution),
    bitrate: options.bitrate ?? 0,
    colorMatrix: isIdentityFilter(state.filter) ? [] : getFilterMatrix(state.filter),
    overlays,
    audio,
    originalVolume: state.originalVolume,
  };

  const sub = onProgress
    ? Native.addListener('onExportProgress', (e) => onProgress(e.progress))
    : null;

  try {
    const r = await Native.exportVideo(payload);
    return { uri: r.uri, width: r.width, height: r.height, duration: r.durationMs / 1000 };
  } catch (e) {
    throw toEditorError(e);
  } finally {
    sub?.remove();
  }
}

export function cancelExport(): void {
  Native.cancelExport();
}

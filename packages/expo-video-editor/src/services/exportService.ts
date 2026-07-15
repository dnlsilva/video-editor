import { captureRef } from 'react-native-view-shot';

import { toEditorError } from '../errors';
import { getFilterMatrix, isIdentityFilter } from '../filters/presets';
import Native, { type NativeExportPayload, type NativeOverlay } from '../native/VideoEditorModule';
import { getOverlayRef } from '../overlays/captureRegistry';
import { useEditorStore } from '../state/store';
import type { EditorState, ExportOptions, ExportResult } from '../types';

/**
 * Rasterize each overlay's (unscaled) content view to a PNG and express its placement as
 * fractions of the video frame, so native burns it in at video resolution — not a screen grab.
 */
async function buildOverlayPayload(state: EditorState): Promise<NativeOverlay[]> {
  if (!state.meta || state.overlays.length === 0) return [];
  const { width: pw, height: ph } = useEditorStore.getState().previewSize;
  if (pw <= 0 || ph <= 0) return [];

  const result: NativeOverlay[] = [];
  for (const ov of state.overlays) {
    const ref = getOverlayRef(ov.id);
    const baseW = ov.baseWidth ?? 0;
    const baseH = ov.baseHeight ?? 0;
    if (!ref || baseW <= 0 || baseH <= 0) continue;
    let uri: string;
    try {
      uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
    } catch {
      continue; // skip an overlay that fails to rasterize rather than failing the export
    }
    result.push({
      uri,
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
  // default (undefined) and 1080 both cap at 1080 (plan decision #4)
  return 1080;
}

/**
 * Build the native payload from the serializable edit and run a single-pass export.
 * Phase 1: trim + resolution only. Later phases append filter/overlays/audio fields.
 */
export async function exportVideo(
  state: EditorState,
  options: ExportOptions = {},
  onProgress?: (progress: number) => void,
): Promise<ExportResult> {
  const overlays = await buildOverlayPayload(state);

  const payload: NativeExportPayload = {
    sourceUri: state.source.uri,
    startMs: Math.round(state.trim.start * 1000),
    endMs: Math.round(state.trim.end * 1000),
    resolution: resolutionToHeight(options.resolution),
    bitrate: options.bitrate ?? 0,
    // empty for the identity filter so trim-only stays a passthrough (no re-encode)
    colorMatrix: isIdentityFilter(state.filter) ? [] : getFilterMatrix(state.filter),
    overlays,
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

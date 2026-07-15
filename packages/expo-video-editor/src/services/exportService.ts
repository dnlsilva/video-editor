import { toEditorError } from '../errors';
import { getFilterMatrix, isIdentityFilter } from '../filters/presets';
import Native, { type NativeExportPayload } from '../native/VideoEditorModule';
import type { EditorState, ExportOptions, ExportResult } from '../types';

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
  const payload: NativeExportPayload = {
    sourceUri: state.source.uri,
    startMs: Math.round(state.trim.start * 1000),
    endMs: Math.round(state.trim.end * 1000),
    resolution: resolutionToHeight(options.resolution),
    bitrate: options.bitrate ?? 0,
    // empty for the identity filter so trim-only stays a passthrough (no re-encode)
    colorMatrix: isIdentityFilter(state.filter) ? [] : getFilterMatrix(state.filter),
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

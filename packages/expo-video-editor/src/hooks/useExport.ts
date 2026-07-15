import { useCallback } from 'react';

import { cancelExport, exportVideo } from '../services/exportService';
import { useEditorStore } from '../state/store';
import type { ExportOptions, ExportResult } from '../types';

export type ExportCallbacks = {
  onExportStart?: () => void;
  onExportProgress?: (progress: number) => void;
  onExportComplete?: (result: ExportResult) => void;
  onExportError?: (error: unknown) => void;
};

export function useExport(options: ExportOptions = {}, callbacks: ExportCallbacks = {}) {
  const setExporting = useEditorStore((s) => s.setExporting);
  const setExportProgress = useEditorStore((s) => s.setExportProgress);
  const getEditorState = useEditorStore((s) => s.getEditorState);

  const run = useCallback(async (): Promise<ExportResult | undefined> => {
    setExporting(true);
    setExportProgress(0);
    callbacks.onExportStart?.();
    try {
      const result = await exportVideo(getEditorState(), options, (p) => {
        setExportProgress(p);
        callbacks.onExportProgress?.(p);
      });
      callbacks.onExportComplete?.(result);
      return result;
    } catch (e) {
      callbacks.onExportError?.(e);
      return undefined;
    } finally {
      setExporting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, callbacks, getEditorState, setExporting, setExportProgress]);

  const cancel = useCallback(() => cancelExport(), []);

  return { run, cancel };
}

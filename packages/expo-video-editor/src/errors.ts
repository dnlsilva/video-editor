export type EditorErrorCode =
  'EXPORT_FAILED' | 'CANCELLED' | 'SOURCE_LOAD' | 'AUDIO_LOAD' | 'GIPHY_NETWORK' | 'UNSUPPORTED';

export class EditorError extends Error {
  readonly code: EditorErrorCode;
  readonly cause?: unknown;

  constructor(code: EditorErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'EditorError';
    this.code = code;
    this.cause = cause;
  }
}

export function toEditorError(
  e: unknown,
  fallback: EditorErrorCode = 'EXPORT_FAILED'
): EditorError {
  if (e instanceof EditorError) return e;
  const code = (e as { code?: string })?.code;
  const message = (e as { message?: string })?.message ?? String(e);
  const known: EditorErrorCode[] = [
    'EXPORT_FAILED',
    'CANCELLED',
    'SOURCE_LOAD',
    'AUDIO_LOAD',
    'GIPHY_NETWORK',
    'UNSUPPORTED',
  ];
  const matched = known.find((k) => k === code) ?? fallback;
  return new EditorError(matched, message, e);
}

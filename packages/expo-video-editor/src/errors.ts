export type EditorErrorCode =
  | 'EXPORT_FAILED'
  | 'CANCELLED'
  | 'SOURCE_LOAD'
  | 'AUDIO_LOAD'
  | 'GIPHY_NETWORK'
  | 'UNSUPPORTED';

/** Typed error surfaced by the editor. Native promises reject with these codes. */
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

/** Normalize anything thrown across the native bridge into an EditorError. */
export function toEditorError(e: unknown, fallback: EditorErrorCode = 'EXPORT_FAILED'): EditorError {
  if (e instanceof EditorError) return e;
  // Expo native rejections arrive as { code, message }.
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

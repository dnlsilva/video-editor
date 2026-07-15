export { VideoEditor } from './components/VideoEditor';
export { useEditorStore as useVideoEditor } from './state/store';
export { exportVideo, cancelExport } from './services/exportService';
export { EditorError, type EditorErrorCode } from './errors';
export { defaultTheme, type EditorTheme } from './theme';
export * from './types';

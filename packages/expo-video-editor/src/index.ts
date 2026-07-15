// Reexport the native module. On web, it will be resolved to ExpoVideoEditorModule.web.ts
// and on native platforms to ExpoVideoEditorModule.ts
export { default } from './ExpoVideoEditorModule';
export { default as ExpoVideoEditorView } from './ExpoVideoEditorView';
export * from './ExpoVideoEditor.types';

import { ExpoVideoEditorViewProps } from './ExpoVideoEditor.types';

// ExpoVideoEditorView is not available on the web platform.
export default function ExpoVideoEditorView(_props: ExpoVideoEditorViewProps) {
  throw new Error('ExpoVideoEditorView is not available on the web platform.');
}

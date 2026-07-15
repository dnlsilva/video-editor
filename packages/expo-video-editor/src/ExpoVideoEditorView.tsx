import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoVideoEditorViewProps } from './ExpoVideoEditor.types';

const NativeView: React.ComponentType<ExpoVideoEditorViewProps> = requireNativeView('ExpoVideoEditor');

export default function ExpoVideoEditorView(props: ExpoVideoEditorViewProps) {
  return <NativeView {...props} />;
}

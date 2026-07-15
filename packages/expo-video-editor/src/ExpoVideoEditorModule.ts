import { NativeModule, requireNativeModule } from 'expo';

import { ExpoVideoEditorModuleEvents } from './ExpoVideoEditor.types';

declare class ExpoVideoEditorModule extends NativeModule<ExpoVideoEditorModuleEvents> {
  PI: number;
  hello(): string;
  ping(): Promise<string>;
  setValueAsync(value: string): Promise<void>;
}

export default requireNativeModule<ExpoVideoEditorModule>('ExpoVideoEditor');

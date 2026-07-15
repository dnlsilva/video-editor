import { registerWebModule, NativeModule } from 'expo';

import { ExpoVideoEditorModuleEvents } from './ExpoVideoEditor.types';

// ExpoVideoEditorModule is not available on the web platform.
class ExpoVideoEditorModule extends NativeModule<ExpoVideoEditorModuleEvents> {}

export default registerWebModule(ExpoVideoEditorModule, 'ExpoVideoEditorModule');

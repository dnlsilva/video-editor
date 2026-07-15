import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useEditorStore } from '../state/store';
import { EditorThemeContext, mergeTheme } from '../theme';
import type { VideoEditorProps } from '../types';
import { EditorRoot } from './EditorRoot';

/** Full-screen editor. Owns the store lifecycle and provides theme + gesture root. */
export function VideoEditor(props: VideoEditorProps) {
  const init = useEditorStore((s) => s.init);
  const setGiphyApiKey = useEditorStore((s) => s.setGiphyApiKey);
  const theme = useMemo(() => mergeTheme(props.theme), [props.theme]);

  useEffect(() => {
    init(props.source);
  }, [props.source.uri, init]);

  useEffect(() => {
    setGiphyApiKey(props.giphy?.apiKey ?? null);
  }, [props.giphy?.apiKey, setGiphyApiKey]);

  const callbacks = useMemo(
    () => ({
      onExportStart: props.onExportStart,
      onExportProgress: props.onExportProgress,
      onExportComplete: props.onExportComplete,
      onExportError: props.onExportError,
    }),
    [props.onExportStart, props.onExportProgress, props.onExportComplete, props.onExportError],
  );

  return (
    <GestureHandlerRootView style={[styles.root, props.style]}>
      <EditorThemeContext.Provider value={theme}>
        <EditorRoot exportOptions={props.export ?? {}} callbacks={callbacks} onCancel={props.onCancel} />
      </EditorThemeContext.Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

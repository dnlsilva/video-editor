import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { searchGifs, trendingGifs, type GiphyItem } from '../../services/giphyClient';
import { useEditorStore } from '../../state/store';
import { useTheme } from '../../theme';
import { GiphyGrid } from './GiphyGrid';

const PAGE = 24;

export function GiphyPicker() {
  const activePanel = useEditorStore((s) => s.activePanel);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const apiKey = useEditorStore((s) => s.giphyApiKey);
  const addGifOverlay = useEditorStore((s) => s.addGifOverlay);
  const theme = useTheme();

  const [query, setQuery] = useState('');
  const [items, setItems] = useState<GiphyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const offsetRef = useRef(0);

  const visible = activePanel === 'giphy' && !!apiKey;

  const load = useCallback(
    async (reset: boolean, q: string) => {
      if (!apiKey) return;
      setLoading(true);
      try {
        const offset = reset ? 0 : offsetRef.current;
        const page = q
          ? await searchGifs(apiKey, q, { offset, limit: PAGE })
          : await trendingGifs(apiKey, { offset, limit: PAGE });
        offsetRef.current = offset + PAGE;
        setItems((prev) => (reset ? page : [...prev, ...page]));
      } catch {
        if (reset) setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [apiKey],
  );

  // (re)load on open and on debounced query change
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => load(true, query.trim()), query ? 350 : 0);
    return () => clearTimeout(t);
  }, [visible, query, load]);

  if (!visible) return null;
  const close = () => setActivePanel('none');

  return (
    <Modal transparent visible animationType="slide" onRequestClose={close}>
      <View style={[styles.sheet, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search GIPHY"
            placeholderTextColor={theme.textMuted}
            autoCorrect={false}
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
          />
          <Pressable onPress={close} hitSlop={12}>
            <Text style={[styles.close, { color: theme.accent }]}>Close</Text>
          </Pressable>
        </View>

        <GiphyGrid
          items={items}
          onPick={(item) => {
            addGifOverlay({
              previewUri: item.previewUrl,
              exportUri: item.originalUrl,
              aspectRatio: item.height > 0 ? item.width / item.height : 1,
            });
            close();
          }}
          onEndReached={() => !loading && load(false, query.trim())}
        />

        {loading ? <ActivityIndicator style={styles.loader} color={theme.accent} /> : null}
        <Text style={[styles.attribution, { color: theme.textMuted }]}>Powered by GIPHY</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 10 },
  input: { flex: 1, height: 40, borderRadius: 20, paddingHorizontal: 16, fontSize: 15 },
  close: { fontSize: 15, fontWeight: '700' },
  loader: { position: 'absolute', top: '50%', alignSelf: 'center' },
  attribution: { textAlign: 'center', fontSize: 11, paddingVertical: 8, letterSpacing: 1 },
});

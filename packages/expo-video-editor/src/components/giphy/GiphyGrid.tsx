import { Image } from 'expo-image';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import type { GiphyItem } from '../../services/giphyClient';

const COLUMNS = 3;
const GAP = 6;

export function GiphyGrid({
  items,
  onPick,
  onEndReached,
}: {
  items: GiphyItem[];
  onPick: (item: GiphyItem) => void;
  onEndReached: () => void;
}) {
  return (
    <FlatList
      data={items}
      keyExtractor={(it, i) => `${it.id}-${i}`}
      numColumns={COLUMNS}
      contentContainerStyle={styles.content}
      columnWrapperStyle={styles.row}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <Pressable style={styles.cell} onPress={() => onPick(item)}>
          <Image source={{ uri: item.previewUrl }} style={styles.img} contentFit="cover" />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: GAP, gap: GAP },
  row: { gap: GAP },
  cell: { flex: 1 / COLUMNS, aspectRatio: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: '#222' },
  img: { width: '100%', height: '100%' },
});

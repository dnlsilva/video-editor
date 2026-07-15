import * as VideoThumbnails from 'expo-video-thumbnails';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

type Props = { uri: string; duration: number; count?: number };

export function ThumbnailStrip({ uri, duration, count = 12 }: Props) {
  const [thumbs, setThumbs] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!uri || duration <= 0) {
      setThumbs([]);
      return;
    }
    (async () => {
      const out: string[] = [];
      for (let i = 0; i < count; i++) {
        const t = (duration * (i + 0.5)) / count;
        try {
          const { uri: thumb } = await VideoThumbnails.getThumbnailAsync(uri, {
            time: Math.round(t * 1000),
            quality: 0.4,
          });
          if (cancelled) return;
          out.push(thumb);
          setThumbs([...out]);
        } catch {
          if (cancelled) return;
          out.push('');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uri, duration, count]);

  return (
    <View style={styles.row} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.cell}>
          {thumbs[i] ? <Image source={{ uri: thumbs[i] }} style={styles.img} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 8,
  },
  cell: { flex: 1, backgroundColor: '#000' },
  img: { width: '100%', height: '100%' },
});

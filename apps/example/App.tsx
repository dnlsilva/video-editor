import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { VideoEditor, type ExportResult } from 'expo-video-editor';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const GIPHY_API_KEY = '';

export default function App() {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [exported, setExported] = useState<ExportResult | null>(null);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
    });
    if (!res.canceled && res.assets[0]) {
      setExported(null);
      setVideoUri(res.assets[0].uri);
    }
  };

  const onPickAudio = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets[0]) return null;
    return { uri: res.assets[0].uri, title: res.assets[0].name };
  };

  if (videoUri) {
    return (
      <VideoEditor
        source={{ uri: videoUri }}
        giphy={GIPHY_API_KEY ? { apiKey: GIPHY_API_KEY } : undefined}
        audio={{ onPickAudio }}
        onExportComplete={(r) => {
          setExported(r);
          setVideoUri(null);
        }}
        onExportError={(e) => {
          console.warn('export error', e);
          setVideoUri(null);
        }}
        onCancel={() => setVideoUri(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>expo-video-editor</Text>
      {exported ? (
        <Text style={styles.mono}>
          exported → {exported.width}×{exported.height} · {exported.duration.toFixed(1)}s{'\n'}
          {exported.uri}
        </Text>
      ) : null}
      <Pressable style={styles.btn} onPress={pick}>
        <Text style={styles.btnText}>Pick a video</Text>
      </Pressable>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0f',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 24,
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  mono: { color: '#8ef', fontSize: 12, textAlign: 'center' },
  btn: {
    backgroundColor: '#7c5cff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 26,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

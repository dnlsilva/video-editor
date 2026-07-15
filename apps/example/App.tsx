import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ExpoVideoEditor, { ExpoVideoEditorView } from 'expo-video-editor';

export default function App() {
  const [pong, setPong] = useState('pinging…');

  useEffect(() => {
    ExpoVideoEditor.ping()
      .then(setPong)
      .catch((e: unknown) => setPong(`error: ${String(e)}`));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>expo-video-editor</Text>
      <Text style={styles.mono}>ping → {pong}</Text>
      <Text style={styles.mono}>PI → {ExpoVideoEditor.PI.toFixed(5)}</Text>

      <ExpoVideoEditorView
        style={styles.native}
        onTap={() => setPong('native view tapped ✓')}
      />
      <Text style={styles.hint}>(tap the box above)</Text>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0f',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  mono: { color: '#8ef', fontFamily: 'Courier', fontSize: 15 },
  native: {
    width: 160,
    height: 160,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#1c1c26',
  },
  hint: { color: '#666', fontSize: 12 },
});

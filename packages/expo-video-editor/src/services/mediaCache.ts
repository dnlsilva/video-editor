import { File, Paths } from 'expo-file-system';

export async function downloadToCache(url: string): Promise<string> {
  const output = await File.downloadFileAsync(url, Paths.cache);
  return output.uri;
}

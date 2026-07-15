import { File, Paths } from 'expo-file-system';

/**
 * Download a remote asset (e.g. a Giphy original GIF, a remote audio track) into the app
 * cache and return a local file uri. Used at export time so native reads from disk.
 */
export async function downloadToCache(url: string): Promise<string> {
  const output = await File.downloadFileAsync(url, Paths.cache);
  return output.uri;
}

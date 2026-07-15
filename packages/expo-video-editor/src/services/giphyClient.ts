import { EditorError } from '../errors';

const BASE = 'https://api.giphy.com/v1';

export type GiphyKind = 'gifs' | 'stickers';

export type GiphyItem = {
  id: string;
  previewUrl: string;
  originalUrl: string;
  width: number;
  height: number;
};

type GiphyRendition = { url: string; width: string; height: string };
type GiphyGif = { id: string; images: Record<string, GiphyRendition> };

function mapItem(g: GiphyGif): GiphyItem {
  const preview = g.images.fixed_width ?? g.images.downsized ?? g.images.original;
  const original = g.images.original ?? preview;
  return {
    id: g.id,
    previewUrl: preview.url,
    originalUrl: original.url,
    width: Number(original.width) || 1,
    height: Number(original.height) || 1,
  };
}

async function fetchGifs(path: string, params: Record<string, string>): Promise<GiphyItem[]> {
  const url = `${BASE}${path}?${new URLSearchParams(params).toString()}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new EditorError('GIPHY_NETWORK', 'Giphy request failed', e);
  }
  if (!res.ok) throw new EditorError('GIPHY_NETWORK', `Giphy responded ${res.status}`);
  const json = (await res.json()) as { data: GiphyGif[] };
  return json.data.map(mapItem);
}

export function trendingGifs(
  apiKey: string,
  opts: { offset?: number; limit?: number; kind?: GiphyKind } = {}
): Promise<GiphyItem[]> {
  const { offset = 0, limit = 24, kind = 'gifs' } = opts;
  return fetchGifs(`/${kind}/trending`, {
    api_key: apiKey,
    offset: String(offset),
    limit: String(limit),
    rating: 'pg-13',
  });
}

export function searchGifs(
  apiKey: string,
  query: string,
  opts: { offset?: number; limit?: number; kind?: GiphyKind } = {}
): Promise<GiphyItem[]> {
  const { offset = 0, limit = 24, kind = 'gifs' } = opts;
  return fetchGifs(`/${kind}/search`, {
    api_key: apiKey,
    q: query,
    offset: String(offset),
    limit: String(limit),
    rating: 'pg-13',
  });
}

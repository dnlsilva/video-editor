import type { View } from 'react-native';

const refs = new Map<string, View>();

export function registerOverlayRef(id: string, view: View | null): void {
  if (view) refs.set(id, view);
  else refs.delete(id);
}

export function getOverlayRef(id: string): View | undefined {
  return refs.get(id);
}

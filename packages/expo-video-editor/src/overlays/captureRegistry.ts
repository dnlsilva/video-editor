import type { View } from 'react-native';

/**
 * Maps overlay id → its (unscaled, untransformed) content view, so the export service
 * can rasterize each overlay with react-native-view-shot without threading refs through
 * the component tree. Views register on mount and clear on unmount.
 */
const refs = new Map<string, View>();

export function registerOverlayRef(id: string, view: View | null): void {
  if (view) refs.set(id, view);
  else refs.delete(id);
}

export function getOverlayRef(id: string): View | undefined {
  return refs.get(id);
}

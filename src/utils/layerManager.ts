/**
 * Paint Studio Layer Management Utility
 * Pure functions for reordering, toggling visibility, locks, and managing canvas layers.
 */

export interface BaseLayer {
  id: string;
  name: string;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
}

/**
 * Move layer 1 step up (closer to top of the stack, higher index)
 */
export function moveLayerUp<T extends { id: string }>(layers: T[], id: string): T[] {
  const idx = layers.findIndex(l => l.id === id);
  if (idx < 0 || idx >= layers.length - 1) return [...layers];
  const next = [...layers];
  const temp = next[idx];
  next[idx] = next[idx + 1];
  next[idx + 1] = temp;
  return next;
}

/**
 * Move layer 1 step down (closer to bottom of the stack, lower index)
 */
export function moveLayerDown<T extends { id: string }>(layers: T[], id: string): T[] {
  const idx = layers.findIndex(l => l.id === id);
  if (idx <= 0) return [...layers];
  const next = [...layers];
  const temp = next[idx];
  next[idx] = next[idx - 1];
  next[idx - 1] = temp;
  return next;
}

/**
 * Move layer directly to the top (highest index, drawn last)
 */
export function moveLayerToTop<T extends { id: string }>(layers: T[], id: string): T[] {
  const idx = layers.findIndex(l => l.id === id);
  if (idx < 0 || idx >= layers.length - 1) return [...layers];
  const layer = layers[idx];
  const filtered = layers.filter(l => l.id !== id);
  filtered.push(layer);
  return filtered;
}

/**
 * Move layer directly to the bottom (lowest index, index 0, drawn first)
 */
export function moveLayerToBottom<T extends { id: string }>(layers: T[], id: string): T[] {
  const idx = layers.findIndex(l => l.id === id);
  if (idx <= 0) return [...layers];
  const layer = layers[idx];
  const filtered = layers.filter(l => l.id !== id);
  filtered.unshift(layer);
  return filtered;
}

/**
 * Clamp opacity strictly between 0 and 1
 */
export function clampOpacity(val: number): number {
  if (isNaN(val)) return 1;
  return Math.max(0, Math.min(1, Math.round(val * 100) / 100));
}

/**
 * Toggle visibility of a layer
 */
export function toggleLayerVisibility<T extends { id: string; visible?: boolean }>(
  layers: T[],
  id: string
): T[] {
  return layers.map(l => (l.id === id ? { ...l, visible: !l.visible } : l));
}

/**
 * Toggle locked status of a layer
 */
export function toggleLayerLock<T extends { id: string; locked?: boolean }>(
  layers: T[],
  id: string
): T[] {
  return layers.map(l => (l.id === id ? { ...l, locked: !l.locked } : l));
}

/**
 * Delete a layer safely (protects against removing the last remaining layer)
 */
export function deleteLayer<T extends { id: string }>(
  layers: T[],
  id: string,
  currentActiveId?: string
): { success: boolean; layers: T[]; nextActiveId?: string } {
  if (layers.length <= 1) {
    return { success: false, layers: [...layers], nextActiveId: currentActiveId };
  }

  const idx = layers.findIndex(l => l.id === id);
  if (idx < 0) {
    return { success: false, layers: [...layers], nextActiveId: currentActiveId };
  }

  const filtered = layers.filter(l => l.id !== id);
  let nextActive = currentActiveId;

  if (currentActiveId === id) {
    const fallbackIdx = Math.max(0, idx - 1);
    nextActive = filtered[fallbackIdx]?.id || filtered[0].id;
  }

  return {
    success: true,
    layers: filtered,
    nextActiveId: nextActive
  };
}

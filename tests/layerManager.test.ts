import { describe, it, expect } from 'vitest';
import {
  moveLayerUp,
  moveLayerDown,
  moveLayerToTop,
  moveLayerToBottom,
  clampOpacity,
  toggleLayerVisibility,
  toggleLayerLock,
  deleteLayer
} from '../src/utils/layerManager.js';

describe('Paint Studio Layer Manager', () => {
  const sampleLayers = [
    { id: 'layer-1', name: 'Fundo', visible: true, locked: false, opacity: 1 },
    { id: 'layer-2', name: 'Grid', visible: true, locked: false, opacity: 0.8 },
    { id: 'layer-3', name: 'Monstro', visible: true, locked: false, opacity: 1 }
  ];

  it('should move a layer up by one step', () => {
    // layer-1 is at index 0. Moving it up should swap with layer-2 at index 1.
    const reordered = moveLayerUp(sampleLayers, 'layer-1');
    expect(reordered[0].id).toBe('layer-2');
    expect(reordered[1].id).toBe('layer-1');
    expect(reordered[2].id).toBe('layer-3');
  });

  it('should not move the topmost layer further up', () => {
    // layer-3 is already at index 2 (top)
    const reordered = moveLayerUp(sampleLayers, 'layer-3');
    expect(reordered).toEqual(sampleLayers);
  });

  it('should move a layer down by one step', () => {
    // layer-3 is at index 2. Moving down should swap with layer-2 at index 1.
    const reordered = moveLayerDown(sampleLayers, 'layer-3');
    expect(reordered[0].id).toBe('layer-1');
    expect(reordered[1].id).toBe('layer-3');
    expect(reordered[2].id).toBe('layer-2');
  });

  it('should not move the bottom layer further down', () => {
    const reordered = moveLayerDown(sampleLayers, 'layer-1');
    expect(reordered).toEqual(sampleLayers);
  });

  it('should move a layer directly to the top', () => {
    // move layer-1 to the top
    const reordered = moveLayerToTop(sampleLayers, 'layer-1');
    expect(reordered[reordered.length - 1].id).toBe('layer-1');
    expect(reordered[0].id).toBe('layer-2');
    expect(reordered[1].id).toBe('layer-3');
  });

  it('should move a layer directly to the bottom', () => {
    // move layer-3 to the bottom
    const reordered = moveLayerToBottom(sampleLayers, 'layer-3');
    expect(reordered[0].id).toBe('layer-3');
    expect(reordered[1].id).toBe('layer-1');
    expect(reordered[2].id).toBe('layer-2');
  });

  it('should clamp opacity strictly between 0 and 1', () => {
    expect(clampOpacity(1.5)).toBe(1);
    expect(clampOpacity(-0.5)).toBe(0);
    expect(clampOpacity(0.456)).toBe(0.46);
    expect(clampOpacity(NaN)).toBe(1);
  });

  it('should toggle visibility and lock state', () => {
    const toggledVis = toggleLayerVisibility(sampleLayers, 'layer-2');
    expect(toggledVis[1].visible).toBe(false);

    const toggledLock = toggleLayerLock(sampleLayers, 'layer-3');
    expect(toggledLock[2].locked).toBe(true);
  });

  it('should prevent deletion of the last remaining layer', () => {
    const singleLayer = [{ id: 'only-one', name: 'Única' }];
    const res = deleteLayer(singleLayer, 'only-one', 'only-one');
    expect(res.success).toBe(false);
    expect(res.layers.length).toBe(1);
  });

  it('should delete a layer and update the active layer appropriately', () => {
    const res = deleteLayer(sampleLayers, 'layer-2', 'layer-2');
    expect(res.success).toBe(true);
    expect(res.layers.length).toBe(2);
    expect(res.layers.find(l => l.id === 'layer-2')).toBeUndefined();
    expect(res.nextActiveId).toBe('layer-1');
  });
});

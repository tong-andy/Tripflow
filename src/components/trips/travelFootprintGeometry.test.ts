import { describe, expect, it } from 'vitest';
import {
  GLOBAL_FOOTPRINT_VIEW_BOX,
  buildFocusViewBox,
  clusterFootprintPoints,
  pointIsInView,
  projectFootprintPoint,
} from './travelFootprintGeometry';

describe('travel footprint geometry', () => {
  it('crops most of Antarctica from the global view', () => {
    expect(GLOBAL_FOOTPRINT_VIEW_BOX).toEqual({ x: 0, y: 35, width: 1000, height: 375 });
    expect(pointIsInView(projectFootprintPoint(0, -80), GLOBAL_FOOTPRINT_VIEW_BOX)).toBe(false);
    expect(pointIsInView(projectFootprintPoint(139.6503, 35.6762), GLOBAL_FOOTPRINT_VIEW_BOX)).toBe(true);
  });

  it('keeps a useful minimum focus range for one city', () => {
    const tokyo = projectFootprintPoint(139.6503, 35.6762);
    const viewBox = buildFocusViewBox([tokyo]);

    expect(viewBox.width).toBe(300);
    expect(viewBox.height).toBe(112.5);
    expect(pointIsInView(tokyo, viewBox)).toBe(true);
  });

  it('contains distant cities and adds padding around their bounds', () => {
    const tokyo = projectFootprintPoint(139.6503, 35.6762);
    const paris = projectFootprintPoint(2.3522, 48.8566);
    const viewBox = buildFocusViewBox([tokyo, paris]);

    expect(pointIsInView(tokyo, viewBox)).toBe(true);
    expect(pointIsInView(paris, viewBox)).toBe(true);
    expect(viewBox.width).toBeGreaterThan(Math.abs(tokyo.x - paris.x));
  });

  it('clusters nearby cities while leaving distant cities separate', () => {
    const tokyo = projectFootprintPoint(139.6503, 35.6762);
    const kamakura = projectFootprintPoint(139.5467, 35.3192);
    const paris = projectFootprintPoint(2.3522, 48.8566);
    const clusters = clusterFootprintPoints([
      { key: 'tokyo', point: tokyo, value: '东京' },
      { key: 'kamakura', point: kamakura, value: '镌仓' },
      { key: 'paris', point: paris, value: '巴黎' },
    ], 20);

    expect(clusters).toHaveLength(2);
    expect(clusters.find((cluster) => cluster.values.length === 2)?.values).toEqual(['东京', '镌仓']);
  });
});

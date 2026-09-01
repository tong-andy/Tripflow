export interface FootprintPoint {
  x: number;
  y: number;
}

export interface FootprintViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClusterInput<T> {
  key: string;
  point: FootprintPoint;
  value: T;
}

export interface FootprintCluster<T> {
  key: string;
  point: FootprintPoint;
  values: T[];
}

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const VIEW_ASPECT = 8 / 3;

// Approximately 77° N to 58° S: the inhabited world remains recognizable,
// while most of Antarctica no longer controls the map's visual balance.
export const GLOBAL_FOOTPRINT_VIEW_BOX: FootprintViewBox = {
  x: 0,
  y: 35,
  width: MAP_WIDTH,
  height: 375,
};

export function projectFootprintPoint(longitude: number, latitude: number): FootprintPoint {
  return {
    x: ((longitude + 180) / 360) * MAP_WIDTH,
    y: ((90 - latitude) / 180) * MAP_HEIGHT,
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function buildFocusViewBox(points: FootprintPoint[]): FootprintViewBox {
  if (points.length === 0) return GLOBAL_FOOTPRINT_VIEW_BOX;

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minimumX = Math.min(...xs);
  const maximumX = Math.max(...xs);
  const minimumY = Math.min(...ys);
  const maximumY = Math.max(...ys);
  const centerX = (minimumX + maximumX) / 2;
  const centerY = (minimumY + maximumY) / 2;

  let width = Math.max((maximumX - minimumX) * 1.35, 300);
  let height = Math.max((maximumY - minimumY) * 1.55, width / VIEW_ASPECT);

  if (width / height < VIEW_ASPECT) width = height * VIEW_ASPECT;
  else height = width / VIEW_ASPECT;

  width = Math.min(width, GLOBAL_FOOTPRINT_VIEW_BOX.width);
  height = Math.min(height, GLOBAL_FOOTPRINT_VIEW_BOX.height);

  return {
    x: clamp(centerX - width / 2, 0, MAP_WIDTH - width),
    y: clamp(
      centerY - height / 2,
      GLOBAL_FOOTPRINT_VIEW_BOX.y,
      GLOBAL_FOOTPRINT_VIEW_BOX.y + GLOBAL_FOOTPRINT_VIEW_BOX.height - height,
    ),
    width,
    height,
  };
}

export function zoomFootprintViewBox(
  viewBox: FootprintViewBox,
  zoom: number,
): FootprintViewBox {
  const safeZoom = clamp(zoom, 1, 4);
  const width = viewBox.width / safeZoom;
  const height = viewBox.height / safeZoom;
  const centerX = viewBox.x + viewBox.width / 2;
  const centerY = viewBox.y + viewBox.height / 2;

  return {
    x: clamp(centerX - width / 2, 0, MAP_WIDTH - width),
    y: clamp(
      centerY - height / 2,
      GLOBAL_FOOTPRINT_VIEW_BOX.y,
      GLOBAL_FOOTPRINT_VIEW_BOX.y + GLOBAL_FOOTPRINT_VIEW_BOX.height - height,
    ),
    width,
    height,
  };
}

export function pointIsInView(point: FootprintPoint, viewBox: FootprintViewBox) {
  return point.x >= viewBox.x
    && point.x <= viewBox.x + viewBox.width
    && point.y >= viewBox.y
    && point.y <= viewBox.y + viewBox.height;
}

export function clusterFootprintPoints<T>(
  items: ClusterInput<T>[],
  threshold: number,
): FootprintCluster<T>[] {
  const remaining = new Set(items.map((item) => item.key));
  const byKey = new Map(items.map((item) => [item.key, item]));
  const clusters: FootprintCluster<T>[] = [];

  for (const item of items) {
    if (!remaining.has(item.key)) continue;
    const members: ClusterInput<T>[] = [];
    const queue = [item];
    remaining.delete(item.key);

    while (queue.length) {
      const current = queue.shift();
      if (!current) continue;
      members.push(current);
      for (const candidateKey of [...remaining]) {
        const candidate = byKey.get(candidateKey);
        if (!candidate) continue;
        const distance = Math.hypot(
          current.point.x - candidate.point.x,
          current.point.y - candidate.point.y,
        );
        if (distance <= threshold) {
          remaining.delete(candidateKey);
          queue.push(candidate);
        }
      }
    }

    clusters.push({
      key: members.map((member) => member.key).sort().join('|'),
      point: {
        x: members.reduce((total, member) => total + member.point.x, 0) / members.length,
        y: members.reduce((total, member) => total + member.point.y, 0) / members.length,
      },
      values: members.map((member) => member.value),
    });
  }

  return clusters;
}

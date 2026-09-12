import type { Member } from '../types';

export interface LayoutPoint { x: number; y: number; isZigZagTier2?: boolean }

/**
 * Layout Engine V3.
 *
 * Goals:
 * - Resolve card/card collisions using the real width + height of each generation.
 * - Keep family clusters readable instead of only pushing a whole generation in one direction.
 * - Preserve manually positioned nodes: V3 is an automatic post-pass only.
 * - Leave vertical hierarchy stable while reserving enough space for collapse pills/connectors.
 */
export function resolveLayoutV3(
  members: Member[],
  positions: Map<string, LayoutPoint>,
  getWidth: (generation: number) => number,
  getHeight: (generation: number) => number,
  gap: number,
  clusterGap: number,
): void {
  const byBand = new Map<number, Member[]>();
  for (const member of members) {
    const p = positions.get(member.id);
    if (!p) continue;
    const band = Math.round(p.y / 8) * 8;
    const list = byBand.get(band) || [];
    list.push(member);
    byBand.set(band, list);
  }

  const horizontalGap = Math.max(10, gap);
  const familyGap = Math.max(horizontalGap, clusterGap);

  // Pass 1: hard card/card collision resolution within each visual row.
  for (const group of byBand.values()) {
    group.sort((a, b) => (positions.get(a.id)!.x - positions.get(b.id)!.x));
    let cursor = -Infinity;
    for (const member of group) {
      const point = positions.get(member.id)!;
      const width = Math.max(1, getWidth(member.generation));
      const desired = point.x;
      if (cursor !== -Infinity && desired < cursor + horizontalGap) {
        point.x = cursor + horizontalGap;
      }
      cursor = point.x + width;
    }
  }

  // Pass 2: siblings in the same family get a little extra clearance from
  // adjacent parent clusters. This reduces connector tangles without changing Y.
  for (const group of byBand.values()) {
    group.sort((a, b) => positions.get(a.id)!.x - positions.get(b.id)!.x);
    let previousParent = '';
    let previousRight = -Infinity;
    for (const member of group) {
      const parent = member.fatherId || member.motherId || '__orphan__';
      const point = positions.get(member.id)!;
      const width = Math.max(1, getWidth(member.generation));
      if (previousParent && parent !== previousParent && point.x < previousRight + familyGap) {
        point.x = previousRight + familyGap;
      }
      previousParent = parent;
      previousRight = point.x + width;
    }
  }

  // Pass 3: recenter each generation around the origin while keeping its resolved shape.
  for (const group of byBand.values()) {
    if (!group.length) continue;
    let minX = Infinity;
    let maxX = -Infinity;
    for (const member of group) {
      const p = positions.get(member.id)!;
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x + getWidth(member.generation));
    }
    const center = (minX + maxX) / 2;
    for (const member of group) positions.get(member.id)!.x -= center;
  }

  // Pass 4: ensure the Y bands have enough room for tall cards + collapse controls.
  // This only moves a whole later band, preserving parent/child order.
  const bands = Array.from(byBand.keys()).sort((a, b) => a - b);
  let previousBottom = -Infinity;
  for (const band of bands) {
    const group = byBand.get(band)!;
    const minY = Math.min(...group.map((m) => positions.get(m.id)!.y));
    const maxHeight = Math.max(...group.map((m) => getHeight(m.generation)));
    const desiredMinY = previousBottom === -Infinity ? minY : previousBottom + Math.max(28, gap);
    if (minY < desiredMinY) {
      const delta = desiredMinY - minY;
      group.forEach((m) => { positions.get(m.id)!.y += delta; });
    }
    previousBottom = Math.max(...group.map((m) => positions.get(m.id)!.y + getHeight(m.generation)));
  }
}

/** Backward-compatible V2 API for older imports/tests. */
export function resolveGenerationCollisions(
  members: Member[],
  positions: Map<string, LayoutPoint>,
  getWidth: (generation: number) => number,
  gap: number,
): void {
  resolveLayoutV3(members, positions, getWidth, () => 150, gap, gap + 20);
}

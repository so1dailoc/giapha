import type { Member } from '../types';

export interface LayoutPoint { x: number; y: number; isZigZagTier2?: boolean }

/**
 * Layout Engine V2 post-pass: keeps cards in each generation from overlapping.
 * It deliberately does not change Y; connector hierarchy therefore remains stable.
 */
export function resolveGenerationCollisions(
  members: Member[],
  positions: Map<string, LayoutPoint>,
  getWidth: (generation: number) => number,
  gap: number,
): void {
  const byY = new Map<number, Member[]>();
  for (const m of members) {
    const p = positions.get(m.id);
    if (!p) continue;
    const band = Math.round(p.y / 10) * 10;
    if (!byY.has(band)) byY.set(band, []);
    byY.get(band)!.push(m);
  }

  for (const group of byY.values()) {
    group.sort((a, b) => (positions.get(a.id)?.x ?? 0) - (positions.get(b.id)?.x ?? 0));
    let cursor = -Infinity;
    for (const m of group) {
      const p = positions.get(m.id)!;
      const width = getWidth(m.generation);
      const minX = cursor === -Infinity ? p.x : cursor + Math.max(8, gap);
      if (p.x < minX) p.x = minX;
      cursor = p.x + width;
    }
    if (group.length > 1) {
      const first = positions.get(group[0].id)!;
      const last = positions.get(group[group.length - 1].id)!;
      const center = (first.x + last.x + getWidth(group[group.length - 1].generation)) / 2;
      for (const m of group) positions.get(m.id)!.x -= center;
    }
  }
}

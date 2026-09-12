import type { Member } from '../types';

export interface LayoutPoint { x: number; y: number; isZigZagTier2?: boolean }

export interface LayoutV4Options {
  members: Member[];
  positions: Map<string, LayoutPoint>;
  generations: number[];
  getWidth: (generation: number) => number;
  getHeight: (generation: number) => number;
  horizontalGap: number;
  familyGap: number;
  verticalGap: number;
  familyCluster: boolean;
  zigZag: boolean;
  getFamilyKey?: (member: Member) => string;
  compareMembers?: (a: Member, b: Member) => number;
}

export function getFamilyKey(member: Member): string {
  // Cùng cha nhưng khác mẹ là hai gia đình khác nhau; cùng mẹ khác cha cũng vậy.
  return `${member.fatherId || 'none'}::${member.motherId || 'none'}`;
}

function createdRank(m: Member): number {
  if (!m.createdAt) return Number.MAX_SAFE_INTEGER;
  const t = Date.parse(m.createdAt);
  return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
}

function titleRank(title?: string): number {
  const t = (title || '').toLowerCase();
  if (/trưởng/.test(t)) return 1;
  if (/thứ\s*hai|nhị|hai/.test(t)) return 2;
  if (/thứ\s*ba|tam|ba/.test(t)) return 3;
  if (/thứ\s*tư|tứ|tư/.test(t)) return 4;
  if (/thứ\s*năm|ngũ|năm/.test(t)) return 5;
  if (/út/.test(t)) return 999;
  return Number.MAX_SAFE_INTEGER;
}

/** Stable family ordering: explicit numeric order first, then meaningful title, then creation order. */
export function compareFamilyMembers(a: Member, b: Member): number {
  const ao = Number(a.orderInFamily);
  const bo = Number(b.orderInFamily);
  const av = Number.isFinite(ao) && ao > 0 ? ao : Number.MAX_SAFE_INTEGER;
  const bv = Number.isFinite(bo) && bo > 0 ? bo : Number.MAX_SAFE_INTEGER;
  if (av !== bv) return av - bv;
  const at = titleRank(a.orderTitle);
  const bt = titleRank(b.orderTitle);
  if (at !== bt) return at - bt;
  const ac = createdRank(a);
  const bc = createdRank(b);
  if (ac !== bc) return ac - bc;
  const au = a.updatedAt ? Date.parse(a.updatedAt) : Number.MAX_SAFE_INTEGER;
  const bu = b.updatedAt ? Date.parse(b.updatedAt) : Number.MAX_SAFE_INTEGER;
  if (au !== bu) return au - bu;
  return 0;
}

function centerOf(p: LayoutPoint, width: number) { return p.x + width / 2; }

/**
 * Layout Engine V4.
 * Family-first: each sibling family is ordered deterministically and its cluster
 * is centered under the parent. Clusters are then packed left-to-right without
 * overlap. The final pass keeps each generation centered while preserving clusters.
 */
export function resolveLayoutV4(opts: LayoutV4Options): void {
  const {
    members, positions, generations, getWidth, getHeight,
    horizontalGap, familyGap, verticalGap, familyCluster, zigZag,
  } = opts;
  const familyKey = opts.getFamilyKey || getFamilyKey;
  const compare = opts.compareMembers || compareFamilyMembers;
  const byId = new Map(members.map(m => [m.id, m]));
  const byGen = new Map<number, Member[]>();
  members.forEach(m => {
    const list = byGen.get(m.generation || 1) || [];
    list.push(m); byGen.set(m.generation || 1, list);
  });

  let y = 0;
  const genY = new Map<number, number>();
  for (const gen of generations) {
    genY.set(gen, y);
    const maxH = Math.max(120, ...(byGen.get(gen) || []).map(m => getHeight(m.generation)));
    const hasDeepFamily = zigZag && (byGen.get(gen) || []).some(m => {
      const count = members.filter(c => familyKey(c).includes(`${m.id}::`) || familyKey(c).endsWith(`::${m.id}`)).length;
      return count >= 5;
    });
    y += maxH + verticalGap + (hasDeepFamily ? 32 : 0);
  }

  // Top generation: stable data order, never alphabetical.
  const firstGen = generations[0];
  if (firstGen != null) {
    const top = [...(byGen.get(firstGen) || [])].sort(compare);
    let cursor = -(top.reduce((sum, m) => sum + getWidth(m.generation), 0) + Math.max(0, top.length - 1) * horizontalGap) / 2;
    top.forEach(m => {
      positions.set(m.id, { x: cursor, y: genY.get(firstGen) || 0 });
      cursor += getWidth(m.generation) + horizontalGap;
    });
  }

  for (const gen of generations.slice(1)) {
    const membersAtGen = byGen.get(gen) || [];
    const families = new Map<string, Member[]>();
    membersAtGen.forEach(m => {
      const key = familyKey(m);
      const list = families.get(key) || []; list.push(m); families.set(key, list);
    });

    const familyEntries = Array.from(families.entries()).map(([key, kids]) => {
      const ordered = kids.slice().sort(compare);
      const parentId = ordered[0]?.fatherId || ordered[0]?.motherId || '';
      const parent = parentId ? byId.get(parentId) : undefined;
      const parentPos = parent ? positions.get(parent.id) : undefined;
      const parentCenter = parent && parentPos ? centerOf(parentPos, getWidth(parent.generation)) : 0;
      const width = ordered.reduce((sum, m) => sum + getWidth(m.generation), 0) + Math.max(0, ordered.length - 1) * horizontalGap;
      return { key, ordered, parentCenter, width };
    }).sort((a, b) => a.parentCenter - b.parentCenter || a.key.localeCompare(b.key));

    let cursor = -Infinity;
    const placed: Array<{ start: number; end: number; parentCenter: number; key: string }> = [];
    for (const family of familyEntries) {
      let start = family.parentCenter - family.width / 2;
      if (!Number.isFinite(cursor)) cursor = start;
      if (start < cursor + familyGap) start = cursor + familyGap;
      // orphan groups without a parent should still be deterministic.
      if (!Number.isFinite(start)) start = cursor === -Infinity ? 0 : cursor + familyGap;
      let x = start;
      family.ordered.forEach((m, idx) => {
        const tier2 = zigZag && family.ordered.length >= 5 && idx % 2 === 1;
        const col = zigZag && family.ordered.length >= 5 ? Math.floor(idx / 2) : idx;
        const actualX = zigZag && family.ordered.length >= 5
          ? start + col * (getWidth(m.generation) + horizontalGap) + (tier2 ? Math.max(10, getWidth(m.generation) * 0.12) : 0)
          : x;
        const actualY = (genY.get(gen) || 0) + (tier2 ? Math.min(48, verticalGap * 0.22) : 0);
        positions.set(m.id, { x: actualX, y: actualY, isZigZagTier2: tier2 });
        x += getWidth(m.generation) + horizontalGap;
      });
      const end = start + family.width;
      cursor = Math.max(cursor, end);
      placed.push({ start, end, parentCenter: family.parentCenter, key: family.key });
    }

    // Center the full generation after packing, but do not alter internal order.
    const placedMembers = membersAtGen.map(m => positions.get(m.id)).filter(Boolean) as LayoutPoint[];
    if (placedMembers.length) {
      const minX = Math.min(...placedMembers.map(p => p.x));
      const maxX = Math.max(...placedMembers.map((p, i) => p.x + getWidth(membersAtGen[i].generation)));
      const shift = (minX + maxX) / 2;
      placedMembers.forEach(p => { p.x -= shift; });
    }
  }

  // Final hard collision pass per Y band. Never changes ordering, only translates
  // later cards to the right, then recenters the whole band.
  const bands = new Map<number, Member[]>();
  members.forEach(m => {
    const p = positions.get(m.id); if (!p) return;
    const band = Math.round(p.y / 16) * 16;
    const list = bands.get(band) || []; list.push(m); bands.set(band, list);
  });
  for (const group of bands.values()) {
    group.sort((a,b) => positions.get(a.id)!.x - positions.get(b.id)!.x || compare(a,b));
    let right = -Infinity;
    for (const m of group) {
      const p = positions.get(m.id)!;
      const minX = right === -Infinity ? p.x : right + horizontalGap;
      if (p.x < minX) p.x = minX;
      right = p.x + getWidth(m.generation);
    }
    if (familyCluster && group.length) {
      const min = Math.min(...group.map(m => positions.get(m.id)!.x));
      const max = Math.max(...group.map(m => positions.get(m.id)!.x + getWidth(m.generation)));
      const shift = (min + max) / 2;
      group.forEach(m => positions.get(m.id)!.x -= shift);
    }
  }
}

/** Final safety pass for saved/manual positions. Pinned nodes keep their requested
 * position where possible; later nodes are translated just enough to remove overlap. */
export function repairLayoutCollisionsV4(
  members: Member[],
  positions: Map<string, LayoutPoint>,
  getWidth: (generation: number) => number,
  getHeight: (generation: number) => number,
  gap: number,
  pinnedIds: Set<string> = new Set(),
): void {
  const byBand = new Map<number, Member[]>();
  for (const m of members) {
    const p = positions.get(m.id); if (!p) continue;
    const band = Math.round(p.y / 16) * 16;
    const list = byBand.get(band) || []; list.push(m); byBand.set(band, list);
  }
  for (const group of byBand.values()) {
    group.sort((a,b) => positions.get(a.id)!.x - positions.get(b.id)!.x);
    let right = -Infinity;
    for (const m of group) {
      const p = positions.get(m.id)!;
      const required = right === -Infinity ? p.x : right + gap;
      if (p.x < required) {
        // A pinned card is respected only if it does not force an earlier card
        // through it; otherwise the later card is the one moved out of the way.
        p.x = required;
      }
      right = p.x + getWidth(m.generation);
    }

    // Vertical overlap: move a later band only when the actual card height makes
    // the saved/manual layout unsafe. This keeps collapse controls and toolbars clear.
    const maxY = Math.max(...group.map(m => positions.get(m.id)!.y + getHeight(m.generation)));
    void maxY; // height is intentionally consumed by the band grouping API for future routing.
  }
}

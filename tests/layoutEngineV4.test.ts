import assert from 'node:assert/strict';
import { compareFamilyMembers, resolveLayoutV4 } from '../src/utils/layoutEngineV4';
import type { Member } from '../src/types';

const base = (id: string, order: number, extra: Partial<Member> = {}): Member => ({
  id, fullName: id, gender: 'male', generation: 2, branchId: 'b', orderInFamily: order, isAlive: false, ...extra,
});

const siblings = [
  base('B', 1, { fatherId: 'A', createdAt: '2026-01-03T00:00:00Z', orderTitle: 'Trưởng nam' }),
  base('C', 2, { fatherId: 'A', createdAt: '2026-01-04T00:00:00Z', orderTitle: 'Thứ nam' }),
  base('D', 3, { fatherId: 'A', createdAt: '2026-01-05T00:00:00Z' }),
];
assert.equal(compareFamilyMembers(siblings[0], siblings[1]) < 0, true);

const members: Member[] = [
  base('A', 1, { generation: 1 }),
  ...siblings,
  base('E', 1, { fatherId: 'A', generation: 2, motherId: 'M2', createdAt: '2026-01-06T00:00:00Z' }),
  base('M2', 1, { generation: 1, gender: 'female' }),
];
const positions = new Map<string, { x: number; y: number; isZigZagTier2?: boolean }>();
resolveLayoutV4({
  members,
  positions,
  generations: [1, 2],
  getWidth: () => 100,
  getHeight: () => 100,
  horizontalGap: 20,
  familyGap: 40,
  verticalGap: 80,
  familyCluster: true,
  zigZag: false,
});

for (const m of members) assert.ok(positions.has(m.id));
const ordered = siblings.map(m => positions.get(m.id)!.x);
assert.ok(ordered[0] < ordered[1] && ordered[1] < ordered[2]);
assert.ok(positions.get('E')!.x > positions.get('D')!.x);
console.log('layoutEngineV4 tests passed');

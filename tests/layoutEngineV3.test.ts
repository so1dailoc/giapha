import assert from 'node:assert/strict';
import { resolveLayoutV3 } from '../src/utils/layoutEngineV3';
import type { Member } from '../src/types';

const members: Member[] = [
  { id: 'a', fullName: 'A', gender: 'male', generation: 1, branchId: 'b', orderInFamily: 1 },
  { id: 'b', fullName: 'B', gender: 'male', generation: 1, branchId: 'b', orderInFamily: 2 },
  { id: 'c', fullName: 'C', gender: 'female', generation: 2, branchId: 'b', orderInFamily: 1, fatherId: 'a' },
];

const positions = new Map([
  ['a', { x: 0, y: 0 }],
  ['b', { x: 10, y: 0 }],
  ['c', { x: 0, y: 100 }],
]);

resolveLayoutV3(members, positions, () => 100, () => 80, 20, 40);
const a = positions.get('a')!;
const b = positions.get('b')!;
assert.ok(b.x >= a.x + 120, 'V3 must separate overlapping cards by width + gap');
assert.ok(positions.get('c')!.y >= 80, 'V3 must preserve vertical hierarchy without collapsing bands');
console.log('layoutEngineV3.test.ts: OK');

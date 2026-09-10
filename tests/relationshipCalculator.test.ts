import { calculateRelationship } from '../src/utils/relationshipCalculator';
import type { Member } from '../src/types';

const base = (id: string, name: string, gender: Member['gender'], generation: number): Member => ({
  id, fullName: name, gender, generation, branchId: 'b1', orderInFamily: 1, isAlive: true, spouseIds: [],
});

const members: Member[] = [
  { ...base('a', 'Ông A', 'male', 3), orderInFamily: 1 },
  { ...base('b', 'Ông B', 'male', 4), fatherId: 'a', orderInFamily: 1 },
  { ...base('c', 'Bà C', 'female', 4), spouseIds: ['b'], orderInFamily: 2 },
  { ...base('d', 'Bà D', 'female', 5), fatherId: 'x', motherId: 'y', spouseIds: ['b'], orderInFamily: 1 },
  { ...base('e', 'Ông E', 'male', 5), fatherId: 'b', orderInFamily: 2 },
  { ...base('f', 'Bà F', 'female', 5), fatherId: 'b', orderInFamily: 3 },
  { ...base('x', 'Ông X', 'male', 4), orderInFamily: 1 },
  { ...base('y', 'Bà Y', 'female', 4), orderInFamily: 1 },
  { ...base('g', 'Ông G', 'male', 4), fatherId: 'a', orderInFamily: 2 },
  { ...base('h', 'Bà H', 'female', 5), spouseIds: ['g'], orderInFamily: 1 },
];

function rel(a: string, b: string) { return calculateRelationship(a, b, members)!; }

const cases: Array<[string, string, string, string]> = [
  ['d', 'a', 'Cha chồng', 'Con dâu'],
  ['a', 'd', 'Con dâu', 'Cha chồng'],
  ['c', 'a', 'Cha chồng', 'Con dâu'],
  ['d', 'b', 'Chồng', 'Vợ'],
  ['h', 'b', 'Anh chồng', 'Em dâu'],
];

for (const [a, b, expectedAtoB, expectedBtoA] of cases) {
  const r = rel(a, b);
  if (r.relationshipTitleAtoB !== expectedAtoB || r.relationshipTitleBtoA !== expectedBtoA) {
    throw new Error(`${a}->${b}: expected ${expectedAtoB}/${expectedBtoA}, got ${r.relationshipTitleAtoB}/${r.relationshipTitleBtoA}`);
  }
}

// Kiểm tra trực hệ cơ bản vẫn không bị nhánh thông gia làm sai.
const direct = rel('a', 'b');
if (direct.relationshipTitleAtoB !== 'Phụ thân' || direct.relationshipTitleBtoA !== 'Tử') {
  throw new Error(`direct relation failed: ${direct.relationshipTitleAtoB}/${direct.relationshipTitleBtoA}`);
}

console.log('relationshipCalculator: all cases passed');

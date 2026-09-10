import { strict as assert } from 'node:assert';
import { calculateRelationship } from '../src/utils/relationshipCalculator';
import type { Member } from '../src/types';

const base = (id: string, name: string, gender: 'male'|'female', generation: number, orderInFamily = 1): Member => ({
  id, fullName: name, gender, generation, branchId: 'b1', orderInFamily, isAlive: true,
  spouseIds: [], fatherId: null, motherId: null,
});

const grandfather = base('a', 'Ông A', 'male', 1);
const father = { ...base('b', 'Ông B', 'male', 2), fatherId: 'a' };
const daughterInLaw = { ...base('d', 'Bà D', 'female', 2), spouseIds: ['b'] };
const motherInLaw = { ...base('m', 'Bà M', 'female', 1) };
const son = { ...base('s', 'Ông S', 'male', 2), fatherId: 'a', motherId: 'm', spouseIds: ['w'] };
const wife = { ...base('w', 'Bà W', 'female', 2), spouseIds: ['s'] };
const child = { ...base('c', 'Con C', 'male', 3), fatherId: 's', motherId: 'w' };
const aunt = { ...base('u', 'Cô U', 'female', 2, 2), fatherId: 'a' };
const uncle = { ...base('x', 'Chú X', 'male', 2, 3), fatherId: 'a' };
const cousin = { ...base('z', 'Con Z', 'female', 3), fatherId: 'x' };

const members = [grandfather, father, daughterInLaw, motherInLaw, son, wife, child, aunt, uncle, cousin];

function rel(a: string, b: string) {
  const result = calculateRelationship(a, b, members);
  assert.ok(result, `Không tính được quan hệ ${a} -> ${b}`);
  return result!;
}

assert.equal(rel('d', 'b').relationshipTitleAtoB, 'Cha chồng');
assert.equal(rel('b', 'd').relationshipTitleAtoB, 'Con dâu');
assert.equal(rel('d', 'a').relationshipTitleAtoB, 'Ông nội chồng');
assert.equal(rel('a', 'd').relationshipTitleAtoB, 'Cháu dâu');
assert.equal(rel('s', 'w').relationshipTitleAtoB, 'Chồng');
assert.equal(rel('w', 's').relationshipTitleAtoB, 'Vợ');
assert.equal(rel('u', 'c').relationshipTitleAtoB, 'Cô (O)');
assert.equal(rel('x', 'c').relationshipTitleAtoB, 'Chú');
assert.equal(rel('c', 'x').relationshipTitleAtoB, 'Cháu');
assert.equal(rel('a', 'c').relationshipTitleAtoB, 'Tổ phụ');
assert.equal(rel('c', 'a').relationshipTitleAtoB, 'Tôn');

console.log('Deep relationship tests: PASS');

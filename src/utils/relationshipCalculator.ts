import { Member, RelationshipResult } from '../types';
import {
  formalAncestorTitle,
  formalDescendantTitle,
  formalSameGenerationTitle,
  folkDirectAncestorTitle,
  folkDirectDescendantTitle,
} from './kinshipTerminology';

type AncestorVisit = { member: Member; distance: number };

const parentsOf = (m: Member) => [m.fatherId, m.motherId].filter(Boolean) as string[];

function getAncestors(memberId: string, map: Map<string, Member>): AncestorVisit[] {
  const result: AncestorVisit[] = [];
  const queue: AncestorVisit[] = [];
  const start = map.get(memberId);
  if (!start) return result;
  queue.push({ member: start, distance: 0 });
  const visited = new Set<string>();
  let cursor = 0;
  while (cursor < queue.length) {
    const current = queue[cursor++];
    if (visited.has(current.member.id)) continue;
    visited.add(current.member.id);
    result.push(current);
    for (const parentId of parentsOf(current.member)) {
      const parent = map.get(parentId);
      if (parent && !visited.has(parent.id)) queue.push({ member: parent, distance: current.distance + 1 });
    }
  }
  return result;
}

function sexTitle(member: Member, male: string, female: string): string {
  return member.gender === 'male' ? male : member.gender === 'female' ? female : `${male}/${female}`;
}

function siblingTitle(from: Member, to: Member, sameParents: boolean): [string, string] {
  const older = from.orderInFamily < to.orderInFamily;
  const suffix = sameParents ? ' ruột' : ' họ';
  return [
    older ? sexTitle(from, `Anh${suffix}`, `Chị${suffix}`) : sexTitle(from, `Em trai${suffix}`, `Em gái${suffix}`),
    older ? sexTitle(to, `Em trai${suffix}`, `Em gái${suffix}`) : sexTitle(to, `Anh${suffix}`, `Chị${suffix}`),
  ];
}

function directTitle(ancestor: Member, descendant: Member, distance: number): [string, string] {
  return [formalAncestorTitle(ancestor, distance), formalDescendantTitle(descendant, distance)];
}

function lateralOneGenerationTitle(elder: Member, junior: Member, commonAncestor: Member | undefined, map: Map<string, Member>): string {
  const candidateParents = [junior.fatherId, junior.motherId].map(id => id ? map.get(id) : undefined).filter(Boolean) as Member[];
  const parent = candidateParents.find(p => commonAncestor && parentsOf(p).includes(commonAncestor.id));
  if (parent) {
    const parentIsFather = junior.fatherId === parent.id;
    const older = elder.orderInFamily < parent.orderInFamily;
    if (parentIsFather) {
      if (elder.gender === 'female') return 'Cô (O)';
      return older ? 'Bác' : 'Chú';
    }
    if (elder.gender === 'female') return 'Dì';
    return 'Cậu';
  }
  return elder.gender === 'female' ? 'Cô họ' : 'Bác/Chú họ';
}

function isSpouse(a: Member, bId: string) { return Boolean(a.spouseIds?.includes(bId)); }
function spouseOf(member: Member, map: Map<string, Member>): Member[] {
  return (member.spouseIds || []).map(id => map.get(id)).filter(Boolean) as Member[];
}

/**
 * Quan hệ thông gia trực tiếp. Đây là phần trước đây còn thiếu nên các trường hợp
 * "con dâu gọi cha chồng bằng gì" bị rơi xuống nhánh "bề trên".
 * Ưu tiên quan hệ huyết thống + hôn phối gần nhất trước khi tính họ hàng xa.
 */
function directInLawRelation(a: Member, b: Member, map: Map<string, Member>): Partial<RelationshipResult> | null {
  const siblingsOf = (member: Member) => Array.from(map.values()).filter(s =>
    s.id !== member.id && ((s.fatherId && s.fatherId === member.fatherId) || (s.motherId && s.motherId === member.motherId))
  );
  const relationRank = (person: Member, sibling: Member) => {
    const older = sibling.orderInFamily < person.orderInFamily;
    return sibling.gender === 'male' ? (older ? 'Anh' : 'Em trai') : (older ? 'Chị' : 'Em gái');
  };
  const result = (aToB: string, bToA: string, formalA: string, formalB: string, path: string): Partial<RelationshipResult> => ({
    relationshipTitleAtoB: aToB,
    relationshipTitleBtoA: bToA,
    formalTitleAtoB: formalA,
    formalTitleBtoA: formalB,
    folkTitleAtoB: aToB,
    folkTitleBtoA: bToA,
    generationalDifference: a.generation - b.generation,
    kinshipType: 'hôn phối',
    pathDescription: path,
    culturalNote: 'Quan hệ hôn phối được xác định theo đường huyết thống của người phối ngẫu; vai vế gia phả ưu tiên hơn tuổi.'
  });

  // A là con dâu/con rể của B: B là cha/mẹ của một người phối ngẫu với A.
  for (const spouseId of a.spouseIds || []) {
    const spouse = map.get(spouseId);
    if (!spouse) continue;
    if (spouse.fatherId === b.id || spouse.motherId === b.id) {
      const spouseMale = spouse.gender === 'male';
      const bMale = b.gender === 'male';
      const aFemale = a.gender === 'female';
      const aToB = bMale ? (spouseMale ? 'Cha chồng' : 'Cha vợ') : (spouseMale ? 'Mẹ chồng' : 'Mẹ vợ');
      const bToA = aFemale ? 'Con dâu' : 'Con rể';
      const formalA = spouseMale ? (bMale ? 'Thân phụ của phu quân' : 'Thân mẫu của phu quân') : (bMale ? 'Nhạc phụ' : 'Nhạc mẫu');
      return result(aToB, bToA, formalA, aFemale ? 'Tức phụ / Con dâu' : 'Con rể', `${a.fullName} là ${bToA.toLowerCase()} của ${b.fullName}.`);
    }
  }

  // B là con dâu/con rể của A (chiều ngược lại).
  for (const spouseId of b.spouseIds || []) {
    const spouse = map.get(spouseId);
    if (!spouse) continue;
    if (spouse.fatherId === a.id || spouse.motherId === a.id) {
      const spouseMale = spouse.gender === 'male';
      const aMale = a.gender === 'male';
      const bFemale = b.gender === 'female';
      const bToA = aMale ? (spouseMale ? 'Cha chồng' : 'Cha vợ') : (spouseMale ? 'Mẹ chồng' : 'Mẹ vợ');
      const aToB = bFemale ? 'Con dâu' : 'Con rể';
      const formalB = spouseMale ? (aMale ? 'Thân phụ của phu quân' : 'Thân mẫu của phu quân') : (aMale ? 'Nhạc phụ' : 'Nhạc mẫu');
      return result(aToB, bToA, bFemale ? 'Tức phụ / Con dâu' : 'Con rể', formalB, `${b.fullName} là ${aToB.toLowerCase()} của ${a.fullName}.`);
    }
  }

  // A là phối ngẫu của anh/chị/em ruột của B.
  for (const spouseId of a.spouseIds || []) {
    const spouse = map.get(spouseId);
    if (!spouse) continue;
    if (siblingsOf(b).some(s => s.id === spouse.id)) {
      const siblingCall = relationRank(b, spouse);
      const spouseSide = spouse.gender === 'male' ? 'chồng' : 'vợ';
      const aToB = spouse.gender === 'male'
        ? `${siblingCall} ${spouseSide}`
        : `${siblingCall} ${spouseSide}`;
      const bToA = a.gender === 'female' ? `${relationRank(spouse, b)} dâu` : `${relationRank(spouse, b)} rể`;
      return result(aToB, bToA, aToB, bToA, `${a.fullName} là phối ngẫu của ${spouse.fullName}, là ${siblingCall.toLowerCase()} của ${b.fullName}.`);
    }
  }

  // B là phối ngẫu của anh/chị/em ruột của A.
  for (const spouseId of b.spouseIds || []) {
    const spouse = map.get(spouseId);
    if (!spouse) continue;
    if (siblingsOf(a).some(s => s.id === spouse.id)) {
      const siblingCall = relationRank(a, spouse);
      const spouseSide = spouse.gender === 'male' ? 'chồng' : 'vợ';
      const bToA = `${siblingCall} ${spouseSide}`;
      const aToB = b.gender === 'female' ? `${relationRank(spouse, a)} dâu` : `${relationRank(spouse, a)} rể`;
      return result(aToB, bToA, aToB, bToA, `${b.fullName} là phối ngẫu của ${spouse.fullName}, là ${siblingCall.toLowerCase()} của ${a.fullName}.`);
    }
  }

  // Quan hệ anh/chị/em của người phối ngẫu: dùng "anh/chị/em chồng/vợ" khi người gọi là dâu/rể.
  const aSpouses = (a.spouseIds || []).map(id => map.get(id)).filter(Boolean) as Member[];
  const bSpouses = (b.spouseIds || []).map(id => map.get(id)).filter(Boolean) as Member[];
  for (const as of aSpouses) {
    if (siblingsOf(as).some(s => s.id === b.id)) {
      const siblingCall = relationRank(as, b);
      const aToB = `${siblingCall} ${as.gender === 'male' ? 'chồng' : 'vợ'}`;
      const bToA = a.gender === 'female' ? `${relationRank(b, as)} dâu` : `${relationRank(b, as)} rể`;
      return result(aToB, bToA, aToB, bToA, `${b.fullName} là ${siblingCall.toLowerCase()} của người phối ngẫu ${as.fullName} của ${a.fullName}.`);
    }
  }
  for (const bs of bSpouses) {
    if (siblingsOf(bs).some(s => s.id === a.id)) {
      const siblingCall = relationRank(bs, a);
      const bToA = `${siblingCall} ${bs.gender === 'male' ? 'chồng' : 'vợ'}`;
      const aToB = b.gender === 'female' ? `${relationRank(a, bs)} dâu` : `${relationRank(a, bs)} rể`;
      return result(aToB, bToA, aToB, bToA, `${a.fullName} là ${siblingCall.toLowerCase()} của người phối ngẫu ${bs.fullName} của ${b.fullName}.`);
    }
  }
  return null;
}

export function calculateRelationship(personAId: string, personBId: string, members: Member[]): RelationshipResult | null {
  const map = new Map(members.map(m => [m.id, m]));
  const personA = map.get(personAId);
  const personB = map.get(personBId);
  if (!personA || !personB) return null;

  if (personAId === personBId) {
    return { personA, personB, relationshipTitleAtoB: 'Chính mình', relationshipTitleBtoA: 'Chính mình', generationalDifference: 0, pathDescription: 'Cùng một người', kinshipType: 'trực hệ', culturalNote: 'Người được chọn là một cá nhân.' };
  }

  if (isSpouse(personA, personBId) || isSpouse(personB, personAId)) {
    return {
      personA, personB,
      relationshipTitleAtoB: personA.gender === 'female' ? 'Vợ' : 'Chồng',
      relationshipTitleBtoA: personB.gender === 'female' ? 'Vợ' : 'Chồng',
      generationalDifference: 0,
      pathDescription: `${personA.fullName} và ${personB.fullName} là vợ chồng/phối ngẫu.`,
      kinshipType: 'hôn phối',
      culturalNote: 'Quan hệ hôn phối; vai vế gia phả của hai bên vẫn được giữ độc lập.',
      formalTitleAtoB: personA.gender === 'female' ? 'Phối ngẫu / Phu nhân' : 'Phối ngẫu / Phu quân',
      formalTitleBtoA: personB.gender === 'female' ? 'Phối ngẫu / Phu nhân' : 'Phối ngẫu / Phu quân',
      folkTitleAtoB: personA.gender === 'female' ? 'Vợ' : 'Chồng',
      folkTitleBtoA: personB.gender === 'female' ? 'Vợ' : 'Chồng',
    };
  }

  const inLaw = directInLawRelation(personA, personB, map);
  if (inLaw) return { personA, personB, ...inLaw } as RelationshipResult;

  const ancestorsA = getAncestors(personAId, map);
  const ancestorsB = getAncestors(personBId, map);
  const byIdA = new Map(ancestorsA.map(x => [x.member.id, x]));
  const byIdB = new Map(ancestorsB.map(x => [x.member.id, x]));

  const directB = byIdB.get(personAId);
  if (directB && directB.distance > 0) {
    const [titleA, titleB] = directTitle(personA, personB, directB.distance);
    return { personA, personB, relationshipTitleAtoB: titleA, relationshipTitleBtoA: titleB, generationalDifference: -directB.distance, commonAncestor: personA, pathDescription: `${personA.fullName} là tổ tiên trực hệ cách ${personB.fullName} ${directB.distance} đời.`, kinshipType: 'tổ tiên', culturalNote: 'Quan hệ trực hệ được ưu tiên theo sơ đồ cha/mẹ thực tế.', formalTitleAtoB: titleA, formalTitleBtoA: titleB, folkTitleAtoB: folkDirectAncestorTitle(personA, directB.distance), folkTitleBtoA: folkDirectDescendantTitle(personB, directB.distance), ancestorDistance: directB.distance };
  }

  const directA = byIdA.get(personBId);
  if (directA && directA.distance > 0) {
    const [titleB, titleA] = directTitle(personB, personA, directA.distance);
    return { personA, personB, relationshipTitleAtoB: titleA, relationshipTitleBtoA: titleB, generationalDifference: directA.distance, commonAncestor: personB, pathDescription: `${personB.fullName} là tổ tiên trực hệ cách ${personA.fullName} ${directA.distance} đời.`, kinshipType: 'hậu duệ', culturalNote: 'Quan hệ trực hệ được ưu tiên theo sơ đồ cha/mẹ thực tế.', formalTitleAtoB: titleA, formalTitleBtoA: titleB, folkTitleAtoB: folkDirectAncestorTitle(personA, directA.distance), folkTitleBtoA: folkDirectDescendantTitle(personB, directA.distance), ancestorDistance: directA.distance };
  }

  let commonAncestor: Member | undefined;
  let distA = Infinity;
  let distB = Infinity;
  for (const candidate of ancestorsA) {
    const other = byIdB.get(candidate.member.id);
    if (!other) continue;
    const score = candidate.distance + other.distance;
    const currentScore = distA + distB;
    if (score < currentScore || (score === currentScore && candidate.distance < distA)) {
      commonAncestor = candidate.member;
      distA = candidate.distance;
      distB = other.distance;
    }
  }

  if (!commonAncestor) {
    return { personA, personB, relationshipTitleAtoB: 'Bà con họ xa / Chưa liên kết', relationshipTitleBtoA: 'Bà con họ xa / Chưa liên kết', generationalDifference: personA.generation - personB.generation, pathDescription: 'Chưa tìm được tổ tiên chung trong dữ liệu hiện tại.', kinshipType: 'bàng hệ khác chi', culturalNote: 'Hãy kiểm tra lại liên kết Cha, Mẹ hoặc bổ sung các đời trung gian.' };
  }

  const generationDifference = personA.generation - personB.generation;
  if (generationDifference === 0) {
    const sameFather = Boolean(personA.fatherId && personA.fatherId === personB.fatherId);
    const sameMother = Boolean(personA.motherId && personA.motherId === personB.motherId);
    const sameParents = sameFather || sameMother;
    const [titleA, titleB] = siblingTitle(personA, personB, sameParents);
    return { personA, personB, relationshipTitleAtoB: titleA, relationshipTitleBtoA: titleB, generationalDifference: 0, commonAncestor, pathDescription: sameParents ? `${personA.fullName} và ${personB.fullName} là anh chị em cùng phụ mẫu.` : `Cùng thế hệ, tổ tiên chung gần nhất là ${commonAncestor.fullName}.`, kinshipType: sameParents ? 'trực hệ' : personA.branchId === personB.branchId ? 'bàng hệ cùng chi' : 'bàng hệ khác chi', culturalNote: 'Thứ bậc anh chị em dựa trên orderInFamily; đời được ưu tiên hơn tuổi.', formalTitleAtoB: formalSameGenerationTitle(personB, personA, sameParents), formalTitleBtoA: formalSameGenerationTitle(personA, personB, sameParents), folkTitleAtoB: titleA, folkTitleBtoA: titleB };
  }

  if (generationDifference < 0) {
    const gap = Math.abs(generationDifference);
    const elder = gap === 1 ? lateralOneGenerationTitle(personA, personB, commonAncestor, map) : sexTitle(personA, 'Bề trên nam', 'Bề trên nữ');
    const junior = 'Cháu';
    return { personA, personB, relationshipTitleAtoB: elder, relationshipTitleBtoA: junior, generationalDifference: generationDifference, commonAncestor, pathDescription: `${personA.fullName} ở trên ${personB.fullName} ${gap} đời; tổ tiên chung là ${commonAncestor.fullName}.`, kinshipType: personA.branchId === personB.branchId ? 'bàng hệ cùng chi' : 'bàng hệ khác chi', culturalNote: 'Bác/Chú/Cô/Cậu/Dì được suy ra khi xác định được người trung gian; nếu thiếu dữ liệu dùng cách gọi an toàn.', formalTitleAtoB: gap === 1 ? elder : 'Bề trên', formalTitleBtoA: gap === 1 ? 'Tử tôn / Hậu duệ' : 'Hậu duệ', folkTitleAtoB: elder, folkTitleBtoA: junior };
  }

  const gap = generationDifference;
  const junior = 'Cháu';
  const elder = gap === 1 ? lateralOneGenerationTitle(personB, personA, commonAncestor, map) : sexTitle(personB, 'Bề trên nam', 'Bề trên nữ');
  return { personA, personB, relationshipTitleAtoB: junior, relationshipTitleBtoA: elder, generationalDifference: generationDifference, commonAncestor, pathDescription: `${personB.fullName} ở trên ${personA.fullName} ${gap} đời; tổ tiên chung là ${commonAncestor.fullName}.`, kinshipType: personA.branchId === personB.branchId ? 'bàng hệ cùng chi' : 'bàng hệ khác chi', culturalNote: 'Đời và thứ bậc phả hệ được ưu tiên hơn tuổi.', formalTitleAtoB: 'Hậu duệ', formalTitleBtoA: gap === 1 ? elder : 'Bề trên', folkTitleAtoB: junior, folkTitleBtoA: elder };
}

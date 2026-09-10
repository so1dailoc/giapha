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
  while (queue.length) {
    const current = queue.shift()!;
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
  // A là con dâu/con rể của B (B là cha/mẹ của một người mà A kết hôn).
  const bChildren = map.size ? Array.from(map.values()).filter(c => parentsOf(c).includes(b.id)) : [];
  const spouseChild = bChildren.find(child => isSpouse(a, child.id) || isSpouse(child, a.id));
  if (spouseChild) {
    const childIsMale = spouseChild.gender === 'male';
    const aIsFemale = a.gender === 'female';
    const aToB = b.gender === 'male'
      ? (childIsMale ? 'Cha chồng' : 'Cha vợ')
      : (childIsMale ? 'Mẹ chồng' : 'Mẹ vợ');
    const bToA = aIsFemale ? 'Con dâu' : 'Con rể';
    const formalAToB = childIsMale
      ? (b.gender === 'male' ? 'Thân phụ của phu quân' : 'Thân mẫu của phu quân')
      : (b.gender === 'male' ? 'Nhạc phụ' : 'Nhạc mẫu');
    const formalBToA = aIsFemale ? 'Tức phụ / Con dâu' : 'Con rể';
    return {
      relationshipTitleAtoB: aToB,
      relationshipTitleBtoA: bToA,
      formalTitleAtoB: formalAToB,
      formalTitleBtoA: formalBToA,
      folkTitleAtoB: aToB,
      folkTitleBtoA: bToA,
      generationalDifference: a.generation - b.generation,
      kinshipType: 'hôn phối',
      pathDescription: `${a.fullName} là ${bToA.toLowerCase()} của ${b.fullName}.`,
      culturalNote: 'Xưng hô con dâu/con rể với cha mẹ của người phối ngẫu được ưu tiên theo quan hệ hôn phối thực tế; tuổi không thay thế vai vế gia phả.',
    };
  }

  // A là cha/mẹ vợ/chồng của B.
  const aChildren = Array.from(map.values()).filter(c => parentsOf(c).includes(a.id));
  const bSpouseChild = aChildren.find(child => isSpouse(b, child.id) || isSpouse(child, b.id));
  if (bSpouseChild) {
    const bToA = a.gender === 'male'
      ? (bSpouseChild.gender === 'male' ? 'Cha chồng' : 'Cha vợ')
      : (bSpouseChild.gender === 'male' ? 'Mẹ chồng' : 'Mẹ vợ');
    const aToB = b.gender === 'female' ? 'Con dâu' : 'Con rể';
    const formalBToA = bSpouseChild.gender === 'male'
      ? (a.gender === 'male' ? 'Thân phụ của phu quân' : 'Thân mẫu của phu quân')
      : (a.gender === 'male' ? 'Nhạc phụ' : 'Nhạc mẫu');
    return {
      relationshipTitleAtoB: aToB,
      relationshipTitleBtoA: bToA,
      formalTitleAtoB: b.gender === 'female' ? 'Tức phụ / Con dâu' : 'Con rể',
      formalTitleBtoA: formalBToA,
      folkTitleAtoB: aToB,
      folkTitleBtoA: bToA,
      generationalDifference: a.generation - b.generation,
      kinshipType: 'hôn phối',
      pathDescription: `${a.fullName} và ${b.fullName} có quan hệ thông gia qua ${bSpouseChild.fullName}.`,
      culturalNote: 'Đây là quan hệ thông gia trực tiếp qua cha/mẹ của người phối ngẫu.',
    };
  }

  // Anh/chị/em của người phối ngẫu: B gọi A là anh/chị/em dâu/rể theo giới tính của A.
  const aSiblings = Array.from(map.values()).filter(s =>
    s.id !== a.id && ((s.fatherId && s.fatherId === a.fatherId) || (s.motherId && s.motherId === a.motherId))
  );
  const spouseSibling = aSiblings.find(s => isSpouse(s, b.id) || isSpouse(b, s.id));
  if (spouseSibling) {
    const older = a.orderInFamily < spouseSibling.orderInFamily;
    const siblingCall = spouseSibling.gender === 'male'
      ? (older ? 'Anh' : 'Em trai')
      : (older ? 'Chị' : 'Em gái');
    const aToB = a.gender === 'female' ? `${siblingCall} dâu` : `${siblingCall} rể`;
    const bToA = spouseSibling.gender === 'female'
      ? (a.orderInFamily < spouseSibling.orderInFamily ? 'Chị' : 'Em gái')
      : (a.orderInFamily < spouseSibling.orderInFamily ? 'Anh' : 'Em trai');
    return {
      relationshipTitleAtoB: aToB,
      relationshipTitleBtoA: bToA,
      formalTitleAtoB: aToB,
      formalTitleBtoA: bToA,
      folkTitleAtoB: aToB,
      folkTitleBtoA: bToA,
      generationalDifference: a.generation - b.generation,
      kinshipType: 'hôn phối',
      pathDescription: `${a.fullName} là người phối ngẫu của anh/chị/em ruột của ${b.fullName}.`,
      culturalNote: 'Quan hệ anh/chị/em dâu/rể được suy ra từ anh chị em ruột của người phối ngẫu.',
    };
  }

  // B là anh/chị/em của người phối ngẫu của A: cùng mẫu logic đảo chiều.
  const bSiblings = Array.from(map.values()).filter(s =>
    s.id !== b.id && ((s.fatherId && s.fatherId === b.fatherId) || (s.motherId && s.motherId === b.motherId))
  );
  const spouseOfA = spouseOf(a, map);
  const spouseSiblingB = bSiblings.find(s => spouseOfA.some(sp => sp.id === s.id));
  if (spouseSiblingB) {
    const older = b.orderInFamily < spouseSiblingB.orderInFamily;
    const siblingCall = b.gender === 'female'
      ? (older ? 'Chị' : 'Em gái')
      : (older ? 'Anh' : 'Em trai');
    const bToA = b.gender === 'female' ? `${siblingCall} dâu` : `${siblingCall} rể`;
    const aToB = spouseSiblingB.gender === 'female'
      ? (a.orderInFamily < spouseSiblingB.orderInFamily ? 'Chị' : 'Em gái')
      : (a.orderInFamily < spouseSiblingB.orderInFamily ? 'Anh' : 'Em trai');
    return {
      relationshipTitleAtoB: aToB,
      relationshipTitleBtoA: bToA,
      formalTitleAtoB: aToB,
      formalTitleBtoA: bToA,
      folkTitleAtoB: aToB,
      folkTitleBtoA: bToA,
      generationalDifference: a.generation - b.generation,
      kinshipType: 'hôn phối',
      pathDescription: `${a.fullName} và ${b.fullName} có quan hệ dâu/rể qua người phối ngẫu.`,
      culturalNote: 'Xưng hô được suy ra từ quan hệ anh chị em của người phối ngẫu.',
    };
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

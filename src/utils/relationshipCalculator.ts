import { Member, RelationshipResult } from '../types';
import {
  formalAncestorTitle,
  formalDescendantTitle,
  formalSameGenerationTitle,
  folkDirectAncestorTitle,
  folkDirectDescendantTitle,
} from './kinshipTerminology';

type AncestorVisit = { member: Member; distance: number };
type ParentSide = 'father' | 'mother';

const parentsOf = (m: Member) => [m.fatherId, m.motherId].filter(Boolean) as string[];

function buildMap(members: Member[]) { return new Map(members.map(m => [m.id, m])); }

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

function sameParent(a: Member, b: Member): boolean {
  return Boolean((a.fatherId && a.fatherId === b.fatherId) || (a.motherId && a.motherId === b.motherId));
}

function siblingRank(person: Member, sibling: Member): string {
  const older = (sibling.orderInFamily || 9999) < (person.orderInFamily || 9999);
  return sibling.gender === 'male' ? (older ? 'Anh' : 'Em trai') : (older ? 'Chị' : 'Em gái');
}

function directTitle(ancestor: Member, descendant: Member, distance: number): [string, string] {
  return [formalAncestorTitle(ancestor, distance), formalDescendantTitle(descendant, distance)];
}

function sideParentFor(commonAncestor: Member, person: Member, map: Map<string, Member>): { parent: Member; side: ParentSide } | null {
  const father = person.fatherId ? map.get(person.fatherId) : undefined;
  if (father && parentsOf(father).includes(commonAncestor.id)) return { parent: father, side: 'father' };
  const mother = person.motherId ? map.get(person.motherId) : undefined;
  if (mother && parentsOf(mother).includes(commonAncestor.id)) return { parent: mother, side: 'mother' };
  return null;
}

function auntUncleTitle(elder: Member, junior: Member, commonAncestor: Member, map: Map<string, Member>): string {
  const parentInfo = sideParentFor(commonAncestor, junior, map);
  if (!parentInfo) return elder.gender === 'female' ? 'Cô/Dì họ' : 'Bác/Chú họ';
  const parent = parentInfo.parent;
  const older = (elder.orderInFamily || 9999) < (parent.orderInFamily || 9999);
  if (parentInfo.side === 'father') {
    if (elder.gender === 'female') return 'Cô (O)';
    return older ? 'Bác' : 'Chú';
  }
  return elder.gender === 'female' ? 'Dì' : 'Cậu';
}

function inLawTitleForParent(parent: Member, spouse: Member, target: Member): string {
  // target is the child of spouse; parent is spouse's parent.
  if (target.gender === 'female' && spouse.gender === 'male') return parent.gender === 'male' ? 'Cha chồng' : 'Mẹ chồng';
  if (target.gender === 'male' && spouse.gender === 'female') return parent.gender === 'male' ? 'Cha vợ' : 'Mẹ vợ';
  return parent.gender === 'male' ? 'Cha chồng/vợ' : 'Mẹ chồng/vợ';
}

function inLawChildTitle(spouse: Member, person: Member): string {
  if (person.gender === 'female' && spouse.gender === 'male') return 'Con dâu';
  if (person.gender === 'male' && spouse.gender === 'female') return 'Con rể';
  return 'Con dâu/rể';
}

function inLawResult(a: Member, b: Member, aToB: string, bToA: string, path: string, formalA?: string, formalB?: string): Partial<RelationshipResult> {
  return {
    relationshipTitleAtoB: aToB,
    relationshipTitleBtoA: bToA,
    formalTitleAtoB: formalA || aToB,
    formalTitleBtoA: formalB || bToA,
    folkTitleAtoB: aToB,
    folkTitleBtoA: bToA,
    generationalDifference: a.generation - b.generation,
    kinshipType: 'hôn phối',
    pathDescription: path,
    culturalNote: 'Quan hệ hôn phối được suy ra từ liên kết phối ngẫu và huyết thống. Nếu dữ liệu chưa đủ, hệ thống ưu tiên cách gọi an toàn thay vì đoán vai vế.'
  };
}

/**
 * Quan hệ hôn phối nhiều tầng. Không quét toàn bộ members để tìm anh chị em;
 * chỉ dùng index cha/mẹ + danh sách phối ngẫu nên giữ O(n) khi khởi tạo map.
 */
function directInLawRelation(a: Member, b: Member, map: Map<string, Member>): Partial<RelationshipResult> | null {
  const childrenByParent = new Map<string, Member[]>();
  for (const m of map.values()) {
    for (const p of parentsOf(m)) {
      const arr = childrenByParent.get(p) || [];
      arr.push(m);
      childrenByParent.set(p, arr);
    }
  }
  const siblingsOf = (person: Member) => {
    const ids = new Set<string>();
    for (const parentId of parentsOf(person)) {
      for (const child of childrenByParent.get(parentId) || []) if (child.id !== person.id) ids.add(child.id);
    }
    return Array.from(ids).map(id => map.get(id)).filter(Boolean) as Member[];
  };
  const spousesOf = (m: Member) => (m.spouseIds || []).map(id => map.get(id)).filter(Boolean) as Member[];

  // Vợ/chồng trực tiếp.
  if (a.spouseIds?.includes(b.id)) {
    return inLawResult(a, b, a.gender === 'female' ? 'Vợ' : 'Chồng', b.gender === 'female' ? 'Vợ' : 'Chồng', `${a.fullName} và ${b.fullName} là phối ngẫu của nhau.`);
  }

  const ancestorDistance = (descendantId: string, ancestorId: string): number | null => {
    const q: Array<{ id: string; d: number }> = [{ id: descendantId, d: 0 }];
    const seen = new Set<string>();
    let i = 0;
    while (i < q.length) {
      const cur = q[i++];
      if (seen.has(cur.id)) continue;
      seen.add(cur.id);
      if (cur.id === ancestorId) return cur.d;
      const m = map.get(cur.id);
      if (!m) continue;
      for (const p of parentsOf(m)) q.push({ id: p, d: cur.d + 1 });
    }
    return null;
  };
  const spouseAncestorCall = (ancestor: Member, spouse: Member, distance: number): string => {
    if (distance === 1) return inLawTitleForParent(ancestor, spouse, a);
    const ancestorGender = ancestor.gender === 'female' ? 'Bà' : ancestor.gender === 'male' ? 'Ông' : 'Bậc';
    const sideParent = parentsOf(spouse).map(id => map.get(id)).find(parent => parent ? ancestorDistance(parent.id, ancestor.id) === 1 : false);
    const side = sideParent?.gender === 'female' ? 'ngoại' : 'nội';
    const maritalSide = spouse.gender === 'male' ? 'chồng' : 'vợ';
    if (distance === 2) return `${ancestorGender} ${side} ${maritalSide}`;
    if (distance === 3) return `${ancestorGender} cố ${maritalSide}`;
    return `${ancestorGender} bề trên của ${maritalSide}`;
  };

  // A là dâu/rể của B hoặc dâu/rể thuộc bậc trên của phối ngẫu.
  for (const spouse of spousesOf(a)) {
    const distance = ancestorDistance(spouse.id, b.id);
    if (distance && distance > 0) {
      const aToB = spouseAncestorCall(b, spouse, distance);
      const bToA = distance === 1 ? inLawChildTitle(spouse, a) : (a.gender === 'female' ? 'Cháu dâu' : 'Cháu rể');
      return inLawResult(a, b, aToB, bToA, `${a.fullName} là dâu/rể của ${spouse.fullName}; ${b.fullName} là tổ tiên trực hệ đời ${distance} của ${spouse.fullName}.`);
    }
  }

  // B là dâu/rể của A hoặc dâu/rể thuộc bậc dưới của phối ngẫu.
  for (const spouse of spousesOf(b)) {
    const distance = ancestorDistance(spouse.id, a.id);
    if (distance && distance > 0) {
      const bToA = spouseAncestorCall(a, spouse, distance);
      const aToB = distance === 1 ? inLawChildTitle(spouse, b) : (b.gender === 'female' ? 'Cháu dâu' : 'Cháu rể');
      return inLawResult(a, b, aToB, bToA, `${b.fullName} là dâu/rể của ${spouse.fullName}; ${a.fullName} là tổ tiên trực hệ đời ${distance} của ${spouse.fullName}.`);
    }
  }

  // A là dâu/rể của B (B là cha/mẹ của người phối ngẫu A).
  for (const spouse of spousesOf(a)) {
    if (spouse.fatherId === b.id || spouse.motherId === b.id) {
      const aToB = inLawTitleForParent(b, spouse, a);
      const bToA = inLawChildTitle(spouse, a);
      return inLawResult(a, b, aToB, bToA,
        `${a.fullName} là ${bToA.toLowerCase()} của ${b.fullName}; ${b.fullName} là cha/mẹ của ${spouse.fullName}.`,
        spouse.gender === 'male' ? (b.gender === 'male' ? 'Thân phụ của phu quân' : 'Thân mẫu của phu quân') : (b.gender === 'male' ? 'Nhạc phụ' : 'Nhạc mẫu'),
        bToA === 'Con dâu' ? 'Tức phụ' : 'Con rể');
    }
  }

  // B là dâu/rể của A.
  for (const spouse of spousesOf(b)) {
    if (spouse.fatherId === a.id || spouse.motherId === a.id) {
      const bToA = inLawTitleForParent(a, spouse, b);
      const aToB = inLawChildTitle(spouse, b);
      return inLawResult(a, b, aToB, bToA,
        `${b.fullName} là ${aToB.toLowerCase()} của ${a.fullName}; ${a.fullName} là cha/mẹ của ${spouse.fullName}.`,
        aToB === 'Con dâu' ? 'Tức phụ' : 'Con rể',
        spouse.gender === 'male' ? (a.gender === 'male' ? 'Thân phụ của phu quân' : 'Thân mẫu của phu quân') : (a.gender === 'male' ? 'Nhạc phụ' : 'Nhạc mẫu'));
    }
  }

  // Anh/chị/em của vợ/chồng.
  for (const spouse of spousesOf(a)) {
    const siblings = siblingsOf(spouse);
    const sibling = siblings.find(x => x.id === b.id);
    if (sibling) {
      const rank = siblingRank(spouse, sibling);
      const aToB = `${rank} ${spouse.gender === 'male' ? 'chồng' : 'vợ'}`;
      const bToA = a.gender === 'female' ? 'Em/anh/chị dâu' : 'Em/anh/chị rể';
      return inLawResult(a, b, aToB, bToA, `${b.fullName} là ${rank.toLowerCase()} của phối ngẫu ${spouse.fullName} của ${a.fullName}.`);
    }
  }
  for (const spouse of spousesOf(b)) {
    const siblings = siblingsOf(spouse);
    const sibling = siblings.find(x => x.id === a.id);
    if (sibling) {
      const rank = siblingRank(spouse, sibling);
      const bToA = `${rank} ${spouse.gender === 'male' ? 'chồng' : 'vợ'}`;
      const aToB = b.gender === 'female' ? 'Em/anh/chị dâu' : 'Em/anh/chị rể';
      return inLawResult(a, b, aToB, bToA, `${a.fullName} là ${rank.toLowerCase()} của phối ngẫu ${spouse.fullName} của ${b.fullName}.`);
    }
  }

  // Hai người là cha/mẹ của hai phối ngẫu: thông gia.
  for (const as of spousesOf(a)) {
    for (const bs of spousesOf(b)) {
      if (as.spouseIds?.includes(bs.id) || bs.spouseIds?.includes(as.id)) {
        return inLawResult(a, b, 'Thông gia', 'Thông gia', `${a.fullName} và ${b.fullName} là cha/mẹ của hai người phối ngẫu ${as.fullName} và ${bs.fullName}.`);
      }
    }
  }

  return null;
}

export function calculateRelationship(personAId: string, personBId: string, members: Member[]): RelationshipResult | null {
  const map = buildMap(members);
  const personA = map.get(personAId);
  const personB = map.get(personBId);
  if (!personA || !personB) return null;

  if (personAId === personBId) {
    return {
      personA, personB,
      relationshipTitleAtoB: 'Chính mình', relationshipTitleBtoA: 'Chính mình',
      generationalDifference: 0, pathDescription: 'Cùng một người', kinshipType: 'trực hệ',
      culturalNote: 'Người được chọn là một cá nhân.', formalTitleAtoB: 'Bản thân', formalTitleBtoA: 'Bản thân',
      folkTitleAtoB: 'Bản thân', folkTitleBtoA: 'Bản thân'
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
    return {
      personA, personB, relationshipTitleAtoB: titleA, relationshipTitleBtoA: titleB,
      generationalDifference: -directB.distance, commonAncestor: personA,
      pathDescription: `${personA.fullName} là tổ tiên trực hệ cách ${personB.fullName} ${directB.distance} đời.`,
      kinshipType: 'tổ tiên', culturalNote: 'Quan hệ trực hệ ưu tiên theo liên kết Cha/Mẹ thực tế.',
      formalTitleAtoB: titleA, formalTitleBtoA: titleB,
      folkTitleAtoB: folkDirectAncestorTitle(personA, directB.distance),
      folkTitleBtoA: folkDirectDescendantTitle(personB, directB.distance), ancestorDistance: directB.distance
    };
  }

  const directA = byIdA.get(personBId);
  if (directA && directA.distance > 0) {
    const [titleB, titleA] = directTitle(personB, personA, directA.distance);
    return {
      personA, personB, relationshipTitleAtoB: titleA, relationshipTitleBtoA: titleB,
      generationalDifference: directA.distance, commonAncestor: personB,
      pathDescription: `${personB.fullName} là tổ tiên trực hệ cách ${personA.fullName} ${directA.distance} đời.`,
      kinshipType: 'hậu duệ', culturalNote: 'Quan hệ trực hệ ưu tiên theo liên kết Cha/Mẹ thực tế.',
      formalTitleAtoB: titleA, formalTitleBtoA: titleB,
      folkTitleAtoB: folkDirectDescendantTitle(personA, directA.distance),
      folkTitleBtoA: folkDirectAncestorTitle(personB, directA.distance), ancestorDistance: directA.distance
    };
  }

  let commonAncestor: Member | undefined;
  let distA = Infinity;
  let distB = Infinity;
  for (const candidate of ancestorsA) {
    const other = byIdB.get(candidate.member.id);
    if (!other) continue;
    const score = candidate.distance + other.distance;
    if (score < distA + distB || (score === distA + distB && candidate.distance < distA)) {
      commonAncestor = candidate.member;
      distA = candidate.distance;
      distB = other.distance;
    }
  }

  if (!commonAncestor) {
    return {
      personA, personB,
      relationshipTitleAtoB: 'Chưa xác định', relationshipTitleBtoA: 'Chưa xác định',
      generationalDifference: personA.generation - personB.generation,
      pathDescription: 'Chưa tìm được tổ tiên chung hoặc đường hôn phối đủ dữ liệu.',
      kinshipType: 'bàng hệ khác chi',
      culturalNote: 'Không nên đoán xưng hô khi dữ liệu Cha/Mẹ hoặc phối ngẫu còn thiếu. Hãy bổ sung liên kết phả hệ.'
    };
  }

  const generationDifference = personA.generation - personB.generation;
  if (generationDifference === 0) {
    const sameParents = sameParent(personA, personB);
    const [folkA, folkB] = siblingTitle(personA, personB, sameParents);
    return {
      personA, personB,
      relationshipTitleAtoB: folkA, relationshipTitleBtoA: folkB,
      generationalDifference: 0, commonAncestor,
      pathDescription: sameParents ? `${personA.fullName} và ${personB.fullName} là anh chị em cùng phụ mẫu.` : `Cùng thế hệ, tổ tiên chung gần nhất là ${commonAncestor.fullName}.`,
      kinshipType: sameParents ? 'trực hệ' : personA.branchId === personB.branchId ? 'bàng hệ cùng chi' : 'bàng hệ khác chi',
      culturalNote: 'Thứ bậc anh/chị/em dựa trên orderInFamily; đời và phả hệ được ưu tiên hơn tuổi.',
      formalTitleAtoB: formalSameGenerationTitle(personB, personA, sameParents),
      formalTitleBtoA: formalSameGenerationTitle(personA, personB, sameParents),
      folkTitleAtoB: folkA, folkTitleBtoA: folkB
    };
  }

  if (generationDifference < 0) {
    const elder = generationDifference === -1 ? auntUncleTitle(personA, personB, commonAncestor, map) : sexTitle(personA, 'Bề trên nam', 'Bề trên nữ');
    const junior = generationDifference === -1 ? (personA.gender === 'female' ? 'Cháu' : 'Cháu') : 'Hậu duệ';
    return {
      personA, personB, relationshipTitleAtoB: elder, relationshipTitleBtoA: junior,
      generationalDifference: generationDifference, commonAncestor,
      pathDescription: `${personA.fullName} ở trên ${personB.fullName} ${Math.abs(generationDifference)} đời; tổ tiên chung là ${commonAncestor.fullName}.`,
      kinshipType: personA.branchId === personB.branchId ? 'bàng hệ cùng chi' : 'bàng hệ khác chi',
      culturalNote: 'Bác/Chú/Cô/O/Cậu/Dì chỉ được dùng khi xác định được cha/mẹ trung gian. Thiếu dữ liệu sẽ dùng cách gọi an toàn.',
      formalTitleAtoB: generationDifference === -1 ? elder : 'Bề trên', formalTitleBtoA: generationDifference === -1 ? 'Tử tôn' : 'Hậu duệ',
      folkTitleAtoB: elder, folkTitleBtoA: junior
    };
  }

  const elder = generationDifference === 1 ? auntUncleTitle(personB, personA, commonAncestor, map) : sexTitle(personB, 'Bề trên nam', 'Bề trên nữ');
  return {
    personA, personB, relationshipTitleAtoB: generationDifference === 1 ? 'Cháu' : 'Hậu duệ', relationshipTitleBtoA: elder,
    generationalDifference: generationDifference, commonAncestor,
    pathDescription: `${personB.fullName} ở trên ${personA.fullName} ${generationDifference} đời; tổ tiên chung là ${commonAncestor.fullName}.`,
    kinshipType: personA.branchId === personB.branchId ? 'bàng hệ cùng chi' : 'bàng hệ khác chi',
    culturalNote: 'Đời và thứ bậc phả hệ được ưu tiên hơn tuổi.',
    formalTitleAtoB: generationDifference === 1 ? 'Tử tôn' : 'Hậu duệ', formalTitleBtoA: generationDifference === 1 ? elder : 'Bề trên',
    folkTitleAtoB: generationDifference === 1 ? 'Cháu' : 'Hậu duệ', folkTitleBtoA: elder
  };
}

export function validateFamilyGraph(members: Member[]) {
  const byId = buildMap(members);
  const issues: { member: Member; message: string; severity: 'error' | 'warning' }[] = [];
  const seen = new Set<string>();
  for (const member of members) {
    if (seen.has(member.id)) issues.push({ member, message: 'ID thành viên bị trùng.', severity: 'error' });
    seen.add(member.id);
    if (member.fatherId && !byId.has(member.fatherId)) issues.push({ member, message: `Không tìm thấy Cha (${member.fatherId}).`, severity: 'error' });
    if (member.motherId && !byId.has(member.motherId)) issues.push({ member, message: `Không tìm thấy Mẹ (${member.motherId}).`, severity: 'error' });
    if (member.fatherId === member.id || member.motherId === member.id || member.spouseIds?.includes(member.id)) issues.push({ member, message: 'Quan hệ tự trỏ vào chính mình.', severity: 'error' });
    for (const spouseId of member.spouseIds || []) {
      const spouse = byId.get(spouseId);
      if (!spouse) issues.push({ member, message: `Không tìm thấy phối ngẫu (${spouseId}).`, severity: 'error' });
      else if (!(spouse.spouseIds || []).includes(member.id)) issues.push({ member, message: `Liên kết phối ngẫu chưa đối xứng với ${spouse.fullName}.`, severity: 'warning' });
    }
    const father = member.fatherId ? byId.get(member.fatherId) : undefined;
    const mother = member.motherId ? byId.get(member.motherId) : undefined;
    const parentGens = [father?.generation, mother?.generation].filter((g): g is number => Number.isFinite(g));
    if (parentGens.length) {
      const expected = Math.max(...parentGens) + 1;
      if (member.generation !== expected) issues.push({ member, message: `Đời đang là ${member.generation}, nhưng theo Cha/Mẹ nên là ${expected}.`, severity: 'warning' });
    }
  }
  return issues.filter((item, index, arr) => arr.findIndex(x => x.member.id === item.member.id && x.message === item.message) === index);
}

import { Member, RelationshipResult } from '../types';

type AncestorVisit = { member: Member; distance: number };

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

    for (const parentId of [current.member.fatherId, current.member.motherId]) {
      if (!parentId) continue;
      const parent = map.get(parentId);
      if (parent && !visited.has(parent.id)) {
        queue.push({ member: parent, distance: current.distance + 1 });
      }
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
  if (distance === 1) {
    return [sexTitle(ancestor, 'Cha', 'Mẹ'), sexTitle(descendant, 'Con trai', 'Con gái')];
  }
  if (distance === 2) {
    return [sexTitle(ancestor, 'Ông', 'Bà'), sexTitle(descendant, 'Cháu trai', 'Cháu gái')];
  }
  if (distance === 3) {
    return [sexTitle(ancestor, 'Cụ', 'Cụ'), sexTitle(descendant, 'Chắt trai', 'Chắt gái')];
  }
  if (distance === 4) {
    return [sexTitle(ancestor, 'Kỵ', 'Kỵ'), sexTitle(descendant, 'Chút trai', 'Chút gái')];
  }
  return [`Tiền nhân đời trước (${distance} đời)`, `Hậu duệ (${distance} đời sau)`];
}

export function calculateRelationship(
  personAId: string,
  personBId: string,
  members: Member[],
): RelationshipResult | null {
  const map = new Map(members.map((m) => [m.id, m]));
  const personA = map.get(personAId);
  const personB = map.get(personBId);
  if (!personA || !personB) return null;

  if (personAId === personBId) {
    return {
      personA,
      personB,
      relationshipTitleAtoB: 'Chính mình',
      relationshipTitleBtoA: 'Chính mình',
      generationalDifference: 0,
      pathDescription: 'Cùng một người',
      kinshipType: 'trực hệ',
      culturalNote: 'Người được chọn là một cá nhân.',
    };
  }

  if (personA.spouseIds?.includes(personBId) || personB.spouseIds?.includes(personAId)) {
    return {
      personA,
      personB,
      relationshipTitleAtoB: sexTitle(personA, 'Chồng', 'Vợ'),
      relationshipTitleBtoA: sexTitle(personB, 'Chồng', 'Vợ'),
      generationalDifference: 0,
      pathDescription: `${personA.fullName} và ${personB.fullName} là vợ chồng/phối ngẫu`,
      kinshipType: 'hôn phối',
      culturalNote: 'Quan hệ hôn phối; cách xưng hô thực tế có thể thay đổi theo tuổi và vai vế của từng gia đình.',
    };
  }

  const ancestorsA = getAncestors(personAId, map);
  const ancestorsB = getAncestors(personBId, map);
  const byIdA = new Map(ancestorsA.map((x) => [x.member.id, x]));
  const byIdB = new Map(ancestorsB.map((x) => [x.member.id, x]));

  // Trực hệ: một người xuất hiện trong đường tổ tiên của người kia.
  const directB = byIdB.get(personAId);
  if (directB && directB.distance > 0) {
    const [titleA, titleB] = directTitle(personA, personB, directB.distance);
    return {
      personA,
      personB,
      relationshipTitleAtoB: titleA,
      relationshipTitleBtoA: titleB,
      generationalDifference: -directB.distance,
      commonAncestor: personA,
      pathDescription: `${personA.fullName} là tổ tiên trực hệ cách ${personB.fullName} ${directB.distance} đời.`,
      kinshipType: 'tổ tiên',
      culturalNote: 'Quan hệ trực hệ được ưu tiên theo sơ đồ cha/mẹ thực tế trong dữ liệu.',
    };
  }

  const directA = byIdA.get(personBId);
  if (directA && directA.distance > 0) {
    const [titleB, titleA] = directTitle(personB, personA, directA.distance);
    return {
      personA,
      personB,
      relationshipTitleAtoB: titleA,
      relationshipTitleBtoA: titleB,
      generationalDifference: directA.distance,
      commonAncestor: personB,
      pathDescription: `${personB.fullName} là tổ tiên trực hệ cách ${personA.fullName} ${directA.distance} đời.`,
      kinshipType: 'hậu duệ',
      culturalNote: 'Quan hệ trực hệ được ưu tiên theo sơ đồ cha/mẹ thực tế trong dữ liệu.',
    };
  }

  // Tìm tổ tiên chung gần nhất theo tổng khoảng cách. Thuật toán này xử lý cả cha và mẹ.
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
    return {
      personA,
      personB,
      relationshipTitleAtoB: 'Bà con họ xa / Chưa liên kết',
      relationshipTitleBtoA: 'Bà con họ xa / Chưa liên kết',
      generationalDifference: personA.generation - personB.generation,
      pathDescription: 'Chưa tìm được tổ tiên chung trong dữ liệu hiện tại.',
      kinshipType: 'bàng hệ khác chi',
      culturalNote: 'Hãy kiểm tra lại liên kết Cha, Mẹ hoặc bổ sung các đời trung gian.',
    };
  }

  const generationDifference = personA.generation - personB.generation;
  const sameGeneration = generationDifference === 0;

  if (sameGeneration) {
    const sameFather = Boolean(personA.fatherId && personA.fatherId === personB.fatherId);
    const sameMother = Boolean(personA.motherId && personA.motherId === personB.motherId);
    const sameParents = sameFather || sameMother;
    const [titleA, titleB] = siblingTitle(personA, personB, sameParents);

    return {
      personA,
      personB,
      relationshipTitleAtoB: titleA,
      relationshipTitleBtoA: titleB,
      generationalDifference: 0,
      commonAncestor,
      pathDescription: sameParents
        ? `${personA.fullName} và ${personB.fullName} là anh chị em cùng phụ mẫu.`
        : `Cùng thế hệ, tổ tiên chung gần nhất là ${commonAncestor.fullName}.`,
      kinshipType: sameParents ? 'trực hệ' : personA.branchId === personB.branchId ? 'bàng hệ cùng chi' : 'bàng hệ khác chi',
      culturalNote: sameParents
        ? 'Thứ bậc anh chị em dựa trên orderInFamily.'
        : 'Trong họ tộc Việt Nam, vai vế thường theo thứ bậc của nhánh và đời, không chỉ theo tuổi.',
    };
  }

  // Bàng hệ lệch thế hệ: gọi theo vai trên/dưới, tránh khẳng định Bác/Chú khi dữ liệu chưa đủ.
  if (generationDifference < 0) {
    const gap = Math.abs(generationDifference);
    const elder = sexTitle(personA, gap === 1 ? 'Bác/Chú họ' : 'Bề trên nam', gap === 1 ? 'Cô họ' : 'Bề trên nữ');
    const junior = sexTitle(personB, 'Cháu trai họ', 'Cháu gái họ');

    return {
      personA,
      personB,
      relationshipTitleAtoB: elder,
      relationshipTitleBtoA: junior,
      generationalDifference,
      commonAncestor,
      pathDescription: `${personA.fullName} ở trên ${personB.fullName} ${gap} đời; tổ tiên chung là ${commonAncestor.fullName}.`,
      kinshipType: personA.branchId === personB.branchId ? 'bàng hệ cùng chi' : 'bàng hệ khác chi',
      culturalNote: 'Tên gọi Bác/Chú/Cô cụ thể cần xét thứ tự của các anh chị em thuộc thế hệ trung gian.',
    };
  }

  const gap = generationDifference;
  const junior = sexTitle(personA, 'Cháu trai họ', 'Cháu gái họ');
  const elder = sexTitle(personB, gap === 1 ? 'Bác/Chú họ' : 'Bề trên nam', gap === 1 ? 'Cô họ' : 'Bề trên nữ');

  return {
    personA,
    personB,
    relationshipTitleAtoB: junior,
    relationshipTitleBtoA: elder,
    generationalDifference,
    commonAncestor,
    pathDescription: `${personB.fullName} ở trên ${personA.fullName} ${gap} đời; tổ tiên chung là ${commonAncestor.fullName}.`,
    kinshipType: personA.branchId === personB.branchId ? 'bàng hệ cùng chi' : 'bàng hệ khác chi',
    culturalNote: 'Tên gọi Bác/Chú/Cô cụ thể cần xét thứ tự của các anh chị em thuộc thế hệ trung gian.',
  };
}

import { Member, RelationshipResult } from '../types';

/**
 * Thuật toán tính mối quan hệ thân tộc theo văn hóa Việt Nam
 * "Bé bằng củ khoai, cứ vai mà gọi"
 */

// Lấy danh sách tổ tiên từ thành viên ngược lên Thủy tổ
function getAncestorsPath(memberId: string, memberMap: Map<string, Member>): Member[] {
  const path: Member[] = [];
  let curr = memberMap.get(memberId);
  const visited = new Set<string>();

  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    path.push(curr);
    if (curr.fatherId && memberMap.has(curr.fatherId)) {
      curr = memberMap.get(curr.fatherId);
    } else if (curr.motherId && memberMap.has(curr.motherId)) {
      curr = memberMap.get(curr.motherId);
    } else {
      break;
    }
  }
  return path;
}

export function calculateRelationship(
  personAId: string,
  personBId: string,
  members: Member[]
): RelationshipResult | null {
  if (personAId === personBId) {
    const p = members.find((m) => m.id === personAId);
    if (!p) return null;
    return {
      personA: p,
      personB: p,
      relationshipTitleAtoB: 'Chính mình',
      relationshipTitleBtoA: 'Chính mình',
      generationalDifference: 0,
      pathDescription: 'Cùng một người',
      kinshipType: 'trực hệ',
      culturalNote: 'Người được chọn là một cá nhân.',
    };
  }

  const memberMap = new Map<string, Member>();
  members.forEach((m) => memberMap.set(m.id, m));

  const personA = memberMap.get(personAId);
  const personB = memberMap.get(personBId);
  if (!personA || !personB) return null;

  // 1. Kiểm tra quan hệ Vợ / Chồng
  if (personA.spouseIds?.includes(personBId) || personB.spouseIds?.includes(personAId)) {
    const aIsHusband = personA.gender === 'male';
    return {
      personA,
      personB,
      relationshipTitleAtoB: aIsHusband ? 'Chồng' : 'Vợ',
      relationshipTitleBtoA: aIsHusband ? 'Vợ' : 'Chồng',
      generationalDifference: 0,
      pathDescription: `${personA.fullName} và ${personB.fullName} là vợ chồng`,
      kinshipType: 'hôn phối',
      culturalNote: 'Mối quan hệ hôn phối, phu thê kết tóc tương kính như tân.',
    };
  }

  // 2. Tìm tổ tiên của cả hai người
  const pathA = getAncestorsPath(personAId, memberMap);
  const pathB = getAncestorsPath(personBId, memberMap);

  // 3. Kiểm tra Trực hệ (A là tổ tiên của B hoặc B là tổ tiên của A)
  const indexAinB = pathB.findIndex((m) => m.id === personAId);
  if (indexAinB > 0) {
    // A là cha/ông/cụ của B
    const genDiff = indexAinB;
    let titleA = '';
    let titleB = '';
    const isMale = personA.gender === 'male';

    if (genDiff === 1) {
      titleA = isMale ? 'Cha (Bố)' : 'Mẹ';
      titleB = personB.gender === 'male' ? 'Con trai' : 'Con gái';
    } else if (genDiff === 2) {
      titleA = isMale ? 'Ông nội' : 'Bà nội';
      titleB = 'Cháu nội';
    } else if (genDiff === 3) {
      titleA = isMale ? 'Cụ nội (Cố)' : 'Bà Cụ nội';
      titleB = 'Chắt nội';
    } else if (genDiff === 4) {
      titleA = isMale ? 'Kỵ nội (Sơ)' : 'Bà Kỵ';
      titleB = 'Chút nội';
    } else {
      titleA = `Tiền bối đời trước (${genDiff} đời)`;
      titleB = `Hậu duệ (${genDiff} đời sau)`;
    }

    return {
      personA,
      personB,
      relationshipTitleAtoB: titleA,
      relationshipTitleBtoA: titleB,
      generationalDifference: -genDiff,
      commonAncestor: personA,
      pathDescription: `${personA.fullName} là ${titleA} trực hệ của ${personB.fullName}`,
      kinshipType: 'tổ tiên',
      culturalNote: `Mối quan hệ huyết thống trực hệ cách nhau ${genDiff} thế hệ.`,
    };
  }

  const indexBinA = pathA.findIndex((m) => m.id === personBId);
  if (indexBinA > 0) {
    // B là cha/ông/cụ của A -> ngược lại
    const genDiff = indexBinA;
    let titleB = '';
    let titleA = '';
    const isMale = personB.gender === 'male';

    if (genDiff === 1) {
      titleB = isMale ? 'Cha (Bố)' : 'Mẹ';
      titleA = personA.gender === 'male' ? 'Con trai' : 'Con gái';
    } else if (genDiff === 2) {
      titleB = isMale ? 'Ông nội' : 'Bà nội';
      titleA = 'Cháu nội';
    } else if (genDiff === 3) {
      titleB = isMale ? 'Cụ nội' : 'Bà Cụ nội';
      titleA = 'Chắt nội';
    } else {
      titleB = `Tiền nhân đời trước (${genDiff} đời)`;
      titleA = `Hậu duệ (${genDiff} đời sau)`;
    }

    return {
      personA,
      personB,
      relationshipTitleAtoB: titleA,
      relationshipTitleBtoA: titleB,
      generationalDifference: genDiff,
      commonAncestor: personB,
      pathDescription: `${personB.fullName} là ${titleB} trực hệ của ${personA.fullName}`,
      kinshipType: 'hậu duệ',
      culturalNote: `Mối quan hệ huyết thống trực hệ cách nhau ${genDiff} thế hệ.`,
    };
  }

  // 4. Tìm tổ tiên chung gần nhất (LCA - Lowest Common Ancestor)
  let commonAncestor: Member | undefined;
  let distA = -1;
  let distB = -1;

  for (let i = 0; i < pathA.length; i++) {
    const anc = pathA[i];
    const j = pathB.findIndex((m) => m.id === anc.id);
    if (j !== -1) {
      commonAncestor = anc;
      distA = i; // Khoảng cách từ A tới tổ tiên chung
      distB = j; // Khoảng cách từ B tới tổ tiên chung
      break;
    }
  }

  if (!commonAncestor) {
    return {
      personA,
      personB,
      relationshipTitleAtoB: 'Bà con họ xa / Khác nhánh gốc',
      relationshipTitleBtoA: 'Bà con họ xa / Khác nhánh gốc',
      generationalDifference: personA.generation - personB.generation,
      pathDescription: 'Chưa xác định được tổ tiên chung trong cây gia phả hiện tại.',
      kinshipType: 'bàng hệ khác chi',
      culturalNote: 'Có thể thuộc các phân chi chưa liên kết hoặc phối ngẫu bên ngoại.',
    };
  }

  // Phân tích vai vế theo phong tục Việt Nam
  // "Bé bằng củ khoai cứ vai mà gọi"
  const genDiff = personA.generation - personB.generation; // A so với B
  const isSameGen = personA.generation === personB.generation;

  // Trường hợp cùng thế hệ (Anh/Chị/Em họ)
  if (isSameGen) {
    if (distA === 1 && distB === 1) {
      // Cùng cha mẹ: Anh chị em ruột
      const isOlder = personA.orderInFamily < personB.orderInFamily;
      const titleAtoB = isOlder
        ? personA.gender === 'male' ? 'Anh ruột' : 'Chị ruột'
        : personA.gender === 'male' ? 'Em trai ruột' : 'Em gái ruột';
      const titleBtoA = !isOlder
        ? personB.gender === 'male' ? 'Anh ruột' : 'Chị ruột'
        : personB.gender === 'male' ? 'Em trai ruột' : 'Em gái ruột';

      return {
        personA,
        personB,
        relationshipTitleAtoB: titleAtoB,
        relationshipTitleBtoA: titleBtoA,
        generationalDifference: 0,
        commonAncestor,
        pathDescription: `${personA.fullName} và ${personB.fullName} là anh chị em ruột (Chung phụ mẫu: ${commonAncestor.fullName})`,
        kinshipType: 'trực hệ',
        culturalNote: 'Anh em như thể tay chân, rách lành đùm bọc dở hay đỡ đần.',
      };
    }

    // Anh em họ (chú bác / cô cậu)
    // Xác định vai anh/em dựa theo thứ tự của nhánh cha/mẹ
    const branchRankA = pathA[distA - 1]?.orderInFamily || personA.orderInFamily;
    const branchRankB = pathB[distB - 1]?.orderInFamily || personB.orderInFamily;
    const aIsElderBranch = branchRankA < branchRankB;

    const titleAtoB = aIsElderBranch
      ? personA.gender === 'male' ? 'Anh họ (Thuộc cành trên)' : 'Chị họ (Thuộc cành trên)'
      : personA.gender === 'male' ? 'Em trai họ' : 'Em gái họ';

    const titleBtoA = !aIsElderBranch
      ? personB.gender === 'male' ? 'Anh họ (Thuộc cành trên)' : 'Chị họ (Thuộc cành trên)'
      : personB.gender === 'male' ? 'Em trai họ' : 'Em gái họ';

    return {
      personA,
      personB,
      relationshipTitleAtoB: titleAtoB,
      relationshipTitleBtoA: titleBtoA,
      generationalDifference: 0,
      commonAncestor,
      pathDescription: `Cùng Đời thứ ${personA.generation}. Tổ tiên chung: ${commonAncestor.fullName} (Đời ${commonAncestor.generation})`,
      kinshipType: personA.branchId === personB.branchId ? 'bàng hệ cùng chi' : 'bàng hệ khác chi',
      culturalNote: 'Theo phong tục truyền thống: Dù tuổi đời ai lớn hơn, vai vế xưng hô trong họ phụ thuộc vào thứ bậc của nhánh cha/ông khai sinh (Cành Trưởng là Anh/Chị, Cành Thứ là Em).',
    };
  }

  // Trường hợp A trên B 1 đời (A là Bác họ / Chú họ / Cô họ của B)
  if (genDiff === -1) {
    // A thuộc thế hệ cha chú của B
    const fatherOfB = pathB[1];
    let titleA = '';
    const isMale = personA.gender === 'male';

    if (fatherOfB) {
      if (personA.orderInFamily < fatherOfB.orderInFamily) {
        titleA = isMale ? 'Bác họ (Anh của Cha)' : 'Bác gái / Cô trưởng';
      } else {
        titleA = isMale ? 'Chú họ (Em trai của Cha)' : 'Cô họ (Em gái của Cha)';
      }
    } else {
      titleA = isMale ? 'Bác / Chú họ' : 'Cô họ';
    }

    const titleB = personB.gender === 'male' ? 'Cháu trai họ' : 'Cháu gái họ';

    return {
      personA,
      personB,
      relationshipTitleAtoB: titleA,
      relationshipTitleBtoA: titleB,
      generationalDifference: -1,
      commonAncestor,
      pathDescription: `${personA.fullName} (Đời ${personA.generation}) là bề trên của ${personB.fullName} (Đời ${personB.generation})`,
      kinshipType: 'bàng hệ cùng chi',
      culturalNote: `B gọi A là ${titleA}, A xưng là ${isMale ? (titleA.startsWith('Bác') ? 'Bác' : 'Chú') : 'Cô'} và gọi B là Cháu.`,
    };
  }

  // Trường hợp A dưới B 1 đời (B là Bác / Chú / Cô của A)
  if (genDiff === 1) {
    const fatherOfA = pathA[1];
    let titleB = '';
    const isMaleB = personB.gender === 'male';

    if (fatherOfA) {
      if (personB.orderInFamily < fatherOfA.orderInFamily) {
        titleB = isMaleB ? 'Bác họ' : 'Bác gái / Cô trưởng';
      } else {
        titleB = isMaleB ? 'Chú họ' : 'Cô họ';
      }
    } else {
      titleB = isMaleB ? 'Bác / Chú họ' : 'Cô họ';
    }

    const titleA = personA.gender === 'male' ? 'Cháu trai họ' : 'Cháu gái họ';

    return {
      personA,
      personB,
      relationshipTitleAtoB: titleA,
      relationshipTitleBtoA: titleB,
      generationalDifference: 1,
      commonAncestor,
      pathDescription: `${personB.fullName} (Đời ${personB.generation}) là bề trên của ${personA.fullName} (Đời ${personA.generation})`,
      kinshipType: 'bàng hệ cùng chi',
      culturalNote: `A gọi B là ${titleB}, B xưng Bác/Chú/Cô và gọi A là Cháu họ.`,
    };
  }

  // Trường hợp cách nhau 2 đời (Thế hệ Ông / Cháu)
  if (genDiff === -2) {
    const isMale = personA.gender === 'male';
    const titleA = isMale ? 'Ông Bác / Ông Chú họ' : 'Bà Cô họ';
    return {
      personA,
      personB,
      relationshipTitleAtoB: titleA,
      relationshipTitleBtoA: 'Cháu họ (Đời thứ 3)',
      generationalDifference: -2,
      commonAncestor,
      pathDescription: `${personA.fullName} cách ${personB.fullName} 2 thế hệ trong họ.`,
      kinshipType: 'bàng hệ cùng chi',
      culturalNote: `${personB.fullName} gọi ${personA.fullName} bằng ${titleA}.`,
    };
  }

  if (genDiff === 2) {
    const isMale = personB.gender === 'male';
    const titleB = isMale ? 'Ông Bác / Ông Chú họ' : 'Bà Cô họ';
    return {
      personA,
      personB,
      relationshipTitleAtoB: 'Cháu họ (Đời thứ 3)',
      relationshipTitleBtoA: titleB,
      generationalDifference: 2,
      commonAncestor,
      pathDescription: `${personB.fullName} cách ${personA.fullName} 2 thế hệ trong họ.`,
      kinshipType: 'bàng hệ cùng chi',
      culturalNote: `${personA.fullName} gọi ${personB.fullName} bằng ${titleB}.`,
    };
  }

  // Chênh lệch 3 đời trở lên
  const absDiff = Math.abs(genDiff);
  const aIsElder = genDiff < 0;
  const seniorTitle = aIsElder ? `Tiền bối nhánh họ (Cách ${absDiff} đời)` : `Hậu bối chi họ (Cách ${absDiff} đời)`;
  const juniorTitle = aIsElder ? `Hậu bối chi họ (Cách ${absDiff} đời)` : `Tiền bối nhánh họ (Cách ${absDiff} đời)`;

  return {
    personA,
    personB,
    relationshipTitleAtoB: seniorTitle,
    relationshipTitleBtoA: juniorTitle,
    generationalDifference: genDiff,
    commonAncestor,
    pathDescription: `Tổ tiên chung: ${commonAncestor.fullName}. Cách nhau ${absDiff} đời.`,
    kinshipType: 'bàng hệ cùng chi',
    culturalNote: 'Khoảng cách thế hệ xa, nên duy trì xưng hô theo tôn ti trật tự gia phả.',
  };
}

import { Gender, Member } from '../types';

/**
 * Bộ từ vựng vai vế chính thống dùng khi biên soạn phả ký / văn cúng.
 * Khoảng cách được tính theo số cạnh cha/mẹ giữa hai người.
 */
export function formalAncestorTitle(member: Member, distance: number): string {
  if (distance <= 0) return 'Bản thân';
  const male = member.gender === 'male';
  if (distance === 1) return member.isAlive ? (male ? 'Phụ thân' : 'Mẫu thân') : (male ? 'Hiển khảo' : 'Hiển tỷ');
  if (distance === 2) return member.isAlive ? (male ? 'Tổ phụ' : 'Tổ mẫu') : (male ? 'Hiển tổ khảo' : 'Hiển tổ tỷ');
  if (distance === 3) return member.isAlive ? (male ? 'Tằng tổ phụ' : 'Tằng tổ mẫu') : (male ? 'Hiển tằng tổ khảo' : 'Hiển tằng tổ tỷ');
  if (distance === 4) return member.isAlive ? (male ? 'Cao tổ phụ' : 'Cao tổ mẫu') : (male ? 'Hiển cao tổ khảo' : 'Hiển cao tổ tỷ');
  if (distance === 5) return 'Tiễn tổ';
  if (distance === 6) return 'Viễn tổ';
  if (member.isRootAncestor) return 'Thỉ tổ';
  return `Tiền tổ đời thứ ${distance}`;
}

export function formalDescendantTitle(descendant: Member, distance: number): string {
  if (distance <= 0) return 'Bản thân';
  const child = descendant.gender === 'male' ? 'Tử' : 'Nữ';
  if (distance === 1) return child;
  if (distance === 2) return 'Tôn';
  if (distance === 3) return 'Tằng tôn';
  if (distance === 4) return 'Huyền tôn';
  if (distance === 5) return 'Lai tôn';
  if (distance === 6) return 'Khổn tôn';
  if (distance === 7) return 'Vân tôn';
  if (distance === 8) return 'Nhĩ tôn';
  return `Hậu duệ đời thứ ${distance}`;
}

export function formalSameGenerationTitle(from: Member, to: Member, sameParents: boolean): string {
  if (sameParents) {
    const older = from.orderInFamily < to.orderInFamily;
    if (older) return from.gender === 'male' ? 'Huynh' : 'Tỷ';
    return from.gender === 'male' ? 'Đệ' : 'Muội';
  }
  return from.gender === 'male' ? 'Huynh đệ họ' : 'Tỷ muội họ';
}

export function folkDirectAncestorTitle(member: Member, distance: number): string {
  if (distance === 1) return member.gender === 'female' ? 'Mẹ' : 'Cha';
  if (distance === 2) return member.gender === 'female' ? 'Bà nội/ngoại' : 'Ông nội/ngoại';
  if (distance === 3) return 'Ông/Bà cố';
  if (distance === 4) return 'Ông/Bà sơ';
  return member.gender === 'female' ? 'Bà tổ' : 'Ông tổ';
}

export function folkDirectDescendantTitle(member: Member, distance: number): string {
  if (distance === 1) return member.gender === 'female' ? 'Con gái' : 'Con trai';
  if (distance === 2) return member.gender === 'female' ? 'Cháu gái' : 'Cháu trai';
  if (distance === 3) return member.gender === 'female' ? 'Chắt gái' : 'Chắt trai';
  if (distance === 4) return member.gender === 'female' ? 'Chút gái' : 'Chút trai';
  if (distance === 5) return member.gender === 'female' ? 'Chít gái' : 'Chít trai';
  return 'Hậu duệ';
}

export function formalWorshipAddress(member: Member): string {
  if (member.isAlive) return member.gender === 'male' ? 'Phụ thân' : 'Mẫu thân';
  return member.gender === 'male' ? 'Hiển khảo' : 'Hiển tỷ';
}

export function branchIdentity(member: Member): string {
  return [member.phaiName, member.chiName, member.nhanhName].filter(Boolean).join(' • ');
}

export type Gender = 'male' | 'female' | 'other';

export type UserRole = 'super_admin' | 'branch_admin' | 'editor' | 'member' | 'visitor';

export interface ClanUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  memberId?: string; // ID của thành viên trên cây gia phả (liên kết hồ sơ)
  memberName?: string; // Tên thành viên trên cây phả hệ
  branchId?: string; // Chi nhánh phụ trách nếu là Trưởng Chi
  branchName?: string;
  createdAt: string;
  lastLogin?: string;
  status: 'active' | 'pending' | 'blocked';
  notes?: string;
}

export interface Member {
  id: string;
  fullName: string;
  courtesyName?: string; // Tên tự / Tên chữ
  posthumousName?: string; // Tên thụy / Tên hèm / Húy
  gender: Gender;
  generation: number; // Đời thứ mấy (1, 2, 3...)
  branchId: string; // Thuộc Chi nào
  
  // Phân cấp dòng tộc: Đời > Phái > Chi > Nhánh (VD: Đời thứ 3, Phái II Xuyên Tây, Chi 1, Nhánh 3)
  phaiName?: string; // Ví dụ: "Phái II Xuyên Tây", "Phái IV Đại Lộc", "Phái I"
  chiName?: string; // Ví dụ: "Chi 1", "Chi 2", "Chi Giáp"...
  nhanhName?: string; // Ví dụ: "Nhánh 3", "Nhánh 1"...

  orderInFamily: number; // Thứ tự con (1: Trưởng, 2: Thứ...)
  orderTitle?: string; // Trưởng nam, Thứ nam, Trưởng nữ, Út nam...
  
  birthPlace?: string; // Nơi sinh (VD: Xuyên Tây, Duy Xuyên, Quảng Nam)
  birthDate?: string; // YYYY-MM-DD
  birthDateLunar?: string; // DD/MM/YYYY Âm lịch
  isAlive: boolean;
  deathDate?: string; // YYYY-MM-DD
  deathDateLunar?: string; // DD/MM/YYYY Âm lịch (Quan trọng để tính ngày giỗ)
  burialLocation?: string; // Nơi an táng / Mộ phần
  burialCoordinates?: { lat: number; lng: number }; // Tọa độ Google Maps

  avatarUrl?: string;
  phone?: string;
  email?: string;
  currentAddress?: string;
  occupation?: string;
  bio?: string;
  achievements?: string[]; // Công trạng, đỗ đạt, huân chương, công đức
  
  fatherId?: string | null;
  motherId?: string | null;
  spouseIds?: string[]; // Danh sách ID vợ / chồng (Hỗ trợ nhiều vợ: Vợ Cả, Vợ Hai...)

  isRootAncestor?: boolean; // Thủy tổ / Tiền hiền
  createdAt?: string;
  updatedAt?: string;
}

export interface Branch {
  id: string;
  name: string; // Chi Trưởng, Chi Hai, Chi Ba, Phân chi Miền Nam...
  code: string;
  leaderId?: string; // Trưởng chi hiện tại
  description?: string;
  ancestorId?: string; // Vị tổ khai sáng chi
  colorAccent?: string;
}

export interface EventItem {
  id: string;
  title: string;
  type: 'death_anniversary' | 'clan_meeting' | 'tomb_cleaning' | 'ancestor_worship' | 'longevity_celebration';
  memberId?: string; // Gắn với thành viên (nếu là ngày giỗ)
  memberName?: string;
  lunarDay: number;
  lunarMonth: number;
  lunarYear?: number;
  solarDateThisYear?: string; // Ngày Dương lịch tương ứng năm nay
  daysLeft?: number;
  description: string;
  location: string;
  responsibleBranchId?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: 'sac_phong' | 'pha_ky' | 'huong_uoc' | 'van_khan' | 'hinh_anh_mo_to' | 'khac';
  categoryLabel: string;
  fileUrl: string;
  fileType: 'pdf' | 'image' | 'doc';
  description: string;
  recordedDate?: string;
  dynastyEra?: string; // Triều Lê, Triều Nguyễn, Tự Đức...
  authorOrPreserver?: string;
  tags: string[];
}

export interface PostItem {
  id: string;
  title: string;
  authorName: string;
  authorRole: string;
  avatarUrl?: string;
  createdAt: string;
  category: 'vinh_danh' | 'thong_bao' | 'khuyen_hoc' | 'hi_su' | 'tang_su';
  content: string;
  images?: string[];
  likesCount: number;
  commentsCount: number;
}

export interface FundRecord {
  id: string;
  title: string;
  type: 'income' | 'expense';
  amount: number;
  contributorOrReceiver: string;
  date: string;
  purpose: string;
  branchName?: string;
  receiptNumber?: string;
}

export interface FamilyTreeSettings {
  theme: 'traditional' | 'modern';
  fontFamily?: 'be-vietnam' | 'merriweather' | 'sans';
  showSpouses: boolean;
  showDates: boolean;
  showDaughters: boolean;
  showAvatars: boolean;
  orientation: 'vertical' | 'horizontal';
  zoomLevel: number;
}

export interface RelationshipResult {
  personA: Member;
  personB: Member;
  relationshipTitleAtoB: string; // B gọi A là gì
  relationshipTitleBtoA: string; // A gọi B là gì
  generationalDifference: number; // Chênh lệch mấy đời
  commonAncestor?: Member;
  pathDescription: string;
  kinshipType: 'trực hệ' | 'bàng hệ cùng chi' | 'bàng hệ khác chi' | 'hôn phối' | 'hậu duệ' | 'tổ tiên';
  culturalNote?: string; // Ghi chú xưng hô theo phong tục Việt Nam
}

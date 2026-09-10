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

export interface DocumentImage {
  id: string;
  url: string;
  caption?: string; // Chú thích báo chí dưới hình ảnh
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
  images?: DocumentImage[]; // Bộ sưu tập nhiều hình ảnh kèm chú thích báo chí
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

export interface BurialLocationSubmission {
  id: string;
  memberId: string;
  memberName?: string;
  mapsUrl: string;
  latitude: number;
  longitude: number;
  note?: string;
  submittedByName?: string;
  submittedByContact?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
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

export type TreeViewMode = 'graph_canvas' | 'book_outline';
export type LayoutAlgorithm = 'family_cluster' | 'flat_generation';

export interface FamilyTreeSettings {
  theme: 'traditional' | 'modern';
  fontFamily?: 'be-vietnam' | 'merriweather' | 'sans';
  showSpouses: boolean;
  showDates: boolean;
  showDaughters: boolean;
  showAvatars: boolean;
  showTitles?: boolean; // Thứ bậc (Trưởng, Thứ...), Tự, Thụy
  showHierarchy?: boolean; // Hiển thị Phái • Chi • Nhánh trên thẻ
  showBirthPlace?: boolean; // Hiển thị Nơi sinh / An táng
  orientation: 'vertical' | 'horizontal';
  zoomLevel: number;
  
  // 5 Optimization Solutions for Dense / Wide Generations:
  viewMode?: TreeViewMode; // PA 5: Cây Đồ Họa 2D vs Sổ Phả Hệ Dọc
  layoutAlgorithm?: LayoutAlgorithm; // PA 3: Thuật toán Cụm Gia Đình vs Dàn Đều Hàng Ngang
  enableCollapsible?: boolean; // PA 1: Nút Thu Gọn / Mở Rộng Nhánh Con [+] / [-]
  autoCollapseDeepGens?: boolean; // PA 1: Tự động thu gọn từ Đời 7 trở đi
  enableZigZagRows?: boolean; // PA 4: Xếp so le 2 tầng cho gia đình >= 5 con
  focusedSubtreeRootId?: string | null; // PA 2: Xem riêng nhánh con cháu của một cụ

  // Phương Án Thẻ Dọc Tên Sổ Dọc & Khoảng Cách Thẻ:
  enableVerticalCards?: boolean; // Bật phương án thẻ dọc từ đời sâu (tiết kiệm 70% chiều rộng)
  verticalCardStartGen?: number; // Đời bắt đầu áp dụng thẻ dọc (mặc định: 6)
  cardHorizontalGap?: number; // Khoảng cách ngang giữa 2 anh em trong cùng nhà (px)
  interFamilyGap?: number; // Khoảng cách giữa các cụm gia đình khác nhau để chống đè line (px)

  // Cấu hình riêng cho trải nghiệm mobile / màn hình cảm ứng
  mobileTreeHeight?: number; // Chiều cao vùng cây trên mobile (px)
  mobileInitialZoom?: number; // Zoom khởi tạo trên mobile
  mobileMinZoom?: number; // Zoom nhỏ nhất trên mobile
  mobileMaxZoom?: number; // Zoom lớn nhất trên mobile
  mobileShowMiniMap?: boolean; // Hiện/ẩn MiniMap trên mobile
  mobileControlsPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  focusMobileZoom?: number; // Zoom khi mở một nhánh cụ thể trên mobile
  focusDesktopZoom?: number; // Zoom khi mở một nhánh cụ thể trên desktop
  focusMobileOffsetY?: number; // Dịch tâm node trên mobile (px)
  focusDesktopOffsetY?: number; // Dịch tâm node trên desktop (px)

  // Tùy biến giao diện thẻ trong AdminCP
  horizontalCardWidth?: number;
  horizontalCardHeight?: number;
  verticalCardWidth?: number;
  verticalCardHeight?: number;
  cardNameFontSize?: number;
  horizontalCardFontSize?: number;
  horizontalCardNameColor?: string;
  horizontalCardNameBackgroundColor?: string;
  horizontalCardBackgroundColor?: string;
  horizontalCardBorderColor?: string;
  verticalCardFontSize?: number;
  verticalCardNameColor?: string;
  verticalCardNameBackgroundColor?: string;
  verticalCardBackgroundColor?: string;
  verticalCardBorderColor?: string;
  cardNameColor?: string;
  cardNameBackgroundColor?: string;
  cardBackgroundColor?: string;
  cardBorderColor?: string;
  cardVerticalGap?: number;
  cardThemePreset?: 'traditional' | 'modern' | 'ivory' | 'emerald' | 'midnight';

  // Theme toàn website (AdminCP đặt mặc định cho giao diện chung).
  interfaceThemePreset?: 'traditional' | 'paper' | 'modern' | 'forest' | 'midnight';
  interfacePrimaryColor?: string;
  interfaceAccentColor?: string;
  interfacePageBackground?: string;
  interfaceSurfaceColor?: string;
  interfaceTextColor?: string;
  interfaceFontFamily?: 'be-vietnam' | 'merriweather' | 'sans';
  interfaceRadius?: 'compact' | 'soft' | 'rounded';
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
  // Chuẩn gọi vai vế dùng cho phả ký/văn cúng; tách khỏi cách gọi dân gian trên giao diện.
  formalTitleAtoB?: string;
  formalTitleBtoA?: string;
  folkTitleAtoB?: string;
  folkTitleBtoA?: string;
  ancestorDistance?: number;
  commonAncestorPath?: string[];
}

export interface ClanInfo {
  name: string;
  branchSubtitle: string;
  ancestralHall: string;
  address: string;
  foundingYear: number;
  motto: string;
  mottoMeaning: string;
  // Cấu hình hiển thị cây phả hệ do Admin chỉ định
  defaultTreeSettings?: Partial<FamilyTreeSettings>;
  allowUserViewCustomization?: boolean; // Cho phép người xem tự do chuyển đổi phương án
  // Thông tin liên hệ cập nhật & bổ sung gia phả (hiển thị trong hồ sơ chi tiết thành viên)
  contactNotice?: string;
  contactPhone?: string;
  contactEmail?: string;
}


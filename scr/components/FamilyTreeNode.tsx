import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Member, UserRole } from '../types';
import { Crown, Heart, UserPlus, Eye, Trash2, MapPin, Sparkles } from 'lucide-react';
import { DefaultAvatar } from './DefaultAvatar';

export interface FamilyTreeNodeData extends Record<string, unknown> {
  member: Member;
  spouses?: Member[];
  mother?: Member | null;
  childrenBySpouse?: Record<string, string[]>; // spouseId -> list of children names
  theme: 'traditional' | 'modern';
  fontFamily: 'be-vietnam' | 'merriweather' | 'sans';
  showDates: boolean;
  showSpouse: boolean;
  showAvatar: boolean;
  userRole: UserRole;
  onSelectMember: (member: Member) => void;
  onAddChild?: (parent: Member) => void;
  onAddSpouse?: (member: Member) => void;
  onDeleteMember?: (id: string) => void;
  branchName?: string;
  branchColor?: string;
  isHighlighted?: boolean;
}

export const FamilyTreeNode = memo(({ data }: NodeProps<Node<FamilyTreeNodeData>>) => {
  const {
    member,
    spouses = [],
    mother,
    childrenBySpouse = {},
    theme,
    fontFamily = 'be-vietnam',
    showDates,
    showSpouse,
    showAvatar,
    userRole,
    onSelectMember,
    onAddChild,
    onAddSpouse,
    onDeleteMember,
    branchName,
    isHighlighted,
  } = data;

  const isTraditional = theme === 'traditional';
  const canEdit = userRole === 'super_admin' || userRole === 'branch_admin';
  const canDelete = userRole === 'super_admin';

  // Font family class mapping to prevent broken Vietnamese diacritics
  const fontClass =
    fontFamily === 'be-vietnam'
      ? "font-['Be_Vietnam_Pro',sans-serif]"
      : fontFamily === 'merriweather'
      ? "font-['Merriweather',serif]"
      : "font-['Plus_Jakarta_Sans',sans-serif]";

  // Traditional Theme Styles (Hoành phi, đỏ thẫm & viền vàng hoàng gia)
  // Traditional Vietnamese Clan Theme Styles
  const nodeWidthClass = showSpouse
    ? 'w-[330px] min-w-[330px] max-w-[340px]'
    : 'w-[270px] min-w-[260px] max-w-[280px]';

  const traditionalNodeClass = `
    relative rounded-xl transition-all duration-300 shadow-xl border-2
    ${
      isHighlighted
        ? 'border-yellow-300 ring-4 ring-yellow-400/60 scale-105 z-30'
        : member.isRootAncestor
        ? 'border-amber-400 bg-gradient-to-b from-[#8B0000] via-[#6d0008] to-[#4a0005]'
        : member.isAlive
        ? 'border-amber-600/80 bg-gradient-to-b from-[#5c0612] via-[#45050e] to-[#2c0309]'
        : 'border-yellow-700/70 bg-gradient-to-b from-[#400207] via-[#2f0105] to-[#1c0103]'
    }
    text-amber-50 ${nodeWidthClass}
  `;

  // Modern Theme Styles
  const modernNodeClass = `
    relative rounded-xl transition-all duration-300 shadow-md border
    ${
      isHighlighted
        ? 'border-blue-500 ring-4 ring-blue-300 scale-105 z-30'
        : member.isRootAncestor
        ? 'border-amber-400 bg-amber-50/90 text-amber-950'
        : member.isAlive
        ? 'border-emerald-300 bg-white text-slate-800'
        : 'border-slate-300 bg-slate-50 text-slate-700'
    }
    ${nodeWidthClass}
  `;

  // Hierarchy line: Đời > Phái > Chi > Nhánh (Chỉ áp dụng từ Đời 3 trở đi vì Đời 1 và 2 là Thủy Tổ chung của toàn tộc)
  const hierarchyDetails =
    member.generation > 2
      ? [member.phaiName, member.chiName, member.nhanhName].filter(Boolean).join(' • ')
      : '';

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc chắn muốn xóa thành viên "${member.fullName}" khỏi cây gia phả không?`)) {
      onDeleteMember?.(member.id);
    }
  };

  return (
    <div className={`${isTraditional ? traditionalNodeClass : modernNodeClass} ${fontClass}`}>
      {/* Top Handle for Parent connections */}
      {!member.isRootAncestor && (
        <Handle
          type="target"
          position={Position.Top}
          className={`!w-3 !h-3 !border-2 ${
            isTraditional ? '!bg-amber-400 !border-[#4a0005]' : '!bg-blue-500 !border-white'
          }`}
        />
      )}

      {/* Decorative Corner Motifs (Góc hoa văn truyền thống) */}
      {isTraditional && (
        <>
          <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400/80 pointer-events-none" />
          <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400/80 pointer-events-none" />
          <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400/80 pointer-events-none" />
          <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400/80 pointer-events-none" />
        </>
      )}

      {/* Header Banner: Generation & Hierarchy */}
      <div
        className={`px-3 py-1.5 flex items-center justify-between text-[11px] font-semibold rounded-t-[10px] ${
          isTraditional
            ? 'bg-[#350207]/95 border-b border-amber-500/30 text-amber-300'
            : member.isRootAncestor
            ? 'bg-amber-200/80 border-b border-amber-300 text-amber-900'
            : member.generation === 2
            ? 'bg-amber-100 border-b border-amber-300 text-amber-900'
            : 'bg-slate-100 border-b border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex items-center gap-1.5">
          {member.isRootAncestor ? (
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          ) : member.generation === 2 ? (
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
          )}
          <span className="tracking-wide font-bold">
            {member.isRootAncestor
              ? 'TRIỆU TỔ (ĐỜI 1)'
              : member.generation === 2
              ? 'KHẢI TỔ (ĐỜI 2)'
              : `ĐỜI THỨ ${member.generation}`}
          </span>
        </div>

        {/* Đời 1 và Đời 2 là Thủy Tổ chung toàn tộc, KHÔNG hiển thị nhãn phân phái */}
        {branchName && member.generation > 2 && (
          <span
            className={`text-[9.5px] px-1.5 py-0.5 rounded font-medium ${
              isTraditional
                ? 'bg-amber-950/60 border border-amber-500/40 text-amber-200'
                : 'bg-white border border-slate-300 text-slate-700'
            }`}
          >
            {branchName}
          </span>
        )}
      </div>

      {/* Phái > Chi > Nhánh Sub-header (Chỉ hiển thị từ Đời 3 trở đi) */}
      {hierarchyDetails && member.generation > 2 && (
        <div
          className={`px-3 py-0.5 text-[9.5px] truncate font-medium ${
            isTraditional
              ? 'bg-[#290104] text-amber-300/80 border-b border-amber-500/10'
              : 'bg-slate-50 text-slate-500 border-b border-slate-100'
          }`}
          title={`Phân cấp: ${hierarchyDetails}`}
        >
          {hierarchyDetails}
        </div>
      )}

      {/* Main Card Body */}
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          {/* Avatar (Facebook style) - ONLY rendered when showAvatar is true */}
          {showAvatar && (
            <div className="relative flex-shrink-0">
              <DefaultAvatar
                avatarUrl={member.avatarUrl}
                gender={member.gender}
                fullName={member.fullName}
                size="md"
              />
              {/* Alive / Deceased status indicator */}
              <span
                title={member.isAlive ? 'Còn sống' : 'Đã tạ thế'}
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                  isTraditional ? 'border-[#300207]' : 'border-white'
                } ${member.isAlive ? 'bg-emerald-500' : 'bg-amber-600'}`}
              />
            </div>
          )}

          {/* Member Name and Vital Info */}
          <div className="flex-1 min-w-0">
            {/* TÊN THÀNH VIÊN TRÊN CÂY GIA PHẢ VIẾT HOA THEO YÊU CẦU */}
            <h3
              className={`text-xs sm:text-sm font-black truncate leading-snug tracking-wide uppercase ${
                isTraditional ? 'text-amber-100' : 'text-slate-900'
              }`}
              title={member.fullName}
            >
              {member.fullName.toUpperCase()}
            </h3>

            {/* Courtesy or Posthumous name if present */}
            {(member.courtesyName || member.posthumousName) && (
              <p
                className={`text-[10.5px] truncate italic ${
                  isTraditional ? 'text-amber-300/90' : 'text-slate-500'
                }`}
              >
                {member.courtesyName ? `Tự: ${member.courtesyName}` : `Thụy: ${member.posthumousName}`}
              </p>
            )}

            {/* Order Title & Mother attribution (if father has multiple wives) */}
            <div className="flex flex-wrap items-center gap-1 mt-0.5">
              {member.orderTitle && (
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                    isTraditional
                      ? 'bg-red-950/80 text-amber-300 border border-amber-500/20'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {member.orderTitle}
                </span>
              )}

              {/* Nơi sinh nếu có */}
              {member.birthPlace && (
                <span
                  className={`text-[9.5px] flex items-center gap-0.5 truncate max-w-[140px] ${
                    isTraditional ? 'text-amber-200/70' : 'text-slate-500'
                  }`}
                  title={`Nơi sinh: ${member.birthPlace}`}
                >
                  <MapPin className="w-2.5 h-2.5 flex-shrink-0 text-amber-400" />
                  {member.birthPlace}
                </span>
              )}
            </div>

            {/* Mother clarification if known */}
            {mother && (
              <p
                className={`text-[9.5px] mt-0.5 italic truncate ${
                  isTraditional ? 'text-amber-300/80' : 'text-slate-500'
                }`}
              >
                Mẹ: {mother.fullName} {mother.orderTitle ? `(${mother.orderTitle})` : ''}
              </p>
            )}

            {/* Dates (Birth & Death & Giỗ) */}
            {showDates && (
              <div
                className={`text-[10px] mt-1 leading-tight ${
                  isTraditional ? 'text-amber-200/80' : 'text-slate-500'
                }`}
              >
                <span>
                  {member.birthDate ? member.birthDate.split('-')[0] : '????'} -{' '}
                  {member.isAlive
                    ? 'Nay'
                    : member.deathDate
                    ? member.deathDate.split('-')[0]
                    : 'Mất'}
                </span>
                {!member.isAlive && member.deathDateLunar && (
                  <span className="block text-[9.5px] text-amber-400 font-medium">
                    Giỗ: {member.deathDateLunar}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SPOUSES SECTION: LINE KẾT NỐI HÔN PHỐI (VỢ CHỒNG) */}
        {showSpouse && spouses.length > 0 && (
          <div className="mt-2.5 pt-2 relative">
            {/* Thanh Line Kết Nối Hôn Phối Nổi Bật */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-rose-400/70 to-rose-500" />
              <div className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-950/80 border border-rose-400 text-rose-200 flex items-center gap-1 shadow-sm">
                <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400/40" />
                <span>Line Kết Nối Hôn Phối (Vợ Chồng)</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-rose-400/70 to-rose-500" />
            </div>

            {/* Khung nối nhánh hôn phối từ chồng xuống từng người vợ */}
            <div className="space-y-2 relative pl-3 border-l-2 border-dashed border-rose-400/70 ml-1.5">
              {spouses.map((sp, sIdx) => {
                const spChildren = childrenBySpouse[sp.id] || [];
                return (
                  <div
                    key={sp.id}
                    className={`p-2 rounded-xl text-xs flex flex-col gap-1 relative shadow-sm transition-all ${
                      isTraditional
                        ? 'border border-rose-400/50 bg-[#350209]/90 text-rose-100'
                        : 'border border-rose-300 bg-rose-50/90 text-slate-800'
                    }`}
                  >
                    {/* Nhánh ngang nối từ đường dọc vào thẻ vợ */}
                    <div className="absolute -left-[14px] top-3.5 w-3 h-0.5 bg-rose-400" />

                    {/* Header Thẻ Vợ: Avatar, Họ Tên, Thứ Tự Vợ */}
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {showAvatar && (
                          <div className="flex-shrink-0">
                            <DefaultAvatar
                              avatarUrl={sp.avatarUrl}
                              gender="female"
                              fullName={sp.fullName}
                              size="sm"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-bold text-[11px] uppercase tracking-wide text-rose-200 truncate">
                              {sp.fullName}
                            </span>
                            <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-400/40 font-semibold flex-shrink-0">
                              {sp.orderTitle || (sIdx === 0 ? 'Vợ Cả (Chánh Thất)' : `Vợ Thứ ${sIdx + 1} (Kế Thất)`)}
                            </span>
                          </div>
                          <div className="text-[9px] text-rose-300/80 flex items-center gap-1 mt-0.5">
                            <span className="text-amber-400 font-bold">⚭</span>
                            <span>Hôn phối: <strong className="text-amber-200">{member.fullName.toUpperCase()}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Nút xem chi tiết vợ */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMember(sp);
                        }}
                        className="px-1.5 py-0.5 rounded bg-rose-500/30 hover:bg-rose-500/50 text-rose-200 text-[9.5px] flex items-center gap-0.5 flex-shrink-0 transition-colors"
                        title="Xem hồ sơ phối ngẫu"
                      >
                        <Eye className="w-2.5 h-2.5" />
                        <span>Xem</span>
                      </button>
                    </div>

                    {/* Phân định con trực hệ sinh ra từ người vợ này */}
                    <div className="pt-1 border-t border-rose-400/20 text-[9.5px]">
                      <div className="text-amber-200/90 flex flex-col gap-1">
                        <span className="font-semibold text-rose-300">Con sinh ra:</span>
                        {spChildren.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {spChildren.map((cName, cIdx) => (
                              <span
                                key={cIdx}
                                className={`text-[8.5px] px-1.5 py-0.2 rounded font-semibold border ${
                                  isTraditional
                                    ? 'bg-amber-950/70 text-amber-200 border-amber-500/40'
                                    : 'bg-white text-slate-700 border-slate-300'
                                }`}
                              >
                                {cName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="italic opacity-60">Chưa ghi nhận hậu duệ</span>
                        )}
                      </div>
                    </div>

                    {/* Ngày giỗ / năm mất */}
                    {!sp.isAlive && sp.deathDateLunar && (
                      <div className="text-[9px] text-amber-300/90 flex items-center gap-1">
                        <span>Giỗ:</span>
                        <span className="font-semibold text-amber-200">{sp.deathDateLunar}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => onSelectMember(member)}
            className={`flex-1 py-1 px-1.5 text-[10.5px] font-medium rounded flex items-center justify-center gap-1 transition-colors ${
              isTraditional
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            <Eye className="w-3 h-3" />
            Chi tiết
          </button>

          {canEdit && (
            <>
              {onAddChild && (
                <button
                  type="button"
                  title="Thêm con cho thành viên này"
                  onClick={() => onAddChild(member)}
                  className={`py-1 px-2 text-[10.5px] font-medium rounded flex items-center gap-1 transition-colors ${
                    isTraditional
                      ? 'bg-red-800/80 hover:bg-red-700 text-amber-100 border border-amber-500/40'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  <UserPlus className="w-3 h-3" />
                  + Con
                </button>
              )}

              {onAddSpouse && (
                <button
                  type="button"
                  title="Thêm phối ngẫu (Vợ/Chồng)"
                  onClick={() => onAddSpouse(member)}
                  className={`py-1 px-1.5 text-[10.5px] font-medium rounded flex items-center transition-colors ${
                    isTraditional
                      ? 'bg-amber-700/60 hover:bg-amber-600 text-amber-100'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                  }`}
                >
                  <Heart className="w-3 h-3" />
                </button>
              )}

              {canDelete && onDeleteMember && !member.isRootAncestor && (
                <button
                  type="button"
                  title="Xóa thành viên khỏi cây"
                  onClick={handleDeleteClick}
                  className="py-1 px-1.5 text-[10.5px] font-medium rounded text-red-400 hover:text-red-200 hover:bg-red-950/60 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom Handle for Children connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`!w-3 !h-3 !border-2 ${
          isTraditional ? '!bg-amber-400 !border-[#4a0005]' : '!bg-blue-500 !border-white'
        }`}
      />
    </div>
  );
});

FamilyTreeNode.displayName = 'FamilyTreeNode';

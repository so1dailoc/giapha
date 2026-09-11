import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Member, UserRole } from '../types';
import { Crown, Heart, UserPlus, Eye, Trash2, MapPin, Sparkles, GitFork, ChevronDown, ChevronUp, MoreHorizontal, Settings2 } from 'lucide-react';
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
  showTitles?: boolean;
  showHierarchy?: boolean;
  showBirthPlace?: boolean;
  userRole: UserRole;
  onSelectMember: (member: Member) => void;
  onAddChild?: (parent: Member) => void;
  onAddSpouse?: (member: Member) => void;
  onDeleteMember?: (id: string) => void;
  branchName?: string;
  branchColor?: string;
  isHighlighted?: boolean;

  // 5 Solutions Enhancements:
  childrenCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: (memberId: string) => void;
  onFocusSubtree?: (memberId: string) => void;
  isSubtreeRoot?: boolean;
  isDirectAncestor?: boolean; // Tổ tiên trực hệ của nhánh đang xem
  isZigZagTier2?: boolean;
  isVerticalCard?: boolean; // Phương án thẻ dọc từ đời thứ 6 trở xuống
  cardWidth?: number;
  cardHeight?: number;
  cardNameFontSize?: number;
  cardNameColor?: string;
  cardNameBackgroundColor?: string;
  cardBackgroundColor?: string;
  cardBorderColor?: string;
  horizontalCardFontSize?: number;
  horizontalCardNameAlignment?: 'auto' | 'left' | 'center' | 'right';
  horizontalCardNameColor?: string;
  horizontalCardNameBackgroundColor?: string;
  horizontalCardBackgroundColor?: string;
  horizontalCardBorderColor?: string;
  verticalCardFontSize?: number;
  verticalCardNameAlignment?: 'auto' | 'left' | 'center' | 'right';
  verticalCardNameColor?: string;
  verticalCardNameBackgroundColor?: string;
  verticalCardBackgroundColor?: string;
  verticalCardBorderColor?: string;
  showBranchLabel?: boolean;
  compactSpouseDisplay?: boolean;
  mobileCardScale?: number;
  mobileCardMinWidth?: number;
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
    showTitles = false,
    showHierarchy = false,
    showBirthPlace = false,
    userRole,
    onSelectMember,
    onAddChild,
    onAddSpouse,
    onDeleteMember,
    branchName,
    isHighlighted,
    childrenCount = 0,
    isCollapsed = false,
    onToggleCollapse,
    onFocusSubtree,
    isSubtreeRoot = false,
    isDirectAncestor = false,
    isVerticalCard = false,
    cardWidth,
    cardHeight,
    cardNameFontSize = 14,
    cardNameColor,
    cardNameBackgroundColor,
    cardBackgroundColor,
    cardBorderColor,
    horizontalCardFontSize,
    horizontalCardNameAlignment = 'auto',
    horizontalCardNameColor,
    horizontalCardNameBackgroundColor,
    horizontalCardBackgroundColor,
    horizontalCardBorderColor,
    verticalCardFontSize,
    verticalCardNameAlignment = 'auto',
    verticalCardNameColor,
    verticalCardNameBackgroundColor,
    verticalCardBackgroundColor,
    verticalCardBorderColor,
    showBranchLabel = true,
    compactSpouseDisplay = true,
    mobileCardMinWidth = 240,
  } = data;

  const isTraditional = theme === 'traditional';
  const canEdit = userRole === 'super_admin' || userRole === 'branch_admin';
  const canDelete = userRole === 'super_admin';
  const [adminToolsOpen, setAdminToolsOpen] = useState(false);

  // Font family class mapping to prevent broken Vietnamese diacritics
  const fontClass =
    fontFamily === 'be-vietnam'
      ? "font-['Be_Vietnam_Pro',sans-serif]"
      : fontFamily === 'merriweather'
      ? "font-['Merriweather',serif]"
      : "font-['Plus_Jakarta_Sans',sans-serif]";

  // Minimal card mode: only Name and Generation (User requested default!)
  const isMinimalCard = !showSpouse && !showAvatar && !showDates && !showTitles && !showBirthPlace;

  // Card-specific visual tokens deliberately live on the card itself. The
  // website theme must never override the administrator's card name color or
  // background. CSS custom properties let the values remain configurable while
  // safely surviving global theme selectors that use !important.
  const activeNameColor = isVerticalCard
    ? (verticalCardNameColor || cardNameColor || (isTraditional ? '#fef3c7' : '#0f172a'))
    : (horizontalCardNameColor || cardNameColor || (isTraditional ? '#fef3c7' : '#0f172a'));
  const activeNameBackground = isVerticalCard
    ? (verticalCardNameBackgroundColor || cardNameBackgroundColor || 'transparent')
    : (horizontalCardNameBackgroundColor || cardNameBackgroundColor || 'transparent');
  const activeCardBackground = isVerticalCard
    ? (verticalCardBackgroundColor || cardBackgroundColor || undefined)
    : (horizontalCardBackgroundColor || cardBackgroundColor || undefined);
  const activeCardBorder = isVerticalCard
    ? (verticalCardBorderColor || cardBorderColor || undefined)
    : (horizontalCardBorderColor || cardBorderColor || undefined);
  const nameAlignment = isVerticalCard ? verticalCardNameAlignment : horizontalCardNameAlignment;
  const resolvedNameAlignment = nameAlignment === 'auto' ? 'center' : nameAlignment;
  const nameSizeBase = isVerticalCard ? (verticalCardFontSize || cardNameFontSize) : (horizontalCardFontSize || cardNameFontSize);
  const nameFontSize = isVerticalCard
    ? Math.max(11, Math.min(18, nameSizeBase))
    : Math.max(13, Math.min(24, nameSizeBase));
  const cardTokenStyle = {
    '--card-name-color': activeNameColor,
    '--card-name-bg': activeNameBackground,
    '--card-bg': activeCardBackground,
    '--card-border': activeCardBorder,
  } as React.CSSProperties;

  // Traditional Theme Styles (Hoành phi, đỏ thẫm & viền vàng hoàng gia)
  const nodeWidthClass = '';

  const traditionalNodeClass = `
    relative rounded-xl transition-all duration-300 shadow-xl border-2
    ${
      isHighlighted
        ? 'border-yellow-300 ring-4 ring-yellow-400/60 scale-105 z-30'
        : isSubtreeRoot
        ? 'border-yellow-300 ring-4 ring-red-500/80 scale-105 z-25 bg-gradient-to-b from-[#8B0000] via-[#6d0008] to-[#3a0005]'
        : isDirectAncestor
        ? 'border-amber-400/90 ring-2 ring-amber-400/50 bg-gradient-to-b from-[#7a050e] via-[#520309] to-[#300206]'
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
        : isSubtreeRoot
        ? 'border-amber-500 ring-4 ring-amber-300 scale-105 z-25 bg-amber-50 text-amber-950'
        : isDirectAncestor
        ? 'border-amber-400 bg-amber-50/70 text-amber-950'
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

  const deleteMember = () => {
    if (confirm(`Bạn có chắc chắn muốn xóa thành viên "${member.fullName}" khỏi cây gia phả không?`)) {
      onDeleteMember?.(member.id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMember();
  };

  // PHƯƠNG ÁN THẺ THÀNH VIÊN DỌC (Nếu được Admin/Người xem bật)
  // Đảm bảo font chữ luôn đồng nhất với đời trên thông qua fontClass
  if (isVerticalCard) {
    const nameWords = member.fullName.trim().split(/\s+/);
    const verticalNodeClass = isTraditional
      ? `relative rounded-xl transition-all duration-300 shadow-xl border-2 cursor-pointer select-none group ${
          isHighlighted
            ? 'border-yellow-300 ring-4 ring-yellow-400/60 scale-105 z-30'
            : isSubtreeRoot
            ? 'border-yellow-300 ring-4 ring-red-500/80 scale-105 z-25 bg-gradient-to-b from-[#8B0000] to-[#3a0005]'
            : isDirectAncestor
            ? 'border-amber-400/90 ring-2 ring-amber-400/50 bg-gradient-to-b from-[#7a050e] to-[#300206]'
            : member.isAlive
            ? 'border-amber-500/80 bg-gradient-to-b from-[#5c0612] via-[#45050e] to-[#2c0309]'
            : 'border-yellow-700/70 bg-gradient-to-b from-[#400207] via-[#2f0105] to-[#1c0103]'
        } text-amber-50`
      : `relative rounded-xl transition-all duration-300 shadow-md border cursor-pointer select-none group ${
          isHighlighted
            ? 'border-blue-500 ring-4 ring-blue-300 scale-105 z-30'
            : member.isAlive
            ? 'border-emerald-400 bg-white text-slate-800'
            : 'border-slate-300 bg-slate-50 text-slate-700'
        }`;

    return (
      <div
        className={`${verticalNodeClass} ${fontClass} family-tree-card-content-aware`}
        style={{ ...cardTokenStyle, width: cardWidth || undefined, minWidth: cardWidth || undefined, maxWidth: cardWidth || undefined, minHeight: cardHeight || undefined, height: 'auto', boxSizing: 'border-box', overflow: 'visible' }}
        onClick={() => onSelectMember(member)}
        title={`${member.fullName} (Đời ${member.generation}) - Nhấp để xem hồ sơ chi tiết`}
      >
        {/* Top Handle for Parent connection */}
        {!member.isRootAncestor && (
          <Handle
            type="target"
            position={Position.Top}
            className={`!w-3 !h-3 !border-2 ${
              isTraditional ? '!bg-amber-400 !border-[#4a0005]' : '!bg-blue-500 !border-white'
            }`}
          />
        )}

        {/* Decorative corner motifs */}
        {isTraditional && (
          <>
            <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-amber-400/80 pointer-events-none" />
            <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-amber-400/80 pointer-events-none" />
            <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-amber-400/80 pointer-events-none" />
            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-amber-400/80 pointer-events-none" />
          </>
        )}

        {/* Header: Đời & Trạng thái Sống/Mất */}
        <div
          className={`px-1.5 py-1 flex items-center justify-between text-[9px] font-bold rounded-t-[10px] border-b ${
            isTraditional
              ? 'bg-[#350207]/95 border-amber-500/30 text-amber-300'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
        >
          <span className="font-serif tracking-tight text-[9.5px]">Đời {member.generation}</span>
          <span
            className={`w-2 h-2 rounded-full border ${
              isTraditional ? 'border-[#300207]' : 'border-white'
            } ${member.isAlive ? 'bg-emerald-400 shadow-[0_0_4px_#34d399]' : 'bg-amber-600'}`}
            title={member.isAlive ? 'Còn sống' : 'Đã tạ thế'}
          />
        </div>

        {/* Thứ bậc trong nhà - CHỈ HIỂN THỊ KHI CÓ THÔNG TIN THỨ BẬC, KHÔNG HIỂN THỊ NAM/NỮ */}
        {member.orderTitle && (
          <div className="px-1 pt-1 flex justify-center">
            <span
              className={`text-[8.5px] font-medium px-1.5 py-0.2 rounded truncate max-w-[70px] ${
                isTraditional
                  ? 'bg-amber-950/70 text-amber-300 border border-amber-500/20'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {member.orderTitle}
            </span>
          </div>
        )}

        {/* HỌ VÀ TÊN SỔ DỌC (TỪNG TỪ XUỐNG DÒNG) */}
        <div className="px-1 py-1.5 flex flex-col items-center">
          <div
            className={`family-tree-card-name w-full flex flex-col items-center justify-center py-2 px-1 rounded border transition-colors ${
              isTraditional
                ? 'bg-black/30 border-amber-500/30 group-hover:border-amber-400/70'
                : 'bg-slate-50 border-slate-200 group-hover:border-blue-300'
            }`}
            style={{ '--card-name-color': activeNameColor, '--card-name-bg': activeNameBackground } as React.CSSProperties}
          >
            {nameWords.map((word, idx) => (
              <span
                key={idx}
                className={`block font-bold tracking-wider leading-none my-0.5 ${fontClass} ${
                  isTraditional
                    ? 'text-amber-100 drop-shadow-sm uppercase'
                    : 'text-slate-800 font-bold uppercase'
                }`} style={{ fontSize: `${nameFontSize}px`, textAlign: resolvedNameAlignment, lineHeight: 1.12 }}
              >
                {word}
              </span>
            ))}
          </div>

          {/* Tự / Thụy nếu có */}
          {showTitles && (member.courtesyName || member.posthumousName) && (
            <p
              className={`text-[8px] text-center italic truncate w-full mt-0.5 ${
                isTraditional ? 'text-amber-300/80' : 'text-slate-500'
              }`}
              title={member.courtesyName ? `Tự: ${member.courtesyName}` : `Thụy: ${member.posthumousName}`}
            >
              {member.courtesyName || member.posthumousName}
            </p>
          )}

          {/* Năm sinh - năm mất */}
          {showDates && (member.birthDate || member.deathDate || !member.isAlive) && (
            <div
              className={`text-[8.5px] text-center mt-1 leading-tight font-mono ${
                isTraditional ? 'text-amber-300/70' : 'text-slate-500'
              }`}
            >
              {member.birthDate ? member.birthDate.split('-')[0] : '?'}
              {member.isAlive
                ? ''
                : member.deathDate
                ? `-${member.deathDate.split('-')[0]}`
                : '-†'}
            </div>
          )}

          {/* Phối ngẫu nếu bật showSpouse */}
          {showSpouse && spouses.length > 0 && (
            <div
              className={`text-[8px] flex items-center justify-center gap-0.5 mt-1 px-1 py-0.5 rounded truncate max-w-full ${
                isTraditional
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
              title={`Phối ngẫu: ${spouses.map((s) => s.fullName).join(', ')}`}
            >
              <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400 shrink-0" />
              <span className="truncate">{spouses[0].fullName.split(' ').pop()}</span>
            </div>
          )}
        </div>

        {/* Hover Action Floating Bar
            Desktop: show on hover.
            Touch/mobile: always show because there is no reliable hover gesture. */}
        <div className="family-tree-mobile-actions opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity flex items-center justify-center gap-1 pb-1">
          <button
            type="button"
            title="Xem chi tiết"
            onClick={(e) => {
              e.stopPropagation();
              onSelectMember(member);
            }}
            className="nodrag nopan p-1 rounded bg-amber-500 text-amber-950 hover:bg-amber-400 shadow text-[9px] sm:min-w-0 min-w-6 min-h-6 flex items-center justify-center"
          >
            <Eye className="w-2.5 h-2.5" />
          </button>

          {onFocusSubtree && (
            <button
              type="button"
              title="Xem riêng cành nhánh / tổ tiên trực hệ của người này"
              onClick={(e) => {
                e.stopPropagation();
                onFocusSubtree(member.id);
              }}
              className="nodrag nopan p-1 rounded bg-amber-600/80 text-amber-100 hover:bg-amber-500 shadow text-[9px] sm:min-w-0 min-w-6 min-h-6 flex items-center justify-center"
            >
              <GitFork className="w-2.5 h-2.5" />
            </button>
          )}

          {canEdit && onAddSpouse && <button type="button" title="Thêm phối ngẫu" onClick={(e) => { e.stopPropagation(); onAddSpouse(member); }} className="nodrag nopan p-1 rounded bg-rose-500 text-white shadow text-[9px] min-w-6 min-h-6 flex items-center justify-center"><Heart className="w-2.5 h-2.5" /></button>}

          {canEdit && onAddChild && (
            <button
              type="button"
              title="Thêm con"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(member);
              }}
              className="nodrag nopan p-1 rounded bg-red-800 text-amber-100 hover:bg-red-700 shadow text-[9px] sm:min-w-0 min-w-6 min-h-6 flex items-center justify-center"
            >
              <UserPlus className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Nút Thu Gọn / Mở Rộng Cành Con [+] / [-] */}
        {childrenCount > 0 && onToggleCollapse && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(member.id);
            }}
            className={`absolute ${isVerticalCard ? '-right-3 top-1/2 -translate-y-1/2' : '-bottom-3 left-1/2 -translate-x-1/2'} z-40 px-1.5 py-0.2 rounded-full text-[8.5px] font-bold shadow-md flex items-center gap-0.5 transition-all whitespace-nowrap ${
              isCollapsed
                ? 'bg-amber-500 text-amber-950 ring-1 ring-amber-300 hover:scale-105'
                : isTraditional
                ? 'bg-[#3b0206] text-amber-300 border border-amber-500/60 hover:bg-amber-600 hover:text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
            }`}
            title={isCollapsed ? `Mở rộng ${childrenCount} con` : `Thu gọn ${childrenCount} con`}
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-2.5 h-2.5" />
                <span>+{childrenCount}</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-2.5 h-2.5" />
                <span>-{childrenCount}</span>
              </>
            )}
          </button>
        )}

        {/* Bottom Handle for Children connection */}
        <Handle
          type="source"
          position={Position.Bottom}
          className={`!w-3 !h-3 !border-2 ${
            isTraditional ? '!bg-amber-400 !border-[#4a0005]' : '!bg-blue-500 !border-white'
          }`}
        />
      </div>
    );
  }

  const branchLabel = [member.phaiName, member.chiName, member.nhanhName].filter(Boolean).join(' • ') || branchName;
  const compactSpouses = spouses.slice(0, 2);
  const extraSpouses = Math.max(0, spouses.length - compactSpouses.length);
  const compactMeta = [
    showDates && (member.birthDate || member.deathDate)
      ? `${member.birthDate?.split('-')[0] || '????'}–${member.isAlive ? 'Nay' : member.deathDate?.split('-')[0] || 'Mất'}`
      : '',
    showBirthPlace && member.birthPlace ? member.birthPlace : '',
  ].filter(Boolean);

  return (
    <div
      className={`${isTraditional ? traditionalNodeClass : modernNodeClass} ${fontClass} family-tree-card-content-aware family-tree-card-compact`}
      style={{
        ...cardTokenStyle,
        width: cardWidth || undefined,
        minWidth: cardWidth || undefined,
        maxWidth: cardWidth || undefined,
        minHeight: cardHeight || undefined,
        height: 'auto',
        boxSizing: 'border-box',
        overflow: 'visible',
      } as React.CSSProperties}
    >
      {!member.isRootAncestor && (
        <Handle type="target" position={Position.Top} className={`!w-3 !h-3 !border-2 ${isTraditional ? '!bg-amber-400 !border-[#4a0005]' : '!bg-blue-500 !border-white'}`} />
      )}

      {isTraditional && (
        <>
          <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400/80 pointer-events-none" />
          <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400/80 pointer-events-none" />
          <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400/80 pointer-events-none" />
          <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400/80 pointer-events-none" />
        </>
      )}

      {isSubtreeRoot && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 px-2.5 py-0.5 rounded-full bg-amber-500 text-amber-950 font-black text-[8.5px] shadow-xl border border-yellow-300 flex items-center gap-1 whitespace-nowrap">
          <GitFork className="w-2.5 h-2.5" /><span>Cụ khởi cành</span>
        </div>
      )}

      <div className={`px-3 py-2 flex items-center justify-between gap-2 rounded-t-[10px] border-b ${isTraditional ? 'bg-[#350207]/95 border-amber-500/30 text-amber-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          {member.isRootAncestor ? <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" /> : member.generation === 2 ? <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
          <span className="tracking-wide text-[10px] font-black uppercase truncate">{member.isRootAncestor ? 'TRIỆU TỔ' : member.generation === 2 ? 'KHẢI TỔ' : `ĐỜI ${member.generation}`}</span>
        </div>
        <span title={member.isAlive ? 'Còn sống' : 'Đã tạ thế'} className={`w-2.5 h-2.5 rounded-full border shrink-0 ${isTraditional ? 'border-[#300207]' : 'border-white'} ${member.isAlive ? 'bg-emerald-400' : 'bg-amber-600'}`} />
      </div>

      {showBranchLabel && branchLabel && member.generation > 2 && (
        <div className={`mx-3 mt-2 px-2 py-1 rounded-md text-[9px] font-semibold text-center truncate ${isTraditional ? 'bg-amber-950/60 text-amber-300 border border-amber-500/20' : 'bg-slate-50 text-slate-500 border border-slate-200'}`} title={branchLabel}>
          {branchLabel}
        </div>
      )}

      <div className="p-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {showAvatar && (
            <div className="relative shrink-0">
              <DefaultAvatar avatarUrl={member.avatarUrl} gender={member.gender} fullName={member.fullName} size="sm" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border ${isTraditional ? 'border-[#300207]' : 'border-white'} ${member.isAlive ? 'bg-emerald-500' : 'bg-amber-600'}`} />
            </div>
          )}
          <div className="min-w-0 flex-1 text-center">
            <div className="family-tree-card-name font-black tracking-wide uppercase break-words select-text rounded-md px-2 py-1.5" style={{ '--card-name-color': activeNameColor, '--card-name-bg': activeNameBackground, fontSize: `${nameFontSize}px`, textAlign: resolvedNameAlignment, lineHeight: 1.14 } as React.CSSProperties} title={member.fullName}>
              {member.fullName.toUpperCase()}
            </div>
            {showTitles && (member.courtesyName || member.posthumousName || member.orderTitle) && (
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                {member.orderTitle && <span className={`text-[8.5px] px-1.5 py-0.5 rounded ${isTraditional ? 'bg-red-950/80 text-amber-300 border border-amber-500/20' : 'bg-slate-100 text-slate-600'}`}>{member.orderTitle}</span>}
                {member.courtesyName && <span className={`text-[8.5px] italic truncate max-w-[150px] ${isTraditional ? 'text-amber-300/80' : 'text-slate-500'}`}>Tự: {member.courtesyName}</span>}
                {!member.courtesyName && member.posthumousName && <span className={`text-[8.5px] italic truncate max-w-[150px] ${isTraditional ? 'text-amber-300/80' : 'text-slate-500'}`}>Thụy: {member.posthumousName}</span>}
              </div>
            )}
          </div>
        </div>

        {compactMeta.length > 0 && (
          <div className={`mt-2 flex flex-wrap justify-center gap-1.5 text-[8.5px] ${isTraditional ? 'text-amber-200/80' : 'text-slate-500'}`}>
            {compactMeta.map((item) => <span key={item} className={`px-1.5 py-0.5 rounded-full border truncate max-w-[150px] ${isTraditional ? 'border-amber-500/20 bg-black/20' : 'border-slate-200 bg-slate-50'}`}>{item}</span>)}
            {showDates && !member.isAlive && member.deathDateLunar && <span className="px-1.5 py-0.5 rounded-full border border-amber-500/20 bg-amber-950/30 text-amber-300">Giỗ {member.deathDateLunar}</span>}
          </div>
        )}

        {showSpouse && spouses.length > 0 && (
          <div className={`mt-2 flex flex-wrap items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 border ${isTraditional ? 'bg-rose-950/40 border-rose-500/25' : 'bg-rose-50 border-rose-200'}`}>
            <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400/50 shrink-0" />
            {compactSpouses.map((sp) => (
              <button key={sp.id} type="button" className={`nodrag nopan max-w-[125px] truncate text-[8.5px] font-semibold px-1.5 py-0.5 rounded-full ${isTraditional ? 'bg-rose-900/60 text-rose-200' : 'bg-white text-rose-700 border border-rose-200'}`} title={`Xem phối ngẫu: ${sp.fullName}`} onClick={(e) => { e.stopPropagation(); onSelectMember(sp); }}>
                {sp.fullName}
              </button>
            ))}
            {extraSpouses > 0 && <span className={`text-[8px] font-bold ${isTraditional ? 'text-rose-300' : 'text-rose-600'}`}>+{extraSpouses}</span>}
          </div>
        )}

        <div className={`family-tree-card-actions mt-2.5 pt-2 border-t ${isTraditional ? 'border-amber-500/20' : 'border-slate-200'} grid gap-1.5 ${canEdit ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <button type="button" onClick={(e) => { e.stopPropagation(); onSelectMember(member); }} className={`family-tree-action-btn nodrag nopan py-1.5 px-1 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 min-h-8 ${isTraditional ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30' : 'bg-slate-100 text-slate-700 border border-slate-300'}`}>
            <Eye className="w-3 h-3" /> <span>Chi tiết</span>
          </button>
          {onFocusSubtree && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onFocusSubtree(member.id); }} className={`family-tree-action-btn nodrag nopan py-1.5 px-1 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 min-h-8 ${isTraditional ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
              <GitFork className="w-3 h-3" /> <span>Nhánh</span>
            </button>
          )}
          {canEdit && (
            <div className="relative">
              <button type="button" aria-expanded={adminToolsOpen} onClick={(e) => { e.stopPropagation(); setAdminToolsOpen((v) => !v); }} className={`family-tree-action-btn nodrag nopan w-full py-1.5 px-1 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 min-h-8 ${isTraditional ? 'bg-red-800/80 text-amber-100 border border-amber-500/40' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                <Settings2 className="w-3 h-3" /> <span>Quản trị</span>
              </button>
              {adminToolsOpen && (
                <div className={`absolute bottom-full right-0 mb-2 z-[100] w-40 rounded-xl border shadow-2xl p-1.5 ${isTraditional ? 'bg-[#250104] border-amber-500/60' : 'bg-white border-slate-200'}`} onClick={(e) => e.stopPropagation()}>
                  {onAddChild && <button type="button" onClick={() => { setAdminToolsOpen(false); onAddChild(member); }} className={`w-full px-2.5 py-2 rounded-lg text-left text-[10px] font-bold flex items-center gap-2 ${isTraditional ? 'text-amber-100 hover:bg-amber-900/50' : 'text-slate-700 hover:bg-slate-100'}`}><UserPlus className="w-3.5 h-3.5" /> Thêm con</button>}
                  {onAddSpouse && <button type="button" onClick={() => { setAdminToolsOpen(false); onAddSpouse(member); }} className={`w-full px-2.5 py-2 rounded-lg text-left text-[10px] font-bold flex items-center gap-2 ${isTraditional ? 'text-rose-200 hover:bg-rose-900/40' : 'text-rose-700 hover:bg-rose-50'}`}><Heart className="w-3.5 h-3.5" /> Thêm phối ngẫu</button>}
                  {canDelete && onDeleteMember && !member.isRootAncestor && <button type="button" onClick={() => { setAdminToolsOpen(false); deleteMember(); }} className="w-full px-2.5 py-2 rounded-lg text-left text-[10px] font-bold text-red-400 hover:bg-red-950/30 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Xóa thành viên</button>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {childrenCount > 0 && onToggleCollapse && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onToggleCollapse(member.id); }} className={`absolute -bottom-3 left-1/2 -translate-x-1/2 z-40 px-2.5 py-0.5 rounded-full text-[9px] font-bold shadow-lg flex items-center gap-1 whitespace-nowrap ${isCollapsed ? 'bg-amber-500 text-amber-950 ring-2 ring-amber-300' : isTraditional ? 'bg-[#3b0206] text-amber-300 border border-amber-500/60' : 'bg-white text-slate-700 border border-slate-300'}`} title={isCollapsed ? `Mở rộng ${childrenCount} con` : `Thu gọn ${childrenCount} con`}>
          {isCollapsed ? <><ChevronDown className="w-3 h-3" /><span>+ {childrenCount} con</span></> : <><ChevronUp className="w-3 h-3" /><span>- {childrenCount} con</span></>}
        </button>
      )}

      <Handle type="source" position={Position.Bottom} className={`!w-3 !h-3 !border-2 ${isTraditional ? '!bg-amber-400 !border-[#4a0005]' : '!bg-blue-500 !border-white'}`} />
    </div>
  );
});

FamilyTreeNode.displayName = 'FamilyTreeNode';

import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Member, UserRole } from '../types';
import { Crown, Heart, UserPlus, Eye, Trash2, MapPin, Sparkles, GitFork, ChevronDown, ChevronUp } from 'lucide-react';
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
  cardThemePreset?: 'traditional' | 'modern' | 'ivory' | 'emerald' | 'midnight';
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
    cardThemePreset = theme === 'traditional' ? 'traditional' : 'modern',
  } = data;

  const isTraditional = cardThemePreset === 'traditional';
  const canEdit = userRole === 'super_admin' || userRole === 'branch_admin';
  const canDelete = userRole === 'super_admin';
  const cardPresetPalette = {
    traditional: { accent: '#d4a72c', muted: '#f3c969', surface: '#350207', action: '#6b2a08', actionText: '#fff7d6', name: '#fef3c7', admin: '#4a1808', danger: '#9f1239', info: '#fbbf24' },
    modern: { accent: '#0ea5e9', muted: '#64748b', surface: '#f8fafc', action: '#e0f2fe', actionText: '#0f172a', name: '#0f172a', admin: '#eef2ff', danger: '#e11d48', info: '#2563eb' },
    ivory: { accent: '#b88746', muted: '#765b3b', surface: '#fff1c2', action: '#f7e6bb', actionText: '#4a2c10', name: '#4a2c10', admin: '#f8edd7', danger: '#b42318', info: '#8b5e34' },
    emerald: { accent: '#65a30d', muted: '#4d7c0f', surface: '#dcfce7', action: '#dcfce7', actionText: '#14532d', name: '#14532d', admin: '#ecfdf5', danger: '#be123c', info: '#15803d' },
    midnight: { accent: '#818cf8', muted: '#a5b4fc', surface: '#1e293b', action: '#312e81', actionText: '#f8fafc', name: '#f8fafc', admin: '#1e1b4b', danger: '#be123c', info: '#818cf8' },
  }[cardThemePreset] || undefined;
  const cardPalette = cardPresetPalette || { accent: '#d4a72c', muted: '#f3c969', surface: '#350207', action: '#6b2a08', actionText: '#fff7d6', name: '#fef3c7', admin: '#4a1808', danger: '#9f1239', info: '#fbbf24' };

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
    ? (verticalCardNameColor || cardNameColor || cardPalette.name)
    : (horizontalCardNameColor || cardNameColor || cardPalette.name);
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
  const resolvedNameAlignment = nameAlignment === 'auto'
    ? (isVerticalCard ? 'center' : (showAvatar || showSpouse || showDates || showTitles || showBirthPlace ? 'left' : 'center'))
    : nameAlignment;
  const nameSizeBase = isVerticalCard ? (verticalCardFontSize || cardNameFontSize) : (horizontalCardFontSize || cardNameFontSize);
  const nameFontSize = isVerticalCard
    ? Math.max(11, Math.min(18, nameSizeBase))
    : Math.max(13, Math.min(24, nameSizeBase));
  const cardTokenStyle = {
    '--card-name-color': activeNameColor,
    '--card-name-bg': activeNameBackground,
    '--card-bg': activeCardBackground || (isTraditional ? '#5c0612' : cardPalette.surface),
    '--card-border': activeCardBorder || cardPalette.accent,
    '--card-accent': cardPalette.accent,
    '--card-muted': cardPalette.muted,
    '--card-surface': cardPalette.surface,
    '--card-action-bg': cardPalette.action,
    '--card-action-text': cardPalette.actionText,
    '--card-admin-bg': cardPalette.admin,
    '--card-danger': cardPalette.danger,
    '--card-info': cardPalette.info,
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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc chắn muốn xóa thành viên "${member.fullName}" khỏi cây gia phả không?`)) {
      onDeleteMember?.(member.id);
    }
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
        className={`${verticalNodeClass} ${fontClass} family-tree-card-content-aware family-tree-card-shell`}
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
          className={`family-tree-card-header px-1.5 py-1 flex items-center justify-between text-[9px] font-bold rounded-t-[10px] border-b ${
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

        {/* Avatar dọc: chỉ chiếm một vùng cố định, tên vẫn giữ trọng tâm. */}
        {showAvatar && (
          <div className="relative flex justify-center py-1">
            <DefaultAvatar avatarUrl={member.avatarUrl} gender={member.gender} fullName={member.fullName} size="sm" />
            <span title={member.isAlive ? 'Còn sống' : 'Đã tạ thế'} className={`absolute bottom-0 right-1/2 translate-x-4 w-2.5 h-2.5 rounded-full border ${isTraditional ? 'border-[#300207]' : 'border-white'} ${member.isAlive ? 'bg-emerald-400' : 'bg-amber-600'}`} />
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

          {showHierarchy && hierarchyDetails && (
            <div className={`w-full mt-1 px-1 text-[7.5px] text-center truncate ${isTraditional ? 'text-amber-300/75' : 'text-slate-500'}`} title={hierarchyDetails}>
              {hierarchyDetails}
            </div>
          )}

          {showBirthPlace && member.birthPlace && (
            <div className={`w-full mt-1 flex items-center justify-center gap-0.5 text-[7.5px] truncate ${isTraditional ? 'text-amber-200/75' : 'text-slate-500'}`} title={`Nơi sinh: ${member.birthPlace}`}>
              <MapPin className="w-2 h-2 shrink-0" />
              <span className="truncate">{member.birthPlace}</span>
            </div>
          )}

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

        {/* Action toolbar: compact primary controls for vertical cards. Admin tools live in a separate row. */}
        <div className="family-tree-card-actions family-tree-card-actions-vertical px-1.5 pb-1.5 pt-0.5 flex flex-col gap-1.5">
          <div className="family-tree-card-primary-actions grid grid-cols-2 gap-1.5">
            <button type="button" title="Xem chi tiết" onClick={(e) => { e.stopPropagation(); onSelectMember(member); }} className="family-tree-action-btn family-tree-action-primary nodrag nopan">
              <Eye className="w-3.5 h-3.5" />
              <span className="sr-only">Chi tiết</span>
            </button>
            {onFocusSubtree && (
              <button type="button" title="Xem riêng cành nhánh" onClick={(e) => { e.stopPropagation(); onFocusSubtree(member.id); }} className="family-tree-action-btn family-tree-action-primary family-tree-action-secondary nodrag nopan">
                <GitFork className="w-3.5 h-3.5" />
                <span className="sr-only">Nhánh</span>
              </button>
            )}
          </div>
          {canEdit && (
            <div className="family-tree-card-admin-actions grid grid-cols-3 gap-1">
              {onAddSpouse && <button type="button" title="Thêm phối ngẫu" onClick={(e) => { e.stopPropagation(); onAddSpouse(member); }} className="family-tree-action-btn family-tree-action-admin nodrag nopan"><Heart className="w-3.5 h-3.5" /></button>}
              {onAddChild && <button type="button" title="Thêm con" onClick={(e) => { e.stopPropagation(); onAddChild(member); }} className="family-tree-action-btn family-tree-action-admin nodrag nopan"><UserPlus className="w-3.5 h-3.5" /></button>}
              {canDelete && onDeleteMember && !member.isRootAncestor && <button type="button" title="Xóa thành viên" onClick={handleDeleteClick} className="family-tree-action-btn family-tree-action-admin family-tree-action-danger nodrag nopan"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
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
            className={`absolute ${isVerticalCard ? '-right-3 top-1/2 -translate-y-1/2' : '-bottom-3 left-1/2 -translate-x-1/2'} family-tree-collapse-control z-40 px-1.5 py-0.2 rounded-full text-[8.5px] font-bold shadow-md flex items-center gap-0.5 transition-all whitespace-nowrap ${
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

  return (
    <div className={`${isTraditional ? traditionalNodeClass : modernNodeClass} ${fontClass} family-tree-card-content-aware family-tree-card-shell`} style={{ ...cardTokenStyle, width: cardWidth || undefined, minWidth: cardWidth || undefined, maxWidth: cardWidth || undefined, minHeight: cardHeight || undefined, height: 'auto', boxSizing: 'border-box', overflow: 'visible' }}>
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

      {/* PA 2: Huy hiệu Đang Xem Nhánh hoặc Tổ Tiên Trực Hệ */}
      {isSubtreeRoot && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 px-3 py-0.5 rounded-full bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white font-black text-[9.5px] uppercase tracking-wider shadow-xl border border-yellow-300 flex items-center gap-1.5 ring-2 ring-yellow-400/60 whitespace-nowrap animate-pulse">
          <GitFork className="w-3 h-3 text-yellow-200" />
          <span>Cụ Khởi Cành Nhánh</span>
        </div>
      )}
      {!isSubtreeRoot && isDirectAncestor && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 px-2.5 py-0.5 rounded-full bg-amber-500 text-amber-950 font-black text-[9px] uppercase tracking-wider shadow-md border border-amber-200 flex items-center gap-1 whitespace-nowrap">
          <Crown className="w-2.5 h-2.5 fill-amber-950" />
          <span>Tổ Tiên Trực Hệ</span>
        </div>
      )}

      {/* Header Banner: Canh giữa thế hệ & Trạng thái sống/mất */}
      <div
        className={`family-tree-card-header px-3 py-1.5 flex items-center justify-center relative text-[11px] font-bold rounded-t-[10px] ${
          isTraditional
            ? 'bg-[#350207]/95 border-b border-amber-500/30 text-amber-300'
            : member.isRootAncestor
            ? 'bg-amber-200/80 border-b border-amber-300 text-amber-900'
            : member.generation === 2
            ? 'bg-amber-100 border-b border-amber-300 text-amber-900'
            : 'bg-slate-100 border-b border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-1.5 justify-center">
          {member.isRootAncestor ? (
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          ) : member.generation === 2 ? (
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
          )}
          <span className="tracking-wider uppercase">
            {member.isRootAncestor
              ? 'TRIỆU TỔ (ĐỜI 1)'
              : member.generation === 2
              ? 'KHẢI TỔ (ĐỜI 2)'
              : `ĐỜI THỨ ${member.generation}`}
          </span>
        </div>

        {/* Trạng thái sống / mất ở góc phải header */}
        <span
          title={member.isAlive ? 'Còn sống' : 'Đã tạ thế'}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border ${
            isTraditional ? 'border-[#300207]' : 'border-white'
          } ${member.isAlive ? 'bg-emerald-400 shadow-[0_0_5px_#34d399]' : 'bg-amber-600'}`}
        />
      </div>

      {/* Phái > Chi > Nhánh Sub-header (Chỉ hiển thị khi bật showHierarchy) */}
      {showHierarchy && hierarchyDetails && member.generation > 2 && (
        <div
          className={`px-3 py-0.5 text-[9.5px] truncate font-medium text-center ${
            isTraditional
              ? 'bg-[#290104] text-amber-300/80 border-b border-amber-500/10'
              : 'bg-slate-50 text-slate-500 border-b border-slate-100'
          }`}
          title={`Phân cấp: ${hierarchyDetails}`}
        >
          {hierarchyDetails}
        </div>
      )}

      {/* Main Card Body: Canh giữa tên thành viên và các thông tin */}
      <div className={`${isMinimalCard ? 'p-2.5' : 'p-3'} ${childrenCount > 0 ? 'pb-6' : ''}`}>
        <div className="flex flex-col items-center justify-center text-center w-full">
          {/* Avatar (Facebook style) - ONLY rendered when showAvatar is true */}
          {showAvatar && (
            <div className="relative mb-2 flex justify-center">
              <DefaultAvatar
                avatarUrl={member.avatarUrl}
                gender={member.gender}
                fullName={member.fullName}
                size="md"
              />
              <span
                title={member.isAlive ? 'Còn sống' : 'Đã tạ thế'}
                className={`absolute bottom-0 right-1 w-3 h-3 rounded-full border-2 ${
                  isTraditional ? 'border-[#300207]' : 'border-white'
                } ${member.isAlive ? 'bg-emerald-500' : 'bg-amber-600'}`}
              />
            </div>
          )}

          {/* TÊN THÀNH VIÊN TRÊN CÂY GIA PHẢ: VIẾT HOA VÀ CANH GIỮA HOÀN TOÀN */}
          <h3
            className={`family-tree-card-name font-black tracking-wide uppercase w-full break-words select-text ${fontClass} ${
              isMinimalCard ? 'py-1' : 'py-1.5'
            }`}
            title={member.fullName}
            style={{
              '--card-name-color': activeNameColor,
              '--card-name-bg': activeNameBackground,
              fontSize: `${nameFontSize}px`,
              textAlign: resolvedNameAlignment,
              lineHeight: 1.14,
            } as React.CSSProperties}
          >
            {member.fullName.toUpperCase()}
          </h3>

          {/* Courtesy or Posthumous name if present and showTitles is on */}
          {showTitles && (member.courtesyName || member.posthumousName) && (
            <p
              className={`text-[10.5px] truncate italic text-center w-full mt-0.5 ${
                isTraditional ? 'text-amber-300/90' : 'text-slate-500'
              }`}
            >
              {member.courtesyName ? `Tự: ${member.courtesyName}` : `Thụy: ${member.posthumousName}`}
            </p>
          )}

          {/* Order Title */}
          {showTitles && member.orderTitle && (
            <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
              {member.orderTitle && (
                <span
                  className={`text-[9.5px] font-medium px-1.5 py-0.5 rounded ${
                    isTraditional
                      ? 'bg-red-950/80 text-amber-300 border border-amber-500/20'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {member.orderTitle}
                </span>
              )}

            </div>
          )}

          {showBirthPlace && member.birthPlace && (
            <div className={`mt-1 max-w-full flex items-center justify-center gap-1 text-[9.5px] truncate ${isTraditional ? 'text-amber-200/75' : 'text-slate-500'}`} title={`Nơi sinh: ${member.birthPlace}`}>
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{member.birthPlace}</span>
            </div>
          )}

          {/* Mother clarification if known and showTitles is on */}
          {showTitles && mother && (
            <p
              className={`text-[9.5px] mt-0.5 italic truncate text-center w-full ${
                isTraditional ? 'text-amber-300/80' : 'text-slate-500'
              }`}
            >
              Mẹ: {mother.fullName} {mother.orderTitle ? `(${mother.orderTitle})` : ''}
            </p>
          )}

          {/* Dates (Birth & Death & Giỗ) */}
          {showDates && (
            <div
              className={`text-[10px] mt-1 text-center leading-tight w-full ${
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
                <span className="block text-[9.5px] text-amber-400 font-medium mt-0.5">
                  Giỗ: {member.deathDateLunar}
                </span>
              )}
            </div>
          )}
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
                        className="nodrag nopan px-1.5 py-0.5 rounded bg-rose-500/30 hover:bg-rose-500/50 text-rose-200 text-[9.5px] flex items-center gap-0.5 flex-shrink-0 transition-colors min-h-7"
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

        {/* Action Toolbar: primary actions are always equal; admin tools are a separate compact row. */}
        <div className={`family-tree-card-actions mt-2.5 pt-2 border-t border-[color:var(--card-accent)]/25 flex flex-col gap-1.5 ${isVerticalCard ? 'family-tree-card-actions-vertical' : ''}`}>
          <div className="family-tree-card-primary-actions grid grid-cols-2 gap-1.5">
            <button
              type="button"
              title="Xem chi tiết"
              onClick={(e) => { e.stopPropagation(); onSelectMember(member); }}
              className="family-tree-action-btn family-tree-action-primary nodrag nopan"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Chi tiết</span>
            </button>
            {onFocusSubtree && (
              <button
                type="button"
                title="Xem riêng cành nhánh / tổ tiên trực hệ của người này"
                onClick={(e) => { e.stopPropagation(); onFocusSubtree(member.id); }}
                className="family-tree-action-btn family-tree-action-primary family-tree-action-secondary nodrag nopan"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Nhánh</span>
              </button>
            )}
          </div>

          {canEdit && (
            <div className="family-tree-card-admin-actions grid grid-cols-3 gap-1">
              {onAddSpouse && (
                <button type="button" title="Thêm phối ngẫu" onClick={(e) => { e.stopPropagation(); onAddSpouse(member); }} className="family-tree-action-btn family-tree-action-admin nodrag nopan">
                  <Heart className="w-3.5 h-3.5" />
                  <span className="sr-only">Thêm phối ngẫu</span>
                </button>
              )}
              {onAddChild && (
                <button type="button" title="Thêm con" onClick={(e) => { e.stopPropagation(); onAddChild(member); }} className="family-tree-action-btn family-tree-action-admin nodrag nopan">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="sr-only">Thêm con</span>
                </button>
              )}
              {canDelete && onDeleteMember && !member.isRootAncestor && (
                <button type="button" title="Xóa thành viên khỏi cây" onClick={handleDeleteClick} className="family-tree-action-btn family-tree-action-admin family-tree-action-danger nodrag nopan">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="sr-only">Xóa thành viên</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PA 1: Nút Thu Gọn / Mở Rộng Nhánh Con [+] / [-] */}
      {childrenCount > 0 && onToggleCollapse && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(member.id);
          }}
          className={`absolute ${isVerticalCard ? '-right-3 top-1/2 -translate-y-1/2' : '-bottom-3 left-1/2 -translate-x-1/2'} family-tree-collapse-control z-40 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1 transition-all ${
            isCollapsed
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 ring-2 ring-amber-300 shadow-amber-500/50 hover:scale-105 active:scale-95'
              : isTraditional
              ? 'bg-[#3b0206] text-amber-300 border border-amber-500/60 hover:bg-amber-600 hover:text-white'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 shadow'
          }`}
          title={isCollapsed ? `Bấm để mở rộng ${childrenCount} con cháu` : `Bấm để thu gọn nhánh ${childrenCount} con cháu`}
        >
          {isCollapsed ? (
            <>
              <ChevronDown className="w-3 h-3 text-amber-950 font-bold" />
              <span>+ {childrenCount} con</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-3 h-3 text-amber-400 font-bold" />
              <span>- {childrenCount} con</span>
            </>
          )}
        </button>
      )}

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

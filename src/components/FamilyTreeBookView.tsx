import React, { useState, useMemo } from 'react';
import { Member, Branch, UserRole } from '../types';
import { compareFamilyMembers } from '../utils/layoutEngineV4';
import {
  Search,
  BookOpen,
  Printer,
  ChevronDown,
  ChevronRight,
  GitFork,
  Eye,
  MapPin,
  Calendar,
  Heart,
  Crown,
  Sparkles,
  Users,
  Filter,
} from 'lucide-react';

interface FamilyTreeBookViewProps {
  members: Member[];
  branches: Branch[];
  userRole: UserRole;
  theme: 'traditional' | 'modern';
  onSelectMember: (member: Member) => void;
  onSwitchToGraphView: (memberId?: string) => void;
  onFocusSubtree: (memberId: string) => void;
}

export const FamilyTreeBookView: React.FC<FamilyTreeBookViewProps> = ({
  members,
  branches,
  userRole,
  theme,
  onSelectMember,
  onSwitchToGraphView,
  onFocusSubtree,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhai, setSelectedPhai] = useState<string>('all');
  const [collapsedGenerations, setCollapsedGenerations] = useState<Set<number>>(new Set());
  const [expandedMemberDetails, setExpandedMemberDetails] = useState<Set<string>>(new Set());

  const isTraditional = theme === 'traditional';

  // Normalize search helper
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .trim();

  // Unique phai names
  const phaiList = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.phaiName) set.add(m.phaiName);
    });
    return Array.from(set).sort();
  }, [members]);

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Phái filter
      if (selectedPhai !== 'all') {
        if (m.generation > 2 && m.phaiName !== selectedPhai) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = normalize(searchQuery);
        const nameMatch = normalize(m.fullName).includes(q);
        const courtesyMatch = m.courtesyName && normalize(m.courtesyName).includes(q);
        const posthumousMatch = m.posthumousName && normalize(m.posthumousName).includes(q);
        const phaiMatch = m.phaiName && normalize(m.phaiName).includes(q);
        const chiMatch = m.chiName && normalize(m.chiName).includes(q);
        const jobMatch = m.occupation && normalize(m.occupation).includes(q);
        const genMatch = `doi ${m.generation}`.includes(q) || `d${m.generation}`.includes(q);
        return nameMatch || courtesyMatch || posthumousMatch || phaiMatch || chiMatch || jobMatch || genMatch;
      }

      return true;
    });
  }, [members, selectedPhai, searchQuery]);

  // Group by generation
  const membersByGeneration = useMemo(() => {
    const map = new Map<number, Member[]>();
    filteredMembers.forEach((m) => {
      const g = m.generation || 1;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m);
    });

    // Sort inside each generation with the same canonical family ordering as the tree.
    map.forEach((list) => {
      list.sort((a, b) => {
        if (a.fatherId !== b.fatherId) return (a.fatherId || '').localeCompare(b.fatherId || '');
        if (a.motherId !== b.motherId) return (a.motherId || '').localeCompare(b.motherId || '');
        return compareFamilyMembers(a, b);
      });
    });

    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [filteredMembers]);

  // Toggle generation collapse
  const toggleGeneration = (gen: number) => {
    setCollapsedGenerations((prev) => {
      const next = new Set(prev);
      if (next.has(gen)) next.delete(gen);
      else next.add(gen);
      return next;
    });
  };

  const expandAllGens = () => setCollapsedGenerations(new Set());
  const collapseDeepGens = () => {
    const deep = new Set<number>();
    for (let i = 7; i <= 15; i++) deep.add(i);
    setCollapsedGenerations(deep);
  };

  // Toggle single member detail
  const toggleMemberDetail = (id: string) => {
    setExpandedMemberDetails((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const memberMap = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  // Count children for each member
  const childrenCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    members.forEach((m) => {
      if (m.fatherId) {
        counts.set(m.fatherId, (counts.get(m.fatherId) || 0) + 1);
      }
      if (m.motherId) {
        counts.set(m.motherId, (counts.get(m.motherId) || 0) + 1);
      }
    });
    return counts;
  }, [members]);

  return (
    <div
      className={`w-full rounded-2xl border shadow-xl flex flex-col ${
        isTraditional
          ? 'bg-[#180103] border-amber-500/40 text-amber-50'
          : 'bg-slate-50 border-slate-200 text-slate-900'
      }`}
    >
      {/* Header Filter Bar */}
      <div
        className={`p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-md ${
          isTraditional
            ? 'bg-[#2a0307]/95 border-amber-500/30'
            : 'bg-white/95 border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-amber-950 shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-serif uppercase tracking-wide text-amber-200">
              Sổ Phả Hệ Dòng Tộc (Dạng Văn Bản Phân Tầng)
            </h2>
            <p className="text-xs text-amber-300/80">
              Hiển thị chi tiết theo từng thế hệ, tối ưu đọc sách, in ấn và không bao giờ bị tràn chiều ngang.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <input
              type="text"
              placeholder="Tìm tên, tự, kỵ, chức danh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-1.5 pl-8 pr-3 text-xs rounded-xl border focus:outline-none ${
                isTraditional
                  ? 'bg-black/40 border-amber-500/40 text-amber-100 placeholder-amber-400/50 focus:border-amber-400'
                  : 'bg-slate-100 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500'
              }`}
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-400/70" />
          </div>

          {/* Phái Filter */}
          <select
            value={selectedPhai}
            onChange={(e) => setSelectedPhai(e.target.value)}
            className={`py-1.5 px-3 text-xs rounded-xl border focus:outline-none font-medium ${
              isTraditional
                ? 'bg-[#3b0206] border-amber-500/40 text-amber-100'
                : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="all">Tất cả Phái & Chi</option>
            {phaiList.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Quick Collapse Buttons */}
          <button
            type="button"
            onClick={expandAllGens}
            className={`px-3 py-1.5 text-xs rounded-xl border font-medium flex items-center gap-1 transition-all ${
              isTraditional
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/40'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
            title="Mở rộng tất cả các đời"
          >
            Mở Hết
          </button>

          <button
            type="button"
            onClick={collapseDeepGens}
            className={`px-3 py-1.5 text-xs rounded-xl border font-medium flex items-center gap-1 transition-all ${
              isTraditional
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/40'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
            title="Thu gọn từ Đời 7 trở đi"
          >
            Gọn Đời 7+
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 text-xs rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold flex items-center gap-1.5 shadow"
            title="In sổ gia phả dạng văn bản"
          >
            <Printer className="w-3.5 h-3.5" />
            In Sổ
          </button>
        </div>
      </div>

      {/* Book Content Body */}
      <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
        {membersByGeneration.map(([generation, memberList]) => {
          const isCollapsed = collapsedGenerations.has(generation);
          return (
            <div
              key={generation}
              className={`rounded-2xl border overflow-hidden transition-all ${
                isTraditional
                  ? 'border-amber-500/30 bg-gradient-to-b from-[#220205] to-[#160103]'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              {/* Generation Header */}
              <div
                onClick={() => toggleGeneration(generation)}
                className={`p-4 flex items-center justify-between cursor-pointer select-none transition-colors ${
                  isTraditional
                    ? 'bg-gradient-to-r from-[#400207] via-[#52030a] to-[#400207] hover:from-[#4c0309] border-b border-amber-500/30 text-amber-100'
                    : 'bg-slate-100 hover:bg-slate-200/80 border-b border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center font-serif font-bold text-amber-300">
                    {generation}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm sm:text-base tracking-wide text-amber-200 flex items-center gap-2">
                      <span>ĐỜI THỨ {generation}</span>
                      {generation === 1 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/60 border border-red-400 text-white font-sans font-normal">
                          Thủy Tổ Khai Sáng
                        </span>
                      )}
                      {generation === 2 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-600/60 border border-amber-400 text-white font-sans font-normal">
                          Đệ Nhị Thế Tổ
                        </span>
                      )}
                    </h3>
                    <span className="text-xs opacity-75 font-sans">
                      {memberList.length} vị thành viên ghi nhận
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="opacity-70 text-[11px] hidden sm:inline">
                    {isCollapsed ? 'Nhấn để mở xem' : 'Nhấn để thu gọn'}
                  </span>
                  {isCollapsed ? (
                    <ChevronRight className="w-5 h-5 text-amber-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-amber-400" />
                  )}
                </div>
              </div>

              {/* Members List in this Generation */}
              {!isCollapsed && (
                <div className="p-3 sm:p-5 divide-y divide-amber-500/10 space-y-4 sm:space-y-0">
                  {memberList.map((m, idx) => {
                    const isExpanded = expandedMemberDetails.has(m.id);
                    const childrenCount = childrenCountMap.get(m.id) || 0;
                    const father = m.fatherId ? memberMap.get(m.fatherId) : null;
                    const mother = m.motherId ? memberMap.get(m.motherId) : null;
                    const spouses = m.spouseIds
                      ? m.spouseIds.map((sid) => memberMap.get(sid)).filter(Boolean)
                      : [];

                    return (
                      <div
                        key={m.id}
                        className={`pt-4 pb-4 first:pt-0 last:pb-0 transition-all rounded-xl p-3 ${
                          isExpanded
                            ? isTraditional
                              ? 'bg-amber-950/30 border border-amber-500/30'
                              : 'bg-slate-50 border border-slate-200'
                            : 'hover:bg-amber-500/5'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          {/* Left: Info */}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Order number */}
                              <span className="text-[11px] px-2 py-0.5 rounded bg-black/40 text-amber-400 font-mono font-bold border border-amber-500/30">
                                #{idx + 1}
                              </span>

                              {/* Full Name */}
                              <h4
                                onClick={() => onSelectMember(m)}
                                className="font-serif font-bold text-sm sm:text-base text-amber-100 hover:text-amber-300 cursor-pointer transition-colors"
                              >
                                {m.fullName}
                              </h4>

                              {/* Gender badge */}
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  m.gender === 'male'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                                }`}
                              >
                                {m.gender === 'male' ? 'Nam' : 'Nữ'}
                              </span>

                              {/* Phái / Chi */}
                              {m.phaiName && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                                  {m.phaiName}
                                </span>
                              )}

                              {m.chiName && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                  {m.chiName}
                                </span>
                              )}

                              {/* Alive / Deceased */}
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  m.isAlive
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-950/60 text-amber-400/80 border border-amber-500/30'
                                }`}
                              >
                                {m.isAlive ? 'Còn sống' : 'Đã tạ thế'}
                              </span>
                            </div>

                            {/* Subtitle names */}
                            <div className="flex flex-wrap items-center gap-x-3 text-xs text-amber-200/80">
                              {m.courtesyName && (
                                <span>
                                  Tên tự: <b>{m.courtesyName}</b>
                                </span>
                              )}
                              {m.posthumousName && (
                                <span>
                                  Tên thụy: <b>{m.posthumousName}</b>
                                </span>
                              )}
                              {m.occupation && (
                                <span>
                                  Chức vụ/Học vị: <i>{m.occupation}</i>
                                </span>
                              )}
                            </div>

                            {/* Parentage */}
                            <div className="text-xs text-amber-300/70 flex flex-wrap items-center gap-x-2">
                              {father && (
                                <span>
                                  Thân phụ: <b className="text-amber-200">{father.fullName}</b>
                                  {father.courtesyName ? ` (${father.courtesyName})` : ''}
                                </span>
                              )}
                              {mother && (
                                <span>
                                  • Thân mẫu: <b className="text-amber-200">{mother.fullName}</b>
                                </span>
                              )}
                              {m.orderInFamily && (
                                <span>• Thứ bậc: Con thứ {m.orderInFamily}</span>
                              )}
                            </div>

                            {/* Death anniversary and burial */}
                            {!m.isAlive && (m.deathDateLunar || m.burialLocation) && (
                              <div className="text-xs text-amber-300/80 flex flex-wrap items-center gap-x-3 pt-0.5">
                                {m.deathDateLunar && (
                                  <span className="flex items-center gap-1 text-amber-300">
                                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                    Ngày kỵ giỗ: <b>{m.deathDateLunar}</b> Âm lịch
                                  </span>
                                )}
                                {m.burialLocation && (
                                  <span className="flex items-center gap-1 text-amber-300/90">
                                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                    Mộ táng: {m.burialLocation}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Spouses List */}
                            {spouses.length > 0 && (
                              <div className="text-xs pt-1">
                                <span className="text-amber-400 font-semibold flex items-center gap-1">
                                  <Heart className="w-3 h-3 text-rose-400" />
                                  Phu nhân / Phối ngẫu ({spouses.length} vị):
                                </span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {spouses.map((sp: any, sIdx: number) => (
                                    <span
                                      key={sIdx}
                                      className="px-2 py-0.5 rounded bg-black/30 border border-amber-500/30 text-amber-200 text-[11px]"
                                    >
                                      {sp.fullName}
                                      {sp.deathDateLunar ? ` (Giỗ: ${sp.deathDateLunar})` : ''}
                                      {sp.burialLocation ? ` - Mộ: ${sp.burialLocation}` : ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Bio details toggle */}
                            {m.bio && isExpanded && (
                              <div className="mt-2 p-3 rounded-xl bg-black/40 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
                                <p className="font-semibold text-amber-400 mb-1">Tiểu sử & Sự nghiệp:</p>
                                {m.bio}
                              </div>
                            )}
                          </div>

                          {/* Right: Quick Actions */}
                          <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0">
                            {/* Jump to 2D Graph view */}
                            <button
                              type="button"
                              onClick={() => onSwitchToGraphView(m.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 flex items-center gap-1 transition-all"
                              title="Chuyển sang Cây Đồ Họa 2D và định vị tới vị này"
                            >
                              <Eye className="w-3 h-3" />
                              Xem trên Cây 2D
                            </button>

                            {/* Focus subtree */}
                            {childrenCount > 0 && (
                              <button
                                type="button"
                                onClick={() => onFocusSubtree(m.id)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-amber-600/40 to-amber-700/40 hover:from-amber-600/60 text-amber-100 border border-amber-500/50 flex items-center gap-1 transition-all"
                                title={`Xem riêng cành nhánh của cụ này (${childrenCount} con cháu)`}
                              >
                                <GitFork className="w-3 h-3 text-amber-400" />
                                Xem riêng nhánh ({childrenCount})
                              </button>
                            )}

                            {/* Detail popup */}
                            <button
                              type="button"
                              onClick={() => onSelectMember(m)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-amber-300/80 border border-amber-500/20 flex items-center gap-1"
                            >
                              Hồ Sơ Đầy Đủ
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredMembers.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-amber-500/30 bg-black/20 text-amber-300">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-60" />
            <p className="font-serif font-bold text-base">Không tìm thấy thành viên nào phù hợp</p>
            <p className="text-xs opacity-75 mt-1">Vui lòng thử từ khóa khác hoặc xóa bộ lọc</p>
          </div>
        )}
      </div>
    </div>
  );
};

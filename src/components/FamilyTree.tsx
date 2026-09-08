import React, { useMemo, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Member, Branch, UserRole, FamilyTreeSettings } from '../types';
import { FamilyTreeNode, FamilyTreeNodeData } from './FamilyTreeNode';
import {
  SlidersHorizontal,
  Palette,
  Search,
  Sparkles,
  ChevronDown,
  UserPlus,
  Type,
  ImageIcon,
  Heart,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FamilyTreeProps {
  members: Member[];
  branches: Branch[];
  userRole: UserRole;
  onSelectMember: (member: Member) => void;
  onAddChild: (parent: Member) => void;
  onAddSpouse: (member: Member) => void;
  onAddNewMember?: () => void;
  onDeleteMember?: (id: string) => void;
  highlightedMemberId?: string | null;
  onOpenAdmin?: () => void;
  onOpenAuth?: () => void;
}

const nodeTypes = {
  familyNode: FamilyTreeNode,
};

export const FamilyTree: React.FC<FamilyTreeProps> = ({
  members,
  branches,
  userRole,
  onSelectMember,
  onAddChild,
  onAddSpouse,
  onAddNewMember,
  onDeleteMember,
  highlightedMemberId,
  onOpenAdmin,
  onOpenAuth,
}) => {
  // Tree Settings: Mặc định tắt Thẻ Vợ/Chồng và Avatar theo yêu cầu người dùng
  const [settings, setSettings] = useState<FamilyTreeSettings>({
    theme: 'traditional',
    fontFamily: 'be-vietnam',
    showSpouses: false, // Mặc định TẮT theo yêu cầu
    showAvatars: false, // Mặc định TẮT theo yêu cầu
    showDates: true,
    showDaughters: true,
    orientation: 'vertical',
    zoomLevel: 1,
  });

  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [treeSearchQuery, setTreeSearchQuery] = useState<string>('');
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(highlightedMemberId || null);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Helper normalize Vietnamese string for smart search
  const normalizeSearch = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .trim();

  // Smart suggestions for real-time search dropdown
  const searchSuggestions = useMemo(() => {
    if (!treeSearchQuery.trim()) return [];
    const q = normalizeSearch(treeSearchQuery);
    return members
      .filter((m) => {
        const nameMatch = normalizeSearch(m.fullName).includes(q);
        const courtesyMatch = m.courtesyName && normalizeSearch(m.courtesyName).includes(q);
        const posthumousMatch = m.posthumousName && normalizeSearch(m.posthumousName).includes(q);
        const phaiMatch = m.phaiName && normalizeSearch(m.phaiName).includes(q);
        const chiMatch = m.chiName && normalizeSearch(m.chiName).includes(q);
        const genMatch =
          `doi ${m.generation}`.includes(q) ||
          `the he ${m.generation}`.includes(q) ||
          `d${m.generation}`.includes(q);
        return nameMatch || courtesyMatch || posthumousMatch || phaiMatch || chiMatch || genMatch;
      })
      .slice(0, 8);
  }, [treeSearchQuery, members]);

  // Map for branch lookups
  const branchMap = useMemo(() => {
    const map = new Map<string, Branch>();
    branches.forEach((b) => map.set(b.id, b));
    return map;
  }, [branches]);

  // Dynamically extract Phái and Chi options for filter dropdown
  const hierarchyFilterOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [
      { value: 'all', label: 'Tất cả Phái & Chi' },
    ];
    // Add branches (Phái & Chi)
    branches.forEach((b) => {
      options.push({ value: b.id, label: b.name });
    });
    // Add any unique phaiName from members not already present in branches
    const uniquePhai = new Set<string>();
    members.forEach((m) => {
      if (m.phaiName && !branches.some((b) => b.name.toLowerCase().includes(m.phaiName!.toLowerCase()))) {
        uniquePhai.add(m.phaiName);
      }
    });
    uniquePhai.forEach((phai) => {
      options.push({ value: `phai:${phai}`, label: phai });
    });
    return options;
  }, [branches, members]);

  // Filter members according to settings
  const filteredMembers = useMemo(() => {
    // If a branch/phai is selected, determine the matching member IDs and their direct ancestors
    let allowedMemberIds: Set<string> | null = null;
    if (selectedBranchId !== 'all') {
      allowedMemberIds = new Set<string>();
      const memberMap = new Map<string, Member>();
      members.forEach((m) => memberMap.set(m.id, m));

      members.forEach((m) => {
        let matches = false;
        if (selectedBranchId.startsWith('phai:')) {
          const phai = selectedBranchId.replace('phai:', '');
          matches = m.phaiName === phai;
        } else {
          matches = m.branchId === selectedBranchId;
        }

        if (matches) {
          allowedMemberIds!.add(m.id);
          // Traverse up to ancestors so the root lineage stays unbroken
          let currentParentId = m.fatherId || m.motherId;
          while (currentParentId) {
            allowedMemberIds!.add(currentParentId);
            const parent = memberMap.get(currentParentId);
            currentParentId = parent ? (parent.fatherId || parent.motherId) : null;
          }
        }
      });
    }

    return members.filter((m) => {
      // 1. Phái / Chi filter
      if (allowedMemberIds && !allowedMemberIds.has(m.id)) {
        return false;
      }

      // 2. In-law Spouses (Wives married into the clan)
      // They are rendered directly connected to their husband via the marriage connector line when "Hiện Vợ" is ON.
      // They should NOT be placed as duplicate floating orphan cards in the generation tree!
      const isInLawSpouse =
        m.gender === 'female' &&
        !m.isRootAncestor &&
        !m.fatherId &&
        m.spouseIds &&
        m.spouseIds.length > 0;

      if (isInLawSpouse) {
        return false;
      }

      // 3. Daughter filter (Bloodline daughters born in the clan)
      // When "Hiện Con gái" is toggled off, hide daughters from the tree
      if (!settings.showDaughters && m.gender === 'female' && !m.isRootAncestor) {
        return false;
      }

      return true;
    });
  }, [members, selectedBranchId, settings.showDaughters]);

  // Build tree nodes and edges with hierarchical layout calculation
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node<FamilyTreeNodeData>[] = [];
    const edges: Edge[] = [];

    // Group members by generation
    const genGroups = new Map<number, Member[]>();
    filteredMembers.forEach((m) => {
      const g = m.generation || 1;
      if (!genGroups.has(g)) genGroups.set(g, []);
      genGroups.get(g)!.push(m);
    });

    // Sort generations
    const sortedGens = Array.from(genGroups.keys()).sort((a, b) => a - b);

    // Spacing configuration (adaptive based on whether spouse cards / avatars are shown)
    const NODE_WIDTH = settings.showSpouses ? 340 : 270;
    const HORIZONTAL_GAP = settings.showSpouses ? 85 : 60;

    // Calculate dynamic Y position per generation based on maximum card height in that generation
    // This strictly prevents cards and lines from overlapping when "Hiện Vợ" is enabled!
    const genYMap = new Map<number, number>();
    let cumulativeY = 0;

    sortedGens.forEach((gen) => {
      genYMap.set(gen, cumulativeY);

      const genMembers = genGroups.get(gen) || [];
      let maxGenHeight = 155;

      if (settings.showSpouses) {
        maxGenHeight = 220;
        genMembers.forEach((m) => {
          const spouseCount = m.spouseIds?.length || 0;
          // Base card height + spouse box height (~120px each)
          const estHeight = 180 + spouseCount * 125;
          if (estHeight > maxGenHeight) {
            maxGenHeight = estHeight;
          }
        });
      } else if (settings.showAvatars) {
        maxGenHeight = 175;
      }

      // Vertical gap between bottom of this generation and top of next generation
      const verticalGap = settings.showSpouses ? 190 : 130;
      cumulativeY += maxGenHeight + verticalGap;
    });

    // Parent order map for intelligent sibling grouping (eliminates line crossing)
    const memberPositionOrder = new Map<string, number>();

    // Coordinate calculation: cluster siblings together under their parents
    sortedGens.forEach((gen) => {
      const genMembers = genGroups.get(gen) || [];

      // Sort members within generation:
      // 1. Group by parent position order from previous generation
      // 2. Then by order in family
      genMembers.sort((a, b) => {
        const parentOrderA = a.fatherId ? memberPositionOrder.get(a.fatherId) ?? 999 : 0;
        const parentOrderB = b.fatherId ? memberPositionOrder.get(b.fatherId) ?? 999 : 0;
        if (parentOrderA !== parentOrderB) {
          return parentOrderA - parentOrderB;
        }
        return (a.orderInFamily || 1) - (b.orderInFamily || 1);
      });

      const totalWidth = genMembers.length * (NODE_WIDTH + HORIZONTAL_GAP) - HORIZONTAL_GAP;
      const startX = -totalWidth / 2;
      const y = genYMap.get(gen) ?? 0;

      genMembers.forEach((m, idx) => {
        const x = startX + idx * (NODE_WIDTH + HORIZONTAL_GAP);
        memberPositionOrder.set(m.id, idx);

        // Find ALL spouses if toggled on (Hỗ trợ đa thê: Ông A có bà B và bà C)
        const spouses: Member[] = [];
        if (m.spouseIds && m.spouseIds.length > 0) {
          m.spouseIds.forEach((sId) => {
            const sp = members.find((item) => item.id === sId);
            if (sp) spouses.push(sp);
          });
        }

        // Calculate biological children per spouse:
        // Bà B có con là E, V. Bà C có con là G, H
        const childrenBySpouse: Record<string, string[]> = {};
        spouses.forEach((sp) => {
          const biologicalKids = members.filter(
            (c) =>
              (c.fatherId === m.id && c.motherId === sp.id) ||
              (c.motherId === m.id && c.fatherId === sp.id)
          );
          if (biologicalKids.length > 0) {
            childrenBySpouse[sp.id] = biologicalKids.map((c) => c.fullName.toUpperCase());
          }
        });

        // Find mother if specified
        const mother = m.motherId ? members.find((item) => item.id === m.motherId) || null : null;

        const isHighlighted = m.id === focusedMemberId || m.id === highlightedMemberId;

        nodes.push({
          id: m.id,
          type: 'familyNode',
          position: { x, y },
          data: {
            member: m,
            spouses,
            mother,
            childrenBySpouse,
            theme: settings.theme,
            fontFamily: settings.fontFamily || 'be-vietnam',
            showDates: settings.showDates,
            showSpouse: settings.showSpouses,
            showAvatar: settings.showAvatars,
            userRole,
            onSelectMember,
            onAddChild,
            onAddSpouse,
            onDeleteMember,
            branchName: branchMap.get(m.branchId)?.name,
            branchColor: branchMap.get(m.branchId)?.colorAccent,
            isHighlighted,
          },
        });

        // Edge from father or mother
        const parentId = m.fatherId || m.motherId;
        if (parentId && filteredMembers.some((p) => p.id === parentId)) {
          const isTraditional = settings.theme === 'traditional';
          edges.push({
            id: `e-${parentId}-${m.id}`,
            source: parentId,
            target: m.id,
            type: 'smoothstep',
            animated: isHighlighted,
            style: {
              stroke: isTraditional ? '#f59e0b' : '#3b82f6',
              strokeWidth: isHighlighted ? 3 : 2,
              strokeDasharray: m.gender === 'female' ? '4 4' : undefined,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isTraditional ? '#f59e0b' : '#3b82f6',
              width: 12,
              height: 12,
            },
          });
        }
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [
    filteredMembers,
    members,
    settings,
    userRole,
    onSelectMember,
    onAddChild,
    onAddSpouse,
    onDeleteMember,
    branchMap,
    focusedMemberId,
    highlightedMemberId,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when layout inputs change
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Jump to specific member and smoothly center ReactFlow canvas
  const jumpToMember = (targetMember: Member) => {
    setFocusedMemberId(targetMember.id);
    setTreeSearchQuery(targetMember.fullName);
    setIsSearchOpen(false);

    // Find node position in canvas
    const targetNode = nodes.find((n) => n.id === targetMember.id);
    if (targetNode && rfInstance) {
      rfInstance.setCenter(targetNode.position.x + 140, targetNode.position.y + 90, {
        zoom: 1.15,
        duration: 800,
      });
    }

    try {
      confetti({
        particleCount: 30,
        spread: 70,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
  };

  // Handle Tree quick search submit
  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!treeSearchQuery.trim()) return;

    if (searchSuggestions.length > 0) {
      jumpToMember(searchSuggestions[0]);
    } else {
      const q = normalizeSearch(treeSearchQuery.trim());
      const found = members.find((m) => normalizeSearch(m.fullName).includes(q));
      if (found) {
        jumpToMember(found);
      }
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = members.length;
    const living = members.filter((m) => m.isAlive).length;
    const deceased = total - living;
    const maxGen = Math.max(...members.map((m) => m.generation), 1);
    return { total, living, deceased, maxGen };
  }, [members]);

  const isTraditional = settings.theme === 'traditional';

  return (
    <div
      className={`relative w-full h-[780px] rounded-2xl overflow-hidden border shadow-2xl flex flex-col ${
        isTraditional
          ? 'bg-[#1e0205] border-amber-500/40 text-amber-50'
          : 'bg-slate-50 border-slate-200 text-slate-900'
      }`}
    >
      {/* Top Traditional Header Banner / Hoành phi câu đối */}
      <div
        className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 z-10 ${
          isTraditional
            ? 'bg-gradient-to-r from-[#400207] via-[#5c0612] to-[#400207] border-amber-500/40 shadow-md'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {/* Title and Motifs */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center border font-serif font-black text-lg ${
              isTraditional
                ? 'bg-amber-950 border-amber-400 text-amber-300 shadow-inner'
                : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}
          >
            宗
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className={`text-base md:text-lg font-bold tracking-wide uppercase ${
                  isTraditional ? 'font-serif text-amber-200' : 'text-slate-800'
                }`}
              >
                Cây Phả Hệ Đại Tộc
              </h2>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                  isTraditional
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {stats.maxGen} Thế Hệ ({stats.total} Thành Viên)
              </span>
            </div>
            <p
              className={`text-xs hidden sm:block ${
                isTraditional ? 'text-amber-300/70 italic' : 'text-slate-500'
              }`}
            >
              Thứ tự: Đời &gt; Phái &gt; Chi &gt; Nhánh • Chuẩn phông Quốc ngữ
            </p>
          </div>
        </div>

        {/* Quick Search bar inside Tree with live dropdown */}
        <div className="relative">
          <form onSubmit={handleQuickSearch} className="flex items-center">
            <div className="relative">
              <input
                type="text"
                value={treeSearchQuery}
                onFocus={() => {
                  if (treeSearchQuery.trim()) setIsSearchOpen(true);
                }}
                onChange={(e) => {
                  setTreeSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Tìm nhanh trên cây..."
                className={`text-xs px-3 py-1.5 pl-8 pr-7 rounded-lg border transition-all w-40 sm:w-56 focus:outline-none ${
                  isTraditional
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-100 placeholder-amber-400/50 focus:border-amber-300 focus:bg-amber-950/90 shadow-inner'
                    : 'bg-slate-100 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white shadow-sm'
                }`}
              />
              <Search
                className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${
                  isTraditional ? 'text-amber-400' : 'text-slate-400'
                }`}
              />
              {treeSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setTreeSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors ${
                    isTraditional
                      ? 'text-amber-400 hover:text-amber-200 hover:bg-white/10'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </form>

          {/* Live Search Suggestions Dropdown */}
          {isSearchOpen && treeSearchQuery.trim() && (
            <>
              {/* Invisible backdrop to dismiss dropdown when clicked outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSearchOpen(false)}
              />

              <div
                className={`absolute left-0 right-0 sm:right-auto sm:w-80 mt-1.5 max-h-72 overflow-y-auto rounded-xl border shadow-2xl z-50 p-1.5 space-y-1 text-xs animate-fadeIn ${
                  isTraditional
                    ? 'bg-[#2a0408] border-amber-500/60 text-amber-100 divide-y divide-amber-900/40'
                    : 'bg-white border-slate-200 text-slate-800 divide-y divide-slate-100'
                }`}
              >
                {searchSuggestions.length > 0 ? (
                  <>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider opacity-60">
                      Gợi ý khớp ({searchSuggestions.length})
                    </div>
                    {searchSuggestions.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => jumpToMember(member)}
                        className={`w-full text-left p-2 rounded-lg transition-colors flex items-start justify-between gap-2 group ${
                          isTraditional
                            ? 'hover:bg-amber-900/60 focus:bg-amber-900/70'
                            : 'hover:bg-slate-100 focus:bg-slate-100'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold font-serif uppercase text-amber-300 group-hover:underline truncate">
                              {member.fullName}
                            </span>
                            {member.courtesyName && (
                              <span className="text-[10px] opacity-70 italic">
                                ({member.courtesyName})
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] flex items-center gap-1.5 opacity-80 flex-wrap">
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                              Đời {member.generation}
                            </span>
                            {member.generation >= 3 && member.phaiName && (
                              <span className="truncate max-w-[120px]">{member.phaiName}</span>
                            )}
                            {member.orderTitle && (
                              <span className="opacity-75">• {member.orderTitle}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0 flex items-center gap-1 pt-1">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              member.isAlive ? 'bg-emerald-400' : 'bg-amber-500'
                            }`}
                            title={member.isAlive ? 'Còn sống' : 'Đã mất'}
                          />
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="p-3 text-center text-slate-400 italic text-[11px]">
                    Không tìm thấy thành viên nào phù hợp với &ldquo;{treeSearchQuery}&rdquo;
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Toolbar & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Nút Thêm thành viên ở đời bất kỳ */}
          {onAddNewMember && (userRole === 'super_admin' || userRole === 'branch_admin') && (
            <button
              type="button"
              onClick={onAddNewMember}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 transition-colors shadow-sm"
              title="Thêm thành viên ở một đời bất kỳ chưa có trong danh sách"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Thêm Thành Viên</span>
            </button>
          )}

          {/* Phái & Chi Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className={`text-xs font-semibold py-1.5 px-3 rounded-lg border appearance-none pr-7 cursor-pointer ${
                isTraditional
                  ? 'bg-[#400207] border-amber-500/50 text-amber-200 hover:border-amber-400'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
              }`}
              title="Lọc hiển thị theo Phái hoặc Chi trong dòng họ"
            >
              {hierarchyFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
          </div>

          {/* Font Selection Dropdown (Chuẩn dấu Tiếng Việt) */}
          <div className="relative">
            <select
              value={settings.fontFamily || 'be-vietnam'}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  fontFamily: e.target.value as 'be-vietnam' | 'merriweather' | 'sans',
                }))
              }
              className={`text-xs font-medium py-1.5 px-2.5 rounded-lg border appearance-none pr-6 cursor-pointer ${
                isTraditional
                  ? 'bg-[#400207] border-amber-500/50 text-amber-200 hover:border-amber-400'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
              }`}
              title="Chọn phông chữ hiển thị để tối ưu dấu tiếng Việt"
            >
              <option value="be-vietnam">Font: Be Vietnam Pro</option>
              <option value="merriweather">Font: Merriweather</option>
              <option value="sans">Font: Sans-serif</option>
            </select>
            <Type className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
          </div>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                theme: prev.theme === 'traditional' ? 'modern' : 'traditional',
              }))
            }
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 border transition-all ${
              isTraditional
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/50'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title="Đổi giao diện Hoàng Gia (Đỏ Vàng) / Hiện Đại"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">
              {isTraditional ? 'Hoàng Gia' : 'Hiện Đại'}
            </span>
          </button>

          {/* Lối vào AdminCP ngay trong thanh công cụ Cây gia phả */}
          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 shadow-md transition-all hover:scale-105 active:scale-95"
              title="Vào Bảng Điều Khiển Quản Trị Tộc (AdminCP)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-950" />
              <span>AdminCP</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary Controls Bar (Toggles for Spouses, Avatars, Daughters, Dates) */}
      <div
        className={`px-5 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-xs z-10 ${
          isTraditional
            ? 'bg-[#2b0206]/95 border-amber-500/20 text-amber-200'
            : 'bg-slate-100/90 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <span className="font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider opacity-80">
            <SlidersHorizontal className="w-3 h-3 text-amber-400" />
            Tùy chọn:
          </span>

          {/* Toggle Vợ (Phối ngẫu) - Mặc định TẮT */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.showSpouses}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, showSpouses: e.target.checked }))
              }
              className="rounded border-rose-400 text-rose-600 focus:ring-rose-500"
            />
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-semibold text-rose-200">
              Hiện Vợ {settings.showSpouses ? '(Bật)' : '(Mặc định Tắt)'}
            </span>
          </label>

          {/* Toggle Con gái - Mặc định BẬT */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.showDaughters}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, showDaughters: e.target.checked }))
              }
              className="rounded border-amber-500 text-amber-600 focus:ring-amber-500"
            />
            <span className="font-medium">
              Hiện con gái {settings.showDaughters ? '(Bật)' : '(Tắt)'}
            </span>
          </label>

          {/* Toggle Avatar - Mặc định TẮT */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.showAvatars}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, showAvatars: e.target.checked }))
              }
              className="rounded border-amber-500 text-amber-600 focus:ring-amber-500"
            />
            <ImageIcon className="w-3 h-3 text-amber-400" />
            <span>Ảnh Avatar {settings.showAvatars ? '(Bật)' : '(Tắt)'}</span>
          </label>

          {/* Toggle Dates */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.showDates}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, showDates: e.target.checked }))
              }
              className="rounded border-amber-500 text-amber-600 focus:ring-amber-500"
            />
            <span>Năm sinh/mất & Ngày giỗ</span>
          </label>
        </div>

        {/* Legend / Status hints */}
        <div className="flex items-center gap-3 text-[11px] opacity-90">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Còn sống ({stats.living})</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
            <span>Đã mất ({stats.deceased})</span>
          </div>
        </div>
      </div>

      {/* React Flow Interactive Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onInit={(instance) => setRfInstance(instance)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.8}
        >
          <Background
            color={isTraditional ? '#7b1113' : '#cbd5e1'}
            gap={24}
            size={1.5}
            variant={BackgroundVariant.Dots}
          />
          <Controls
            className={`!border rounded-lg shadow-lg overflow-hidden ${
              isTraditional
                ? '!bg-[#3c0308] !border-amber-500/50 !text-amber-200'
                : '!bg-white !border-slate-300'
            }`}
          />
          <MiniMap
            zoomable
            pannable
            nodeColor={(node) => {
              if (node.id === 'mem-101') return '#f59e0b';
              return isTraditional ? '#991b1b' : '#3b82f6';
            }}
            className={`!border rounded-lg shadow-md ${
              isTraditional
                ? '!bg-[#200204] !border-amber-500/40'
                : '!bg-white !border-slate-300'
            }`}
          />
        </ReactFlow>

        {/* Bottom Floating Traditional Motto Scroll */}
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none px-4 py-1.5 rounded-full border shadow-xl text-xs font-serif tracking-widest hidden md:flex items-center gap-2 ${
            isTraditional
              ? 'bg-[#3b0207]/90 border-amber-400 text-amber-200'
              : 'bg-white/90 border-slate-300 text-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>QUANG TIỀN DUỆ HẬU • ẨM THỦY TƯ NGUYÊN</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>
      </div>
    </div>
  );
};

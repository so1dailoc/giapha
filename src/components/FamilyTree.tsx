import React, { useMemo, useState, useEffect } from 'react';
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

import { Member, Branch, UserRole, FamilyTreeSettings, ClanInfo, TreeViewMode, LayoutAlgorithm } from '../types';
import { FamilyTreeNode, FamilyTreeNodeData } from './FamilyTreeNode';
import { FamilyTreeBookView } from './FamilyTreeBookView';
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
  BookOpen,
  GitFork,
  Minimize2,
  Maximize2,
  Zap,
  Users,
  RotateCcw,
  Check,
  ChevronUp,
  Eye,
  Settings2,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FamilyTreeProps {
  members: Member[];
  branches: Branch[];
  clanInfo?: ClanInfo;
  onUpdateClanInfo?: (info: ClanInfo) => void;
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
  clanInfo,
  onUpdateClanInfo,
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
  // Read Admin-specified defaults from clanInfo if available
  const adminDefaults = clanInfo?.defaultTreeSettings;

  // 5 Optimization Solutions Settings:
  const [settings, setSettings] = useState<FamilyTreeSettings>(() => ({
    theme: adminDefaults?.theme || 'traditional',
    fontFamily: adminDefaults?.fontFamily || 'be-vietnam',
    showSpouses: adminDefaults?.showSpouses ?? false,
    showAvatars: adminDefaults?.showAvatars ?? false,
    showDates: adminDefaults?.showDates ?? false, // Mặc định chỉ để tên và đời
    showDaughters: adminDefaults?.showDaughters ?? true,
    showTitles: adminDefaults?.showTitles ?? false,
    showHierarchy: adminDefaults?.showHierarchy ?? false,
    showBirthPlace: adminDefaults?.showBirthPlace ?? false,
    orientation: adminDefaults?.orientation || 'vertical',
    zoomLevel: adminDefaults?.zoomLevel || 1,
    // 5 Solutions:
    viewMode: adminDefaults?.viewMode || 'graph_canvas', // PA 5: Cây 2D vs Sổ Phả Hệ
    layoutAlgorithm: adminDefaults?.layoutAlgorithm || 'family_cluster', // PA 3: Cụm gia đình vs Dàn phẳng
    enableCollapsible: adminDefaults?.enableCollapsible ?? true, // PA 1: Thu gọn cành [+] / [-]
    autoCollapseDeepGens: adminDefaults?.autoCollapseDeepGens ?? true, // PA 1: Mặc định thu gọn Đời 7+
    enableZigZagRows: adminDefaults?.enableZigZagRows ?? true, // PA 4: Xếp so le 2 tầng
    focusedSubtreeRootId: null, // PA 2: Xem riêng nhánh cụ này
    // Phương án Thẻ Dọc Sổ Tên Từ Đời 6+:
    enableVerticalCards: adminDefaults?.enableVerticalCards ?? false,
    verticalCardStartGen: adminDefaults?.verticalCardStartGen ?? 6,
    cardHorizontalGap: adminDefaults?.cardHorizontalGap ?? 30,
    interFamilyGap: adminDefaults?.interFamilyGap ?? 110,
  }));

  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [treeSearchQuery, setTreeSearchQuery] = useState<string>('');
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(highlightedMemberId || null);
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCardDisplayModalOpen, setIsCardDisplayModalOpen] = useState(false);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);

  // PA 2 State: Focus Subtree Root ID
  const [focusedSubtreeRootId, setFocusedSubtreeRootId] = useState<string | null>(null);

  // Map of children count per parent
  const childrenCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    members.forEach((m) => {
      if (m.fatherId) counts.set(m.fatherId, (counts.get(m.fatherId) || 0) + 1);
      if (m.motherId) counts.set(m.motherId, (counts.get(m.motherId) || 0) + 1);
    });
    return counts;
  }, [members]);

  // Map parentId -> list of biological children
  const childrenMap = useMemo(() => {
    const map = new Map<string, Member[]>();
    members.forEach((m) => {
      const pId = m.fatherId || m.motherId;
      if (pId) {
        if (!map.has(pId)) map.set(pId, []);
        map.get(pId)!.push(m);
      }
    });
    return map;
  }, [members]);

  // PA 1 State: Collapsed Node IDs (Nodes whose subtree is collapsed)
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    const shouldAutoCollapse = adminDefaults?.autoCollapseDeepGens ?? true;
    if (shouldAutoCollapse) {
      // Auto-collapse from generation 7 if member has children
      members.forEach((m) => {
        if (m.generation === 7 && (childrenCountMap.get(m.id) || 0) > 0) {
          set.add(m.id);
        }
      });
    }
    return set;
  });

  // Toggle Collapse for a specific member node (PA 1)
  const handleToggleCollapse = (memberId: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  // Expand All Subtrees (PA 1)
  const handleExpandAll = () => {
    setCollapsedNodeIds(new Set());
  };

  // Auto-collapse generations >= 7 (PA 1)
  const handleCollapseDeepGens = () => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.generation === 7 && (childrenCountMap.get(m.id) || 0) > 0) {
        set.add(m.id);
      }
    });
    setCollapsedNodeIds(set);
  };

  // Focus Subtree Handler (PA 2)
  const handleFocusSubtree = (memberId: string) => {
    setFocusedSubtreeRootId(memberId);
    setFocusedMemberId(memberId);
    setTreeSearchQuery('');
    setIsSearchOpen(false);
    try {
      confetti({ particleCount: 35, spread: 60 });
    } catch {
      // ignore
    }
  };

  const handleExitFocusSubtree = () => {
    setFocusedSubtreeRootId(null);
    setFocusedMemberId(null);
    if (rfInstance) {
      setTimeout(() => {
        rfInstance.fitView?.({ padding: 0.15, duration: 800 });
      }, 100);
    }
  };

  // Collect all hidden descendant IDs (from collapsed parents)
  const hiddenDescendantIds = useMemo(() => {
    const hidden = new Set<string>();
    if (collapsedNodeIds.size === 0) return hidden;

    const collectDescendants = (parentId: string) => {
      const kids = childrenMap.get(parentId) || [];
      kids.forEach((k) => {
        hidden.add(k.id);
        if (k.spouseIds) k.spouseIds.forEach((sid) => hidden.add(sid));
        collectDescendants(k.id);
      });
    };

    collapsedNodeIds.forEach((id) => {
      collectDescendants(id);
    });

    return hidden;
  }, [collapsedNodeIds, childrenMap]);

  // PA 2: Direct ancestors chain for focused subtree (Từ Thủy Tổ xuống tới cụ khởi cành nhánh)
  const { directAncestorIds, ancestorBreadcrumbs } = useMemo(() => {
    if (!focusedSubtreeRootId) {
      return { directAncestorIds: new Set<string>(), ancestorBreadcrumbs: [] as Member[] };
    }
    const ids = new Set<string>();
    const chain: Member[] = [];
    const memberMap = new Map<string, Member>();
    members.forEach((m) => memberMap.set(m.id, m));

    const rootMember = memberMap.get(focusedSubtreeRootId);
    let currParentId = rootMember ? (rootMember.fatherId || rootMember.motherId) : null;
    while (currParentId) {
      ids.add(currParentId);
      const p = memberMap.get(currParentId);
      if (p) chain.unshift(p);
      currParentId = p ? (p.fatherId || p.motherId) : null;
    }
    return { directAncestorIds: ids, ancestorBreadcrumbs: chain };
  }, [focusedSubtreeRootId, members]);

  // Collect all allowed IDs for focused subtree (PA 2)
  const subtreeAllowedIds = useMemo(() => {
    if (!focusedSubtreeRootId) return null;
    const allowed = new Set<string>();
    allowed.add(focusedSubtreeRootId);

    // 1. Hậu duệ cành nhánh
    const collect = (pid: string) => {
      const kids = childrenMap.get(pid) || [];
      kids.forEach((k) => {
        allowed.add(k.id);
        if (k.spouseIds) k.spouseIds.forEach((sid) => allowed.add(sid));
        collect(k.id);
      });
    };
    collect(focusedSubtreeRootId);

    // 2. Thượng tổ trực hệ (Các đời tổ tiên ở trên của cụ khởi cành nhánh)
    directAncestorIds.forEach((aId) => allowed.add(aId));

    return allowed;
  }, [focusedSubtreeRootId, childrenMap, directAncestorIds]);

  // Focused Root Member object
  const focusedSubtreeMember = useMemo(() => {
    if (!focusedSubtreeRootId) return null;
    return members.find((m) => m.id === focusedSubtreeRootId) || null;
  }, [focusedSubtreeRootId, members]);

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
    branches.forEach((b) => {
      options.push({ value: b.id, label: b.name });
    });
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

  // Filter members according to settings & active solutions
  const filteredMembers = useMemo(() => {
    // 1. Solution 2: Focus Subtree
    if (subtreeAllowedIds) {
      return members.filter((m) => {
        if (!subtreeAllowedIds.has(m.id)) return false;
        // In-law spouse filter
        if (m.gender === 'female' && !m.isRootAncestor && !m.fatherId && m.spouseIds && m.spouseIds.length > 0) {
          return false;
        }
        if (!settings.showDaughters && m.gender === 'female' && !m.isRootAncestor) {
          return false;
        }
        // Solution 1: Collapsed Subtrees (hide descendants)
        if (hiddenDescendantIds.has(m.id)) {
          return false;
        }
        return true;
      });
    }

    // 2. Normal View with Branch/Phái filtering
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
      if (allowedMemberIds && !allowedMemberIds.has(m.id)) {
        return false;
      }
      // In-law spouses (rendered via husband's card)
      if (m.gender === 'female' && !m.isRootAncestor && !m.fatherId && m.spouseIds && m.spouseIds.length > 0) {
        return false;
      }
      if (!settings.showDaughters && m.gender === 'female' && !m.isRootAncestor) {
        return false;
      }
      // Solution 1: Collapsed Subtrees - hide descendants
      if (hiddenDescendantIds.has(m.id)) {
        return false;
      }
      return true;
    });
  }, [members, subtreeAllowedIds, selectedBranchId, settings.showDaughters, hiddenDescendantIds]);

  // Build tree nodes and edges with hierarchical layout calculation (PA 3 & PA 4)
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

    const sortedGens = Array.from(genGroups.keys()).sort((a, b) => a - b);

    // Helper bảng màu phân định dòng nhánh/gia đình để chống đè và phân biệt con ông này và con ông kia
    const FAMILY_PALETTE = [
      '#f59e0b', // Amber Gold
      '#ef4444', // Huyết Hồng
      '#10b981', // Ngọc Lục Bảo
      '#3b82f6', // Lam Hoàng Gia
      '#a855f7', // Tím Cung Đình
      '#f97316', // Cam Hỏa
      '#06b6d4', // Thanh Lam
      '#ec4899', // Cánh Sen
      '#84cc16', // Lục Non
      '#eab308', // Hoàng Kim
    ];

    const getParentLineColor = (pId: string, isTrad: boolean) => {
      const parentMember = members.find((x) => x.id === pId);
      if (parentMember?.branchId && branchMap.has(parentMember.branchId)) {
        const bColor = branchMap.get(parentMember.branchId)?.colorAccent;
        if (bColor) return bColor;
      }
      let hash = 0;
      for (let i = 0; i < pId.length; i++) {
        hash = (hash << 5) - hash + pId.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % FAMILY_PALETTE.length;
      return isTrad ? FAMILY_PALETTE[idx] : '#3b82f6';
    };

    const isMinimalCard =
      !settings.showSpouses &&
      !settings.showAvatars &&
      !settings.showDates &&
      !settings.showTitles &&
      !settings.showBirthPlace;

    // PHƯƠNG ÁN THẺ DỌC SỔ TÊN TỪ ĐỜI 6 TRỞ XUỐNG & ĐIỀU CHỈNH KHOẢNG CÁCH (GAP)
    const isGenVertical = (gen: number) => {
      return (settings.enableVerticalCards ?? false) && gen >= (settings.verticalCardStartGen ?? 6);
    };

    const getGenNodeWidth = (gen: number) => {
      if (isGenVertical(gen)) return 78;
      if (settings.showSpouses) return 330;
      if (isMinimalCard) return 195;
      return 255;
    };

    const getGenGap = (gen: number) => {
      if (typeof settings.cardHorizontalGap === 'number' && settings.cardHorizontalGap >= 5) {
        return settings.cardHorizontalGap;
      }
      return isGenVertical(gen) ? 30 : (isMinimalCard ? 28 : 50);
    };

    const interFamilyClusterGap = settings.interFamilyGap ?? 110;
    const isFamilyCluster = (settings.layoutAlgorithm || 'family_cluster') === 'family_cluster';
    const isZigZag = settings.enableZigZagRows ?? true;

    // Calculate dynamic Y position per generation
    const genYMap = new Map<number, number>();
    let cumulativeY = 0;

    sortedGens.forEach((gen) => {
      genYMap.set(gen, cumulativeY);

      const genMembers = genGroups.get(gen) || [];
      let maxGenHeight = isMinimalCard ? 130 : 160;

      if (isGenVertical(gen)) {
        maxGenHeight = 225; // Chiều cao chuẩn thẻ dọc bài vị truyền thống
      } else if (settings.showSpouses) {
        maxGenHeight = 230;
        genMembers.forEach((m) => {
          const spouseCount = m.spouseIds?.length || 0;
          const estHeight = 180 + spouseCount * 125;
          if (estHeight > maxGenHeight) maxGenHeight = estHeight;
        });
      } else if (settings.showAvatars) {
        maxGenHeight = 180;
      }

      // Check if any family in this generation will be split into 2 zig-zag tiers
      const hasZigZagInThisGen =
        isZigZag &&
        genMembers.some((m) => {
          const pId = m.fatherId || m.motherId;
          return pId && (childrenMap.get(pId)?.length || 0) >= 5;
        });

      if (hasZigZagInThisGen) {
        maxGenHeight += isGenVertical(gen) ? 140 : 160; // Extra room for second tier
      }

      const verticalGap = isGenVertical(gen) ? 120 : (settings.showSpouses ? 190 : (isMinimalCard ? 135 : 150));
      cumulativeY += maxGenHeight + verticalGap;
    });

    // Position map for nodes: memberId -> { x, y, isZigZagTier2 }
    const nodePositions = new Map<string, { x: number; y: number; isZigZagTier2?: boolean }>();

    // Calculate layout
    if (isFamilyCluster) {
      // SOLUTION 3: FAMILY CLUSTER ALGORITHM
      // Hierarchically center sibling clusters under their parent
      sortedGens.forEach((gen) => {
        const genMembers = genGroups.get(gen) || [];
        const baseY = genYMap.get(gen) ?? 0;
        const nodeW = getGenNodeWidth(gen);
        const gap = getGenGap(gen);

        if (gen === sortedGens[0]) {
          // Root generation (or top generation in subtree)
          const totalWidth = genMembers.length * (nodeW + gap) - gap;
          const startX = -totalWidth / 2;
          genMembers.forEach((m, idx) => {
            nodePositions.set(m.id, {
              x: startX + idx * (nodeW + gap),
              y: baseY,
            });
          });
        } else {
          // Subsequent generations: group by parent
          const parentGroups = new Map<string, Member[]>();
          genMembers.forEach((m) => {
            const pId = m.fatherId || m.motherId || 'orphan';
            if (!parentGroups.has(pId)) parentGroups.set(pId, []);
            parentGroups.get(pId)!.push(m);
          });

          // Sort parent groups by parent X position
          const sortedParentIds = Array.from(parentGroups.keys()).sort((a, b) => {
            const posA = nodePositions.get(a)?.x ?? 0;
            const posB = nodePositions.get(b)?.x ?? 0;
            return posA - posB;
          });

          let currentMaxX = -Infinity;

          sortedParentIds.forEach((pId) => {
            const siblings = parentGroups.get(pId) || [];
            siblings.sort((a, b) => (a.orderInFamily || 1) - (b.orderInFamily || 1));

            const parentPos = nodePositions.get(pId);
            const parentMember = members.find((item) => item.id === pId);
            const parentGen = parentMember?.generation || (gen - 1);
            const parentWidth = getGenNodeWidth(parentGen);
            const parentCenterX = parentPos ? parentPos.x + parentWidth / 2 : 0;

            const childWidth = getGenNodeWidth(gen);
            const childGap = getGenGap(gen);
            const isChildVertical = isGenVertical(gen);
            const useZigZag = isZigZag && siblings.length >= 5;

            if (useZigZag) {
              // SOLUTION 4: ZIG-ZAG 2-TIER SUB-ROWS
              const cols = Math.ceil(siblings.length / 2);
              const clusterWidth = cols * (childWidth + childGap) - childGap;
              const targetStartX = parentCenterX - clusterWidth / 2;
              const startX = Math.max(targetStartX, currentMaxX === -Infinity ? targetStartX : currentMaxX + interFamilyClusterGap);

              siblings.forEach((c, i) => {
                const isTier2 = i % 2 === 1;
                const colIndex = Math.floor(i / 2);
                const x = startX + colIndex * (childWidth + childGap) + (isTier2 ? (isChildVertical ? 14 : 25) : 0);
                const y = baseY + (isTier2 ? (isChildVertical ? 130 : 155) : 0);

                nodePositions.set(c.id, { x, y, isZigZagTier2: isTier2 });
              });

              currentMaxX = startX + clusterWidth;
            } else {
              // Single-tier linear cluster
              const clusterWidth = siblings.length * (childWidth + childGap) - childGap;
              const targetStartX = parentCenterX - clusterWidth / 2;
              const startX = Math.max(targetStartX, currentMaxX === -Infinity ? targetStartX : currentMaxX + interFamilyClusterGap);

              siblings.forEach((c, idx) => {
                const x = startX + idx * (childWidth + childGap);
                const y = baseY;
                nodePositions.set(c.id, { x, y });
              });

              currentMaxX = startX + clusterWidth;
            }
          });

          // Center the entire generation around 0
          const allGenX = genMembers.map((m) => nodePositions.get(m.id)?.x ?? 0);
          if (allGenX.length > 0) {
            const minX = Math.min(...allGenX);
            const maxX = Math.max(...allGenX);
            const mid = (minX + maxX) / 2;
            genMembers.forEach((m) => {
              const pos = nodePositions.get(m.id);
              if (pos) {
                pos.x -= mid;
              }
            });
          }
        }
      });
    } else {
      // Classic flat generation layout
      sortedGens.forEach((gen) => {
        const genMembers = genGroups.get(gen) || [];
        const nodeW = getGenNodeWidth(gen);
        const gap = getGenGap(gen);
        const totalWidth = genMembers.length * (nodeW + gap) - gap;
        const startX = -totalWidth / 2;
        const baseY = genYMap.get(gen) ?? 0;

        genMembers.sort((a, b) => {
          const pA = a.fatherId || '';
          const pB = b.fatherId || '';
          if (pA !== pB) return pA.localeCompare(pB);
          return (a.orderInFamily || 1) - (b.orderInFamily || 1);
        });

        genMembers.forEach((m, idx) => {
          nodePositions.set(m.id, {
            x: startX + idx * (nodeW + gap),
            y: baseY,
          });
        });
      });
    }

    // Instantiate ReactFlow Node & Edge objects
    filteredMembers.forEach((m) => {
      const pos = nodePositions.get(m.id) || { x: 0, y: 0 };
      const childrenCount = childrenCountMap.get(m.id) || 0;
      const isCollapsed = collapsedNodeIds.has(m.id);
      const isSubtreeRoot = m.id === focusedSubtreeRootId;
      const isHighlighted = m.id === focusedMemberId || m.id === highlightedMemberId;

      // Spouses
      const spouses: Member[] = [];
      if (m.spouseIds && m.spouseIds.length > 0) {
        m.spouseIds.forEach((sId) => {
          const sp = members.find((item) => item.id === sId);
          if (sp) spouses.push(sp);
        });
      }

      // Children by spouse
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

      const mother = m.motherId ? members.find((item) => item.id === m.motherId) || null : null;

      nodes.push({
        id: m.id,
        type: 'familyNode',
        position: { x: pos.x, y: pos.y },
        data: {
          member: m,
          spouses,
          mother,
          childrenBySpouse,
          theme: settings.theme,
          fontFamily: settings.fontFamily || 'be-vietnam',
          showDates: settings.showDates ?? false,
          showSpouse: settings.showSpouses ?? false,
          showAvatar: settings.showAvatars ?? false,
          showTitles: settings.showTitles ?? false,
          showHierarchy: settings.showHierarchy ?? false,
          showBirthPlace: settings.showBirthPlace ?? false,
          userRole,
          onSelectMember,
          onAddChild,
          onAddSpouse,
          onDeleteMember,
          branchName: branchMap.get(m.branchId)?.name,
          branchColor: branchMap.get(m.branchId)?.colorAccent,
          isHighlighted,
          // 5 Solutions hooks
          childrenCount,
          isCollapsed,
          onToggleCollapse: handleToggleCollapse,
          onFocusSubtree: handleFocusSubtree,
          isSubtreeRoot,
          isDirectAncestor: directAncestorIds.has(m.id),
          isZigZagTier2: pos.isZigZagTier2,
          isVerticalCard: isGenVertical(m.generation),
        },
      });

      // Edge from parent
      const parentId = m.fatherId || m.motherId;
      if (parentId && filteredMembers.some((p) => p.id === parentId)) {
        const isTraditional = settings.theme === 'traditional';
        const isAncestralLine =
          directAncestorIds.has(parentId) &&
          (directAncestorIds.has(m.id) || m.id === focusedSubtreeRootId);
        const isParentHovered = hoveredMemberId === parentId || hoveredMemberId === m.id;
        const isHighlightedFamily = isHighlighted || isParentHovered;
        const familyColor = getParentLineColor(parentId, isTraditional);

        edges.push({
          id: `e-${parentId}-${m.id}`,
          source: parentId,
          target: m.id,
          type: 'smoothstep',
          animated: isAncestralLine || isHighlightedFamily,
          style: {
            stroke: isAncestralLine
              ? '#fbbf24'
              : isHighlightedFamily
              ? '#f59e0b'
              : familyColor,
            strokeWidth: isAncestralLine ? 3.5 : isHighlightedFamily ? 3 : 2.2,
            strokeDasharray: m.gender === 'female' ? '4 4' : undefined,
            opacity: hoveredMemberId && !isHighlightedFamily && !isAncestralLine ? 0.35 : 1,
            filter: isAncestralLine
              ? 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.9))'
              : isHighlightedFamily
              ? 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.7))'
              : undefined,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isAncestralLine
              ? '#fbbf24'
              : isHighlightedFamily
              ? '#f59e0b'
              : familyColor,
            width: 12,
            height: 12,
          },
        });
      }
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
    hoveredMemberId,
    focusedSubtreeRootId,
    directAncestorIds,
    collapsedNodeIds,
    childrenCountMap,
    childrenMap,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when layout inputs change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Auto zoom and smooth center on the branch root node when entering focused subtree
  useEffect(() => {
    if (!rfInstance || !focusedSubtreeRootId) return;
    const timer = setTimeout(() => {
      const targetNode = initialNodes.find((n) => n.id === focusedSubtreeRootId);
      if (targetNode && targetNode.position) {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
        rfInstance.setCenter?.(
          targetNode.position.x + 120,
          targetNode.position.y + (isMobile ? 180 : 120),
          {
            zoom: isMobile ? 0.75 : 1.0,
            duration: 800,
          }
        );
      } else {
        rfInstance.fitView?.({ padding: 0.2, duration: 750 });
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [focusedSubtreeRootId, initialNodes, rfInstance]);

  // Jump to specific member and smoothly center ReactFlow canvas
  const jumpToMember = (targetMember: Member) => {
    setFocusedMemberId(targetMember.id);
    setTreeSearchQuery(targetMember.fullName);
    setIsSearchOpen(false);

    // If member is in a collapsed subtree, automatically expand that lineage
    let p = targetMember.fatherId || targetMember.motherId;
    let needsUncollapse = false;
    const nextCollapsed = new Set(collapsedNodeIds);
    while (p) {
      if (nextCollapsed.has(p)) {
        nextCollapsed.delete(p);
        needsUncollapse = true;
      }
      const parentM = members.find((item) => item.id === p);
      p = parentM ? (parentM.fatherId || parentM.motherId) : undefined;
    }
    if (needsUncollapse) {
      setCollapsedNodeIds(nextCollapsed);
    }

    setTimeout(() => {
      const targetNode = nodes.find((n) => n.id === targetMember.id);
      if (targetNode && rfInstance) {
        rfInstance.setCenter(targetNode.position.x + 140, targetNode.position.y + 90, {
          zoom: 1.15,
          duration: 800,
        });
      }
    }, 150);

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
      className={`relative w-full h-[calc(100dvh-130px)] min-h-[520px] sm:h-[840px] rounded-2xl overflow-hidden border shadow-2xl flex flex-col ${
        isTraditional
          ? 'bg-[#1e0205] border-amber-500/40 text-amber-50'
          : 'bg-slate-50 border-slate-200 text-slate-900'
      }`}
    >
      {/* PA 2: Focused Subtree Active Banner */}
      {focusedSubtreeMember && (
        <div className="bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-800 text-amber-950 px-3 sm:px-6 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3 shadow-lg z-30 border-b-2 border-yellow-400 animate-fadeIn">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-950 text-amber-300 flex items-center justify-center shrink-0 shadow">
              <GitFork className="w-3.5 h-3.5 sm:w-4 sm:h-4 font-bold text-yellow-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-serif font-black text-xs sm:text-sm uppercase tracking-wide text-amber-950 truncate max-w-[170px] sm:max-w-none">
                  Nhánh: <span className="underline decoration-amber-950/40">{focusedSubtreeMember.fullName}</span>
                </span>
                <span className="px-1.5 py-0.5 bg-amber-950 text-amber-300 rounded-full font-bold text-[10px] sm:text-[11px] shadow-sm shrink-0">
                  Đời {focusedSubtreeMember.generation}
                </span>
                {focusedSubtreeMember.phaiName && (
                  <span className="hidden sm:inline text-[11px] font-semibold bg-amber-900/20 px-2 py-0.5 rounded text-amber-950">
                    {focusedSubtreeMember.phaiName}
                  </span>
                )}
                <span className="hidden sm:inline text-[11px] bg-amber-950/20 px-2.5 py-0.5 rounded-full font-bold text-amber-950">
                  {filteredMembers.length} thành viên
                </span>
              </div>
              {/* Lineage breadcrumb (on desktop / tablet) */}
              {ancestorBreadcrumbs.length > 0 && (
                <div className="hidden md:flex items-center gap-1.5 text-[11px] font-serif text-amber-950/80 flex-wrap">
                  <span className="font-bold opacity-75">Nguồn gốc trực hệ:</span>
                  {ancestorBreadcrumbs.map((anc) => (
                    <React.Fragment key={anc.id}>
                      <button
                        type="button"
                        onClick={() => jumpToMember(anc)}
                        className="hover:underline font-bold text-amber-950 hover:text-black"
                        title={`Xem vị trí Cụ ${anc.fullName} (Đời ${anc.generation})`}
                      >
                        {anc.fullName} (Đời {anc.generation})
                      </button>
                      <span className="text-amber-900/60 font-bold">➔</span>
                    </React.Fragment>
                  ))}
                  <span className="font-extrabold text-amber-950 underline">
                    {focusedSubtreeMember.fullName} (Đời {focusedSubtreeMember.generation})
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleExitFocusSubtree}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-900 via-amber-950 to-red-950 hover:from-black hover:to-amber-950 text-amber-200 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-xl shadow-xl border-2 border-yellow-300 ring-2 ring-yellow-400/50 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shrink-0"
            title="Thoát chế độ xem nhánh và quay lại toàn bộ cây phả hệ của cả dòng tộc"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 stroke-[2.5]" />
            <span className="whitespace-nowrap">Quay Lại Cây Toàn Tộc</span>
          </button>
        </div>
      )}

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
              5 Giải pháp chống tràn &amp; chồng line • Chuẩn Quốc ngữ &amp; Trực quan
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
                placeholder="Tìm nhanh thành viên..."
                className={`text-xs px-3 py-1.5 pl-8 pr-7 rounded-lg border transition-all w-36 sm:w-56 focus:outline-none ${
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
              <div className="fixed inset-0 z-40" onClick={() => setIsSearchOpen(false)} />
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
                          </div>
                        </div>
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 ${
                            member.isAlive ? 'bg-emerald-400' : 'bg-amber-500'
                          }`}
                        />
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="p-3 text-center text-slate-400 italic text-[11px]">
                    Không tìm thấy thành viên phù hợp
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Toolbar & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* SOLUTION 5: TOGGLE VIEW MODE (2D CANVAS vs BOOK/OUTLINE VIEW) */}
          <div className="flex items-center rounded-xl p-0.5 border border-amber-500/40 bg-black/30 shadow-inner">
            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, viewMode: 'graph_canvas' }))}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                settings.viewMode === 'graph_canvas'
                  ? 'bg-amber-500 text-amber-950 shadow'
                  : 'text-amber-200 hover:text-white hover:bg-white/5'
              }`}
              title="Xem dạng Cây Đồ Họa 2D kéo thả trên không gian lớn"
            >
              <span>🌲 Cây 2D</span>
            </button>

            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, viewMode: 'book_outline' }))}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                settings.viewMode === 'book_outline'
                  ? 'bg-amber-500 text-amber-950 shadow'
                  : 'text-amber-200 hover:text-white hover:bg-white/5'
              }`}
              title="Xem dạng Sổ Phả Hệ Văn Bản Dọc (Chuẩn sách truyền thống, in ấn &amp; cuộn mượt)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Sổ Phả Hệ</span>
            </button>
          </div>

          {/* Thêm thành viên */}
          {onAddNewMember && (userRole === 'super_admin' || userRole === 'branch_admin') && (
            <button
              type="button"
              onClick={onAddNewMember}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 transition-colors shadow-sm"
              title="Thêm thành viên ở một đời bất kỳ"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Thêm Người</span>
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
              title="Lọc hiển thị theo Phái hoặc Chi"
            >
              {hierarchyFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
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

          {/* Mobile Quick Controls Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileControlsOpen((prev) => !prev)}
            className={`sm:hidden px-2.5 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
              isMobileControlsOpen
                ? 'bg-amber-400 text-amber-950 border-amber-300 shadow'
                : 'bg-black/30 text-amber-200 border-amber-500/40'
            }`}
            title="Mở hoặc đóng bộ lọc và giải pháp chống tràn"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>{isMobileControlsOpen ? 'Đóng Tùy Chọn' : 'Tùy Chọn'}</span>
          </button>

          {/* AdminCP shortcut */}
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

      {/* Secondary Controls Bar: 5 Solutions Quick Toggles */}
      <div
        className={`px-3 sm:px-5 py-2 border-b items-center justify-between gap-3 text-xs z-10 ${
          isMobileControlsOpen ? 'flex flex-wrap' : 'hidden sm:flex flex-wrap'
        } ${
          isTraditional
            ? 'bg-[#2b0206]/95 border-amber-500/20 text-amber-200'
            : 'bg-slate-100/90 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-400">
            <Zap className="w-3 h-3 text-amber-400" />
            Phương Án Tối Ưu:
          </span>

          {/* SOLUTION 1: COLLAPSE BUTTONS */}
          <div className="flex items-center gap-1 bg-black/30 rounded-lg p-0.5 border border-amber-500/30">
            <button
              type="button"
              onClick={handleCollapseDeepGens}
              className="px-2 py-0.5 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/20 rounded transition-colors flex items-center gap-1"
              title="Thu gọn cành con cháu từ Đời 7 trở đi (PA 1: Giúp cây cực kỳ gọn gàng)"
            >
              <Minimize2 className="w-3 h-3 text-amber-400" />
              <span>[-] Gọn Đời 7+</span>
            </button>

            <button
              type="button"
              onClick={handleExpandAll}
              className="px-2 py-0.5 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/20 rounded transition-colors flex items-center gap-1"
              title="Mở bung toàn bộ các cành nhánh con cháu (PA 1)"
            >
              <Maximize2 className="w-3 h-3 text-amber-400" />
              <span>[+] Bung Hết</span>
            </button>
          </div>

          {/* SOLUTION 3: FAMILY CLUSTER ALGORITHM */}
          <button
            type="button"
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                layoutAlgorithm:
                  prev.layoutAlgorithm === 'family_cluster' ? 'flat_generation' : 'family_cluster',
              }))
            }
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border flex items-center gap-1.5 transition-all ${
              settings.layoutAlgorithm === 'family_cluster'
                ? 'bg-amber-500/30 text-amber-200 border-amber-400'
                : 'bg-black/20 text-amber-400/70 border-amber-500/30 hover:bg-black/30'
            }`}
            title="PA 3: Thuật toán gom con cái vào cụm dưới cha, chống chéo đường line"
          >
            <Users className="w-3 h-3 text-amber-400" />
            <span>
              {settings.layoutAlgorithm === 'family_cluster' ? '👨‍👩‍👧‍👦 Cụm Gia Đình' : '↔ Dàn Đều'}
            </span>
          </button>

          {/* SOLUTION 4: ZIG-ZAG 2-TIER SUB-ROWS */}
          <button
            type="button"
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                enableZigZagRows: !prev.enableZigZagRows,
              }))
            }
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border flex items-center gap-1.5 transition-all ${
              settings.enableZigZagRows
                ? 'bg-amber-500/30 text-amber-200 border-amber-400'
                : 'bg-black/20 text-amber-400/70 border-amber-500/30 hover:bg-black/30'
            }`}
            title="PA 4: Xếp so le 2 tầng cho các gia đình đông con (&gt;=5 con), giảm 50% độ rộng ngang"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>So Le 2 Tầng</span>
            {settings.enableZigZagRows && (
              <span className="text-[9px] px-1 bg-amber-400 text-amber-950 font-bold rounded">
                -50% Rộng
              </span>
            )}
          </button>

          {/* PHƯƠNG ÁN MỚI: THẺ DỌC SỔ TÊN TỪ ĐỜI 6 TRỞ XUỐNG */}
          <button
            type="button"
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                enableVerticalCards: !prev.enableVerticalCards,
              }))
            }
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border flex items-center gap-1.5 transition-all ${
              settings.enableVerticalCards
                ? 'bg-amber-500/30 text-amber-200 border-amber-400 shadow-sm'
                : 'bg-black/20 text-amber-400/70 border-amber-500/30 hover:bg-black/30'
            }`}
            title="Phương Án Mới: Thẻ thành viên từ đời thứ 6 trở xuống theo chiều dọc, họ và tên sổ dọc, giảm đến 70% độ rộng ngang"
          >
            <span>📐 Thẻ Dọc Đời {settings.verticalCardStartGen || 6}+</span>
            {settings.enableVerticalCards && (
              <span className="text-[9px] px-1 bg-emerald-500 text-slate-950 font-bold rounded">
                -70% Rộng
              </span>
            )}
          </button>

          {/* ĐIỀU CHỈNH KHOẢNG CÁCH GIỮA 2 THẺ (GAP) */}
          <div
            className="flex items-center gap-1 bg-black/30 rounded-lg px-2 py-0.5 border border-amber-500/30 text-[11px]"
            title="Admin & Người xem có thể tinh chỉnh khoảng cách ngang giữa 2 thẻ thành viên"
          >
            <span className="text-amber-300/80 font-medium">Khoảng cách:</span>
            <button
              type="button"
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  cardHorizontalGap: Math.max(10, (prev.cardHorizontalGap ?? (prev.enableVerticalCards ? 35 : 55)) - 5),
                }))
              }
              className="w-4 h-4 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 font-bold flex items-center justify-center leading-none"
              title="Thu hẹp khoảng cách (-5px)"
            >
              -
            </button>
            <span className="font-mono font-bold text-amber-200 min-w-[28px] text-center">
              {settings.cardHorizontalGap ?? (settings.enableVerticalCards ? 35 : 55)}px
            </span>
            <button
              type="button"
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  cardHorizontalGap: Math.min(150, (prev.cardHorizontalGap ?? (prev.enableVerticalCards ? 35 : 55)) + 5),
                }))
              }
              className="w-4 h-4 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 font-bold flex items-center justify-center leading-none"
              title="Nới rộng khoảng cách (+5px)"
            >
              +
            </button>
          </div>

          {/* NÚT CÀI ĐẶT HIỂN THỊ THẺ THÀNH VIÊN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCardDisplayModalOpen((prev) => !prev)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
                isCardDisplayModalOpen
                  ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-md'
                  : 'bg-black/30 hover:bg-black/40 text-amber-200 border-amber-500/40'
              }`}
              title="Tùy chỉnh thông tin hiển thị trên thẻ thành viên (Mặc định: Chỉ Tên & Đời)"
            >
              <Eye className="w-3.5 h-3.5 text-amber-300" />
              <span>Hiển Thị Thẻ</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isCardDisplayModalOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCardDisplayModalOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsCardDisplayModalOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-[#2b0408] border-2 border-amber-500/60 shadow-2xl z-50 p-3.5 text-xs text-amber-100 space-y-3 backdrop-blur-lg">
                  <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                    <div className="flex items-center gap-1.5 font-bold font-serif text-amber-300">
                      <Settings2 className="w-4 h-4 text-amber-400" />
                      <span>Cài Đặt Hiển Thị Thẻ</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          showDates: false,
                          showSpouses: false,
                          showAvatars: false,
                          showTitles: false,
                          showHierarchy: false,
                          showBirthPlace: false,
                        }))
                      }
                      className="text-[10px] text-amber-400 hover:underline font-semibold"
                      title="Chỉ giữ lại Họ Tên và Đời theo mặc định tối giản"
                    >
                      ↺ Về Tên &amp; Đời
                    </button>
                  </div>

                  <div className="space-y-2">
                    {/* Cố định */}
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/20 text-amber-300/80">
                      <span className="font-semibold">Họ Tên &amp; Thế Hệ (Đời)</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">Mặc định</span>
                    </div>

                    {/* Checkbox fields */}
                    <label className="flex items-center justify-between p-2 rounded-lg hover:bg-amber-900/30 cursor-pointer transition-colors">
                      <span className="flex items-center gap-2">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        <span>Hiện Phối Ngẫu (Vợ / Chồng)</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.showSpouses}
                        onChange={(e) => setSettings((prev) => ({ ...prev, showSpouses: e.target.checked }))}
                        className="rounded border-amber-500 text-amber-500 focus:ring-amber-400"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-lg hover:bg-amber-900/30 cursor-pointer transition-colors">
                      <span className="flex items-center gap-2">
                        <span className="text-amber-400 font-serif">📅</span>
                        <span>Năm Sinh / Năm Mất / Ngày Giỗ</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.showDates}
                        onChange={(e) => setSettings((prev) => ({ ...prev, showDates: e.target.checked }))}
                        className="rounded border-amber-500 text-amber-500 focus:ring-amber-400"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-lg hover:bg-amber-900/30 cursor-pointer transition-colors">
                      <span className="flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                        <span>Ảnh Chân Dung / Avatar</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.showAvatars}
                        onChange={(e) => setSettings((prev) => ({ ...prev, showAvatars: e.target.checked }))}
                        className="rounded border-amber-500 text-amber-500 focus:ring-amber-400"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-lg hover:bg-amber-900/30 cursor-pointer transition-colors">
                      <span className="flex items-center gap-2">
                        <span className="text-amber-300 font-serif font-black">爵</span>
                        <span>Tước Hiệu / Thứ Bậc / Tự Thụy</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.showTitles}
                        onChange={(e) => setSettings((prev) => ({ ...prev, showTitles: e.target.checked }))}
                        className="rounded border-amber-500 text-amber-500 focus:ring-amber-400"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-lg hover:bg-amber-900/30 cursor-pointer transition-colors">
                      <span className="flex items-center gap-2">
                        <span className="text-amber-300">📍</span>
                        <span>Nơi Sinh / Mộ Phần / An Táng</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.showBirthPlace}
                        onChange={(e) => setSettings((prev) => ({ ...prev, showBirthPlace: e.target.checked }))}
                        className="rounded border-amber-500 text-amber-500 focus:ring-amber-400"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-lg hover:bg-amber-900/30 cursor-pointer transition-colors">
                      <span className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>Nhãn Phái • Chi • Cành Nhánh</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.showHierarchy}
                        onChange={(e) => setSettings((prev) => ({ ...prev, showHierarchy: e.target.checked }))}
                        className="rounded border-amber-500 text-amber-500 focus:ring-amber-400"
                      />
                    </label>
                  </div>

                  {/* Khoảng cách slider / inputs */}
                  <div className="pt-2 border-t border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="opacity-80">Khoảng cách giữa các thẻ:</span>
                      <span className="font-mono font-bold text-amber-300">{settings.cardHorizontalGap ?? 30}px</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={120}
                      step={5}
                      value={settings.cardHorizontalGap ?? 30}
                      onChange={(e) => setSettings((prev) => ({ ...prev, cardHorizontalGap: Number(e.target.value) }))}
                      className="w-full accent-amber-400 h-1 bg-amber-950 rounded cursor-pointer"
                    />

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="opacity-80">Khoảng cách cụm các gia đình:</span>
                      <span className="font-mono font-bold text-amber-300">{settings.interFamilyGap ?? 110}px</span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={250}
                      step={10}
                      value={settings.interFamilyGap ?? 110}
                      onChange={(e) => setSettings((prev) => ({ ...prev, interFamilyGap: Number(e.target.value) }))}
                      className="w-full accent-amber-400 h-1 bg-amber-950 rounded cursor-pointer"
                    />
                  </div>

                  {/* Admin Save default button */}
                  {(userRole === 'super_admin' || userRole === 'branch_admin') && onUpdateClanInfo && clanInfo && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateClanInfo({
                          ...clanInfo,
                          defaultTreeSettings: {
                            ...clanInfo.defaultTreeSettings,
                            ...settings,
                          },
                        });
                        alert('Đã lưu cấu hình hiển thị thẻ làm mặc định cho toàn tộc!');
                      }}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Lưu Làm Mặc Định Dòng Họ</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Toggle Con gái */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px]">
            <input
              type="checkbox"
              checked={settings.showDaughters}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, showDaughters: e.target.checked }))
              }
              className="rounded border-amber-500 text-amber-600 focus:ring-amber-500"
            />
            <span>Con gái {settings.showDaughters ? '(Bật)' : '(Tắt)'}</span>
          </label>
        </div>

        {/* Status hints */}
        <div className="flex items-center gap-3 text-[11px] opacity-90 hidden md:flex">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Sống ({stats.living})</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
            <span>Tạ thế ({stats.deceased})</span>
          </div>
        </div>
      </div>

      {/* Main Content: Solution 5 (Book View) OR Interactive 2D Graph Canvas */}
      {settings.viewMode === 'book_outline' ? (
        <div className="flex-1 w-full overflow-y-auto p-2 sm:p-4">
          <FamilyTreeBookView
            members={members}
            branches={branches}
            userRole={userRole}
            theme={settings.theme}
            onSelectMember={onSelectMember}
            onSwitchToGraphView={(targetMemberId) => {
              setSettings((prev) => ({ ...prev, viewMode: 'graph_canvas' }));
              if (targetMemberId) {
                setTimeout(() => {
                  const m = members.find((item) => item.id === targetMemberId);
                  if (m) jumpToMember(m);
                }, 200);
              }
            }}
            onFocusSubtree={(targetMemberId) => {
              handleFocusSubtree(targetMemberId);
              setSettings((prev) => ({ ...prev, viewMode: 'graph_canvas' }));
            }}
          />
        </div>
      ) : (
        <div className="flex-1 w-full h-full relative">
          {/* PA 2: Floating Return Button on Canvas (Placed at bottom-left corner so it never covers branch nodes) */}
          {focusedSubtreeMember && (
            <div className="absolute bottom-14 sm:bottom-5 left-4 z-20 pointer-events-auto">
              <button
                type="button"
                onClick={handleExitFocusSubtree}
                className="px-3.5 py-2 bg-gradient-to-r from-red-800 via-amber-900 to-red-950 hover:from-black hover:to-amber-950 text-amber-200 text-xs font-bold rounded-xl shadow-2xl border border-yellow-400/80 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
                title="Thoát chế độ xem nhánh và quay lại toàn bộ cây phả hệ"
              >
                <RotateCcw className="w-3.5 h-3.5 text-yellow-300 stroke-[2.5]" />
                <span className="whitespace-nowrap">Quay Lại Cây Toàn Tộc</span>
              </button>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onInit={(instance) => setRfInstance(instance)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.15}
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
      )}
    </div>
  );
};

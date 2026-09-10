import React, { useState, useEffect } from 'react';
import {
  Member,
  Branch,
  EventItem,
  DocumentItem,
  PostItem,
  FundRecord,
  UserRole,
  ClanUser,
  ClanInfo,
} from './types';
import {
  CLAN_INFO,
  INITIAL_BRANCHES,
  INITIAL_MEMBERS,
  INITIAL_EVENTS,
  INITIAL_DOCUMENTS,
  INITIAL_POSTS,
  INITIAL_FUNDS,
} from './data/sampleData';
import {
  INITIAL_CLAN_USERS,
  SUPABASE_FIX_BURIAL_COORDINATES_SQL,
  isSupabaseConfigured,
  supabase,
} from './lib/supabase';
import {
  saveMemberToSupabase,
  deleteMemberFromSupabase,
  fetchMembersFromSupabase,
  fetchCoreClanDataFromSupabase,
  fetchEventsFromSupabase,
  fetchDocumentsFromSupabase,
  fetchPostsFromSupabase,
  fetchCurrentClanUser,
  fetchClanUsersFromSupabase,
  saveClanUserToSupabase,
  deleteClanUserFromSupabase,
  upsertClanInfoToSupabase,
  upsertEventToSupabase,
  deleteEventFromSupabase,
  upsertDocumentToSupabase,
  deleteDocumentFromSupabase,
  upsertFundToSupabase,
  upsertPostToSupabase,
} from './lib/supabaseService';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { FamilyTree } from './components/FamilyTree';
import { SmartSearch } from './components/SmartSearch';
import { RelationshipModal } from './components/RelationshipModal';
import { LunarAnniversaries } from './components/LunarAnniversaries';
import { ArchivesManager } from './components/ArchivesManager';
import { CommunityAndFund } from './components/CommunityAndFund';
import { MemberModal } from './components/MemberModal';
import { AddMemberModal } from './components/AddMemberModal';
import { AdminCP } from './components/AdminCP';
import {
  Crown,
  Search,
  GitCompare,
  Calendar,
  Scroll,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  Sparkles,
  TreeDeciduous,
  Bell,
  ChevronRight,
  Info,
  SlidersHorizontal,
  LogIn,
  LogOut,
  User,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  X,
  Menu,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

function wouldCreateParentCycle(memberId: string, parentId: string | null | undefined, members: Member[]): boolean {
  if (!parentId) return false;
  if (memberId === parentId) return true;
  const byId = new Map(members.map((m) => [m.id, m]));
  const visited = new Set<string>();
  const queue = [parentId];
  while (queue.length) {
    const id = queue.shift()!;
    if (id === memberId) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    const m = byId.get(id);
    if (!m) continue;
    if (m.fatherId) queue.push(m.fatherId);
    if (m.motherId) queue.push(m.motherId);
  }
  return false;
}

export default function App() {
  type TabType = 'tree' | 'search' | 'relationship' | 'anniversaries' | 'archives' | 'community' | 'admin';

  // Master state
  const [clanInfo, setClanInfo] = useState<ClanInfo>(CLAN_INFO);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [posts, setPosts] = useState<PostItem[]>(INITIAL_POSTS);
  const [funds, setFunds] = useState<FundRecord[]>(INITIAL_FUNDS);

  // Authentication & Users state (Bảo mật: Mặc định chưa đăng nhập là Khách xem)
  const [clanUsers, setClanUsers] = useState<ClanUser[]>(INITIAL_CLAN_USERS);
  const [currentUser, setCurrentUser] = useState<ClanUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('tree');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Vai trò luôn lấy từ hồ sơ đã xác thực trong Supabase, không tin dữ liệu localStorage.
  const [userRole, setUserRole] = useState<UserRole>('visitor');

  // Kiểm tra quyền quản trị: Chỉ Super Admin hoặc Trưởng Chi khi ĐÃ ĐĂNG NHẬP
  const isAdmin = Boolean(
    currentUser && ['super_admin', 'branch_admin', 'editor'].includes(userRole)
  );

  // Modals & Selection
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [highlightedTreeMemberId, setHighlightedTreeMemberId] = useState<string | null>(null);

  // Add Relative Modal State
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [parentForNewChild, setParentForNewChild] = useState<Member | null>(null);
  const [spouseForNewMember, setSpouseForNewMember] = useState<Member | null>(null);

  // Supabase Schema Warning Notice (Lỗi burial_coordinates) & Notification Toast
  const [schemaWarningNotice, setSchemaWarningNotice] = useState(false);
  const [copiedNoticeSql, setCopiedNoticeSql] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Khởi tạo dữ liệu + phiên đăng nhập thật từ Supabase.
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (mounted) setAuthLoading(false);
        return;
      }

      // Chỉ tải dữ liệu lõi khi khởi động. Lịch giỗ vẫn tải một lần vì nó phục vụ
      // thông báo sự kiện ở header; Tư liệu và Bảng tin được lazy-load theo menu.
      const [{ data: sessionData }, membersResult, coreData, initialEvents] = await Promise.all([
        supabase.auth.getSession(),
        fetchMembersFromSupabase(),
        fetchCoreClanDataFromSupabase(),
        fetchEventsFromSupabase(),
      ]);

      if (!mounted) return;

      if (membersResult.members && membersResult.members.length > 0) setMembers(membersResult.members);
      if (coreData.clanInfo) setClanInfo((prev) => ({ ...prev, ...coreData.clanInfo }));
      if (coreData.branches?.length) setBranches(coreData.branches);
      if (initialEvents.length) setEvents(initialEvents);

      if (sessionData.session?.user) {
        const profile = await fetchCurrentClanUser(sessionData.session.user);
        if (mounted && profile) {
          setCurrentUser(profile);
          setUserRole(profile.role);
          if (profile.role === 'super_admin') {
            const dbUsers = await fetchClanUsersFromSupabase();
            if (mounted && dbUsers.length) setClanUsers(dbUsers);
          }
        }
      }

      if (mounted) setAuthLoading(false);
    };

    load();

    const { data: listener } = supabase?.auth.onAuthStateChange((_event, session) => {
      // Không gọi API Supabase trực tiếp bên trong callback auth để tránh deadlock.
      window.setTimeout(async () => {
        if (!session?.user) {
          if (mounted) {
            setCurrentUser(null);
            setUserRole('visitor');
          }
          return;
        }

        const profile = await fetchCurrentClanUser(session.user);
        if (mounted) {
          setCurrentUser(profile);
          setUserRole(profile?.role || 'visitor');
          if (profile?.role === 'super_admin') {
            const dbUsers = await fetchClanUsersFromSupabase();
            if (mounted && dbUsers.length) setClanUsers(dbUsers);
          }
        }
      }, 0);
    }) ?? { subscription: { unsubscribe: () => undefined } };

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Lazy-load các màn hình nặng: chỉ gọi Supabase khi người dùng thực sự mở menu.
  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    if (activeTab === 'archives' && !loadedTabs.archives) {
      setLoadedTabs((prev) => ({ ...prev, archives: true }));
      fetchDocumentsFromSupabase().then((data) => setDocuments(data));
    }
    if (activeTab === 'community' && !loadedTabs.community) {
      setLoadedTabs((prev) => ({ ...prev, community: true }));
      fetchPostsFromSupabase().then((data) => setPosts(data));
    }
  }, [activeTab, loadedTabs.archives, loadedTabs.community]);

  // Quick notification message
  const upcomingEvent = events.find((e) => e.type === 'death_anniversary');

  // Handlers
  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
  };

  const handleJumpToTree = (memberId: string) => {
    setHighlightedTreeMemberId(memberId);
    setActiveTab('tree');
  };

  const handleOpenAddChild = (parent: Member) => {
    setParentForNewChild(parent);
    setSpouseForNewMember(null);
    setIsAddingMember(true);
  };

  const handleOpenAddSpouse = (member: Member) => {
    setParentForNewChild(null);
    setSpouseForNewMember(member);
    setIsAddingMember(true);
  };

  const handleOpenAddNewMember = () => {
    setParentForNewChild(null);
    setSpouseForNewMember(null);
    setIsAddingMember(true);
  };

  const handleAddMember = async (newMember: Member) => {
    if (wouldCreateParentCycle(newMember.id, newMember.fatherId, members) || wouldCreateParentCycle(newMember.id, newMember.motherId, members)) {
      setSaveToast('Không thể tạo quan hệ: Cha/Mẹ được chọn nằm trong chính nhánh hậu duệ của người này.');
      setTimeout(() => setSaveToast(null), 3500);
      return;
    }
    // Quan hệ được ghi hai chiều: thêm vợ/chồng ở bất kỳ màn hình nào cũng cập nhật cả hai hồ sơ.
    const spouseIds: string[] = Array.from(new Set<string>(newMember.spouseIds || []));
    const spouseTargets = members.filter((m) => spouseIds.includes(m.id));
    const updatedNewMember = { ...newMember, spouseIds };
    setMembers((prev) => [...prev, updatedNewMember].map((m) =>
      spouseIds.includes(m.id) ? { ...m, spouseIds: Array.from(new Set([...(m.spouseIds || []), updatedNewMember.id])) } : m
    ));

    confetti({ particleCount: 35, spread: 70, origin: { y: 0.6 } });

    if (isSupabaseConfigured) {
      const res = await saveMemberToSupabase(updatedNewMember);
      if (res.missingBurialCoordinatesColumn) setSchemaWarningNotice(true);
      if (!res.success) { setSaveToast(res.error || 'Không thể lưu thành viên'); setTimeout(() => setSaveToast(null), 3500); return; }
      for (const spouse of spouseTargets) {
        const spouseResult = await saveMemberToSupabase({ ...spouse, spouseIds: Array.from(new Set([...(spouse.spouseIds || []), updatedNewMember.id])) });
        if (!spouseResult.success) { setSaveToast(spouseResult.error || 'Đã thêm người nhưng chưa đồng bộ phối ngẫu'); setTimeout(() => setSaveToast(null), 3500); return; }
      }
      setSaveToast('Đã lưu thành viên và đồng bộ quan hệ gia đình'); setTimeout(() => setSaveToast(null), 3500);
    }
  };

  const handleUpdateMember = async (updated: Member) => {
    if (wouldCreateParentCycle(updated.id, updated.fatherId, members) || wouldCreateParentCycle(updated.id, updated.motherId, members)) {
      setSaveToast('Không thể lưu: quan hệ Cha/Mẹ mới sẽ tạo vòng lặp gia phả.');
      setTimeout(() => setSaveToast(null), 3500);
      return;
    }
    const previous = members.find((m) => m.id === updated.id);
    const oldSpouses = new Set(previous?.spouseIds || []);
    const newSpouses = new Set(updated.spouseIds || []);

    // Nếu đổi/xóa phối ngẫu, tự tháo liên kết cũ và thêm liên kết mới ở hồ sơ đối phương.
    const affectedIds = new Set<string>([...oldSpouses, ...newSpouses]);
    const nextMembers = members.map((m) => {
      if (m.id === updated.id) return { ...updated, spouseIds: Array.from(newSpouses) };
      if (oldSpouses.has(m.id) && !newSpouses.has(m.id)) return { ...m, spouseIds: (m.spouseIds || []).filter((id) => id !== updated.id) };
      if (newSpouses.has(m.id)) return { ...m, spouseIds: Array.from(new Set([...(m.spouseIds || []), updated.id])) };
      return m;
    });

    // Quan hệ cha/mẹ quyết định đời của hậu duệ; đổi cha/mẹ sẽ tự lan đời xuống con cháu.
    const byId = new Map<string, Member>(nextMembers.map((m) => [m.id, m] as [string, Member]));
    const childrenByParent = new Map<string, string[]>();
    nextMembers.forEach((child) => {
      for (const parentId of [child.fatherId, child.motherId]) {
        if (!parentId) continue;
        const list = childrenByParent.get(parentId);
        if (list) list.push(child.id); else childrenByParent.set(parentId, [child.id]);
      }
    });
    const queue = [updated.id];
    const visited = new Set<string>();
    while (queue.length) {
      const parentId = queue.shift()!;
      if (visited.has(parentId)) continue;
      visited.add(parentId);
      for (const childId of childrenByParent.get(parentId) || []) {
        const child = byId.get(childId);
        if (!child) continue;
        const father = child.fatherId ? byId.get(child.fatherId) : undefined;
        const mother = child.motherId ? byId.get(child.motherId) : undefined;
        const expected = Math.max(father?.generation || 0, mother?.generation || 0) + 1;
        if (expected > 0 && child.generation !== expected) {
          child.generation = expected;
          queue.push(child.id);
        }
      }
    }

    setMembers(nextMembers);
    setSelectedMember(byId.get(updated.id) || updated);
    if (isSupabaseConfigured) {
      const toSave = nextMembers.filter((m) => m.id === updated.id || affectedIds.has(m.id) || visited.has(m.id));
      for (const item of toSave) {
        const res = await saveMemberToSupabase(item);
        if (res.missingBurialCoordinatesColumn) setSchemaWarningNotice(true);
        if (!res.success) { setSaveToast(res.error || 'Không thể cập nhật hồ sơ'); setTimeout(() => setSaveToast(null), 3500); return; }
      }
      setSaveToast('Đã cập nhật hồ sơ và đồng bộ quan hệ liên quan'); setTimeout(() => setSaveToast(null), 3500);
    }
  };

  const handleBurialLocationApproved = (memberId: string, coordinates: { lat: number; lng: number }) => {
    setMembers((prev) => prev.map((member) => member.id === memberId ? { ...member, burialCoordinates: coordinates, updatedAt: new Date().toISOString() } : member));
  };

  const handleDeleteMember = async (id: string) => {
    const affected = members.filter((m) => m.id !== id && (m.fatherId === id || m.motherId === id || m.spouseIds?.includes(id)));
    const nextMembers = members
      .filter((m) => m.id !== id)
      .map((m) => ({
        ...m,
        fatherId: m.fatherId === id ? null : m.fatherId,
        motherId: m.motherId === id ? null : m.motherId,
        spouseIds: m.spouseIds ? m.spouseIds.filter((sId) => sId !== id) : [],
      }));
    setMembers(nextMembers);
    setSelectedMember(null);

    if (isSupabaseConfigured) {
      const result = await deleteMemberFromSupabase(id);
      if (!result.success) {
        setSaveToast(result.error || 'Không thể xóa thành viên');
      } else {
        // Xóa người không làm mất liên kết mồ côi trong database. Đồng bộ lại các hồ sơ bị ảnh hưởng.
        for (const member of nextMembers.filter((m) => affected.some((a) => a.id === m.id))) {
          const sync = await saveMemberToSupabase(member);
          if (!sync.success) {
            setSaveToast(sync.error || 'Đã xóa nhưng chưa đồng bộ hết liên kết');
            setTimeout(() => setSaveToast(null), 3500);
            return;
          }
        }
        setSaveToast('Đã xóa thành viên và làm sạch các liên kết cha/mẹ/phối ngẫu');
      }
      setTimeout(() => setSaveToast(null), 3500);
    }
  };

  const handleAddPost = async (post: PostItem) => {
    setPosts((prev) => [post, ...prev]);
    if (isSupabaseConfigured) {
      const result = await upsertPostToSupabase(post);
      if (!result.success) setSaveToast(result.error || 'Không thể lưu bài viết');
    }
  };

  const handleAddFund = async (fund: FundRecord) => {
    setFunds((prev) => [fund, ...prev]);
    if (isSupabaseConfigured) {
      const result = await upsertFundToSupabase(fund);
      if (!result.success) setSaveToast(result.error || 'Không thể lưu giao dịch quỹ');
    }
  };

  const handleUpdateClanInfo = async (newInfo: ClanInfo) => {
    if (isSupabaseConfigured) {
      const result = await upsertClanInfoToSupabase(newInfo);
      if (!result.success) {
        setSaveToast(result.error || 'Không thể lưu thông tin dòng tộc');
        return result;
      }
    }
    setClanInfo(newInfo);
    return { success: true };
  };

  const handleAddDocument = async (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
    if (isSupabaseConfigured) {
      const result = await upsertDocumentToSupabase(newDoc);
      if (!result.success) setSaveToast(result.error || 'Không thể lưu tư liệu');
    }
  };

  const handleUpdateDocument = async (updatedDoc: DocumentItem) => {
    setDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
    if (isSupabaseConfigured) {
      const result = await upsertDocumentToSupabase(updatedDoc);
      if (!result.success) setSaveToast(result.error || 'Không thể cập nhật tư liệu');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (isSupabaseConfigured) {
      const result = await deleteDocumentFromSupabase(id);
      if (!result.success) setSaveToast(result.error || 'Không thể xóa tư liệu');
    }
  };

  const handleAddEvent = async (newEvent: EventItem) => {
    setEvents((prev) => [...prev, newEvent]);
    if (isSupabaseConfigured) {
      const result = await upsertEventToSupabase(newEvent);
      if (!result.success) setSaveToast(result.error || 'Không thể lưu sự kiện');
    }
  };

  const handleUpdateEvent = async (updatedEvent: EventItem) => {
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
    if (isSupabaseConfigured) {
      const result = await upsertEventToSupabase(updatedEvent);
      if (!result.success) setSaveToast(result.error || 'Không thể cập nhật sự kiện');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (isSupabaseConfigured) {
      const result = await deleteEventFromSupabase(id);
      if (!result.success) setSaveToast(result.error || 'Không thể xóa sự kiện');
    }
  };

  const handleResetSampleData = () => {
    setMembers(INITIAL_MEMBERS);
    setBranches(INITIAL_BRANCHES);
    setEvents(INITIAL_EVENTS);
    setDocuments(INITIAL_DOCUMENTS);
    setPosts(INITIAL_POSTS);
    setFunds(INITIAL_FUNDS);
    setClanInfo(CLAN_INFO);
    confetti({ particleCount: 50, spread: 80 });
  };

  const handleImportClanData = (data: any) => {
    if (data.clanInfo) setClanInfo(data.clanInfo);
    if (data.branches) setBranches(data.branches);
    if (data.documents) setDocuments(data.documents);
    if (data.events) setEvents(data.events);
    if (data.members && Array.isArray(data.members)) {
      // If dataset contains root ancestor or generation 1/2, replace entire member list
      const hasRootAncestors = data.members.some((m: Member) => m.generation <= 2 || m.isRootAncestor);
      if (hasRootAncestors) {
        setMembers(data.members);
      } else {
        // Partial import (e.g. generations 7-9): Smart merge into existing tree
        setMembers((prev) => {
          const map = new Map(prev.map((m) => [m.id, m]));
          for (const m of data.members) {
            map.set(m.id, m);
          }
          return Array.from(map.values());
        });
      }
    }
    confetti({ particleCount: 60, spread: 80 });
  };

  // Authentication Handlers: chỉ nhận danh tính từ Supabase Auth.
  const handleLoginWithGoogle = () => {
    // OAuth được thực hiện trong GoogleAuthModal. Session listener sẽ cập nhật profile.
    setIsAuthModalOpen(false);
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setUserRole('visitor');
    if (activeTab === 'admin') setActiveTab('tree');
    setIsAuthModalOpen(false);
  };

  const handleAddUser = async (newUser: ClanUser) => {
    const result = await saveClanUserToSupabase(newUser);
    if (result.success && result.user) {
      setClanUsers((prev) => [result.user!, ...prev.filter((u) => u.email !== result.user!.email)]);
      setSaveToast('Đã lưu tài khoản vào Supabase');
    } else if (!isSupabaseConfigured) {
      setClanUsers((prev) => [newUser, ...prev]);
    } else {
      setSaveToast(result.error || 'Không thể lưu tài khoản');
    }
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleUpdateUser = async (updatedUser: ClanUser) => {
    const result = await saveClanUserToSupabase(updatedUser);
    if (result.success && result.user) {
      setClanUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? result.user! : u)));
      if (currentUser && currentUser.id === updatedUser.id) {
        setCurrentUser(result.user);
        setUserRole(result.user.role);
      }
    } else if (!isSupabaseConfigured) {
      setClanUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    } else {
      setSaveToast(result.error || 'Không thể cập nhật tài khoản');
      setTimeout(() => setSaveToast(null), 3500);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await deleteClanUserFromSupabase(userId);
    if (result.success || !isSupabaseConfigured) {
      setClanUsers((prev) => prev.filter((u) => u.id !== userId));
      if (currentUser && currentUser.id === userId) await handleLogout();
    } else {
      setSaveToast(result.error || 'Không thể xóa tài khoản');
      setTimeout(() => setSaveToast(null), 3500);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#180204] text-amber-100 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <p className="text-sm font-semibold">Đang kết nối dữ liệu gia phả…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#180204] text-amber-50 flex flex-col font-sans selection:bg-amber-500 selection:text-amber-950 pb-16 sm:pb-0">
      {/* Topmost Royal Hoành Phi Banner */}
      <header className="relative bg-gradient-to-r from-[#3b0207] via-[#5c0612] to-[#3b0207] border-b-2 border-amber-500/50 shadow-2xl overflow-hidden">
        {/* Decorative corner motifs */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-500/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3.5">
          {/* Brand & Crest */}
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 p-0.5 shadow-lg flex-shrink-0">
              <div className="w-full h-full bg-[#350207] rounded-[14px] flex items-center justify-center border border-amber-300/40">
                <Crown className="w-6 h-6 text-amber-300 drop-shadow" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-xl md:text-2xl font-black font-serif tracking-wider text-amber-200 uppercase drop-shadow">
                  {clanInfo.name}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 hidden sm:inline">
                  Đại Tôn
                </span>
              </div>
              <p className="text-xs text-amber-300/80 font-serif tracking-widest mt-0.5">
                {clanInfo.motto}
              </p>
            </div>
          </div>

          {/* Action Center: LỐI VÀO ADMINCP + ĐĂNG NHẬP GOOGLE */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5">
            {/* 1. LỐI VÀO ADMINCP - CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP QUẢN TRỊ */}
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-amber-950 ring-2 ring-amber-300 border-2 border-white'
                    : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-amber-950 hover:from-amber-400 hover:to-amber-500 border border-amber-300'
                }`}
                title="Bấm để mở Bảng Điều Khiển Quản Trị Tộc (AdminCP)"
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-950 flex-shrink-0" />
                <div className="text-left leading-tight">
                  <div className="font-extrabold uppercase text-[11px] tracking-wide flex items-center gap-1">
                    <span>Lối Vào AdminCP</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                  </div>
                  <div className="text-[9px] text-amber-950/80 font-medium">
                    {activeTab === 'admin' ? '★ Đang Mở AdminCP' : (userRole === 'super_admin' ? 'Trưởng Tộc Toàn Quyền' : 'Trưởng Chi')}
                  </div>
                </div>
              </button>
            ) : null}

            {/* 2. KHU VỰC ĐĂNG NHẬP GOOGLE / TÀI KHOẢN HIỆN TẠI */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-black/40 p-1.5 pl-2.5 rounded-xl border border-amber-500/40 text-xs">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity"
                  title="Nhấp để đổi tài khoản hoặc xem thông tin phân quyền Google"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover border border-amber-400 shadow"
                    />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-bold text-amber-100 flex items-center gap-1 text-[11px] leading-tight">
                      <span>{currentUser.name}</span>
                      {currentUser.role === 'super_admin' && (
                        <Crown className="w-3 h-3 text-amber-400" />
                      )}
                    </div>
                    <div className="text-[10px] text-amber-300/80 font-mono truncate max-w-[140px]">
                      {currentUser.email}
                    </div>
                  </div>
                </button>

                {/* Role badge */}
                <span className="hidden md:inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {currentUser.role === 'super_admin'
                    ? 'Super Admin'
                    : currentUser.role === 'branch_admin'
                    ? 'Trưởng Chi'
                    : currentUser.role}
                </span>

                {/* Open Modal Button */}
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="p-1.5 hover:bg-white/10 text-amber-300 rounded-lg transition-colors"
                  title="Chuyển đổi tài khoản Google / Đăng xuất"
                >
                  <User className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-2 rounded-xl font-bold text-xs bg-white text-slate-800 hover:bg-amber-50 border border-amber-300 shadow-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                title="Bấm để đăng nhập bằng tài khoản Google (@gmail.com)"
              >
                {/* Google Multi-Color SVG Icon */}
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="font-bold text-slate-800">Đăng Nhập Quản Trị</span>
              </button>
            )}

          </div>
        </div>

        {/* Upcoming Anniversary Notice Banner */}
        {upcomingEvent && (
          <div className="bg-[#240104] border-t border-amber-500/20 px-4 py-1.5 text-xs text-amber-300 flex items-center justify-center gap-2">
            <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>
              <b>Sự kiện sắp tới:</b> {upcomingEvent.title} (Ngày {upcomingEvent.lunarDay}/{upcomingEvent.lunarMonth} Âm lịch).
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('anniversaries')}
              className="text-amber-200 underline hover:text-white font-semibold flex items-center gap-0.5 ml-1"
            >
              Xem chi tiết <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </header>

      {/* Main Tab Navigation Bar (Desktop / Tablet - on mobile use bottom navigation bar) */}
      <nav className="bg-[#280205] border-b border-amber-500/30 sticky top-0 z-30 shadow-md backdrop-blur-md hidden sm:block">
        <div className="max-w-7xl mx-auto px-2 sm:px-6">
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
            {/* Mobile Menu Opener Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="sm:hidden px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 hover:bg-amber-500/30 active:scale-95"
              title="Mở toàn bộ danh mục chức năng"
            >
              <Menu className="w-4 h-4 text-amber-400" />
              <span>Menu</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tree')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 flex-shrink-0 transition-all ${
                activeTab === 'tree'
                  ? 'bg-amber-500 text-amber-950 shadow-lg'
                  : 'text-amber-200 hover:bg-white/5'
              }`}
            >
              <TreeDeciduous className="w-4 h-4" />
              Cây Gia Phả Tương Tác
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 flex-shrink-0 transition-all ${
                activeTab === 'search'
                  ? 'bg-amber-500 text-amber-950 shadow-lg'
                  : 'text-amber-200 hover:bg-white/5'
              }`}
            >
              <Search className="w-4 h-4" />
              Tra Cứu Thông Minh
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('relationship')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 flex-shrink-0 transition-all ${
                activeTab === 'relationship'
                  ? 'bg-amber-500 text-amber-950 shadow-lg'
                  : 'text-amber-200 hover:bg-white/5'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              Tính Mối Quan Hệ (Xưng Hô)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('anniversaries')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 flex-shrink-0 transition-all ${
                activeTab === 'anniversaries'
                  ? 'bg-amber-500 text-amber-950 shadow-lg'
                  : 'text-amber-200 hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Lịch Âm & Ngày Giỗ
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('archives')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 flex-shrink-0 transition-all ${
                activeTab === 'archives'
                  ? 'bg-amber-500 text-amber-950 shadow-lg'
                  : 'text-amber-200 hover:bg-white/5'
              }`}
            >
              <Scroll className="w-4 h-4" />
              Kho Tư Liệu & Sắc Phong
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('community')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 flex-shrink-0 transition-all ${
                activeTab === 'community'
                  ? 'bg-amber-500 text-amber-950 shadow-lg'
                  : 'text-amber-200 hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Bảng Tin Dòng Tộc
            </button>

            {/* AdminCP Tab - CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP VỚI QUYỀN QUẢN TRỊ */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 flex-shrink-0 transition-all border ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-xl border-amber-300'
                    : 'text-amber-300 bg-amber-950/40 border-amber-500/40 hover:bg-amber-900/60'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                AdminCP Quản Trị
                <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {userRole === 'super_admin' ? 'Toàn Quyền' : 'Trưởng Chi'}
                </span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto ${activeTab === 'tree' ? 'p-1 sm:px-6 sm:py-6 max-w-[1920px]' : 'max-w-7xl px-3 sm:px-6 py-4 sm:py-6'} pb-20 sm:pb-6`}>
        {activeTab === 'tree' && (
          <FamilyTree
            members={members}
            branches={branches}
            clanInfo={clanInfo}
            onUpdateClanInfo={handleUpdateClanInfo}
            userRole={userRole}
            onSelectMember={handleSelectMember}
            onAddChild={handleOpenAddChild}
            onAddSpouse={handleOpenAddSpouse}
            onAddNewMember={handleOpenAddNewMember}
            onDeleteMember={handleDeleteMember}
            highlightedMemberId={highlightedTreeMemberId}
            onOpenAdmin={() => setActiveTab('admin')}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'search' && (
          <SmartSearch
            members={members}
            branches={branches}
            userRole={userRole}
            onSelectMember={handleSelectMember}
            onJumpToTree={handleJumpToTree}
          />
        )}

        {activeTab === 'relationship' && (
          <RelationshipModal
            members={members}
            onSelectMember={handleSelectMember}
          />
        )}

        {activeTab === 'anniversaries' && (
          <LunarAnniversaries
            events={events}
            members={members}
            branches={branches}
            onSelectMember={handleSelectMember}
          />
        )}

        {activeTab === 'archives' && (
          <ArchivesManager
            documents={documents}
            userRole={userRole}
          />
        )}

        {activeTab === 'community' && (
          <CommunityAndFund
            posts={posts}
            userRole={userRole}
            onAddPost={handleAddPost}
          />
        )}


        {activeTab === 'admin' && (
          isAdmin ? (
            <AdminCP
              clanInfo={clanInfo}
              onUpdateClanInfo={handleUpdateClanInfo}
              members={members}
              branches={branches}
              documents={documents}
              events={events}
              userRole={userRole}
              clanUsers={clanUsers}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              currentUser={currentUser}
              onSelectMemberForEdit={handleSelectMember}
              onOpenAddChild={handleOpenAddChild}
              onOpenAddSpouse={handleOpenAddSpouse}
              onOpenAddNewMember={handleOpenAddNewMember}
              onDeleteMember={handleDeleteMember}
              onAddDocument={handleAddDocument}
              onUpdateDocument={handleUpdateDocument}
              onDeleteDocument={handleDeleteDocument}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
              onResetSampleData={handleResetSampleData}
              onImportClanData={handleImportClanData}
              onBurialLocationApproved={handleBurialLocationApproved}
            />
          ) : (
            <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border-2 border-amber-500/40 shadow-2xl p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-800 shadow-inner">
                <Lock className="w-8 h-8 text-amber-800" />
              </div>
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  Bảo Vệ Quyền Hạn Dòng Tộc
                </span>
                <h2 className="text-xl font-bold font-serif text-slate-900">
                  Khu Vực Quản Trị Bảo Mật (AdminCP)
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bảng điều khiển AdminCP chỉ dành riêng cho <b>Hội Đồng Trưởng Tộc</b> và các <b>Trưởng Chi</b> được ủy quyền. Bạn cần đăng nhập bằng tài khoản Google có quyền để truy cập.
                </p>
              </div>

              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-left text-xs space-y-1.5 text-slate-700">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Quyền truy cập hợp lệ:</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  • Tài khoản Super Admin: tài khoản được khai báo trong bảng <b>clan_users</b> của Supabase.
                </p>
                <p className="text-[11px] text-slate-600">
                  • Hoặc các tài khoản Google đã được cấp quyền Quản trị trong danh sách gia tộc.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng Nhập Quản Trị Bằng Google
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tree')}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Quay Về Cây Gia Phả
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Floating Quick Action Bar for Desktop */}
      <div className="hidden sm:flex fixed bottom-6 right-6 z-30 items-center gap-2 bg-[#250104]/90 p-2 rounded-2xl border-2 border-amber-500/70 shadow-2xl backdrop-blur-md">
        {isAdmin ? (
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-transform hover:scale-105 active:scale-95 ${
              activeTab === 'admin'
                ? 'bg-amber-400 text-amber-950 ring-2 ring-white'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 hover:from-amber-400 hover:to-amber-500'
            }`}
            title="Vào ngay Bảng Điều Khiển Quản Trị Tộc"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-950" />
            <span>Lối Vào AdminCP</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white transition-transform hover:scale-105 active:scale-95"
            title="Đăng nhập để vào Bảng Điều Khiển Quản Trị Tộc"
          >
            <Lock className="w-3.5 h-3.5 text-amber-200" />
            <span>Đăng Nhập Quản Trị</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-400/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="Đăng nhập Google hoặc chuyển đổi tài khoản"
        >
          <LogIn className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">
            {currentUser ? currentUser.name.split(' ')[0] : 'Tài Khoản'}
          </span>
        </button>
      </div>

      {/* Google Authentication Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        clanUsers={clanUsers}
        onLoginWithGoogle={handleLoginWithGoogle}
        onLogout={handleLogout}
      />

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberModal
          member={selectedMember}
          allMembers={members}
          branches={branches}
          userRole={userRole}
          clanInfo={clanInfo}
          onClose={() => setSelectedMember(null)}
          onSelectRelative={handleSelectMember}
          onUpdateMember={handleUpdateMember}
          onDeleteMember={handleDeleteMember}
        />
      )}

      {/* Add Member (Child or Spouse) Modal */}
      {isAddingMember && (
        <AddMemberModal
          parentMember={parentForNewChild}
          spouseForMember={spouseForNewMember}
          branches={branches}
          allMembers={members}
          onClose={() => setIsAddingMember(false)}
          onAddMember={handleAddMember}
        />
      )}

      {/* Floating Save Toast */}
      {saveToast && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-2.5 bg-emerald-900/95 text-emerald-100 px-4 py-3 rounded-xl border border-emerald-400/50 shadow-2xl backdrop-blur-md text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Modal/Banner Cảnh Báo Thiếu Cột burial_coordinates & Hướng Dẫn Sửa Lỗi 10 Giây */}
      {schemaWarningNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-amber-400 space-y-4 text-xs text-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 text-amber-900 font-bold text-sm font-serif">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-amber-950 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-950" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cần Cập Nhật Cột burial_coordinates Trên Supabase</h3>
                  <p className="text-[11px] text-emerald-700 font-medium">✓ Thành viên đã được lưu an toàn vào hệ thống</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSchemaWarningNotice(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700 leading-relaxed bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
              <p>
                <b>Nguyên nhân thông báo:</b> Bảng <code>members</code> trên dự án Supabase của bạn đang thiếu cột <code>burial_coordinates</code> (lưu kinh độ / vĩ độ GPS mộ phần).
              </p>
              <p>
                <b>Cách khắc phục triệt để trong 10 giây:</b> Vào trang quản trị <b>Supabase</b> &rarr; Menu <b>SQL Editor</b> &rarr; Bấm <b>"New Query"</b> &rarr; Dán 3 dòng lệnh sau và nhấn <b>RUN</b>:
              </p>
            </div>

            <div className="relative">
              <pre className="p-3 bg-slate-950 text-emerald-300 font-mono text-[11px] rounded-xl overflow-x-auto border border-slate-800 leading-relaxed">
                {SUPABASE_FIX_BURIAL_COORDINATES_SQL}
              </pre>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_FIX_BURIAL_COORDINATES_SQL);
                  setCopiedNoticeSql(true);
                  setTimeout(() => setCopiedNoticeSql(false), 3000);
                  confetti({ particleCount: 30, spread: 60 });
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow transition-all active:scale-95"
              >
                {copiedNoticeSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedNoticeSql ? 'Đã Sao Chép SQL!' : 'Sao Chép Mã SQL Này'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSchemaWarningNotice(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition-colors"
              >
                Đã Hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#120103] border-t border-amber-500/20 py-6 text-center text-xs text-amber-300/60 mb-12 sm:mb-0">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-serif font-bold text-amber-200 tracking-wider">
            {clanInfo.ancestralHall} • {clanInfo.address}
          </p>
          <p className="text-[11px]">
            Hệ thống Quản lý Gia phả Tộc số hóa • Thiết kế tối ưu 0đ chạy trên GitHub Pages / Vercel & Supabase
          </p>
        </div>
      </footer>

      {/* MOBILE FULL MENU DRAWER MODAL */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative bg-gradient-to-b from-[#2b0206] to-[#1a0104] border-t-2 border-amber-400 rounded-t-3xl p-5 shadow-2xl z-10 max-h-[85vh] overflow-y-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-amber-950 flex items-center justify-center font-bold">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-amber-200 text-sm uppercase">Danh Mục Phả Hệ</h3>
                  <p className="text-[11px] text-amber-300/70">{clanInfo.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-amber-300 flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu items list */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              {[
                { id: 'tree', label: 'Cây Gia Phả Tương Tác', desc: 'Sơ đồ 2D trực quan, cành nhánh các đời', icon: TreeDeciduous },
                { id: 'search', label: 'Tra Cứu Thông Minh', desc: 'Tìm kiếm con cháu, chi phái, mộ phần', icon: Search },
                { id: 'relationship', label: 'Tính Mối Quan Hệ (Xưng Hô)', desc: 'Xác định cách gọi đúng thứ bậc họ hàng', icon: GitCompare },
                { id: 'anniversaries', label: 'Lịch Âm & Ngày Giỗ', desc: 'Lịch kỵ nhật, thông báo lễ bái hằng năm', icon: Calendar },
                { id: 'archives', label: 'Kho Tư Liệu & Sắc Phong', desc: 'Văn bia, câu đối, gia huấn tiền nhân', icon: Scroll },
                { id: 'community', label: 'Bảng Tin Dòng Tộc', desc: 'Hoạt động, thông báo và vinh danh con cháu', icon: MessageSquare },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id as TabType);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3.5 text-left transition-all ${
                      isActive
                        ? 'bg-amber-500 text-amber-950 font-bold shadow-lg'
                        : 'bg-black/30 hover:bg-white/5 text-amber-100 border border-amber-500/20'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-amber-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight">{item.label}</div>
                      <div className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-amber-950/80' : 'text-amber-300/60'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* AdminCP button */}
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-2xl flex items-center gap-3.5 text-left transition-all border-2 ${
                    activeTab === 'admin'
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border-white shadow-xl'
                      : 'bg-gradient-to-r from-amber-700/60 to-red-900/60 text-amber-100 border-amber-400/50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-950 text-amber-300 flex items-center justify-center shrink-0">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black uppercase text-amber-300 flex items-center gap-2">
                      <span>Bảng Quản Trị AdminCP</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-600 text-white font-bold">
                        {userRole === 'super_admin' ? 'Toàn Quyền' : 'Trưởng Chi'}
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-200/80 mt-0.5">
                      Thêm/sửa thành viên, phân quyền, cấu hình hiển thị thẻ
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full p-3 rounded-2xl flex items-center gap-3.5 text-left bg-white/5 border border-amber-500/30 text-amber-200"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-amber-200">Đăng Nhập Quản Trị Viên</div>
                    <div className="text-[10px] text-amber-300/60 mt-0.5">
                      Đăng nhập tài khoản Google để vào AdminCP
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM QUICK NAVIGATION BAR */}
      <nav className="mobile-bottom-nav-safe fixed bottom-0 left-0 right-0 z-40 bg-[#240205]/95 border-t border-amber-500/40 backdrop-blur-lg flex justify-around items-center py-2 px-1 sm:hidden shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('tree')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'tree' ? 'text-amber-400 font-bold scale-105' : 'text-amber-200/60 hover:text-amber-200'
          }`}
        >
          <TreeDeciduous className="w-4 h-4" />
          <span className="text-[10px]">Cây Phả Hệ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'search' ? 'text-amber-400 font-bold scale-105' : 'text-amber-200/60 hover:text-amber-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span className="text-[10px]">Tra Cứu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('relationship')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'relationship' ? 'text-amber-400 font-bold scale-105' : 'text-amber-200/60 hover:text-amber-200'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span className="text-[10px]">Xưng Hô</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('anniversaries')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'anniversaries' ? 'text-amber-400 font-bold scale-105' : 'text-amber-200/60 hover:text-amber-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[10px]">Lịch Giỗ</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
            isMobileMenuOpen || activeTab === 'admin' || activeTab === 'archives' || activeTab === 'community'
              ? 'text-amber-400 font-bold'
              : 'text-amber-200/60 hover:text-amber-200'
          }`}
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px]">Thêm...</span>
        </button>
      </nav>
    </div>
  );
}

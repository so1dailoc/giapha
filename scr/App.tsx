import React, { useState } from 'react';
import {
  Member,
  Branch,
  EventItem,
  DocumentItem,
  PostItem,
  FundRecord,
  UserRole,
  ClanUser,
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
  DEFAULT_SUPER_ADMIN_EMAIL,
} from './lib/supabase';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { FamilyTree } from './components/FamilyTree';
import { SmartSearch } from './components/SmartSearch';
import { RelationshipModal } from './components/RelationshipModal';
import { LunarAnniversaries } from './components/LunarAnniversaries';
import { ArchivesManager } from './components/ArchivesManager';
import { CommunityAndFund } from './components/CommunityAndFund';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
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
  Database,
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // Master state
  const [clanInfo, setClanInfo] = useState(CLAN_INFO);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [posts, setPosts] = useState<PostItem[]>(INITIAL_POSTS);
  const [funds, setFunds] = useState<FundRecord[]>(INITIAL_FUNDS);

  // Authentication & Users state
  const [clanUsers, setClanUsers] = useState<ClanUser[]>(INITIAL_CLAN_USERS);
  const [currentUser, setCurrentUser] = useState<ClanUser | null>(INITIAL_CLAN_USERS[0]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Active Tab
  type TabType = 'tree' | 'search' | 'relationship' | 'anniversaries' | 'archives' | 'community' | 'database' | 'admin';
  const [activeTab, setActiveTab] = useState<TabType>('tree');

  // RBAC Role State (synced with current user)
  const [userRole, setUserRole] = useState<UserRole>(INITIAL_CLAN_USERS[0]?.role || 'super_admin');

  // Modals & Selection
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [highlightedTreeMemberId, setHighlightedTreeMemberId] = useState<string | null>(null);

  // Add Relative Modal State
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [parentForNewChild, setParentForNewChild] = useState<Member | null>(null);
  const [spouseForNewMember, setSpouseForNewMember] = useState<Member | null>(null);

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

  const handleAddMember = (newMember: Member) => {
    setMembers((prev) => {
      const updated = [...prev, newMember];
      // If adding spouse, update spouseIds in target member
      if (spouseForNewMember) {
        return updated.map((m) => {
          if (m.id === spouseForNewMember.id) {
            return {
              ...m,
              spouseIds: [...(m.spouseIds || []), newMember.id],
            };
          }
          return m;
        });
      }
      return updated;
    });

    confetti({
      particleCount: 35,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleUpdateMember = (updated: Member) => {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setSelectedMember(updated);
  };

  const handleDeleteMember = (id: string) => {
    setMembers((prev) => {
      return prev
        .filter((m) => m.id !== id)
        .map((m) => ({
          ...m,
          fatherId: m.fatherId === id ? null : m.fatherId,
          motherId: m.motherId === id ? null : m.motherId,
          spouseIds: m.spouseIds ? m.spouseIds.filter((sId) => sId !== id) : [],
        }));
    });
    setSelectedMember(null);
  };

  const handleAddPost = (post: PostItem) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handleAddFund = (fund: FundRecord) => {
    setFunds((prev) => [fund, ...prev]);
  };

  const handleUpdateClanInfo = (newInfo: typeof CLAN_INFO) => {
    setClanInfo(newInfo);
  };

  const handleAddDocument = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleUpdateDocument = (updatedDoc: DocumentItem) => {
    setDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleAddEvent = (newEvent: EventItem) => {
    setEvents((prev) => [...prev, newEvent]);
  };

  const handleUpdateEvent = (updatedEvent: EventItem) => {
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
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
    if (data.members) setMembers(data.members);
    if (data.branches) setBranches(data.branches);
    if (data.documents) setDocuments(data.documents);
    if (data.events) setEvents(data.events);
  };

  // Authentication Handlers
  const handleLoginWithGoogle = (user: ClanUser) => {
    setCurrentUser(user);
    setUserRole(user.role);
    setClanUsers((prev) => {
      const exists = prev.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
      if (!exists) {
        return [user, ...prev];
      }
      return prev.map((u) => (u.email.toLowerCase() === user.email.toLowerCase() ? user : u));
    });
    setIsAuthModalOpen(false);
    confetti({ particleCount: 35, spread: 60 });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserRole('visitor');
    setIsAuthModalOpen(false);
  };

  const handleAddUser = (newUser: ClanUser) => {
    setClanUsers((prev) => [newUser, ...prev]);
  };

  const handleUpdateUser = (updatedUser: ClanUser) => {
    setClanUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      setUserRole(updatedUser.role);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setClanUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser && currentUser.id === userId) {
      handleLogout();
    }
  };

  return (
    <div className="min-h-screen bg-[#180204] text-amber-50 flex flex-col font-sans selection:bg-amber-500 selection:text-amber-950">
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
            {/* 1. LỐI VÀO ADMINCP NỔI BẬT */}
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
                  {activeTab === 'admin' ? '★ Đang Mở AdminCP' : 'Quản Trị Toàn Diện'}
                </div>
              </div>
            </button>

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
                <span className="font-bold text-slate-800">Đăng Nhập Google</span>
              </button>
            )}

            {/* Role Quick Switch (tiện thử nghiệm mọi quyền) */}
            <div className="hidden lg:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-amber-500/30 text-[10px]">
              <span className="text-amber-300/70 px-1.5 font-medium">Quyền:</span>
              <button
                type="button"
                onClick={() => setUserRole('super_admin')}
                className={`px-2 py-0.5 rounded ${userRole === 'super_admin' ? 'bg-amber-500 text-amber-950 font-bold' : 'text-amber-200/70 hover:bg-white/5'}`}
              >
                Trưởng Tộc
              </button>
              <button
                type="button"
                onClick={() => setUserRole('branch_admin')}
                className={`px-2 py-0.5 rounded ${userRole === 'branch_admin' ? 'bg-amber-500 text-amber-950 font-bold' : 'text-amber-200/70 hover:bg-white/5'}`}
              >
                Trưởng Chi
              </button>
              <button
                type="button"
                onClick={() => setUserRole('member')}
                className={`px-2 py-0.5 rounded ${userRole === 'member' ? 'bg-amber-500 text-amber-950 font-bold' : 'text-amber-200/70 hover:bg-white/5'}`}
              >
                Thành Viên
              </button>
              <button
                type="button"
                onClick={() => setUserRole('visitor')}
                className={`px-2 py-0.5 rounded ${userRole === 'visitor' ? 'bg-amber-500 text-amber-950 font-bold' : 'text-amber-200/70 hover:bg-white/5'}`}
              >
                Khách
              </button>
            </div>
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

      {/* Main Tab Navigation Bar */}
      <nav className="bg-[#280205] border-b border-amber-500/30 sticky top-0 z-30 shadow-md backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
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
              Bảng Tin & Sổ Quỹ
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('database')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 flex-shrink-0 transition-all ${
                activeTab === 'database'
                  ? 'bg-amber-500 text-amber-950 shadow-lg'
                  : 'text-amber-200 hover:bg-white/5'
              }`}
            >
              <Database className="w-4 h-4" />
              Database Supabase & 0đ Guide
            </button>

            {/* AdminCP Tab */}
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
                Toàn Quyền
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'tree' && (
          <FamilyTree
            members={members}
            branches={branches}
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
            funds={funds}
            userRole={userRole}
            onAddPost={handleAddPost}
            onAddFund={handleAddFund}
          />
        )}

        {activeTab === 'database' && <DatabaseSchemaView />}

        {activeTab === 'admin' && (
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
          />
        )}
      </main>

      {/* Floating Quick Action Bar for Index / Mobile / Everywhere */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-[#250104]/90 p-2 rounded-2xl border-2 border-amber-500/70 shadow-2xl backdrop-blur-md">
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

        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-400/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="Đăng nhập Google hoặc chuyển đổi tài khoản"
        >
          <LogIn className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">
            {currentUser ? currentUser.name.split(' ')[0] : 'Đăng Nhập'}
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

      {/* Footer */}
      <footer className="bg-[#120103] border-t border-amber-500/20 py-6 text-center text-xs text-amber-300/60">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-serif font-bold text-amber-200 tracking-wider">
            {clanInfo.ancestralHall} • {clanInfo.address}
          </p>
          <p className="text-[11px]">
            Hệ thống Quản lý Gia phả Tộc số hóa • Thiết kế tối ưu 0đ chạy trên GitHub Pages / Vercel & Supabase
          </p>
        </div>
      </footer>
    </div>
  );
}

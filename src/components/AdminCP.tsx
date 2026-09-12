import React, { useState, useEffect } from 'react';
import {
  Member,
  Branch,
  DocumentItem,
  EventItem,
  UserRole,
  ClanUser,
  ClanInfo,
} from '../types';
import {
  DEFAULT_SUPER_ADMIN_EMAIL,
  SUPABASE_SQL_SCHEMA,
  SUPABASE_FIX_BURIAL_COORDINATES_SQL,
  downloadSupabaseSchemaSql,
} from '../lib/supabase';
import {
  ShieldCheck,
  Scroll,
  TreeDeciduous,
  Settings,
  Calendar,
  Database,
  Plus,
  Edit3,
  Trash2,
  Search,
  Download,
  Upload,
  Eye,
  CheckCircle,
  AlertTriangle,
  X,
  Save,
  Crown,
  Sparkles,
  Award,
  Users,
  GitBranch,
  FileText,
  MapPin,
  RefreshCw,
  RotateCcw,
  Mail,
  Phone,
  UserPlus,
  UserCheck,
  Copy,
  ExternalLink,
  Lock,
  Unlock,
  Check,
  Globe,
  Code2,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DEFAULT_INTERFACE_THEME, getInterfaceThemePreset } from '../utils/themeDefaults';
import { fetchBurialLocationSubmissions, reviewBurialLocationSubmission } from '../lib/supabaseService';
import type { BurialLocationSubmission } from '../types';

interface AdminCPProps {
  clanInfo: ClanInfo;
  onUpdateClanInfo: (info: ClanInfo) => void | Promise<{ success: boolean; error?: string }>;
  members: Member[];
  branches: Branch[];
  documents: DocumentItem[];
  events: EventItem[];
  userRole: UserRole;
  clanUsers: ClanUser[];
  onAddUser: (user: ClanUser) => void;
  onUpdateUser: (user: ClanUser) => void;
  onDeleteUser: (userId: string) => void;
  currentUser: ClanUser | null;
  onSelectMemberForEdit: (member: Member) => void;
  onOpenAddChild: (parent: Member) => void;
  onOpenAddSpouse: (member: Member) => void;
  onOpenAddNewMember: () => void;
  onDeleteMember: (id: string) => void;
  onAddDocument: (doc: DocumentItem) => void;
  onUpdateDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
  onAddEvent: (evt: EventItem) => void;
  onUpdateEvent: (evt: EventItem) => void;
  onDeleteEvent: (id: string) => void;
  onResetSampleData?: () => void;
  onImportClanData?: (data: any) => void;
  onBurialLocationApproved?: (memberId: string, coordinates: { lat: number; lng: number }) => void;
}

const GenealogyIntegrityPanel: React.FC<{ members: Member[]; onEdit: (member: Member) => void }> = ({ members, onEdit }) => {
  const byId = new Map(members.map((m) => [m.id, m]));
  const issues: { member: Member; message: string }[] = [];
  const seen = new Set<string>();
  for (const member of members) {
    if (seen.has(member.id)) issues.push({ member, message: 'ID thành viên bị trùng.' });
    seen.add(member.id);
    if (member.fatherId && !byId.has(member.fatherId)) issues.push({ member, message: `Không tìm thấy Cha (${member.fatherId}).` });
    if (member.motherId && !byId.has(member.motherId)) issues.push({ member, message: `Không tìm thấy Mẹ (${member.motherId}).` });
    for (const spouseId of member.spouseIds || []) {
      const spouse = byId.get(spouseId);
      if (!spouse) issues.push({ member, message: `Không tìm thấy phối ngẫu (${spouseId}).` });
      else if (!(spouse.spouseIds || []).includes(member.id)) issues.push({ member, message: `Liên kết phối ngẫu chưa đối xứng với ${spouse.fullName}.` });
    }
    const father = member.fatherId ? byId.get(member.fatherId) : undefined;
    const mother = member.motherId ? byId.get(member.motherId) : undefined;
    const expected = Math.max(father?.generation || 0, mother?.generation || 0) + 1;
    if (expected > 1 && member.generation !== expected) issues.push({ member, message: `Đời đang là ${member.generation}, nhưng theo Cha/Mẹ nên là ${expected}.` });
    if (member.fatherId === member.id || member.motherId === member.id || (member.spouseIds || []).includes(member.id)) issues.push({ member, message: 'Quan hệ tự trỏ vào chính mình.' });
  }
  const uniqueIssues = issues.filter((item, index, arr) => arr.findIndex(x => x.member.id === item.member.id && x.message === item.message) === index);
  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> Kiểm tra tính toàn vẹn gia phả</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Quét liên kết Cha/Mẹ, phối ngẫu, đời và lỗi dữ liệu trước khi biên soạn phả ký.</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${uniqueIssues.length ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {uniqueIssues.length ? `${uniqueIssues.length} cảnh báo` : 'Dữ liệu đang nhất quán'}
        </span>
      </div>
      {uniqueIssues.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {uniqueIssues.slice(0, 80).map((issue, idx) => (
            <div key={`${issue.member.id}-${idx}`} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <button type="button" onClick={() => onEdit(issue.member)} className="font-bold text-amber-950 hover:underline truncate">{issue.member.fullName}</button>
              <span className="text-amber-800 truncate flex-1">{issue.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminCP: React.FC<AdminCPProps> = ({
  clanInfo,
  onUpdateClanInfo,
  members,
  branches,
  documents,
  events,
  userRole,
  clanUsers,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUser,
  onSelectMemberForEdit,
  onOpenAddChild,
  onOpenAddSpouse,
  onOpenAddNewMember,
  onDeleteMember,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onResetSampleData,
  onImportClanData,
  onBurialLocationApproved,
}) => {
  type AdminTab = 'tree' | 'users' | 'archives' | 'settings' | 'events' | 'burial' | 'cloud';
  const [activeTab, setActiveTab] = useState<AdminTab>('tree');
  const [burialSubmissions, setBurialSubmissions] = useState<BurialLocationSubmission[]>([]);
  const [burialLoading, setBurialLoading] = useState(false);
  const [burialReviewNote, setBurialReviewNote] = useState<Record<string, string>>({});
  const loadBurialSubmissions = async () => { setBurialLoading(true); const rows = await fetchBurialLocationSubmissions(); setBurialSubmissions(rows); setBurialLoading(false); };
  useEffect(() => { if (activeTab === 'burial') loadBurialSubmissions(); }, [activeTab]);
  const handleBurialReview = async (submission: BurialLocationSubmission, approved: boolean) => {
    const result = await reviewBurialLocationSubmission({ submission, approved, adminNote: burialReviewNote[submission.id], reviewerName: currentUser?.name });
    if (!result.success) { alert(result.error || 'Không thể xử lý đề xuất.'); return; }
    if (approved) onBurialLocationApproved?.(submission.memberId, { lat: submission.latitude, lng: submission.longitude });
    setBurialSubmissions((prev) => prev.map((item) => item.id === submission.id ? { ...item, status: approved ? 'approved' : 'rejected', adminNote: burialReviewNote[item.id], reviewedBy: currentUser?.name, reviewedAt: new Date().toISOString() } : item));
  };

  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ClanUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ClanUser | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedFixSql, setCopiedFixSql] = useState(false);

  const [userForm, setUserForm] = useState<{
    email: string;
    name: string;
    role: UserRole;
    memberId: string;
    branchId: string;
    status: 'active' | 'pending' | 'blocked';
    notes: string;
  }>({
    email: '',
    name: '',
    role: 'member',
    memberId: '',
    branchId: '',
    status: 'active',
    notes: '',
  });

  // Search and filters for members table
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedGenFilter, setSelectedGenFilter] = useState<string>('all');
  const [selectedPhaiFilter, setSelectedPhaiFilter] = useState<string>('all');

  // Delete Member Confirm Modal
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Document management modals
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [docSearch, setDocSearch] = useState('');

  // Document Form State
  const [docForm, setDocForm] = useState<{
    title: string;
    category: 'sac_phong' | 'pha_ky' | 'huong_uoc' | 'van_khan' | 'hinh_anh_mo_to' | 'khac';
    dynastyEra: string;
    description: string;
    authorOrPreserver: string;
    fileUrl: string;
    tags: string;
    images: Array<{ id: string; url: string; caption?: string }>;
  }>({
    title: '',
    category: 'sac_phong',
    dynastyEra: '',
    description: '',
    authorOrPreserver: '',
    fileUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    tags: 'sac_phong, trieu_nguyen',
    images: [
      {
        id: 'img-1',
        url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
        caption: 'Bản chụp sắc phong nguyên bản'
      }
    ],
  });

  // Event management modal
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [eventForm, setEventForm] = useState<{
    title: string;
    type: 'death_anniversary' | 'clan_meeting' | 'tomb_cleaning' | 'ancestor_worship' | 'longevity_celebration';
    lunarDay: number;
    lunarMonth: number;
    location: string;
    description: string;
  }>({
    title: '',
    type: 'ancestor_worship',
    lunarDay: 1,
    lunarMonth: 1,
    location: clanInfo.ancestralHall,
    description: '',
  });

  // Clan Settings Local State
  const [clanForm, setClanForm] = useState({ ...clanInfo });

  useEffect(() => {
    setClanForm({ ...clanInfo });
  }, [clanInfo]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Stats calculation
  const totalMembers = members.length;
  const livingMembers = members.filter((m) => m.isAlive).length;
  const deceasedMembers = totalMembers - livingMembers;
  const maxGen = Math.max(...members.map((m) => m.generation), 1);

  // Available unique Phái from members & branches
  const phaiList = React.useMemo(() => {
    const set = new Set<string>();
    branches.forEach((b) => set.add(b.name));
    members.forEach((m) => {
      if (m.phaiName) set.add(m.phaiName);
    });
    return Array.from(set);
  }, [branches, members]);

  // Filtered members list
  const filteredMembers = React.useMemo(() => {
    return members.filter((m) => {
      if (selectedGenFilter !== 'all' && m.generation !== Number(selectedGenFilter)) {
        return false;
      }
      if (selectedPhaiFilter !== 'all') {
        const phaiMatch = m.phaiName?.toLowerCase().includes(selectedPhaiFilter.toLowerCase()) ||
          branches.find((b) => b.id === m.branchId)?.name.toLowerCase().includes(selectedPhaiFilter.toLowerCase());
        if (!phaiMatch) return false;
      }
      if (memberSearch.trim()) {
        const q = memberSearch.toLowerCase().trim();
        const match = `${m.fullName} ${m.courtesyName || ''} ${m.posthumousName || ''} ${m.occupation || ''}`;
        if (!match.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [members, selectedGenFilter, selectedPhaiFilter, memberSearch, branches]);

  // Handle Export Backup JSON
  const handleExportBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      clanInfo,
      members,
      branches,
      documents,
      events,
      clanUsers,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gia-pha-toc-van-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    confetti({ particleCount: 40, spread: 70 });
  };

  // Download Đời 7 & 8 JSON (Extracted from PDF)
  const handleDownloadDoi78Json = async () => {
    try {
      const res = await fetch('/clan_data_doi7_8.json');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gia_pha_toc_van_doi_7_va_8.json';
      a.click();
      URL.revokeObjectURL(url);
      confetti({ particleCount: 30, spread: 60 });
    } catch (e) {
      alert('Không thể tải tệp dữ liệu Đời 7 & 8.');
    }
  };

  // Download Full 9-Generations JSON
  const handleDownloadFullJson = async () => {
    try {
      const res = await fetch('/clan_data_full.json');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gia_pha_toc_van_full_9_doi.json';
      a.click();
      URL.revokeObjectURL(url);
      confetti({ particleCount: 30, spread: 60 });
    } catch (e) {
      alert('Không thể tải tệp dữ liệu toàn bộ gia phả.');
    }
  };

  // Download Supabase SQL
  const handleDownloadSupabaseSql = async () => {
    try {
      const res = await fetch('/supabase_import.sql');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'supabase_import_toc_van.sql';
      a.click();
      URL.revokeObjectURL(url);
      confetti({ particleCount: 30, spread: 60 });
    } catch (e) {
      alert('Không thể tải tệp SQL Supabase.');
    }
  };

  // 1-Click Load PDF Data (282 members)
  const handleOneClickLoadDoi78 = async () => {
    if (!confirm('Bạn có muốn nạp dữ liệu trích xuất từ Sách Gia Phả (Đời 7, 8 & 9 gồm 282 vị) vào cây phả hệ ngay lập tức không?')) {
      return;
    }
    try {
      const res = await fetch('/clan_data_full.json');
      const full = await res.json();
      if (onImportClanData) {
        onImportClanData(full);
        alert(`Đã nạp thành công ${full.members.length} thành viên (Đời 1 đến Đời 9) vào hệ thống!`);
      }
    } catch (e) {
      alert('Đã xảy ra lỗi khi nạp dữ liệu.');
    }
  };

  // Copy Supabase SQL Schema
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3500);
    confetti({ particleCount: 25, spread: 50 });
  };

  // Copy Supabase Fix Burial Coordinates SQL
  const handleCopyFixSql = () => {
    navigator.clipboard.writeText(SUPABASE_FIX_BURIAL_COORDINATES_SQL);
    setCopiedFixSql(true);
    setTimeout(() => setCopiedFixSql(false), 3500);
    confetti({ particleCount: 25, spread: 50 });
  };

  // Open User Permission Modal
  const handleOpenUserModal = (user?: ClanUser) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        email: user.email,
        name: user.name,
        role: user.role,
        memberId: user.memberId || '',
        branchId: user.branchId || '',
        status: user.status,
        notes: user.notes || '',
      });
    } else {
      setEditingUser(null);
      setUserForm({
        email: '',
        name: '',
        role: 'member',
        memberId: '',
        branchId: branches[0]?.id || '',
        status: 'active',
        notes: '',
      });
    }
    setIsUserModalOpen(true);
  };

  // Submit User Permission Form
  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();
    const email = userForm.email.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      alert('Vui lòng nhập địa chỉ email Google hợp lệ (@gmail.com)!');
      return;
    }

    const linkedMember = members.find((m) => m.id === userForm.memberId);
    const linkedBranch = branches.find((b) => b.id === userForm.branchId);

    if (editingUser) {
      // Protect default Super Admin account from accidental demotion
      const isOriginalSuperAdmin = editingUser.email.toLowerCase() === DEFAULT_SUPER_ADMIN_EMAIL.toLowerCase();
      const updatedUser: ClanUser = {
        ...editingUser,
        email: isOriginalSuperAdmin ? DEFAULT_SUPER_ADMIN_EMAIL : email,
        name: userForm.name.trim() || email.split('@')[0],
        role: isOriginalSuperAdmin ? 'super_admin' : userForm.role,
        memberId: userForm.memberId || undefined,
        memberName: linkedMember ? `${linkedMember.fullName} (Đời ${linkedMember.generation})` : undefined,
        branchId: userForm.branchId || undefined,
        branchName: linkedBranch?.name,
        status: isOriginalSuperAdmin ? 'active' : userForm.status,
        notes: userForm.notes.trim() || undefined,
      };
      onUpdateUser(updatedUser);
    } else {
      const isSuperAdminEmail = email === DEFAULT_SUPER_ADMIN_EMAIL.toLowerCase();
      const newUser: ClanUser = {
        id: `user-${Date.now()}`,
        email,
        name: userForm.name.trim() || email.split('@')[0],
        role: isSuperAdminEmail ? 'super_admin' : userForm.role,
        memberId: userForm.memberId || undefined,
        memberName: linkedMember ? `${linkedMember.fullName} (Đời ${linkedMember.generation})` : undefined,
        branchId: userForm.branchId || undefined,
        branchName: linkedBranch?.name,
        createdAt: new Date().toISOString(),
        status: userForm.status,
        notes: userForm.notes.trim() || undefined,
      };
      onAddUser(newUser);
    }
    setIsUserModalOpen(false);
    confetti({ particleCount: 30, spread: 60 });
  };

  // Handle Import Backup JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.members && onImportClanData) {
          onImportClanData(data);
          alert('Đã nạp thành công dữ liệu gia phả từ bản sao lưu JSON!');
          confetti({ particleCount: 50, spread: 80 });
        } else {
          alert('Tệp tin JSON không đúng định dạng sao lưu chuẩn của Gia Phả!');
        }
      } catch (err) {
        alert('Lỗi đọc tệp tin JSON sao lưu. Vui lòng kiểm tra lại!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle Save Clan Master Settings
  const handleSaveClanSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onUpdateClanInfo(clanForm);
    if (result && !result.success) {
      setSaveSuccessMsg('Lưu thất bại: ' + (result.error || 'Không thể lưu vào Supabase'));
      return;
    }
    setSaveSuccessMsg('Đã lưu thành công thông tin & cài đặt Dòng Tộc!');
    confetti({ particleCount: 30, spread: 60 });
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Handle Open Document Modal (Add or Edit)
  const handleOpenDocModal = (doc?: DocumentItem) => {
    if (doc) {
      setEditingDoc(doc);
      const existingImages = doc.images && doc.images.length > 0
        ? doc.images
        : [
            {
              id: 'img-1',
              url: doc.fileUrl,
              caption: 'Bản chụp tài liệu nguyên bản'
            }
          ];

      setDocForm({
        title: doc.title,
        category: doc.category,
        dynastyEra: doc.dynastyEra || '',
        description: doc.description,
        authorOrPreserver: doc.authorOrPreserver || '',
        fileUrl: doc.fileUrl,
        tags: doc.tags.join(', '),
        images: existingImages,
      });
    } else {
      setEditingDoc(null);
      setDocForm({
        title: '',
        category: 'sac_phong',
        dynastyEra: '',
        description: '',
        authorOrPreserver: '',
        fileUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
        tags: 'sac_phong, co_truyen',
        images: [
          {
            id: 'img-1',
            url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
            caption: 'Bản chụp sắc phong nguyên bản'
          }
        ],
      });
    }
    setIsDocModalOpen(true);
  };

  // Handle Submit Document
  const handleSubmitDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.title.trim()) return;

    const categoryLabels: Record<string, string> = {
      sac_phong: 'Sắc phong triều đình',
      pha_ky: 'Gia phả cổ chữ Nôm',
      huong_uoc: 'Hương ước & Gia quy',
      van_khan: 'Văn khấn cổ truyền',
      hinh_anh_mo_to: 'Hình ảnh mộ tổ & Di tích',
      khac: 'Tư liệu quý khác',
    };

    const parsedTags = docForm.tags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const validImages = docForm.images.filter(img => img.url.trim().length > 0);
    const primaryFileUrl = validImages.length > 0 ? validImages[0].url : docForm.fileUrl.trim();

    if (editingDoc) {
      const updated: DocumentItem = {
        ...editingDoc,
        title: docForm.title.trim(),
        category: docForm.category,
        categoryLabel: categoryLabels[docForm.category] || 'Tư liệu cổ',
        dynastyEra: docForm.dynastyEra.trim() || undefined,
        description: docForm.description.trim(),
        authorOrPreserver: docForm.authorOrPreserver.trim() || undefined,
        fileUrl: primaryFileUrl,
        tags: parsedTags,
        images: validImages.length > 0 ? validImages : undefined,
      };
      onUpdateDocument(updated);
    } else {
      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        title: docForm.title.trim(),
        category: docForm.category,
        categoryLabel: categoryLabels[docForm.category] || 'Tư liệu cổ',
        dynastyEra: docForm.dynastyEra.trim() || undefined,
        description: docForm.description.trim(),
        authorOrPreserver: docForm.authorOrPreserver.trim() || undefined,
        fileUrl: primaryFileUrl,
        fileType: 'image',
        tags: parsedTags,
        images: validImages.length > 0 ? validImages : undefined,
      };
      onAddDocument(newDoc);
    }
    setIsDocModalOpen(false);
    confetti({ particleCount: 25, spread: 60 });
  };

  // Handle Event Modal
  const handleOpenEventModal = (evt?: EventItem) => {
    if (evt) {
      setEditingEvent(evt);
      setEventForm({
        title: evt.title,
        type: evt.type,
        lunarDay: evt.lunarDay,
        lunarMonth: evt.lunarMonth,
        location: evt.location,
        description: evt.description,
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        title: '',
        type: 'ancestor_worship',
        lunarDay: 1,
        lunarMonth: 1,
        location: clanInfo.ancestralHall,
        description: '',
      });
    }
    setIsEventModalOpen(true);
  };

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim()) return;

    if (editingEvent) {
      const updated: EventItem = {
        ...editingEvent,
        title: eventForm.title.trim(),
        type: eventForm.type,
        lunarDay: Number(eventForm.lunarDay),
        lunarMonth: Number(eventForm.lunarMonth),
        location: eventForm.location.trim(),
        description: eventForm.description.trim(),
      };
      onUpdateEvent(updated);
    } else {
      const newEvt: EventItem = {
        id: `evt-${Date.now()}`,
        title: eventForm.title.trim(),
        type: eventForm.type,
        lunarDay: Number(eventForm.lunarDay),
        lunarMonth: Number(eventForm.lunarMonth),
        location: eventForm.location.trim(),
        description: eventForm.description.trim(),
      };
      onAddEvent(newEvt);
    }
    setIsEventModalOpen(false);
    confetti({ particleCount: 25, spread: 60 });
  };

  return (
    <div className="space-y-6">
      {/* AdminCP Master Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#3c0308] via-[#5c0612] to-[#3c0308] border-2 border-amber-500/50 p-6 shadow-2xl overflow-hidden text-amber-50">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Trung Tâm Quản Trị Phả Hệ & Tàng Thư (AdminCP)
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-amber-200 tracking-wide uppercase">
              Bảng Điều Hành Gia Tộc: {clanInfo.name}
            </h1>
            <p className="text-xs text-amber-300/80 max-w-2xl leading-relaxed">
              Quản trị toàn diện phả hệ {maxGen} đời, cập nhật kho sắc phong và tư liệu Hán Nôm, thiết lập nhà thờ từ đường và đồng bộ dữ liệu dòng họ.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Tải tệp JSON sao lưu toàn bộ gia phả về máy tính"
            >
              <Download className="w-3.5 h-3.5" />
              Sao Lưu JSON (Backup)
            </button>

            <label className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Phục Hồi Dữ Liệu
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            {onResetSampleData && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Bạn có chắc muốn khôi phục dữ liệu phả hệ gốc chuẩn Tộc Văn? Mọi thay đổi chưa sao lưu sẽ được làm mới.')) {
                    onResetSampleData();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-medium flex items-center gap-1 transition-all"
                title="Khôi phục lại dữ liệu mẫu gốc"
              >
                <RefreshCw className="w-3 h-3" />
                Làm Mới Gốc
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-amber-500/30">
          <div className="bg-black/30 p-3 rounded-xl border border-amber-500/20">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Quy Mô Phả Hệ</span>
            <span className="text-xl font-bold font-serif text-amber-100">{maxGen} Thế Hệ</span>
          </div>

          <div className="bg-black/30 p-3 rounded-xl border border-amber-500/20">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Tổng Thành Viên</span>
            <span className="text-xl font-bold font-serif text-amber-100">{totalMembers} vị</span>
          </div>

          <div className="bg-black/30 p-3 rounded-xl border border-amber-500/20">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Còn Sống / Đã Mất</span>
            <span className="text-xl font-bold font-serif text-amber-100">{livingMembers} / {deceasedMembers}</span>
          </div>

          <div className="bg-black/30 p-3 rounded-xl border border-amber-500/20">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Kho Sắc Phong</span>
            <span className="text-xl font-bold font-serif text-amber-100">{documents.length} bản</span>
          </div>

          <div className="bg-black/30 p-3 rounded-xl border border-amber-500/20 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Lễ Giỗ & Sự Kiện</span>
            <span className="text-xl font-bold font-serif text-amber-100">{events.length} kỳ lễ</span>
          </div>
        </div>
      </div>

      {/* Admin Sub-Tabs Navigation */}
      <div className="admincp-tabs flex items-center gap-2 p-1.5 rounded-2xl bg-[#280205] border border-amber-500/30 text-xs overflow-x-auto overscroll-x-contain">
        <button
          type="button"
          onClick={() => setActiveTab('tree')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === 'tree'
              ? 'bg-amber-500 text-amber-950 shadow-md'
              : 'text-amber-200 hover:bg-white/5'
          }`}
        >
          <TreeDeciduous className="w-4 h-4" />
          Cây Gia Phả & Thành Viên ({totalMembers})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === 'users'
              ? 'bg-amber-500 text-amber-950 shadow-md'
              : 'text-amber-200 hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Phân Quyền & Tài Khoản Google ({clanUsers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('archives')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === 'archives'
              ? 'bg-amber-500 text-amber-950 shadow-md'
              : 'text-amber-200 hover:bg-white/5'
          }`}
        >
          <Scroll className="w-4 h-4" />
          Kho Sắc Phong & Tư Liệu ({documents.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === 'settings'
              ? 'bg-amber-500 text-amber-950 shadow-md'
              : 'text-amber-200 hover:bg-white/5'
          }`}
        >
          <Settings className="w-4 h-4" />
          Cài Đặt Dòng Tộc & Từ Đường
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === 'events'
              ? 'bg-amber-500 text-amber-950 shadow-md'
              : 'text-amber-200 hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Ngày Giỗ & Tế Tự ({events.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('burial')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === 'burial'
              ? 'bg-amber-500 text-amber-950 shadow-md'
              : 'text-amber-200 hover:bg-white/5'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Xác Nhận Vị Trí Mộ ({burialSubmissions.filter((x) => x.status === 'pending').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cloud')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === 'cloud'
              ? 'bg-amber-500 text-amber-950 shadow-md'
              : 'text-amber-200 hover:bg-white/5'
          }`}
        >
          <Download className="w-4 h-4" />
          Xuất File & Hướng Dẫn Up GitHub / Supabase 0đ
        </button>
      </div>

      {/* TAB 1: QUẢN LÝ CÂY GIA PHẢ & THÀNH VIÊN */}
      {activeTab === 'tree' && (
        <div className="space-y-4">
          <GenealogyIntegrityPanel members={members} onEdit={onSelectMemberForEdit} />
          {/* PDF Genealogy Import & Download Banner */}
          <div className="bg-gradient-to-r from-amber-900 via-[#4a0812] to-amber-950 rounded-2xl border-2 border-amber-500/60 p-5 text-amber-50 shadow-lg space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold uppercase tracking-wider">
                    ✓ Đã Số Hóa Từ Bản Thảo Gia Phả Tộc Văn (20/7/2023)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold">
                    282 Thành Viên Mới (Đời 7, 8 & 9)
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-bold font-serif text-amber-200">
                  Dữ Liệu Gia Phả Tộc Văn Cập Nhật: Đời 7, Đời 8 & Hậu Duệ Đời 9
                </h3>
                <p className="text-xs text-amber-200/80 max-w-3xl leading-relaxed">
                  Bao gồm đầy đủ các nhánh: <b>Phái II-VTQX</b> (Văn Tấn - Quế Xuân), <b>Phái II-VBĐL</b> (Văn Bá - Đại Lộc), <b>Phái II-VBXT</b> (Văn Bá - Xuyên Tây), <b>Phái III-VPXĐ</b> (Văn Phú - Xuyên Đông) và <b>Phái IV-VPXT</b> (Văn Phú - Xuyên Tây).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleOneClickLoadDoi78}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                  title="Nạp ngay toàn bộ dữ liệu Đời 7, 8 vào cây phả hệ"
                >
                  <Sparkles className="w-4 h-4 text-amber-950" />
                  Nạp Vào Cây Phả Hệ (1-Click)
                </button>

                <button
                  type="button"
                  onClick={handleDownloadDoi78Json}
                  className="px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-amber-200 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="Tải tệp JSON Đời 7 và Đời 8"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  Tải JSON Đời 7 & 8
                </button>

                <button
                  type="button"
                  onClick={handleDownloadFullJson}
                  className="px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-amber-200 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="Tải toàn bộ phả hệ 9 đời dạng JSON"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-300" />
                  Tải JSON Toàn Phả Hệ
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSupabaseSql}
                  className="px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-amber-200 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="Tải mã lệnh SQL để chạy trên Supabase"
                >
                  <Database className="w-3.5 h-3.5 text-amber-300" />
                  Tải SQL Supabase
                </button>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs text-slate-800">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Tìm theo họ tên, tên tự, chức vụ..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full p-2 pl-8 border rounded-xl focus:outline-none focus:border-amber-600 text-xs"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Gen filter */}
              <select
                value={selectedGenFilter}
                onChange={(e) => setSelectedGenFilter(e.target.value)}
                className="p-2 border rounded-xl focus:outline-none focus:border-amber-600 bg-white font-medium"
              >
                <option value="all">Tất cả đời thế hệ</option>
                {Array.from({ length: maxGen }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>
                    Đời thứ {g}
                  </option>
                ))}
              </select>

              {/* Phái filter */}
              <select
                value={selectedPhaiFilter}
                onChange={(e) => setSelectedPhaiFilter(e.target.value)}
                className="p-2 border rounded-xl focus:outline-none focus:border-amber-600 bg-white font-medium"
              >
                <option value="all">Tất cả Phái & Chi</option>
                {phaiList.map((p, idx) => (
                  <option key={idx} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onOpenAddNewMember}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              + Thêm Thành Viên Mới
            </button>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs text-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-amber-50/80 border-b border-amber-200/80 text-amber-950 font-bold uppercase text-[11px]">
                    <th className="p-3.5">Đời</th>
                    <th className="p-3.5">Họ và Tên / Tên Tự / Húy</th>
                    <th className="p-3.5">Phân Cấp Dòng Họ</th>
                    <th className="p-3.5">Thứ Bậc</th>
                    <th className="p-3.5">Năm Sinh / Giỗ</th>
                    <th className="p-3.5">Công Đức / Bằng Khen</th>
                    <th className="p-3.5 text-right">Thao Tác Quản Trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                          Đời {member.generation}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 font-serif uppercase text-sm">
                          {member.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 space-x-2">
                          {member.courtesyName && <span>Tự: {member.courtesyName}</span>}
                          {member.posthumousName && <span>Húy/Thụy: {member.posthumousName}</span>}
                        </div>
                      </td>

                      <td className="p-3.5">
                        {member.generation <= 2 ? (
                          <span className="text-amber-800 font-semibold italic">
                            {member.generation === 1 ? 'Thủy Tổ Khai Sáng' : 'Khải Tổ Tông Thống'}
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-700">{member.phaiName || '—'}</div>
                            {(member.chiName || member.nhanhName) && (
                              <div className="text-[10px] text-slate-500">
                                {member.chiName} {member.nhanhName ? `• ${member.nhanhName}` : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="text-slate-600">
                          {member.orderTitle || (member.gender === 'male' ? 'Nam' : 'Nữ')}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              member.isAlive ? 'bg-emerald-500' : 'bg-amber-600'
                            }`}
                          />
                          <span className="text-[11px]">
                            {member.isAlive
                              ? 'Còn sống'
                              : member.deathDateLunar
                              ? `Giỗ: ${member.deathDateLunar}`
                              : 'Đã tạ thế'}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 max-w-[200px]">
                        {member.achievements && member.achievements.length > 0 ? (
                          <div className="flex items-center gap-1 text-amber-800 font-medium">
                            <Award className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span className="truncate" title={member.achievements.join(' • ')}>
                              {member.achievements[0]}
                              {member.achievements.length > 1 && ` (+${member.achievements.length - 1})`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectMemberForEdit(member)}
                          className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
                          title="Sửa thông tin chi tiết & Công đức"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenAddChild(member)}
                          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
                          title="Thêm con cho vị này"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setMemberToDelete(member)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                          title="Xóa thành viên khỏi gia phả"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: QUẢN LÝ PHÂN QUYỀN & ÁP EMAIL TÀI KHOẢN GOOGLE */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Top Banner Notice */}
          <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-950/80 via-[#3d0309] to-[#250104] p-5 shadow-lg space-y-2 text-amber-50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold font-serif text-amber-200 uppercase tracking-wide flex items-center gap-2">
                    Quản Lý Phân Quyền (RBAC) & Áp Email Google
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-amber-950 font-bold font-mono">
                      {clanUsers.length} Tài Khoản
                    </span>
                  </h2>
                  <p className="text-xs text-amber-300/80">
                    Phân quyền theo vai trò: Hội Đồng Trưởng Tộc (Super Admin), Trưởng Chi, Ban Thư Ký, Thành Viên.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenUserModal()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all text-xs"
              >
                <UserPlus className="w-4 h-4" />
                + Cấp Quyền Tài Khoản Mới
              </button>
            </div>

            <div className="mt-2 pt-3 border-t border-amber-500/20 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-amber-200/80">
              <div className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>
                  Super Admin Tối Cao: <b className="text-amber-200 font-mono">{DEFAULT_SUPER_ADMIN_EMAIL}</b> (Phúc Thịnh)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>
                  Áp Email vào Hồ Sơ Cây Phả Hệ giúp thành viên khi đăng nhập Google tự động định vị đúng vị trí của mình.
                </span>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs text-slate-800">
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="Tìm tài khoản theo email Google, họ tên, vai trò..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full p-2 pl-8 border rounded-xl focus:outline-none focus:border-amber-600 text-xs text-slate-800"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Đang hiển thị {clanUsers.length} tài khoản quản trị & thành viên
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse text-slate-800">
                <thead>
                  <tr className="bg-amber-50/80 border-b border-amber-200/60 font-bold text-slate-700">
                    <th className="p-3.5">Tài Khoản Google & Người Dùng</th>
                    <th className="p-3.5">Vai Trò (Role)</th>
                    <th className="p-3.5">Hồ Sơ Áp Trên Cây Phả Hệ</th>
                    <th className="p-3.5">Chi Phái Phụ Trách</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-right">Thao Tác Quản Trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clanUsers
                    .filter((u) => {
                      if (!userSearch.trim()) return true;
                      const q = userSearch.toLowerCase().trim();
                      const match = `${u.email} ${u.name} ${u.role} ${u.memberName || ''} ${u.branchName || ''}`;
                      return match.toLowerCase().includes(q);
                    })
                    .map((user) => {
                      const isSuperAdminUser = user.email.toLowerCase() === DEFAULT_SUPER_ADMIN_EMAIL.toLowerCase();

                      return (
                        <tr key={user.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover border border-amber-300 flex-shrink-0"
                              />
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {isSuperAdminUser && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-400/50 font-bold flex items-center gap-0.5">
                                      <Crown className="w-2.5 h-2.5 text-amber-600" />
                                      Sáng Lập
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  {user.email}
                                </div>
                                {user.notes && (
                                  <div className="text-[10px] text-slate-400 italic mt-0.5">
                                    {user.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            {user.role === 'super_admin' && (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 font-bold text-[11px] border border-amber-300 flex items-center gap-1 w-max">
                                <Crown className="w-3 h-3 text-amber-600" />
                                Hội Đồng Trưởng Tộc
                              </span>
                            )}
                            {user.role === 'branch_admin' && (
                              <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-950 font-bold text-[11px] border border-blue-300 flex items-center gap-1 w-max">
                                <ShieldCheck className="w-3 h-3 text-blue-600" />
                                Trưởng Chi
                              </span>
                            )}
                            {user.role === 'editor' && (
                              <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-950 font-bold text-[11px] border border-purple-300 flex items-center gap-1 w-max">
                                <Edit3 className="w-3 h-3 text-purple-600" />
                                Ban Thư Ký
                              </span>
                            )}
                            {user.role === 'member' && (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 font-medium text-[11px] border border-emerald-300 flex items-center gap-1 w-max">
                                <Users className="w-3 h-3 text-emerald-600" />
                                Thành Viên
                              </span>
                            )}
                            {user.role === 'visitor' && (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-300 flex items-center gap-1 w-max">
                                <Eye className="w-3 h-3 text-slate-500" />
                                Khách Xem
                              </span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {user.memberId ? (
                              <div className="space-y-0.5">
                                <div className="font-bold text-amber-900 flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                  <span>{user.memberName || 'Đã liên kết'}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  ID: {user.memberId}
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenUserModal(user)}
                                className="text-amber-700 hover:text-amber-900 underline text-[11px] flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                + Áp hồ sơ cây phả hệ
                              </button>
                            )}
                          </td>

                          <td className="p-3.5">
                            {user.branchName ? (
                              <span className="font-semibold text-slate-700">
                                {user.branchName}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Toàn tộc</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                user.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : user.status === 'blocked'
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {user.status === 'active'
                                ? 'Đang hoạt động'
                                : user.status === 'blocked'
                                ? 'Tạm khóa'
                                : 'Chờ duyệt'}
                            </span>
                          </td>

                          <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenUserModal(user)}
                              className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
                              title="Hiệu chỉnh quyền & Hồ sơ liên kết"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {!isSuperAdminUser && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = {
                                    ...user,
                                    status: user.status === 'active' ? ('blocked' as const) : ('active' as const),
                                  };
                                  onUpdateUser(updated);
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  user.status === 'active'
                                    ? 'text-amber-600 hover:bg-amber-100'
                                    : 'text-emerald-600 hover:bg-emerald-100'
                                }`}
                                title={user.status === 'active' ? 'Khóa tài khoản này' : 'Mở khóa tài khoản'}
                              >
                                {user.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </button>
                            )}

                            {!isSuperAdminUser && (
                              <button
                                type="button"
                                onClick={() => setUserToDelete(user)}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                                title="Thu hồi quyền tài khoản"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ KHO TƯ LIỆU & SẮC PHONG */}
      {activeTab === 'archives' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                placeholder="Tìm sắc phong, gia phả Nôm, niên hiệu..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                className="w-full p-2 pl-8 border rounded-xl focus:outline-none focus:border-amber-600 text-xs text-slate-800"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <button
              type="button"
              onClick={() => handleOpenDocModal()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              + Thêm Tư Liệu Mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents
              .filter((d) => {
                if (!docSearch.trim()) return true;
                const match = `${d.title} ${d.description} ${d.dynastyEra || ''}`;
                return match.toLowerCase().includes(docSearch.toLowerCase().trim());
              })
              .map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-40 bg-slate-900 overflow-hidden">
                      <img
                        src={doc.fileUrl}
                        alt={doc.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-85"
                      />
                      <span className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-amber-950 shadow">
                        {doc.categoryLabel}
                      </span>
                      {doc.dynastyEra && (
                        <span className="absolute bottom-2 left-2 text-xs font-serif font-semibold text-amber-200">
                          {doc.dynastyEra}
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-2 text-xs text-slate-800">
                      <h3 className="font-bold text-slate-900 font-serif text-sm line-clamp-2">
                        {doc.title}
                      </h3>
                      <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed">
                        {doc.description}
                      </p>
                      {doc.authorOrPreserver && (
                        <p className="text-[11px] text-slate-500 italic">
                          Lưu truyền: {doc.authorOrPreserver}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                    <span className="text-[10px] text-slate-400 font-mono">ID: {doc.id}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenDocModal(doc)}
                        className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors"
                        title="Sửa tư liệu"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocToDelete(doc)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Xóa tư liệu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: CÀI ĐẶT DÒNG TỘC & NHÀ THỜ */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveClanSettings} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-5 lg:p-6 space-y-5 text-xs text-slate-800 w-full max-w-7xl mx-auto overflow-hidden">
          <div className="admin-settings-subnav sticky top-2 z-20 flex gap-1.5 overflow-x-auto p-1 rounded-xl bg-slate-900/95 border border-slate-700 shadow-lg backdrop-blur-sm">
            <a href="#clan-identity" className="shrink-0 px-3 py-2 rounded-lg bg-white/10 text-white font-bold">Dòng tộc & Từ đường</a>
            <a href="#tree-defaults" className="shrink-0 px-3 py-2 rounded-lg bg-white/10 text-white font-bold">Cây gia phả</a>
            <a href="#card-designer" className="shrink-0 px-3 py-2 rounded-lg bg-white/10 text-white font-bold">Thiết kế thẻ</a>
            <a href="#interface-theme" className="shrink-0 px-3 py-2 rounded-lg bg-white/10 text-white font-bold">Giao diện</a>
          </div>
          <div id="clan-identity" className="border-b pb-3">
            <h2 className="text-base font-bold font-serif text-amber-950 uppercase">
              Thiết Lập Thông Tin Đại Tộc & Từ Đường
            </h2>
            <p className="text-slate-500 text-xs">
              Các thông tin dưới đây sẽ hiển thị trên thanh tiêu đề, chân trang và các văn kiện chính thống của dòng tộc.
            </p>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {saveSuccessMsg}
            </div>
          )}

          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-3 sm:p-4 space-y-4">
            <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0"><Crown className="w-5 h-5 text-amber-700" /></div><div><h3 className="font-black text-sm text-amber-950">Thông tin dòng tộc & Từ đường</h3><p className="text-[10px] text-slate-500 mt-0.5">Thông tin nhận diện chính thức, dùng cho tiêu đề, chân trang, văn bản và các nghi lễ.</p></div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Tên Chính Thức Của Tộc *</label>
              <input
                type="text"
                required
                value={clanForm.name}
                onChange={(e) => setClanForm({ ...clanForm, name: e.target.value })}
                className="w-full p-2.5 border rounded-xl focus:outline-none focus:border-amber-600 font-bold uppercase text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Phụ Đề / Các Nhánh Hợp Tự</label>
              <input
                type="text"
                value={clanForm.branchSubtitle}
                onChange={(e) => setClanForm({ ...clanForm, branchSubtitle: e.target.value })}
                className="w-full p-2.5 border rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Hoành Phi Đại Tự / Khẩu Hiệu Gia Tộc</label>
              <input
                type="text"
                value={clanForm.motto}
                onChange={(e) => setClanForm({ ...clanForm, motto: e.target.value })}
                className="w-full p-2.5 border rounded-xl focus:outline-none focus:border-amber-600 font-serif font-bold text-amber-900 bg-amber-50/50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Ý Nghĩa Hoành Phi / Lời Dặn Tổ Tiên</label>
              <textarea
                rows={2}
                value={clanForm.mottoMeaning}
                onChange={(e) => setClanForm({ ...clanForm, mottoMeaning: e.target.value })}
                className="w-full p-2.5 border rounded-xl focus:outline-none focus:border-amber-600 leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Từ Đường / Nhà Thờ Tộc</label>
              <input
                type="text"
                value={clanForm.ancestralHall}
                onChange={(e) => setClanForm({ ...clanForm, ancestralHall: e.target.value })}
                className="w-full p-2.5 border rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Năm Khai Cơ Lập Nghiệp (Dương lịch)</label>
              <input
                type="number"
                value={clanForm.foundingYear}
                onChange={(e) => setClanForm({ ...clanForm, foundingYear: Number(e.target.value) })}
                className="w-full p-2.5 border rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Địa Chỉ Nhà Thờ & Nghĩa Trang Dòng Họ</label>
              <input
                type="text"
                value={clanForm.address}
                onChange={(e) => setClanForm({ ...clanForm, address: e.target.value })}
                className="w-full p-2.5 border rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>

            </div>

            {/* Cấu Hình 5 Phương Án Hiển Thị Cây Phả Hệ Do Ban Quản Trị Chỉ Định */}
            <div id="tree-defaults" className="sm:col-span-2 pt-4 border-t border-slate-200 mt-2 space-y-4 scroll-mt-20">
              <div>
                <h3 className="text-sm font-bold font-serif text-amber-950 uppercase flex items-center gap-2">
                  <TreeDeciduous className="w-4 h-4 text-amber-600" />
                  Cấu Hình 5 Phương Án Hiển Thị Cây Phả Hệ (Chỉ Định Của Ban Quản Trị)
                </h3>
                <p className="text-slate-500 text-xs">
                  Thiết lập giao diện và giải thuật mặc định khi con cháu hoặc khách truy cập vào trang Cây Gia Phả.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200/80">
                {/* Phương Án 5: Chế độ hiển thị mặc định */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    1. Chế Độ Xem Mặc Định Khi Vào Trang (PA 5)
                  </label>
                  <select
                    value={clanForm.defaultTreeSettings?.viewMode || 'graph_canvas'}
                    onChange={(e) =>
                      setClanForm({
                        ...clanForm,
                        defaultTreeSettings: {
                          ...clanForm.defaultTreeSettings,
                          viewMode: e.target.value as any,
                        },
                      })
                    }
                    className="w-full p-2 border rounded-lg bg-white font-medium"
                  >
                    <option value="graph_canvas">🌲 Cây Đồ Họa 2D (Không gian tương tác trực quan)</option>
                    <option value="book_outline">📖 Sổ Phả Hệ Văn Bản Dọc (Dạng sách truyền thống, cuộn mượt)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Khuyên dùng Sổ Phả Hệ nếu đa số con cháu dùng điện thoại hoặc in ấn thành sách.
                  </p>
                </div>

                {/* Phương Án 3: Thuật toán sắp xếp */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    2. Giải Thuật Sắp Xếp Nhánh Con (PA 3)
                  </label>
                  <select
                    value={clanForm.defaultTreeSettings?.layoutAlgorithm || 'family_cluster'}
                    onChange={(e) =>
                      setClanForm({
                        ...clanForm,
                        defaultTreeSettings: {
                          ...clanForm.defaultTreeSettings,
                          layoutAlgorithm: e.target.value as any,
                        },
                      })
                    }
                    className="w-full p-2 border rounded-lg bg-white font-medium"
                  >
                    <option value="family_cluster">👨‍👩‍👧‍👦 Xếp Cụm Gia Đình (Căn giữa dưới cha, chống chéo line)</option>
                    <option value="flat_generation">↔ Dàn Đều Hàng Ngang (Căn bằng phẳng theo thế hệ)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Cụm gia đình giúp triệt tiêu hoàn toàn tình trạng line kéo chéo xiên xẹo qua nhau.
                  </p>
                </div>

                <div className="sm:col-span-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
                  <div className="font-black text-xs text-emerald-950">Layout Engine V2 — Cách lưu bố cục</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="text-[10px] font-semibold text-slate-700">Chế độ bố trí<select value={clanForm.defaultTreeSettings?.layoutMode || 'hybrid'} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,layoutMode:e.target.value as any}})} className="w-full mt-1 p-2 border rounded-lg bg-white"><option value="auto">Tự động hoàn toàn</option><option value="hybrid">Tự động + cho phép kéo chỉnh</option><option value="manual">Thủ công (ưu tiên vị trí đã lưu)</option></select></label>
                    <label className="text-[10px] font-semibold text-slate-700">Khoảng cách an toàn<input type="number" min={8} max={200} value={clanForm.defaultTreeSettings?.cardHorizontalGap ?? 30} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,cardHorizontalGap:Math.max(8,Math.min(200,Number(e.target.value)))}})} className="w-full mt-1 p-2 border rounded-lg bg-white" /></label>
                    <label className="text-[10px] font-semibold text-slate-700">Ngưỡng tuổi mặc định tạ thế<input type="number" min={50} max={130} value={clanForm.defaultTreeSettings?.deceasedAgeThreshold ?? 100} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,deceasedAgeThreshold:Math.max(50,Math.min(130,Number(e.target.value)||100))}})} className="w-full mt-1 p-2 border rounded-lg bg-white" /><span className="block mt-1 text-[9px] text-slate-500">Khi thêm người mới có ngày sinh đạt ngưỡng này, trạng thái sẽ mặc định “Đã tạ thế”; Admin vẫn có thể đổi lại.</span></label>
                    <div className="text-[10px] text-emerald-900 leading-relaxed pt-1">V18 ưu tiên đúng cấu trúc gia đình: Trưởng (thứ tự 1) → thứ tự 2, 3, 4...; nếu cùng thứ tự hoặc chưa khai báo thì giữ thứ tự nhập dữ liệu. Cùng cha nhưng khác mẹ được tách thành cụm riêng để tránh rối và chồng thẻ.</div>
                  </div>
                </div>

                {/* Phương Án 1: Tự động thu gọn cành sâu */}
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="cfg-autoCollapse"
                    checked={clanForm.defaultTreeSettings?.autoCollapseDeepGens ?? true}
                    onChange={(e) =>
                      setClanForm({
                        ...clanForm,
                        defaultTreeSettings: {
                          ...clanForm.defaultTreeSettings,
                          autoCollapseDeepGens: e.target.checked,
                          enableCollapsible: true,
                        },
                      })
                    }
                    className="mt-1 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <label htmlFor="cfg-autoCollapse" className="font-bold text-slate-800 cursor-pointer">
                      3. Tự Động Thu Gọn Từ Đời Thứ 7 Trở Đi (PA 1)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Khi mở trang, các cụ Đời 7 chỉ hiện nút <b>[+ X con]</b>, người xem bấm vào để mở rộng. Cây không bị phình to gây giật lag.
                    </p>
                  </div>
                </div>

                {/* Phương Án 4: Xếp so le 2 tầng */}
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="cfg-zigzag"
                    checked={clanForm.defaultTreeSettings?.enableZigZagRows ?? true}
                    onChange={(e) =>
                      setClanForm({
                        ...clanForm,
                        defaultTreeSettings: {
                          ...clanForm.defaultTreeSettings,
                          enableZigZagRows: e.target.checked,
                        },
                      })
                    }
                    className="mt-1 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <label htmlFor="cfg-zigzag" className="font-bold text-slate-800 cursor-pointer">
                      4. Xếp So Le 2 Tầng Cho Nhà Đông Con (PA 4)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Gia đình có từ 5 người con trở lên sẽ tự động chia 2 hàng so le, giảm tới 50% độ rộng ngang.
                    </p>
                  </div>
                </div>

                {/* Phương Án Mới: Thẻ thành viên dọc từ đời thứ 6 trở xuống, họ tên sổ dọc */}
                <div className="sm:col-span-2 p-3.5 bg-amber-100/50 rounded-xl border border-amber-300/80 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="cfg-verticalCards"
                      checked={clanForm.defaultTreeSettings?.enableVerticalCards ?? true}
                      onChange={(e) =>
                        setClanForm({
                          ...clanForm,
                          defaultTreeSettings: {
                            ...clanForm.defaultTreeSettings,
                            enableVerticalCards: e.target.checked,
                          },
                        })
                      }
                      className="mt-1 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label htmlFor="cfg-verticalCards" className="font-bold text-amber-950 cursor-pointer">
                          📐 Thẻ Dọc Sổ Tên Từ Đời 6 Trở Xuống (Phương Án Tiết Kiệm Diện Tích Tối Đa)
                        </label>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white font-bold rounded-full">
                          -70% Chiều Rộng
                        </span>
                      </div>
                      <p className="text-xs text-amber-900/80 mt-1">
                        Từ đời thứ 6 trở xuống, con cháu rất đông. Thẻ thành viên sẽ tự động chuyển sang chiều dọc, họ và tên sổ dọc từng từ (ví dụ: <b>VĂN</b> &lt;xuống dòng&gt; <b>TẤN</b> &lt;xuống dòng&gt; <b>NHA</b>). Chuẩn phong cách bài vị truyền thống, vừa trang trọng vừa giúp cây không bị quá dài ngang.
                      </p>

                      <div className="mt-2.5 flex items-center gap-3 flex-wrap text-xs">
                        <span className="font-semibold text-amber-900">Bắt đầu áp dụng từ:</span>
                        <select
                          value={clanForm.defaultTreeSettings?.verticalCardStartGen ?? 6}
                          onChange={(e) =>
                            setClanForm({
                              ...clanForm,
                              defaultTreeSettings: {
                                ...clanForm.defaultTreeSettings,
                                verticalCardStartGen: Number(e.target.value),
                              },
                            })
                          }
                          disabled={!(clanForm.defaultTreeSettings?.enableVerticalCards ?? true)}
                          className="py-1 px-2.5 rounded-lg border border-amber-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                        >
                          <option value={5}>Từ Đời Thứ 5 trở xuống</option>
                          <option value={6}>Từ Đời Thứ 6 trở xuống (Khuyên Dùng)</option>
                          <option value={7}>Từ Đời Thứ 7 trở xuống</option>
                          <option value={8}>Từ Đời Thứ 8 trở xuống</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Admin điều chỉnh khoảng cách giữa 2 thẻ thành viên */}
                  <div className="pt-2.5 border-t border-amber-300/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="font-bold text-xs text-amber-950 block">
                        Khoảng Cách Giữa 2 Thẻ Thành Viên (Pixels)
                      </label>
                      <span className="text-[11px] text-amber-800/80 block">
                        Admin có thể kéo thanh trượt để cây thưa thoáng hoặc gom sít lại theo ý muốn.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={15}
                        max={120}
                        step={5}
                        value={clanForm.defaultTreeSettings?.cardHorizontalGap ?? 35}
                        onChange={(e) =>
                          setClanForm({
                            ...clanForm,
                            defaultTreeSettings: {
                              ...clanForm.defaultTreeSettings,
                              cardHorizontalGap: Number(e.target.value),
                            },
                          })
                        }
                        className="w-28 sm:w-36 accent-amber-600 cursor-pointer"
                      />
                      <input
                        type="number"
                        min={10}
                        max={150}
                        value={clanForm.defaultTreeSettings?.cardHorizontalGap ?? 35}
                        onChange={(e) =>
                          setClanForm({
                            ...clanForm,
                            defaultTreeSettings: {
                              ...clanForm.defaultTreeSettings,
                              cardHorizontalGap: Math.max(10, Math.min(150, Number(e.target.value))),
                            },
                          })
                        }
                        className="w-16 py-1 px-2 text-center text-xs font-bold border border-amber-300 rounded-lg bg-white"
                      />
                      <span className="text-xs font-bold text-amber-900">px</span>

                      <div className="flex items-center gap-1 ml-1">
                        <button
                          type="button"
                          onClick={() =>
                            setClanForm({
                              ...clanForm,
                              defaultTreeSettings: {
                                ...clanForm.defaultTreeSettings,
                                cardHorizontalGap: 25,
                              },
                            })
                          }
                          className="px-2 py-0.5 text-[10px] rounded bg-white hover:bg-amber-200 border border-amber-300 font-medium text-amber-950"
                        >
                          Dày 25
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setClanForm({
                              ...clanForm,
                              defaultTreeSettings: {
                                ...clanForm.defaultTreeSettings,
                                cardHorizontalGap: 35,
                              },
                            })
                          }
                          className="px-2 py-0.5 text-[10px] rounded bg-white hover:bg-amber-200 border border-amber-300 font-medium text-amber-950"
                        >
                          Chuẩn 35
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setClanForm({
                              ...clanForm,
                              defaultTreeSettings: {
                                ...clanForm.defaultTreeSettings,
                                cardHorizontalGap: 60,
                              },
                            })
                          }
                          className="px-2 py-0.5 text-[10px] rounded bg-white hover:bg-amber-200 border border-amber-300 font-medium text-amber-950"
                        >
                          Thoáng 60
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cấu Hình Mặc Định Hiển Thị Thẻ Thành Viên (Hiển Thị Thẻ) */}
                <div className="sm:col-span-2 p-4 bg-amber-50/80 rounded-xl border border-amber-300/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-amber-700" />
                        👁️ Cấu Hình Mặc Định &quot;Hiển Thị Thẻ&quot; (Áp Dụng Toàn Cây Gia Phả)
                      </h4>
                      <p className="text-[11px] text-amber-900/80 mt-0.5">
                        Tùy chỉnh thông tin mặc định hiển thị trên thẻ thành viên cho bà con dòng tộc và khách khi truy cập trang web.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-amber-200/80 cursor-pointer hover:bg-amber-100/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={clanForm.defaultTreeSettings?.showSpouses ?? false}
                        onChange={(e) =>
                          setClanForm({
                            ...clanForm,
                            defaultTreeSettings: {
                              ...clanForm.defaultTreeSettings,
                              showSpouses: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">Hiển thị Phối Ngẫu</span>
                        <span className="text-[10px] text-slate-500 block">Vợ / Chồng bên cạnh</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-amber-200/80 cursor-pointer hover:bg-amber-100/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={clanForm.defaultTreeSettings?.showDates ?? false}
                        onChange={(e) =>
                          setClanForm({
                            ...clanForm,
                            defaultTreeSettings: {
                              ...clanForm.defaultTreeSettings,
                              showDates: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">Năm Sinh, Mất & Giỗ</span>
                        <span className="text-[10px] text-slate-500 block">Niên biểu âm / dương</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-amber-200/80 cursor-pointer hover:bg-amber-100/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={clanForm.defaultTreeSettings?.showAvatars ?? false}
                        onChange={(e) =>
                          setClanForm({
                            ...clanForm,
                            defaultTreeSettings: {
                              ...clanForm.defaultTreeSettings,
                              showAvatars: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">Ảnh Chân Dung</span>
                        <span className="text-[10px] text-slate-500 block">Ảnh đại diện thẻ</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-amber-200/80 cursor-pointer hover:bg-amber-100/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={clanForm.defaultTreeSettings?.showTitles ?? false}
                        onChange={(e) =>
                          setClanForm({
                            ...clanForm,
                            defaultTreeSettings: {
                              ...clanForm.defaultTreeSettings,
                              showTitles: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">Thế Hệ & Thứ Bậc</span>
                        <span className="text-[10px] text-slate-500 block">Trưởng nam, thứ nam...</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-amber-200/80 cursor-pointer hover:bg-amber-100/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={clanForm.defaultTreeSettings?.showHierarchy ?? false}
                        onChange={(e) =>
                          setClanForm({
                            ...clanForm,
                            defaultTreeSettings: {
                              ...clanForm.defaultTreeSettings,
                              showHierarchy: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">Phái • Chi • Nhánh</span>
                        <span className="text-[10px] text-slate-500 block">Tổ chức phân cấp</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-amber-200/80 cursor-pointer hover:bg-amber-100/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={clanForm.defaultTreeSettings?.showBirthPlace ?? false}
                        onChange={(e) =>
                          setClanForm({
                            ...clanForm,
                            defaultTreeSettings: {
                              ...clanForm.defaultTreeSettings,
                              showBirthPlace: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">Quê Quán / Nơi Sinh</span>
                        <span className="text-[10px] text-slate-500 block">Địa chỉ sinh quán</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* CẤU HÌNH MOBILE / REACTFLOW NÂNG CAO */}
                <div className="sm:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-300 space-y-4">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Settings className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">⚙️ Cấu Hình ReactFlow & Mobile</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Các thiết lập này được lưu vào Supabase và áp dụng mặc định cho tất cả điện thoại. Có thể thay đổi mà không cần sửa mã nguồn.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <label className="text-xs font-bold text-slate-800 block mb-1">Chiều cao cây trên Mobile</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min={560} max={1400} step={20}
                          value={clanForm.defaultTreeSettings?.mobileTreeHeight ?? 760}
                          onChange={(e) => setClanForm({ ...clanForm, defaultTreeSettings: { ...clanForm.defaultTreeSettings, mobileTreeHeight: Number(e.target.value) } })}
                          className="flex-1 accent-amber-600" />
                        <input type="number" min={560} max={1600} step={20}
                          value={clanForm.defaultTreeSettings?.mobileTreeHeight ?? 760}
                          onChange={(e) => setClanForm({ ...clanForm, defaultTreeSettings: { ...clanForm.defaultTreeSettings, mobileTreeHeight: Math.max(560, Math.min(1600, Number(e.target.value))) } })}
                          className="w-20 p-1.5 text-center border rounded-lg text-xs font-bold" />
                        <span className="text-[10px]">px</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Khuyên dùng 720–900px.</p>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <label className="text-xs font-bold text-slate-800 block mb-1">Zoom mở cây trên Mobile</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min={0.35} max={1.2} step={0.05}
                          value={clanForm.defaultTreeSettings?.mobileInitialZoom ?? 0.72}
                          onChange={(e) => setClanForm({ ...clanForm, defaultTreeSettings: { ...clanForm.defaultTreeSettings, mobileInitialZoom: Number(e.target.value) } })}
                          className="flex-1 accent-amber-600" />
                        <span className="w-10 text-center text-xs font-bold">{(clanForm.defaultTreeSettings?.mobileInitialZoom ?? 0.72).toFixed(2)}×</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Tăng nếu cây vẫn quá bé.</p>
                    </div>

                    <label className="p-3 rounded-lg bg-white border border-slate-200 flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={clanForm.defaultTreeSettings?.mobileShowMiniMap ?? false}
                        onChange={(e) => setClanForm({ ...clanForm, defaultTreeSettings: { ...clanForm.defaultTreeSettings, mobileShowMiniMap: e.target.checked } })}
                        className="mt-0.5 rounded text-amber-600 focus:ring-amber-500" />
                      <span><b className="text-xs block">Hiện MiniMap trên Mobile</b><small className="text-[10px] text-slate-500">Mặc định tắt để dành diện tích cho cây.</small></span>
                    </label>

                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <label className="text-xs font-bold text-slate-800 block mb-1">Zoom khi mở một nhánh</label>
                      <div className="flex gap-3">
                        <label className="flex-1 text-[10px] text-slate-500">Mobile
                          <input type="number" min={0.5} max={1.5} step={0.05}
                            value={clanForm.defaultTreeSettings?.focusMobileZoom ?? 0.9}
                            onChange={(e) => setClanForm({ ...clanForm, defaultTreeSettings: { ...clanForm.defaultTreeSettings, focusMobileZoom: Math.max(0.5, Math.min(1.5, Number(e.target.value))) } })}
                            className="mt-1 w-full p-1.5 border rounded-lg text-xs font-bold text-slate-800" />
                        </label>
                        <label className="flex-1 text-[10px] text-slate-500">Desktop
                          <input type="number" min={0.5} max={1.5} step={0.05}
                            value={clanForm.defaultTreeSettings?.focusDesktopZoom ?? 1}
                            onChange={(e) => setClanForm({ ...clanForm, defaultTreeSettings: { ...clanForm.defaultTreeSettings, focusDesktopZoom: Math.max(0.5, Math.min(1.5, Number(e.target.value))) } })}
                            className="mt-1 w-full p-1.5 border rounded-lg text-xs font-bold text-slate-800" />
                        </label>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <label className="text-xs font-bold text-slate-800 block mb-1">Dịch tâm khi mở nhánh (Y)</label>
                      <div className="flex gap-3">
                        <label className="flex-1 text-[10px] text-slate-500">Mobile
                          <input type="number" min={-300} max={300} step={10}
                            value={clanForm.defaultTreeSettings?.focusMobileOffsetY ?? 0}
                            onChange={(e) => setClanForm({ ...clanForm, defaultTreeSettings: { ...clanForm.defaultTreeSettings, focusMobileOffsetY: Number(e.target.value) } })}
                            className="mt-1 w-full p-1.5 border rounded-lg text-xs font-bold text-slate-800" />
                        </label>
                        <label className="flex-1 text-[10px] text-slate-500">Desktop
                          <input type="number" min={-300} max={300} step={10}
                            value={clanForm.defaultTreeSettings?.focusDesktopOffsetY ?? 0}
                            onChange={(e) => setClanForm({ ...clanForm, defaultTreeSettings: { ...clanForm.defaultTreeSettings, focusDesktopOffsetY: Number(e.target.value) } })}
                            className="mt-1 w-full p-1.5 border rounded-lg text-xs font-bold text-slate-800" />
                        </label>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <label className="text-xs font-bold text-slate-800 block mb-1">Vị trí nút Zoom trên Mobile</label>
                      <select value={clanForm.defaultTreeSettings?.mobileControlsPosition ?? 'bottom-right'}
                        onChange={(e) => setClanForm({ ...clanForm, defaultTreeSettings: { ...clanForm.defaultTreeSettings, mobileControlsPosition: e.target.value as any } })}
                        className="w-full p-1.5 border rounded-lg text-xs font-semibold text-slate-800 bg-white">
                        <option value="top-left">Trên trái</option>
                        <option value="top-right">Trên phải</option>
                        <option value="bottom-left">Dưới trái</option>
                        <option value="bottom-right">Dưới phải</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Quyền Người Xem Tự Do Chuyển Đổi */}
                <div className="sm:col-span-2 flex items-start gap-2.5 pt-2 border-t border-amber-200/60">
                  <input
                    type="checkbox"
                    id="cfg-allowUserCustom"
                    checked={clanForm.allowUserViewCustomization ?? true}
                    onChange={(e) =>
                      setClanForm({
                        ...clanForm,
                        allowUserViewCustomization: e.target.checked,
                      })
                    }
                    className="mt-1 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <label htmlFor="cfg-allowUserCustom" className="font-bold text-slate-800 cursor-pointer">
                      5. Cho Phép Con Cháu / Khách Tự Do Đổi Phương Án Trên Cây
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Bật: Người xem có thể bấm các nút chuyển đổi trên thanh công cụ Cây Phả Hệ. Tắt: Cố định theo cấu hình Ban Quản Trị chỉ định ở trên.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* BỘ THIẾT KẾ THẺ + THEME */}
            <div id="card-designer" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5 scroll-mt-20">
              <div className="flex items-start justify-between gap-3 border-b pb-3">
                <div>
                  <div className="flex items-center gap-2 text-amber-900"><Settings className="w-5 h-5 text-amber-600" /><h3 className="font-bold text-sm font-serif">Thiết Kế Thẻ & Giao Diện Mặc Định</h3></div>
                  <p className="text-[11px] text-slate-500 mt-1">Thiết lập độc lập cho thẻ ngang và thẻ dọc. Kích thước dùng chung với thuật toán bố trí nên không còn tình trạng thẻ thực tế rộng hơn vùng layout và chồng lên nhau.</p>
                </div>
                <button type="button" onClick={() => setClanForm({ ...clanForm, defaultTreeSettings: { ...clanForm.defaultTreeSettings, horizontalCardWidth: 280, horizontalCardHeight: 230, horizontalCardFontSize: 16, horizontalCardNameAlignment: 'auto', horizontalCardNameColor: '#fef3c7', horizontalCardNameBackgroundColor: '#350207', horizontalCardBackgroundColor: '#5c0612', horizontalCardBorderColor: '#d4a72c', verticalCardWidth: 92, verticalCardHeight: 220, verticalCardFontSize: 13, verticalCardNameAlignment: 'auto', verticalCardNameColor: '#fef3c7', verticalCardNameBackgroundColor: '#350207', verticalCardBackgroundColor: '#5c0612', verticalCardBorderColor: '#d4a72c', cardVerticalGap: 150, cardHorizontalGap: 30, collapseControlOffset: 18, collapseControlSize: 24, collapseControlCollapsedColor: '#f59e0b', collapseControlExpandedColor: '#3b0206', collapseControlTextColor: '#fcd34d', collapseControlBorderColor: '#d4a72c', deceasedAgeThreshold: 100, layoutMode: 'hybrid', treeCanvasAutoTheme: true, horizontalCardNameBackgroundEnabled: false, verticalCardNameBackgroundEnabled: false, treeCanvasBackgroundColor: '#1e0205', treeCanvasGridColor: '#7b1113', treeCanvasGridGap: 24 } })} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-[10px] font-bold"><RotateCcw className="w-3.5 h-3.5" /> Reset thẻ</button>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex items-center justify-between mb-3"><div><div className="font-black text-xs text-amber-950">A. THẺ NGANG</div><div className="text-[10px] text-slate-500">Dùng cho các đời đang hiển thị dạng thẻ ngang.</div></div><button type="button" onClick={() => setClanForm({ ...clanForm, defaultTreeSettings: { ...clanForm.defaultTreeSettings, horizontalCardWidth: 280, horizontalCardHeight: 230, horizontalCardFontSize: 16, horizontalCardNameAlignment: 'auto', horizontalCardNameColor: '#fef3c7', horizontalCardNameBackgroundColor: '#350207', horizontalCardBackgroundColor: '#5c0612', horizontalCardBorderColor: '#d4a72c' } })} className="text-[10px] font-bold text-amber-800 hover:underline">Khôi phục thẻ ngang</button></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([['Rộng (px)','horizontalCardWidth',180,500,260],['Cao (px)','horizontalCardHeight',0,500,0],['Cỡ tên (px)','horizontalCardFontSize',9,30,14]] as const).map(([label,key,min,max,def]) => <label key={key} className="text-[10px] font-semibold text-slate-700">{label}<input type="number" min={min} max={max} value={(clanForm.defaultTreeSettings as any)?.[key] ?? def} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,[key]:Number(e.target.value)}})} className="w-full mt-1 p-2 border rounded-lg bg-white" /></label>)}
                  <label className="text-[10px] font-semibold text-slate-700">Tên căn chỉnh<select value={clanForm.defaultTreeSettings?.horizontalCardNameAlignment ?? 'auto'} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,horizontalCardNameAlignment:e.target.value as any}})} className="w-full mt-1 p-2 border rounded-lg bg-white"><option value="auto">Tự động (khuyến nghị)</option><option value="center">Căn giữa</option><option value="left">Căn trái</option><option value="right">Căn phải</option></select></label>
                  <label className="text-[10px] font-semibold text-slate-700">Font<select value={clanForm.defaultTreeSettings?.fontFamily ?? 'be-vietnam'} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,fontFamily:e.target.value as any}})} className="w-full mt-1 p-2 border rounded-lg bg-white"><option value="be-vietnam">Be Vietnam Pro</option><option value="merriweather">Merriweather</option><option value="sans">Plus Jakarta Sans</option></select></label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <div className="sm:col-span-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2"><input type="checkbox" checked={clanForm.defaultTreeSettings?.horizontalCardNameBackgroundEnabled ?? false} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,horizontalCardNameBackgroundEnabled:e.target.checked}})} /><span className="text-[10px] font-semibold text-slate-700">Hiển thị nền khung tên</span><span className="text-[9px] text-slate-500">Tắt mặc định để tên nổi tự nhiên trên thẻ.</span></div>
                  {([['Màu chữ','horizontalCardNameColor','#fef3c7'],['Nền tên','horizontalCardNameBackgroundColor','#350207'],['Nền thẻ','horizontalCardBackgroundColor','#5c0612'],['Màu viền','horizontalCardBorderColor','#d4a72c']] as const).map(([label,key,def])=><label key={key} className="text-[10px] font-semibold text-slate-700">{label}<input type="color" value={(clanForm.defaultTreeSettings as any)?.[key] || def} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,[key]:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white" /></label>)}
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex items-center justify-between mb-3"><div><div className="font-black text-xs text-blue-950">B. THẺ DỌC</div><div className="text-[10px] text-slate-500">Dùng từ đời được chọn ở “Bật thẻ dọc từ đời…”.</div></div><button type="button" onClick={() => setClanForm({ ...clanForm, defaultTreeSettings: { ...clanForm.defaultTreeSettings, verticalCardWidth: 92, verticalCardHeight: 220, verticalCardFontSize: 13, verticalCardNameAlignment: 'auto', verticalCardNameColor: '#fef3c7', verticalCardNameBackgroundColor: '#350207', verticalCardBackgroundColor: '#5c0612', verticalCardBorderColor: '#d4a72c' } })} className="text-[10px] font-bold text-blue-800 hover:underline">Khôi phục thẻ dọc</button></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([['Rộng (px)','verticalCardWidth',50,220,78],['Cao (px)','verticalCardHeight',80,500,180],['Cỡ tên (px)','verticalCardFontSize',9,26,13]] as const).map(([label,key,min,max,def]) => <label key={key} className="text-[10px] font-semibold text-slate-700">{label}<input type="number" min={min} max={max} value={(clanForm.defaultTreeSettings as any)?.[key] ?? def} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,[key]:Number(e.target.value)}})} className="w-full mt-1 p-2 border rounded-lg bg-white" /></label>)}
                  <label className="text-[10px] font-semibold text-slate-700">Bắt đầu từ đời<input type="number" min={2} max={30} value={clanForm.defaultTreeSettings?.verticalCardStartGen ?? 6} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,verticalCardStartGen:Math.max(2,Number(e.target.value))}})} className="w-full mt-1 p-2 border rounded-lg bg-white" /></label>
                  <label className="text-[10px] font-semibold text-slate-700">Tên căn chỉnh<select value={clanForm.defaultTreeSettings?.verticalCardNameAlignment ?? 'auto'} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,verticalCardNameAlignment:e.target.value as any}})} className="w-full mt-1 p-2 border rounded-lg bg-white"><option value="auto">Tự động (khuyến nghị)</option><option value="center">Căn giữa</option><option value="left">Căn trái</option><option value="right">Căn phải</option></select></label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <div className="sm:col-span-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2"><input type="checkbox" checked={clanForm.defaultTreeSettings?.verticalCardNameBackgroundEnabled ?? false} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,verticalCardNameBackgroundEnabled:e.target.checked}})} /><span className="text-[10px] font-semibold text-slate-700">Hiển thị nền khung tên</span><span className="text-[9px] text-slate-500">Tắt mặc định để tên không bị chia thành các mảng.</span></div>
                  {([['Màu chữ','verticalCardNameColor','#fef3c7'],['Nền tên','verticalCardNameBackgroundColor','#350207'],['Nền thẻ','verticalCardBackgroundColor','#5c0612'],['Màu viền','verticalCardBorderColor','#d4a72c']] as const).map(([label,key,def])=><label key={key} className="text-[10px] font-semibold text-slate-700">{label}<input type="color" value={(clanForm.defaultTreeSettings as any)?.[key] || def} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,[key]:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white" /></label>)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-black text-xs text-slate-800 mb-2">C. BỐ TRÍ CÂY</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="text-[10px] font-semibold">Khoảng cách ngang<input type="number" min={10} max={250} value={clanForm.defaultTreeSettings?.cardHorizontalGap ?? 30} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,cardHorizontalGap:Math.max(10,Number(e.target.value))}})} className="w-full mt-1 p-2 border rounded-lg bg-white" /></label>
                  <label className="text-[10px] font-semibold">Khoảng cách thế hệ<input type="number" min={20} max={500} value={clanForm.defaultTreeSettings?.cardVerticalGap ?? 150} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,cardVerticalGap:Math.max(20,Number(e.target.value))}})} className="w-full mt-1 p-2 border rounded-lg bg-white" /></label>
                  <label className="text-[10px] font-semibold">Khoảng cách cụm<input type="number" min={20} max={500} value={clanForm.defaultTreeSettings?.interFamilyGap ?? 110} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,interFamilyGap:Math.max(20,Number(e.target.value))}})} className="w-full mt-1 p-2 border rounded-lg bg-white" /></label>
                  <label className="text-[10px] font-semibold">Khoảng cách reserve cho nút thu gọn<input type="number" min={0} max={120} value={clanForm.defaultTreeSettings?.collapseControlOffset ?? 18} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,collapseControlOffset:Math.max(0,Math.min(120,Number(e.target.value)))}})} className="w-full mt-1 p-2 border rounded-lg bg-white" /><span className="block mt-1 text-[9px] text-slate-500">Khoảng cách từ đáy thẻ đến nhãn “−/＋ con”.</span></label><label className="text-[10px] font-semibold">Chiều cao nút thu gọn<input type="number" min={20} max={48} value={clanForm.defaultTreeSettings?.collapseControlSize ?? 24} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,collapseControlSize:Math.max(20,Math.min(48,Number(e.target.value)))}})} className="w-full mt-1 p-2 border rounded-lg bg-white" /><span className="block mt-1 text-[9px] text-slate-500">Nút luôn căn chính giữa theo chiều rộng thực của thẻ.</span></label>
                  <div className="sm:col-span-2 lg:col-span-3 mt-2 p-4 rounded-xl border-2 border-amber-300 bg-amber-50/70">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div><div className="font-black text-xs text-amber-950">E. NÚT THU GỌN / MỞ RỘNG CON CHÁU</div><div className="text-[10px] text-slate-600">Đây là cấu hình dùng trực tiếp trên cây thật. Nút luôn được căn tâm theo toàn bộ chiều rộng của thẻ, độc lập với toolbar.</div></div>
                      <button type="button" onClick={()=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,collapseControlOffset:18,collapseControlSize:24,collapseControlCollapsedColor:'#f59e0b',collapseControlExpandedColor:'#3b0206',collapseControlTextColor:'#fcd34d',collapseControlBorderColor:'#d4a72c'}})} className="shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-amber-900">Reset nút</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="text-[10px] font-semibold text-slate-700">Khoảng cách dưới thẻ<input type="number" min={0} max={160} value={clanForm.defaultTreeSettings?.collapseControlOffset ?? 18} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,collapseControlOffset:Math.max(0,Math.min(160,Number(e.target.value)||0))}})} className="w-full mt-1 p-2 border rounded-lg bg-white" /></label>
                      <label className="text-[10px] font-semibold text-slate-700">Chiều cao nút<input type="number" min={20} max={56} value={clanForm.defaultTreeSettings?.collapseControlSize ?? 24} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,collapseControlSize:Math.max(20,Math.min(56,Number(e.target.value)||24))}})} className="w-full mt-1 p-2 border rounded-lg bg-white" /></label>
                      <label className="text-[10px] font-semibold text-slate-700">Màu khi đang mở<input type="color" value={clanForm.defaultTreeSettings?.collapseControlExpandedColor || '#3b0206'} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,collapseControlExpandedColor:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white" /></label>
                      <label className="text-[10px] font-semibold text-slate-700">Màu khi đã thu gọn<input type="color" value={clanForm.defaultTreeSettings?.collapseControlCollapsedColor || '#f59e0b'} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,collapseControlCollapsedColor:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white" /></label>
                      <label className="text-[10px] font-semibold text-slate-700">Màu chữ nút<input type="color" value={clanForm.defaultTreeSettings?.collapseControlTextColor || '#fcd34d'} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,collapseControlTextColor:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white" /></label>
                      <label className="text-[10px] font-semibold text-slate-700">Màu viền nút<input type="color" value={clanForm.defaultTreeSettings?.collapseControlBorderColor || '#d4a72c'} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,collapseControlBorderColor:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white" /></label>
                      <div className="col-span-2 flex items-center justify-center rounded-xl border border-amber-200 bg-[#5c0612] p-3">
                        <div className="text-center">
                          <div className="text-[8px] text-amber-200 mb-2">XEM TRƯỚC — CÙNG LOGIC VỚI THẺ THẬT</div>
                          <div className="relative mx-auto w-44 h-16 rounded-xl border-2 border-amber-500 bg-[#350207] flex items-center justify-center text-amber-100 text-xs font-bold">THẺ THÀNH VIÊN
                            <div className="absolute left-0 right-0 flex justify-center" style={{top:'calc(100% + 10px)'}}>
                              <div className="px-3 rounded-full flex items-center justify-center text-[9px] font-bold" style={{height:Math.max(20,Number(clanForm.defaultTreeSettings?.collapseControlSize||24)),backgroundColor:clanForm.defaultTreeSettings?.collapseControlExpandedColor||'#3b0206',color:clanForm.defaultTreeSettings?.collapseControlTextColor||'#fcd34d',border:`1px solid ${clanForm.defaultTreeSettings?.collapseControlBorderColor||'#d4a72c'}`}}>⌃ − 4 con</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3 mt-2 p-3 rounded-xl border border-indigo-200 bg-indigo-50/60"><div className="font-black text-xs text-indigo-950 mb-2">D. NỀN CÂY REACTFLOW</div><div className="grid grid-cols-1 sm:grid-cols-4 gap-3"><label className="text-[10px] font-semibold text-slate-700 flex items-center gap-2 sm:col-span-1"><input type="checkbox" checked={clanForm.defaultTreeSettings?.treeCanvasAutoTheme ?? true} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,treeCanvasAutoTheme:e.target.checked}})} /> Theo màu theme</label><label className="text-[10px] font-semibold text-slate-700">Màu nền cây<input type="color" value={clanForm.defaultTreeSettings?.treeCanvasBackgroundColor || '#1e0205'} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,treeCanvasAutoTheme:false,treeCanvasBackgroundColor:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white"/></label><label className="text-[10px] font-semibold text-slate-700">Màu chấm / lưới<input type="color" value={clanForm.defaultTreeSettings?.treeCanvasGridColor || '#7b1113'} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,treeCanvasGridColor:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white"/></label><label className="text-[10px] font-semibold text-slate-700">Khoảng chấm<input type="number" min={8} max={80} value={clanForm.defaultTreeSettings?.treeCanvasGridGap ?? 24} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,treeCanvasGridGap:Math.max(8,Math.min(80,Number(e.target.value)))}})} className="w-full p-2 mt-1 border rounded-lg bg-white"/></label></div><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={()=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,treeCanvasAutoTheme:true}})} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-indigo-300 bg-white text-indigo-900">Theo theme mặc định</button><button type="button" onClick={()=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,treeCanvasAutoTheme:false,treeCanvasBackgroundColor:'#1e0205',treeCanvasGridColor:'#7b1113',treeCanvasGridGap:24}})} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-indigo-300 bg-white text-indigo-900">Reset nền cây</button></div><p className="text-[9px] text-indigo-800 mt-2">Mặc định lấy màu theo theme giao diện; bỏ chọn để tùy chỉnh độc lập. Reset luôn có sẵn.</p></div>
                <label className="text-[10px] font-semibold">Theme<select value={clanForm.defaultTreeSettings?.cardThemePreset ?? 'traditional'} onChange={(e)=>{const v=e.target.value as any; const p:any={traditional:{theme:'traditional',horizontalCardBackgroundColor:'#5c0612',horizontalCardBorderColor:'#d4a72c',horizontalCardNameColor:'#fef3c7',horizontalCardNameBackgroundColor:'#350207',verticalCardBackgroundColor:'#5c0612',verticalCardBorderColor:'#d4a72c',verticalCardNameColor:'#fef3c7',verticalCardNameBackgroundColor:'#350207'},modern:{theme:'modern',horizontalCardBackgroundColor:'#ffffff',horizontalCardBorderColor:'#cbd5e1',horizontalCardNameColor:'#0f172a',horizontalCardNameBackgroundColor:'#f8fafc',verticalCardBackgroundColor:'#ffffff',verticalCardBorderColor:'#cbd5e1',verticalCardNameColor:'#0f172a',verticalCardNameBackgroundColor:'#f8fafc'},ivory:{theme:'modern',horizontalCardBackgroundColor:'#fffaf0',horizontalCardBorderColor:'#d6b36a',horizontalCardNameColor:'#4a2c10',horizontalCardNameBackgroundColor:'#fff1c2',verticalCardBackgroundColor:'#fffaf0',verticalCardBorderColor:'#d6b36a',verticalCardNameColor:'#4a2c10',verticalCardNameBackgroundColor:'#fff1c2'},emerald:{theme:'modern',horizontalCardBackgroundColor:'#f0fdf4',horizontalCardBorderColor:'#86efac',horizontalCardNameColor:'#14532d',horizontalCardNameBackgroundColor:'#dcfce7',verticalCardBackgroundColor:'#f0fdf4',verticalCardBorderColor:'#86efac',verticalCardNameColor:'#14532d',verticalCardNameBackgroundColor:'#dcfce7'},midnight:{theme:'modern',horizontalCardBackgroundColor:'#0f172a',horizontalCardBorderColor:'#64748b',horizontalCardNameColor:'#f8fafc',horizontalCardNameBackgroundColor:'#1e293b',verticalCardBackgroundColor:'#0f172a',verticalCardBorderColor:'#64748b',verticalCardNameColor:'#f8fafc',verticalCardNameBackgroundColor:'#1e293b'}}[v];setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,cardThemePreset:v,...p}})}} className="w-full mt-1 p-2 border rounded-lg bg-white"><option value="traditional">Cổ điển Đỏ - Vàng</option><option value="modern">Hiện đại Sáng</option><option value="ivory">Giấy Ngà</option><option value="emerald">Ngọc Lục Bảo</option><option value="midnight">Dạ Lam</option></select></label>
                </div>
              </div>

              <div className="rounded-xl border border-slate-300 bg-white p-4 overflow-x-auto">
                <div className="text-[10px] uppercase tracking-wider font-black text-slate-500 mb-3">Xem trước thực tế — toolbar cố định đáy, tên luôn nằm trong vùng trọng tâm</div>
                <div className="min-w-[560px] flex items-end justify-center gap-16 py-6">
                  <div className="text-center">
                    <div className="text-[9px] font-bold text-slate-500 mb-2">THẺ NGANG</div>
                    <div style={{width:Math.min(Number((clanForm.defaultTreeSettings as any)?.horizontalCardWidth||280),340),height:Math.max(150,Number((clanForm.defaultTreeSettings as any)?.horizontalCardHeight||230)||0),backgroundColor:(clanForm.defaultTreeSettings as any)?.horizontalCardBackgroundColor||'#5c0612',borderColor:(clanForm.defaultTreeSettings as any)?.horizontalCardBorderColor||'#d4a72c'}} className="rounded-xl border-2 p-3 shadow-lg flex flex-col overflow-visible">
                      <div className="text-[9px] text-amber-300 font-bold text-center">ĐỜI THỨ 5</div>
                      <div className="flex-1 min-h-0 flex items-center justify-center">
                        <div style={{fontSize:`${Math.max(13,Number((clanForm.defaultTreeSettings as any)?.horizontalCardFontSize||16))}px`,color:(clanForm.defaultTreeSettings as any)?.horizontalCardNameColor||'#fef3c7',backgroundColor:(clanForm.defaultTreeSettings as any)?.horizontalCardNameBackgroundColor||'transparent',textAlign:'center'}} className="w-[86%] min-h-[64px] flex items-center justify-center font-black px-2 rounded">NGUYỄN VĂN A</div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-amber-500/30"><div className="h-8 rounded-md border border-amber-500/40 flex items-center justify-center text-[9px] text-amber-200">◉ Chi tiết</div><div className="h-8 rounded-md border border-amber-500/40 flex items-center justify-center text-[9px] text-amber-200">⌘ Nhánh</div></div>
                    </div>
                    <div className="mt-2 inline-flex px-3 rounded-full text-[9px] font-bold items-center justify-center" style={{height:Math.max(20,Number(clanForm.defaultTreeSettings?.collapseControlSize||24)),backgroundColor:clanForm.defaultTreeSettings?.collapseControlExpandedColor||'#3b0206',color:clanForm.defaultTreeSettings?.collapseControlTextColor||'#fcd34d',border:`1px solid ${clanForm.defaultTreeSettings?.collapseControlBorderColor||'#d4a72c'}`}}>⌃ − 4 con</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-bold text-slate-500 mb-2">THẺ DỌC</div>
                    <div style={{width:Math.min(Number((clanForm.defaultTreeSettings as any)?.verticalCardWidth||92),160),height:Math.max(140,Number((clanForm.defaultTreeSettings as any)?.verticalCardHeight||220)),backgroundColor:(clanForm.defaultTreeSettings as any)?.verticalCardBackgroundColor||'#5c0612',borderColor:(clanForm.defaultTreeSettings as any)?.verticalCardBorderColor||'#d4a72c'}} className="rounded-xl border-2 p-2 shadow-lg flex flex-col overflow-visible">
                      <div className="text-[8px] text-amber-300 font-bold text-center">Đời 6</div>
                      <div className="flex-1 min-h-0 flex items-center justify-center"><div style={{fontSize:`${Math.max(9,Number((clanForm.defaultTreeSettings as any)?.verticalCardFontSize||13))}px`,color:(clanForm.defaultTreeSettings as any)?.verticalCardNameColor||'#fef3c7',backgroundColor:(clanForm.defaultTreeSettings as any)?.verticalCardNameBackgroundColor||'transparent'}} className="w-[78%] min-h-[72px] flex flex-col items-center justify-center font-black leading-tight">NGUYỄN<br/>VĂN<br/>A</div></div>
                      <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-amber-500/30"><div className="h-7 rounded-md border border-amber-500/40 flex items-center justify-center text-[9px] text-amber-200">◉</div><div className="h-7 rounded-md border border-amber-500/40 flex items-center justify-center text-[9px] text-amber-200">⌘</div></div>
                    </div>
                    <div className="mt-2 inline-flex px-2 rounded-full text-[8px] font-bold items-center justify-center" style={{height:Math.max(20,Number(clanForm.defaultTreeSettings?.collapseControlSize||24)),backgroundColor:clanForm.defaultTreeSettings?.collapseControlExpandedColor||'#3b0206',color:clanForm.defaultTreeSettings?.collapseControlTextColor||'#fcd34d',border:`1px solid ${clanForm.defaultTreeSettings?.collapseControlBorderColor||'#d4a72c'}`}}>⌃ − 4</div>
                  </div>
                </div>
              </div>
            </div>

            {/* THEME TOÀN WEBSITE */}
            <div id="interface-theme" className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 space-y-4 scroll-mt-20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div><div className="font-black text-xs text-violet-950">C. GIAO DIỆN TOÀN WEBSITE</div><div className="text-[10px] text-slate-500">Theme mặc định cho giao diện chung; thẻ ngang và dọc vẫn có thiết lập riêng.</div></div>
                <button type="button" onClick={() => setClanForm({...clanForm, defaultTreeSettings:{...clanForm.defaultTreeSettings, ...DEFAULT_INTERFACE_THEME}})} className="text-[10px] font-bold text-violet-800 hover:underline">Reset giao diện</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <label className="text-[10px] font-semibold text-slate-700">Theme mặc định<select value={clanForm.defaultTreeSettings?.interfaceThemePreset || 'traditional'} onChange={(e)=>{const preset=getInterfaceThemePreset(e.target.value);setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,...preset}})}} className="w-full mt-1 p-2 border rounded-lg bg-white"><option value="traditional">Truyền thống Đỏ - Vàng</option><option value="paper">Giấy gia phả</option><option value="modern">Hiện đại</option><option value="forest">Ngọc Lục Bảo</option><option value="midnight">Dạ Lam</option></select></label>
                <label className="text-[10px] font-semibold text-slate-700">Font giao diện<select value={clanForm.defaultTreeSettings?.interfaceFontFamily || 'be-vietnam'} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,interfaceFontFamily:e.target.value as any}})} className="w-full mt-1 p-2 border rounded-lg bg-white"><option value="be-vietnam">Be Vietnam Pro</option><option value="merriweather">Merriweather</option><option value="sans">Sans</option></select></label>
                <label className="text-[10px] font-semibold text-slate-700">Bo góc<select value={clanForm.defaultTreeSettings?.interfaceRadius || 'soft'} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,interfaceRadius:e.target.value as any}})} className="w-full mt-1 p-2 border rounded-lg bg-white"><option value="compact">Gọn</option><option value="soft">Mềm</option><option value="rounded">Tròn</option></select></label>
                <label className="text-[10px] font-semibold text-slate-700">Màu chủ đạo<input type="color" value={clanForm.defaultTreeSettings?.interfacePrimaryColor || DEFAULT_INTERFACE_THEME.interfacePrimaryColor} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,interfacePrimaryColor:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white"/></label>
                <label className="text-[10px] font-semibold text-slate-700">Màu nhấn<input type="color" value={clanForm.defaultTreeSettings?.interfaceAccentColor || DEFAULT_INTERFACE_THEME.interfaceAccentColor} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,interfaceAccentColor:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white"/></label>
                <label className="text-[10px] font-semibold text-slate-700">Nền trang<input type="color" value={clanForm.defaultTreeSettings?.interfacePageBackground || DEFAULT_INTERFACE_THEME.interfacePageBackground} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,interfacePageBackground:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white"/></label>
                <label className="text-[10px] font-semibold text-slate-700">Nền bề mặt<input type="color" value={clanForm.defaultTreeSettings?.interfaceSurfaceColor || DEFAULT_INTERFACE_THEME.interfaceSurfaceColor} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,interfaceSurfaceColor:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white"/></label>
                <label className="text-[10px] font-semibold text-slate-700">Màu chữ<input type="color" value={clanForm.defaultTreeSettings?.interfaceTextColor || DEFAULT_INTERFACE_THEME.interfaceTextColor} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,interfaceTextColor:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white"/></label>
                <label className="text-[10px] font-semibold text-slate-700">Màu Header<input type="color" value={clanForm.defaultTreeSettings?.interfaceHeaderColor || DEFAULT_INTERFACE_THEME.interfaceHeaderColor} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,interfaceHeaderColor:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white"/></label>
                <label className="text-[10px] font-semibold text-slate-700">Màu menu<input type="color" value={clanForm.defaultTreeSettings?.interfaceNavColor || DEFAULT_INTERFACE_THEME.interfaceNavColor} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,interfaceNavColor:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white"/></label>
                <label className="text-[10px] font-semibold text-slate-700">Màu nút<input type="color" value={clanForm.defaultTreeSettings?.interfaceButtonColor || DEFAULT_INTERFACE_THEME.interfaceButtonColor} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,interfaceButtonColor:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white"/></label>
                <label className="text-[10px] font-semibold text-slate-700">Chữ trên nút<input type="color" value={clanForm.defaultTreeSettings?.interfaceButtonTextColor || DEFAULT_INTERFACE_THEME.interfaceButtonTextColor} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,interfaceButtonTextColor:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white"/></label>
                <label className="text-[10px] font-semibold text-slate-700">Chữ phụ<input type="color" value={clanForm.defaultTreeSettings?.interfaceMutedTextColor || DEFAULT_INTERFACE_THEME.interfaceMutedTextColor} onChange={(e)=>setClanForm({...clanForm,defaultTreeSettings:{...clanForm.defaultTreeSettings,interfaceMutedTextColor:e.target.value}})} className="w-full h-9 mt-1 rounded-lg border p-1 bg-white"/></label>
              </div>
              <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
                <div className="px-4 py-3 text-white" style={{backgroundColor:clanForm.defaultTreeSettings?.interfaceHeaderColor || DEFAULT_INTERFACE_THEME.interfaceHeaderColor}}>
                  <div className="font-black text-sm">Xem trước giao diện</div><div className="text-[10px] opacity-80">Header • menu • nút • bề mặt</div>
                </div>
                <div className="px-3 py-2 flex gap-2 text-[10px] font-bold" style={{backgroundColor:clanForm.defaultTreeSettings?.interfaceNavColor || DEFAULT_INTERFACE_THEME.interfaceNavColor, color:clanForm.defaultTreeSettings?.interfaceMutedTextColor || DEFAULT_INTERFACE_THEME.interfaceMutedTextColor}}>
                  <span className="px-2 py-1 rounded-lg" style={{backgroundColor:clanForm.defaultTreeSettings?.interfaceButtonColor || DEFAULT_INTERFACE_THEME.interfaceButtonColor, color:clanForm.defaultTreeSettings?.interfaceButtonTextColor || DEFAULT_INTERFACE_THEME.interfaceButtonTextColor}}>Cây gia phả</span><span className="px-2 py-1">Tra cứu</span><span className="px-2 py-1">Xưng hô</span>
                </div>
                <div className="p-4" style={{backgroundColor:clanForm.defaultTreeSettings?.interfacePageBackground || DEFAULT_INTERFACE_THEME.interfacePageBackground, color:clanForm.defaultTreeSettings?.interfaceTextColor || DEFAULT_INTERFACE_THEME.interfaceTextColor}}>
                  <div className="rounded-xl p-3" style={{backgroundColor:clanForm.defaultTreeSettings?.interfaceSurfaceColor || DEFAULT_INTERFACE_THEME.interfaceSurfaceColor}}>
                    <div className="font-black text-xs">Bảng xem thử</div><div className="text-[10px] opacity-70 mt-1">Kiểm tra tương phản và nhận diện màu trước khi lưu.</div>
                    <button type="button" className="mt-3 px-3 py-2 rounded-lg text-[10px] font-bold" style={{backgroundColor:clanForm.defaultTreeSettings?.interfaceButtonColor || DEFAULT_INTERFACE_THEME.interfaceButtonColor, color:clanForm.defaultTreeSettings?.interfaceButtonTextColor || DEFAULT_INTERFACE_THEME.interfaceButtonTextColor}}>Nút mẫu</button>
                  </div>
                </div>
              </div>
            </div>

            {/* THÔNG TIN LIÊN HỆ TIẾP NHẬN BỔ SUNG & CẬP NHẬT GIA PHẢ */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-amber-900 border-b pb-3">
                <Phone className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm font-serif">Thông Tin Liên Hệ Bổ Sung & Sửa Đổi Gia Phả</h3>
              </div>
              <p className="text-xs text-slate-500">
                Thông tin này sẽ hiển thị ở cuối bảng xem chi tiết thành viên để con cháu tiện liên hệ với Ban Quản Trị khi phát hiện thông tin cần đính chính hoặc bổ sung con cháu mới sinh.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nội dung thông báo hướng dẫn liên hệ
                  </label>
                  <textarea
                    rows={2}
                    value={clanForm.contactNotice || ''}
                    onChange={(e) => setClanForm({ ...clanForm, contactNotice: e.target.value })}
                    placeholder="Gia phả hiện đang được Ban Quản Trị rà soát và cập nhật liên tục. Nếu có sai sót về niên biểu, danh xưng hoặc cần bổ sung con cháu, phối ngẫu, xin vui lòng liên hệ..."
                    className="w-full p-2.5 border rounded-xl focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại / Zalo Ban Quản Trị</label>
                  <input
                    type="text"
                    value={clanForm.contactPhone || ''}
                    onChange={(e) => setClanForm({ ...clanForm, contactPhone: e.target.value })}
                    placeholder="0905.123.456"
                    className="w-full p-2.5 border rounded-xl focus:border-amber-600 focus:outline-none font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email tiếp nhận thông tin</label>
                  <input
                    type="email"
                    value={clanForm.contactEmail || ''}
                    onChange={(e) => setClanForm({ ...clanForm, contactEmail: e.target.value })}
                    placeholder="bqt.giaphatocvan@gmail.com"
                    className="w-full p-2.5 border rounded-xl focus:border-amber-600 focus:outline-none text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Lưu Thiết Lập Dòng Tộc
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: QUẢN LÝ NGÀY GIỖ & SỰ KIỆN */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
            <div>
              <h2 className="font-bold text-slate-900 text-sm font-serif">Lịch Tế Tự & Kỵ Nhật Hằng Năm</h2>
              <p className="text-slate-500 text-xs">Danh mục các ngày giỗ tổ, lễ thanh minh và ngày tế thu/xuân của dòng họ.</p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenEventModal()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              + Thêm Ngày Giỗ / Lễ Tộc
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start justify-between gap-3 text-xs text-slate-800"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                      Ngày {evt.lunarDay}/{evt.lunarMonth} Âm lịch
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 capitalize">{evt.type.replace(/_/g, ' ')}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 font-serif text-sm">{evt.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-xs">{evt.description}</p>
                  <p className="text-slate-500 text-[11px] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    {evt.location}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEventModal(evt)}
                    className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50"
                    title="Sửa sự kiện"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventToDelete(evt)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                    title="Xóa sự kiện"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: DUYỆT VỊ TRÍ MỘ PHẦN */}
      {activeTab === 'burial' && (
        <div className="space-y-4 text-xs text-slate-800">
          <div className="bg-gradient-to-r from-amber-950 via-[#4a0812] to-[#250104] rounded-2xl border-2 border-amber-500/50 p-5 text-amber-50 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold font-serif text-amber-200">Xác Nhận Vị Trí Mộ Phần</h2>
                <p className="text-xs text-amber-300/80 mt-1 max-w-2xl">Thành viên có thể gửi tọa độ thực tế từ Google Maps. Admin kiểm tra trên bản đồ rồi mới ghi tọa độ chính thức vào hồ sơ tổ tiên.</p>
              </div>
              <button type="button" onClick={loadBurialSubmissions} className="px-3 py-2 rounded-xl bg-white/10 border border-amber-400/30 font-bold flex items-center gap-1.5"><RefreshCw className={`w-4 h-4 ${burialLoading ? 'animate-spin' : ''}`} /> Làm mới</button>
            </div>
          </div>
          {burialSubmissions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">Chưa có đề xuất vị trí mộ nào.</div>
          ) : burialSubmissions.map((submission) => (
            <div key={submission.id} className={`bg-white rounded-2xl border p-4 shadow-sm ${submission.status === 'pending' ? 'border-amber-300' : 'border-slate-200'}`}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold font-serif text-sm text-slate-900">{submission.memberName || submission.memberId}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${submission.status === 'pending' ? 'bg-amber-100 text-amber-800' : submission.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{submission.status === 'pending' ? 'Chờ duyệt' : submission.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}</span>
                  </div>
                  <p className="text-slate-600 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-amber-600" /> {submission.latitude.toFixed(7)}, {submission.longitude.toFixed(7)}</p>
                  {submission.note && <p className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 leading-relaxed">Ghi chú: {submission.note}</p>}
                  <p className="text-[11px] text-slate-500">Người gửi: {submission.submittedByName || 'Không cung cấp'} {submission.submittedByContact ? `• ${submission.submittedByContact}` : ''}</p>
                  {submission.adminNote && <p className="text-[11px] text-slate-500">Ghi chú quản trị: {submission.adminNote}</p>}
                </div>
                <div className="w-full lg:w-72 space-y-2 shrink-0">
                  <a href={submission.mapsUrl} target="_blank" rel="noopener noreferrer" className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 font-bold flex items-center justify-center gap-1.5"><ExternalLink className="w-4 h-4" /> Mở Google Maps kiểm tra</a>
                  {submission.status === 'pending' && (<>
                    <textarea value={burialReviewNote[submission.id] || ''} onChange={(e) => setBurialReviewNote((prev) => ({ ...prev, [submission.id]: e.target.value }))} rows={2} placeholder="Ghi chú duyệt/từ chối (không bắt buộc)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs resize-none" />
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => handleBurialReview(submission, false)} className="px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 font-bold">Từ chối</button>
                      <button type="button" onClick={() => handleBurialReview(submission, true)} className="px-3 py-2 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" /> Xác nhận</button>
                    </div>
                  </>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: XUẤT FILE & HƯỚNG DẪN TRIỂN KHAI GITHUB / SUPABASE 0Đ */}
      {activeTab === 'cloud' && (
        <div className="space-y-6 text-xs text-slate-800">
          {/* Top Hero Banner */}
          <div className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/90 via-[#3d0309] to-[#250104] p-6 shadow-xl text-amber-50 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold uppercase tracking-wider">
                    Chi Phí Vận Hành: 0 VNĐ / Tháng
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold uppercase tracking-wider">
                    Super Admin: {DEFAULT_SUPER_ADMIN_EMAIL}
                  </span>
                </div>
                <h2 className="text-lg md:text-xl font-bold font-serif text-amber-200 uppercase tracking-wide">
                  Trung Tâm Xuất File & Triển Khai GitHub + Supabase
                </h2>
                <p className="text-xs text-amber-300/80 max-w-2xl leading-relaxed">
                  Toàn bộ mã nguồn, cấu trúc cơ sở dữ liệu PostgreSQL và quyền quản trị đã được cấu hình tối ưu. Dưới đây là các tệp tin xuất ra và hướng dẫn từng bước để đưa hệ thống lên Internet vĩnh viễn.
                </p>
              </div>

              {/* Main Action Download Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadDoi78Json}
                  className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold rounded-xl shadow-lg flex items-center gap-2 text-xs transition-all hover:scale-[1.02]"
                  title="Tải tệp tin JSON Đời 7 & 8 trích xuất từ PDF Gia Phả"
                >
                  <Sparkles className="w-4 h-4 text-amber-950" />
                  Tải JSON Đời 7 & 8 (.json)
                </button>

                <button
                  type="button"
                  onClick={handleDownloadFullJson}
                  className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition-all"
                  title="Tải toàn bộ phả hệ 9 đời dạng JSON (332 thành viên)"
                >
                  <FileText className="w-4 h-4 text-amber-300" />
                  Tải JSON 9 Đời (.json)
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSupabaseSql}
                  className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-amber-100 border border-amber-400/40 font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition-all"
                  title="Tải toàn bộ dữ liệu 9 đời chuyển thành lệnh SQL Supabase"
                >
                  <Database className="w-4 h-4 text-emerald-400" />
                  Tải SQL Đầy Đủ (.sql)
                </button>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3.5 py-2.5 bg-black/40 hover:bg-black/60 text-amber-200 border border-amber-500/40 font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition-all"
                  title="Sao chép toàn bộ lệnh SQL để dán trực tiếp vào Supabase SQL Editor"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Đã Sao Chép SQL!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-400" />
                      Sao Chép Schema SQL
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Fix Box for burial_coordinates column error */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-amber-950 flex items-center justify-center font-bold shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-950" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-950 text-sm font-serif">
                    Khắc Phục Nhanh: Lỗi Thiếu Cột burial_coordinates Trên Supabase
                  </h3>
                  <p className="text-[11px] text-amber-800">
                    Xử lý triệt để thông báo: <i>&ldquo;Could not find the 'burial_coordinates' column of 'members' in the schema cache&rdquo;</i>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyFixSql}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all active:scale-95 whitespace-nowrap"
                title="Sao chép 3 dòng SQL sửa lỗi"
              >
                {copiedFixSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFixSql ? 'Đã Sao Chép SQL!' : 'Sao Chép Lệnh Sửa (1-Click)'}</span>
              </button>
            </div>

            <p className="text-xs text-amber-900 leading-relaxed">
              <b>Nguyên nhân:</b> Bảng <code>members</code> đã tạo trước đó trên Supabase chưa có cột <code>burial_coordinates</code> (lưu tọa độ GPS Google Maps của mộ phần).<br />
              <b>Cách khắc phục (chỉ 10 giây):</b> Vào Supabase &rarr; Chọn <b>SQL Editor</b> &rarr; Bấm <b>"New Query"</b> &rarr; Dán đoạn mã bên dưới và nhấn <b>RUN</b>:
            </p>

            <pre className="p-3 bg-slate-950 text-emerald-300 font-mono text-[11px] rounded-xl overflow-x-auto border border-amber-400/40 leading-relaxed">
              {SUPABASE_FIX_BURIAL_COORDINATES_SQL}
            </pre>
          </div>

          {/* 4-Step Interactive Deployment Guide */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: GitHub */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-serif flex items-center gap-1.5">
                    Xuất Mã Nguồn & Đưa Lên GitHub (0đ)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lưu trữ toàn bộ mã nguồn website trên nền tảng GitHub an toàn
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <p>
                  <b>Cách 1 (Nhanh nhất từ AI Studio):</b> Nhấp vào biểu tượng <b>Settings / Export</b> ở góc trên bên phải của giao diện AI Studio, chọn <b>"Export to GitHub"</b> (hoặc <b>"Download ZIP"</b> rồi giải nén).
                </p>
                <p>
                  <b>Cách 2 (Nếu dùng Git trên máy tính):</b> Khởi tạo repository và đẩy code lên:
                </p>
                <pre className="bg-slate-900 text-amber-200 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto">
{`git init
git add .
git commit -m "Khoi tao he thong Gia Pha Toc"
git branch -M main
git remote add origin https://github.com/<tai-khoan>/gia-pha-toc.git
git push -u origin main`}
                </pre>
              </div>
            </div>

            {/* Step 2: Supabase */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-serif flex items-center gap-1.5">
                    Tạo Database Supabase & Chạy File SQL (0đ)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    500MB PostgreSQL + 1GB Storage hoàn toàn miễn phí mãi mãi
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>
                    Truy cập <b>https://supabase.com</b> và bấm <b>"Start your project"</b> (Đăng nhập miễn phí).
                  </li>
                  <li>
                    Nhấn <b>"New Project"</b>, đặt tên dự án (VD: <code>gia-pha-toc-van</code>), chọn khu vực <b>Singapore</b> hoặc <b>Tokyo</b> (tốc độ nhanh nhất từ VN).
                  </li>
                  <li>
                    Nhấp vào biểu tượng <b>"SQL Editor"</b> (menu bên trái) -&gt; Bấm <b>"New Query"</b>.
                  </li>
                  <li>
                    Nhấn nút <b>"3. Sao Chép Toàn Bộ SQL"</b> ở trên và <b>dán (Ctrl+V)</b> vào ô soạn thảo, sau đó nhấn nút <b>"RUN"</b>.
                  </li>
                </ol>
                <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 font-medium">
                  ✓ Toàn bộ bảng, bảo mật RLS và tài khoản <b>13.phucthinh@gmail.com</b> sẽ được kích hoạt Super Admin tự động!
                </div>
              </div>
            </div>

            {/* Step 3: Google OAuth */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-serif flex items-center gap-1.5">
                    Cấu Hình Đăng Nhập Google (OAuth)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cho phép con cháu 1-click đăng nhập bằng tài khoản Google
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>
                    Trong Supabase: Vào <b>Authentication</b> -&gt; <b>Providers</b> -&gt; Chọn <b>Google</b> -&gt; Bật sang <b>ON</b>.
                  </li>
                  <li>
                    Sao chép đường dẫn <b>Callback URL (for OAuth)</b> hiển thị trên màn hình Supabase.
                  </li>
                  <li>
                    Vào <b>https://console.cloud.google.com</b> (miễn phí): Tạo Project mới -&gt; Tạo <b>OAuth Client ID</b> (Web application) -&gt; Dán Callback URL vào ô <i>Authorized redirect URIs</i>.
                  </li>
                  <li>
                    Copy <b>Client ID</b> và <b>Client Secret</b> từ Google dán vào Supabase rồi nhấn <b>Save</b>.
                  </li>
                </ol>
              </div>
            </div>

            {/* Step 4: Vercel Deploy */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-serif flex items-center gap-1.5">
                    Deploy Lên Vercel / GitHub Pages (0đ)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Website hoạt động 24/7 trực tuyến với tên miền riêng hoặc .vercel.app
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>
                    Truy cập <b>https://vercel.com</b> -&gt; Đăng nhập bằng tài khoản GitHub của bạn.
                  </li>
                  <li>
                    Nhấn <b>"Add New..."</b> -&gt; <b>"Project"</b> -&gt; Chọn repo gia phả vừa đẩy lên ở Bước 1.
                  </li>
                  <li>
                    Tại mục <b>Environment Variables</b>, thêm 2 biến lấy từ Supabase (Settings -&gt; API):
                    <div className="mt-1 font-mono text-[10px] bg-slate-100 p-1.5 rounded border">
                      VITE_SUPABASE_URL = &lt;Project URL của bạn&gt;<br />
                      VITE_SUPABASE_ANON_KEY = &lt;anon public key của bạn&gt;
                    </div>
                  </li>
                  <li>
                    Bấm <b>Deploy</b>. Sau 60 giây trang web gia phả sẽ chính thức hoạt động toàn cầu!
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* SQL Preview Box */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-0">
            <div className="bg-slate-900 px-5 py-3 text-amber-100 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                <span className="font-bold font-mono text-xs text-amber-200">
                  supabase_schema.sql (PostgreSQL 15+ & RLS Security)
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'Đã Sao Chép!' : 'Sao Chép SQL'}
              </button>
            </div>

            <pre className="p-4 bg-slate-950 text-emerald-300 font-mono text-[11px] max-h-72 overflow-y-auto leading-relaxed scrollbar-thin">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Member */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-red-200 text-xs text-slate-800">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              Xác Nhận Xóa Thành Viên Khỏi Phả Hệ
            </div>
            <p className="text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa thành viên <b className="text-slate-900 uppercase">{memberToDelete.fullName}</b> (Đời {memberToDelete.generation}) khỏi cây gia phả?
            </p>
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Hệ thống sẽ tự động gỡ liên kết cha/mẹ và phối ngẫu liên quan để bảo toàn tính toàn vẹn của cây phả hệ.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteMember(memberToDelete.id);
                  setMemberToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Document */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border-2 border-amber-500/40 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-[#400207] to-[#5c0612] px-6 py-4 text-amber-100 flex items-center justify-between">
              <h3 className="text-base font-bold font-serif text-amber-200">
                {editingDoc ? 'Hiệu Chỉnh Tư Liệu Sắc Phong' : 'Thêm Tư Liệu Sắc Phong Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                className="p-1 text-amber-200 hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDoc} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-800">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu đề tư liệu *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Sắc phong Triều Nguyễn - Niên hiệu Tự Đức cửu niên..."
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:outline-none focus:border-amber-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phân loại *</label>
                  <select
                    value={docForm.category}
                    onChange={(e) => setDocForm({ ...docForm, category: e.target.value as any })}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:border-amber-600"
                  >
                    <option value="sac_phong">Sắc phong triều đình</option>
                    <option value="pha_ky">Gia phả cổ chữ Nôm</option>
                    <option value="huong_uoc">Hương ước & Gia quy</option>
                    <option value="van_khan">Văn khấn cổ truyền</option>
                    <option value="hinh_anh_mo_to">Hình ảnh mộ tổ & Di tích</option>
                    <option value="khac">Tư liệu quý khác</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Triều đại / Thời kỳ</label>
                  <input
                    type="text"
                    placeholder="VD: Triều Nguyễn (Tự Đức, 1856)..."
                    value={docForm.dynastyEra}
                    onChange={(e) => setDocForm({ ...docForm, dynastyEra: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Bộ sưu tập hình ảnh & chú thích báo chí */}
              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Bộ Sưu Tập Hình Ảnh & Chú Thích Báo Chí (Nhiều Ảnh)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDocForm({
                        ...docForm,
                        images: [
                          ...docForm.images,
                          {
                            id: `img-${Date.now()}-${docForm.images.length + 1}`,
                            url: '',
                            caption: `Hình ${docForm.images.length + 1}: Chú thích chi tiết bức ảnh tư liệu cổ...`,
                          },
                        ],
                      });
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Thêm Ảnh & Chú Thích Mới
                  </button>
                </div>

                <p className="text-[11px] text-amber-900/80 leading-relaxed">
                  Bạn có thể đính kèm nhiều hình ảnh cho một sắc phong hoặc bản phả ký. Mỗi bức hình có một dòng <b>chú thích báo chí riêng biệt bên dưới hình</b> để người đọc dễ đối chiếu chi tiết.
                </p>

                <div className="space-y-3">
                  {docForm.images.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                          📷 Bức Ảnh #{idx + 1}
                        </span>
                        {docForm.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextImgs = docForm.images.filter((_, i) => i !== idx);
                              setDocForm({ ...docForm, images: nextImgs });
                            }}
                            className="text-red-500 hover:text-red-700 p-1 text-xs font-semibold flex items-center gap-0.5"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="w-3 h-3" />
                            Xóa
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                        {/* URL Input */}
                        <div className="md:col-span-7 space-y-1">
                          <label className="block text-[10px] font-semibold text-slate-600">
                            Đường dẫn URL ảnh (Supabase Storage / Unsplash / Cloudinary)
                          </label>
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/... hoặc Supabase public URL"
                            value={img.url}
                            onChange={(e) => {
                              const newImgs = [...docForm.images];
                              newImgs[idx] = { ...newImgs[idx], url: e.target.value };
                              setDocForm({
                                ...docForm,
                                images: newImgs,
                                fileUrl: idx === 0 ? e.target.value : docForm.fileUrl,
                              });
                            }}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:border-amber-600 font-mono text-[11px]"
                          />
                        </div>

                        {/* Thumbnail preview */}
                        <div className="md:col-span-5 flex items-center gap-2">
                          <div className="w-16 h-12 rounded-lg bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-300">
                            {img.url ? (
                              <img
                                src={img.url}
                                alt={`Preview ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                                Chưa có ảnh
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 italic">
                            {img.url ? 'Ảnh hiển thị tốt' : 'Nhập URL để xem trước'}
                          </span>
                        </div>
                      </div>

                      {/* Newspaper Caption Input */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                          Chú thích báo chí dưới hình (Hiển thị kiểu phóng sự):
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Hình 1: Toàn văn sắc phong Cảnh Hưng năm thứ 44 đóng dấu ngự bảo..."
                          value={img.caption || ''}
                          onChange={(e) => {
                            const newImgs = [...docForm.images];
                            newImgs[idx] = { ...newImgs[idx], caption: e.target.value };
                            setDocForm({ ...docForm, images: newImgs });
                          }}
                          className="w-full p-2 border border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 bg-amber-50/30 text-xs font-serif italic text-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả nội dung / Phiên âm & Dịch nghĩa</label>
                <textarea
                  rows={3}
                  placeholder="Nội dung sắc phong, lệnh ban của vua, chỉ dụ khen thưởng..."
                  value={docForm.description}
                  onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:outline-none focus:border-amber-600 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Người bảo quản / Lưu truyền</label>
                  <input
                    type="text"
                    placeholder="VD: Chi Trưởng Văn Bá - Xuyên Tây..."
                    value={docForm.authorOrPreserver}
                    onChange={(e) => setDocForm({ ...docForm, authorOrPreserver: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thẻ tags (phân cách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    placeholder="sac_phong, trieu_nguyen, tu_duc"
                    value={docForm.tags}
                    onChange={(e) => setDocForm({ ...docForm, tags: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-md"
                >
                  {editingDoc ? 'Cập Nhật Tư Liệu' : 'Lưu Vào Tàng Thư'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Document */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-red-200 text-xs text-slate-800">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              Xác Nhận Xóa Tư Liệu
            </div>
            <p className="text-slate-600 leading-relaxed">
              Bạn có chắc muốn xóa tư liệu <b className="text-slate-900">{docToDelete.title}</b> khỏi Kho Tàng Thư?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteDocument(docToDelete.id);
                  setDocToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
              >
                Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Event */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border-2 border-amber-500/40 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#400207] to-[#5c0612] px-6 py-4 text-amber-100 flex items-center justify-between">
              <h3 className="text-base font-bold font-serif text-amber-200">
                {editingEvent ? 'Hiệu Chỉnh Lễ Giỗ / Sự Kiện' : 'Thêm Lễ Giỗ / Sự Kiện Tộc'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="p-1 text-amber-200 hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} className="p-6 space-y-4 text-xs text-slate-800">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên lễ giỗ / sự kiện *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Lễ Chạp Tộc Đầu Năm, Giỗ Tiên Tổ..."
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:outline-none focus:border-amber-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày Âm lịch *</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={eventForm.lunarDay}
                    onChange={(e) => setEventForm({ ...eventForm, lunarDay: Number(e.target.value) })}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tháng Âm lịch *</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={eventForm.lunarMonth}
                    onChange={(e) => setEventForm({ ...eventForm, lunarMonth: Number(e.target.value) })}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa điểm tổ chức</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả nghi thức tế lễ</label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:outline-none focus:border-amber-600 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-md"
                >
                  {editingEvent ? 'Cập Nhật Sự Kiện' : 'Lưu Vào Lịch Tộc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Event */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-red-200 text-xs text-slate-800">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              Xác Nhận Xóa Sự Kiện / Lễ Giỗ
            </div>
            <p className="text-slate-600 leading-relaxed">
              Bạn có chắc muốn xóa sự kiện <b className="text-slate-900">{eventToDelete.title}</b>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteEvent(eventToDelete.id);
                  setEventToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit User & Link Member Profile */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border-2 border-amber-500/40 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-[#400207] to-[#5c0612] px-6 py-4 text-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-serif text-amber-200">
                  {editingUser ? 'Hiệu Chỉnh Phân Quyền & Áp Email' : 'Cấp Quyền & Áp Email Google Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 text-amber-200 hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="p-6 space-y-4 overflow-y-auto text-xs text-slate-800">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Cơ chế tự động liên kết danh tính Google
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Khi người dùng đăng nhập bằng tài khoản Google có email trùng khớp, hệ thống sẽ tự động gán vai trò tương ứng và định vị vị trí của họ trên cây gia phả.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Địa Chỉ Email Google (Bắt buộc) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="ví dụ: 13.phucthinh@gmail.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    disabled={editingUser?.email.toLowerCase() === DEFAULT_SUPER_ADMIN_EMAIL.toLowerCase()}
                    className="w-full p-2.5 pl-8 border rounded-xl focus:border-amber-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 font-mono text-xs"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                {editingUser?.email.toLowerCase() === DEFAULT_SUPER_ADMIN_EMAIL.toLowerCase() && (
                  <p className="text-[10px] text-amber-600 mt-1 font-medium">
                    ★ Email của Super Admin Sáng Lập được bảo vệ cố định.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ & Tên Người Dùng
                  </label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vai Trò Quyền Hạn (Role) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                    disabled={editingUser?.email.toLowerCase() === DEFAULT_SUPER_ADMIN_EMAIL.toLowerCase()}
                    className="w-full p-2.5 border rounded-xl focus:border-amber-600 focus:outline-none bg-white font-medium"
                  >
                    <option value="super_admin">👑 Hội Đồng Trưởng Tộc (Super Admin - Toàn Quyền)</option>
                    <option value="branch_admin">🛡️ Trưởng Chi (Quản Trị Theo Phái / Chi)</option>
                    <option value="editor">✍️ Ban Thư Ký (Thêm / Sửa Phả Hệ & Tư Liệu)</option>
                    <option value="member">👥 Thành Viên Dòng Tộc (Xem Đầy Đủ & Bình Luận)</option>
                    <option value="visitor">👁️ Khách Xem (Chỉ Xem Công Khai)</option>
                  </select>
                </div>
              </div>

              {/* Áp Email vào Thành Viên Trên Cây Phả Hệ */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Áp Vào Vị Trí Thành Viên Trên Cây Phả Hệ
                </label>
                <select
                  value={userForm.memberId}
                  onChange={(e) => setUserForm({ ...userForm, memberId: e.target.value })}
                  className="w-full p-2.5 border rounded-xl focus:border-amber-600 focus:outline-none bg-white"
                >
                  <option value="">— Chưa gắn kết với vị trí nào (Tài khoản quản trị viên) —</option>
                  {members
                    .slice()
                    .sort((a, b) => a.generation - b.generation)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        Đời {m.generation}: {m.fullName} {m.courtesyName ? `(${m.courtesyName})` : ''} - {m.phaiName || 'Chính phái'}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Khi áp hồ sơ, người này khi bấm "Vị trí của tôi" trên cây gia phả sẽ được phóng to đến vị trí của mình ngay lập tức.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Chi Phái Trực Thuộc (Nếu có)
                  </label>
                  <select
                    value={userForm.branchId}
                    onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:border-amber-600 focus:outline-none bg-white"
                  >
                    <option value="">— Quản lý toàn dòng tộc —</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Trạng Thái Tài Khoản
                  </label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
                    disabled={editingUser?.email.toLowerCase() === DEFAULT_SUPER_ADMIN_EMAIL.toLowerCase()}
                    className="w-full p-2.5 border rounded-xl focus:border-amber-600 focus:outline-none bg-white"
                  >
                    <option value="active">✓ Đang hoạt động (Cho phép truy cập)</option>
                    <option value="pending">⏳ Đang chờ duyệt</option>
                    <option value="blocked">🔒 Tạm khóa truy cập</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ghi Chú Ban Quản Trị
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cháu trưởng chi 2, liên hệ SĐT: 0912..."
                  value={userForm.notes}
                  onChange={(e) => setUserForm({ ...userForm, notes: e.target.value })}
                  className="w-full p-2.5 border rounded-xl focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {editingUser ? 'Lưu Cập Nhật Quyền' : 'Cấp Quyền & Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete User */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-red-200 text-xs text-slate-800">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              Thu Hồi Quyền Tài Khoản
            </div>
            <p className="text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn thu hồi quyền hạn của tài khoản Google <b className="text-slate-900 font-mono">{userToDelete.email}</b> ({userToDelete.name})?
            </p>
            <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Người dùng này khi đăng nhập sẽ chỉ có quyền Khách xem (visitor) và không thể chỉnh sửa dữ liệu phả hệ nữa.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
              >
                Xác Nhận Thu Hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Member, Branch, UserRole, ClanInfo } from '../types';
import {
  X,
  MapPin,
  Calendar,
  Heart,
  Crown,
  Edit3,
  Award,
  Users,
  ExternalLink,
  Save,
  Trash2,
  GitBranch,
  AlertTriangle,
  Plus,
  Info,
  Phone,
  Mail,
  Share2,
} from 'lucide-react';
import { DefaultAvatar } from './DefaultAvatar';
import { submitBurialLocationSuggestion } from '../lib/supabaseService';
import { MemberPicker } from './MemberPicker';

const getSuggestedGeneration = (member: Member, allMembers: Member[]) => {
  const parents = [member.fatherId, member.motherId].filter(Boolean) as string[];
  const generations = parents.map((id) => allMembers.find((m) => m.id === id)?.generation || 0).filter((g) => g > 0);
  return generations.length ? Math.max(...generations) + 1 : member.generation;
};

interface MemberModalProps {
  member: Member;
  allMembers: Member[];
  branches: Branch[];
  userRole: UserRole;
  clanInfo?: ClanInfo;
  onClose: () => void;
  onSelectRelative: (relative: Member) => void;
  onUpdateMember: (updated: Member) => void;
  onDeleteMember?: (id: string) => void;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  member,
  allMembers,
  branches,
  userRole,
  clanInfo,
  onClose,
  onSelectRelative,
  onUpdateMember,
  onDeleteMember,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<Member>({ ...member });
  const [newAchievementInput, setNewAchievementInput] = useState('');
  const [showBurialSuggestion, setShowBurialSuggestion] = useState(false);
  const [burialMapsUrl, setBurialMapsUrl] = useState('');
  const [burialNote, setBurialNote] = useState('');
  const [burialSubmitter, setBurialSubmitter] = useState('');
  const [burialContact, setBurialContact] = useState('');
  const [burialSubmitting, setBurialSubmitting] = useState(false);
  const [burialMessage, setBurialMessage] = useState<string | null>(null);
  const [burialShareUrl, setBurialShareUrl] = useState<string | null>(null);

  React.useEffect(() => {
    setFormData({ ...member });
    setIsEditing(false);
  }, [member]);

  const handleAddAchievement = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!newAchievementInput.trim()) return;
    const current = formData.achievements || [];
    setFormData({
      ...formData,
      achievements: [...current, newAchievementInput.trim()],
    });
    setNewAchievementInput('');
  };

  const handleRemoveAchievement = (idxToRemove: number) => {
    const current = formData.achievements || [];
    setFormData({
      ...formData,
      achievements: current.filter((_, idx) => idx !== idxToRemove),
    });
  };

  const canEdit = userRole === 'super_admin' || userRole === 'branch_admin';
  const canDelete = userRole === 'super_admin';
  const suggestedGeneration = getSuggestedGeneration(formData, allMembers);
  const generationIsDerived = Boolean(formData.fatherId || formData.motherId) && suggestedGeneration !== formData.generation;

  const branch = branches.find((b) => b.id === member.branchId);
  const father = allMembers.find((m) => m.id === member.fatherId);
  const mother = allMembers.find((m) => m.id === member.motherId);
  const spouses = allMembers.filter((m) => member.spouseIds?.includes(m.id));
  const allChildren = allMembers.filter((m) => m.fatherId === member.id || m.motherId === member.id);

  // Group children by mother if this is a father with multiple wives
  const childrenBySpouseMap = React.useMemo(() => {
    const map = new Map<string, Member[]>();
    spouses.forEach((sp) => {
      const kids = allMembers.filter(
        (c) =>
          (c.fatherId === member.id && c.motherId === sp.id) ||
          (c.motherId === member.id && c.fatherId === sp.id)
      );
      map.set(sp.id, kids);
    });
    return map;
  }, [spouses, allMembers, member.id]);

  const parseMapsCoordinates = (url: string): { lat: number; lng: number } | null => {
    const value = url.trim();
    const patterns = [
      /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
      /[?&](?:q|ll|query)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
      /(?:maps\.google\.[^/]+\/[^/]*\/)(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    ];
    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match) {
        const lat = Number(match[1]); const lng = Number(match[2]);
        if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
      }
    }
    return null;
  };

  const useCurrentBurialLocation = () => {
    if (!navigator.geolocation) { setBurialMessage('Thiết bị không hỗ trợ định vị.'); return; }
    setBurialSubmitting(true); setBurialMessage('Đang lấy vị trí GPS…');
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude.toFixed(7); const lng = pos.coords.longitude.toFixed(7);
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      setBurialMapsUrl(mapsUrl);
      setBurialShareUrl(mapsUrl);
      setBurialMessage('Đã lấy vị trí hiện tại. Hãy kiểm tra lại trước khi gửi.'); setBurialSubmitting(false);
    }, (err) => {
      setBurialMessage(err.code === 1 ? 'Bạn cần cho phép trình duyệt truy cập vị trí.' : 'Không lấy được vị trí GPS.'); setBurialSubmitting(false);
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  };

  const shareBurialLocation = async () => {
    if (!burialShareUrl) return;
    try {
      if (navigator.share) { await navigator.share({ title: `Vị trí mộ - ${member.fullName}`, text: `Vị trí mộ của ${member.fullName}`, url: burialShareUrl }); }
      else { await navigator.clipboard.writeText(burialShareUrl); setBurialMessage('Đã sao chép link Google Maps để chia sẻ.'); }
    } catch { /* Người dùng đóng hộp chia sẻ */ }
  };

  const handleBurialSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const coords = parseMapsCoordinates(burialMapsUrl);
    if (!coords) { setBurialMessage('Không đọc được tọa độ từ link Google Maps. Hãy dán link có dạng @15.123,108.456 hoặc q=15.123,108.456.'); return; }
    setBurialSubmitting(true); setBurialMessage(null);
    const result = await submitBurialLocationSuggestion({ memberId: member.id, mapsUrl: burialMapsUrl, latitude: coords.lat, longitude: coords.lng, note: burialNote, submittedByName: burialSubmitter, submittedByContact: burialContact });
    setBurialSubmitting(false);
    if (!result.success) { setBurialMessage(result.error || 'Gửi đề xuất thất bại.'); return; }
    setBurialMessage('Đã gửi đề xuất. Ban quản trị sẽ kiểm tra và xác nhận trước khi đưa vào gia phả.');
    setBurialMapsUrl(''); setBurialNote('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMember(formData);
    setIsEditing(false);
  };

  const handleConfirmDelete = () => {
    if (onDeleteMember) {
      onDeleteMember(member.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border-2 border-amber-500/40 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#400207] via-[#5c0612] to-[#400207] px-4 sm:px-6 py-3 sm:py-4 border-b border-amber-500/40 text-amber-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex-shrink-0">
              <DefaultAvatar
                avatarUrl={member.avatarUrl}
                gender={member.gender}
                fullName={member.fullName}
                size="md"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold font-serif text-amber-200 uppercase tracking-wide truncate">
                  {member.fullName}
                </h3>
                <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold shrink-0">
                  {member.isRootAncestor ? 'Thủy Tổ Khai Sáng' : `Đời thứ ${member.generation}`}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-300/80 mt-0.5 truncate">
                {member.generation <= 2
                  ? member.orderTitle || 'Thủy Tổ Khai Sáng Toàn Tộc'
                  : [
                      member.phaiName,
                      member.chiName,
                      member.nhanhName,
                      member.orderTitle,
                    ]
                      .filter(Boolean)
                      .join(' • ') || (branch?.name || 'Chi phái')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/50 flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Sửa
              </button>
            )}

            {canDelete && !member.isRootAncestor && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-500/40 flex items-center gap-1 transition-colors"
                title="Xóa thành viên này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xóa</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-amber-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert Banner */}
        {showDeleteConfirm && (
          <div className="p-4 bg-red-50 border-b border-red-200 flex items-center justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-900 text-xs">
                  Xác nhận xóa thành viên &quot;{member.fullName}&quot;?
                </h4>
                <p className="text-[11px] text-red-700 mt-0.5">
                  Thành viên sẽ được gỡ khỏi cây gia phả. Mối liên kết cha con và phối ngẫu sẽ được tách rời an toàn.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 text-slate-800 text-xs">
          {isEditing ? (
            /* Editing Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ và Tên đầy đủ *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none uppercase font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thứ bậc gia đình</label>
                  <input
                    type="text"
                    placeholder="Trưởng nam, Thứ nam, Trưởng nữ, Phu nhân..."
                    value={formData.orderTitle || ''}
                    onChange={(e) => setFormData({ ...formData, orderTitle: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none"
                  />
                  <label className="block font-bold text-slate-700 mt-3 mb-1">Thứ tự trong gia đình</label>
                  <input type="number" min={1} max={999} value={Math.max(1, Number(formData.orderInFamily) || 1)} onChange={(e) => setFormData({ ...formData, orderInFamily: Math.max(1, Number(e.target.value) || 1) })} className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none" />
                  <p className="text-[10px] text-slate-500 mt-1">Số này dùng để sắp xếp anh chị em trên cây; tên thẻ chỉ hiển thị “Trưởng nam/Trưởng nữ...” nếu đã khai báo.</p>
                </div>

                {/* Phân cấp gia tộc: Phái > Chi > Nhánh */}
                <div className="sm:col-span-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                  <span className="font-bold text-amber-950 flex items-center gap-1 text-xs mb-2">
                    <GitBranch className="w-3.5 h-3.5 text-amber-600" />
                    Phân Cấp Gia Tộc: Đời &gt; Phái &gt; Chi &gt; Nhánh
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Tên Phái</label>
                      <input
                        type="text"
                        placeholder="VD: Phái II Xuyên Tây"
                        value={formData.phaiName || ''}
                        onChange={(e) => setFormData({ ...formData, phaiName: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-amber-600 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Chi</label>
                      <input
                        type="text"
                        placeholder="VD: Chi 1, Chi Giáp"
                        value={formData.chiName || ''}
                        onChange={(e) => setFormData({ ...formData, chiName: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-amber-600 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Nhánh</label>
                      <input
                        type="text"
                        placeholder="VD: Nhánh 3"
                        value={formData.nhanhName || ''}
                        onChange={(e) => setFormData({ ...formData, nhanhName: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-amber-600 focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-600" />
                      Nơi sinh (Quê quán / Bản quán)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Xuyên Tây, Duy Xuyên, Quảng Nam"
                      value={formData.birthPlace || ''}
                      onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:border-amber-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div>
                    <div className="font-bold text-slate-900">Quan hệ cha mẹ & phối ngẫu</div>
                    <p className="text-[10px] text-slate-500">Có thể đổi cha, mẹ, phối ngẫu hoặc đời ngay tại đây. Không cần xóa rồi tạo lại thành viên.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <MemberPicker members={allMembers} value={formData.fatherId || ''} onChange={(id) => { const father = allMembers.find((m) => m.id === id); setFormData({ ...formData, fatherId: id || null, generation: father ? father.generation + 1 : formData.generation }); }} label="Cha (Phụ thân)" gender="male" excludeIds={[member.id, formData.motherId || '']} hint="Tìm kiếm" />
                    <MemberPicker members={allMembers} value={formData.motherId || ''} onChange={(id) => { const mother = allMembers.find((m) => m.id === id); const father = allMembers.find((m) => m.id === (formData.fatherId || '')); setFormData({ ...formData, motherId: id || null, generation: father ? father.generation + 1 : mother ? mother.generation + 1 : formData.generation }); }} label="Mẹ (Mẫu thân)" gender="female" excludeIds={[member.id, formData.fatherId || '']} hint="Tìm kiếm" />
                  </div>
                  <MemberPicker members={allMembers} value="" onChange={(id) => { if (!id) return; setFormData({ ...formData, spouseIds: Array.from(new Set([...(formData.spouseIds || []), id])) }); }} label="Thêm phối ngẫu" excludeIds={[member.id, ...(formData.spouseIds || []), formData.fatherId || '', formData.motherId || '']} hint="Có thể có nhiều phối ngẫu" />
                  {(formData.spouseIds || []).length > 0 && <div className="flex flex-wrap gap-2">{(formData.spouseIds || []).map((sid) => { const sp = allMembers.find((m) => m.id === sid); return sp ? <button key={sid} type="button" onClick={() => setFormData({ ...formData, spouseIds: (formData.spouseIds || []).filter((id) => id !== sid) })} className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold">{sp.fullName} ×</button> : null; })}</div>}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giới tính</label>
                  <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as Member['gender'] })} className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none"><option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option></select>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block font-bold text-slate-700">Đời</label>
                    {(formData.fatherId || formData.motherId) && (
                      <button type="button" onClick={() => setFormData({ ...formData, generation: suggestedGeneration })} className="text-[10px] font-bold text-emerald-700 hover:underline">Đồng bộ theo cha/mẹ: Đời {suggestedGeneration}</button>
                    )}
                  </div>
                  <input type="number" min="1" max="100" value={formData.generation} onChange={(e) => setFormData({ ...formData, generation: Math.max(1, Number(e.target.value) || 1) })} className={`w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none font-bold ${generationIsDerived ? 'border-amber-400 bg-amber-50 text-amber-900' : 'text-amber-900'}`} />
                  {(formData.fatherId || formData.motherId) && <p className={`mt-1 text-[9px] ${generationIsDerived ? 'text-amber-700 font-semibold' : 'text-slate-500'}`}>{generationIsDerived ? `Đời sẽ tự chuẩn hóa thành ${suggestedGeneration} khi lưu.` : 'Đời đang khớp với quan hệ cha/mẹ.'}</p>}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên Tự / Tên Chữ</label>
                  <input
                    type="text"
                    value={formData.courtesyName || ''}
                    onChange={(e) => setFormData({ ...formData, courtesyName: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên Thụy / Tên Húy (Nếu đã mất)</label>
                  <input
                    type="text"
                    value={formData.posthumousName || ''}
                    onChange={(e) => setFormData({ ...formData, posthumousName: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày sinh (Dương lịch)</label>
                  <input
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày sinh Âm lịch</label>
                  <input
                    type="text"
                    placeholder="VD: 15/01/Canh Thìn"
                    value={formData.birthDateLunar || ''}
                    onChange={(e) => setFormData({ ...formData, birthDateLunar: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái sống / mất</label>
                  <select
                    value={formData.isAlive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isAlive: e.target.value === 'true' })}
                    className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none font-semibold"
                  >
                    <option value="true">Còn sống</option>
                    <option value="false">Đã tạ thế</option>
                  </select>
                </div>

                {!formData.isAlive && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ngày giỗ chính (Âm lịch)</label>
                      <input
                        type="text"
                        placeholder="VD: 19/10/Ất Dậu"
                        value={formData.deathDateLunar || ''}
                        onChange={(e) => setFormData({ ...formData, deathDateLunar: e.target.value })}
                        className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Nơi an táng / Mộ phần</label>
                      <input
                        type="text"
                        placeholder="VD: Khu lăng mộ họ Nguyễn, Gò Kim Quy, Đông Ngạc"
                        value={formData.burialLocation || ''}
                        onChange={(e) => setFormData({ ...formData, burialLocation: e.target.value })}
                        className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nghề nghiệp / Chức vụ</label>
                  <input
                    type="text"
                    value={formData.occupation || ''}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><label className="block font-bold text-slate-700 mb-1">Điện thoại</label><input value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full p-2.5 border rounded-lg" /></div>
                  <div><label className="block font-bold text-slate-700 mb-1">Email</label><input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-2.5 border rounded-lg" /></div>
                  <div><label className="block font-bold text-slate-700 mb-1">Địa chỉ hiện tại</label><input value={formData.currentAddress || ''} onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })} className="w-full p-2.5 border rounded-lg" /></div>
                </div>

                {/* Công Đức, Bằng Khen & Thành Tựu */}
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                      <Award className="w-4 h-4 text-amber-600" />
                      Công Đức, Bằng Khen & Thành Tựu ({(formData.achievements || []).length})
                    </label>
                    <span className="text-[10px] text-amber-800 italic">Nhấn Enter hoặc bấm Thêm</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="VD: Huân chương Kháng chiến, Công đức đúc chuông Từ đường..."
                      value={newAchievementInput}
                      onChange={(e) => setNewAchievementInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAchievement();
                        }
                      }}
                      className="flex-1 p-2 border rounded-lg focus:border-amber-600 focus:outline-none bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddAchievement}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm
                    </button>
                  </div>

                  {/* Danh sách thành tựu */}
                  {(formData.achievements || []).length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {(formData.achievements || []).map((ach, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-amber-200 text-amber-950 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                            <span className="font-medium">{ach}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAchievement(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Xóa mục này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tiểu sử & Sự nghiệp</label>
                  <textarea
                    rows={3}
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          ) : (
            /* Profile View Mode */
            <>
              {/* Hierarchy Breadcrumb Banner */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-950">
                  <GitBranch className="w-4 h-4 text-amber-600" />
                  <span>
                    Đời {member.generation}
                    {member.phaiName && ` • ${member.phaiName}`}
                    {member.chiName && ` • ${member.chiName}`}
                    {member.nhanhName && ` • ${member.nhanhName}`}
                  </span>
                </div>
                {member.birthPlace && (
                  <div className="flex items-center gap-1 text-[11px] text-amber-800 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>Nơi sinh: {member.birthPlace}</span>
                  </div>
                )}
              </div>

              {/* Primary Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tên Tự / Húy</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {member.courtesyName || member.posthumousName || 'Chưa cập nhật'}
                  </span>
                </div>
                <div className={`p-3 bg-slate-50 rounded-xl border border-slate-200 border-l-4 ${member.gender === 'male' ? 'border-l-blue-600' : 'border-l-rose-500'}`}>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Thế hệ & Thứ bậc</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {member.isRootAncestor
                      ? 'Thủy Tổ Khai Sáng'
                      : member.orderTitle
                      ? `Đời ${member.generation} • ${member.orderTitle}`
                      : `Đời ${member.generation}`}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tình trạng</span>
                  <span
                    className={`font-bold text-xs mt-0.5 inline-block px-2 py-0.5 rounded ${
                      member.isAlive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {member.isAlive ? 'Đang sinh sống' : 'Đã tạ thế'}
                  </span>
                </div>
              </div>

              {/* Dates & Burial */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-2">
                <h4 className="font-serif font-bold text-amber-950 uppercase tracking-wide text-xs flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  Niên Biểu & Mộ Phần
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-500">Năm sinh:</span>{' '}
                    <span className="font-semibold">{member.birthDate || 'Chưa rõ'}</span>{' '}
                    {member.birthDateLunar && (
                      <span className="text-amber-800 font-medium">({member.birthDateLunar})</span>
                    )}
                  </div>

                  {!member.isAlive && (
                    <div>
                      <span className="text-slate-500">Ngày quy tiên / Giỗ chạp:</span>{' '}
                      <span className="font-bold text-red-800">
                        {member.deathDateLunar || member.deathDate || 'Chưa ghi chép'}
                      </span>
                    </div>
                  )}

                  {(member.burialLocation || member.burialCoordinates) && (
                    <div className="sm:col-span-2 flex items-start gap-1.5 pt-1">
                      <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500">Nơi an táng:</span>{' '}
                        <span className="font-semibold text-slate-800">{member.burialLocation || 'Đã xác nhận tọa độ mộ phần'}</span>
                        {member.burialCoordinates && (
                          <a
                            href={`https://maps.google.com/?q=${member.burialCoordinates.lat},${member.burialCoordinates.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline ml-2 font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Xem tọa độ trên Google Maps
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!member.isAlive && (
                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                  <button type="button" onClick={() => setShowBurialSuggestion((v) => !v)} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 hover:text-blue-950">
                    <MapPin className="w-4 h-4" /> {member.burialCoordinates ? 'Đề xuất cập nhật vị trí mộ' : 'Bạn biết vị trí mộ? Gửi vị trí Google Maps'}
                  </button>
                  {showBurialSuggestion && (
                    <form onSubmit={handleBurialSuggestion} className="mt-3 space-y-2.5">
                      <div className="flex gap-2">
                        <input value={burialMapsUrl} onChange={(e) => setBurialMapsUrl(e.target.value)} placeholder="Dán link Google Maps của ngôi mộ…" className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-400" />
                        <button type="button" onClick={useCurrentBurialLocation} disabled={burialSubmitting} className="shrink-0 rounded-lg bg-blue-700 px-3 py-2 text-[11px] font-bold text-white">GPS hiện tại</button>
                        {burialShareUrl && <button type="button" onClick={shareBurialLocation} className="shrink-0 rounded-lg border border-blue-300 bg-white px-3 py-2 text-[11px] font-bold text-blue-800 inline-flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> Chia sẻ</button>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input value={burialSubmitter} onChange={(e) => setBurialSubmitter(e.target.value)} placeholder="Tên người gửi (không bắt buộc)" className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs" />
                        <input value={burialContact} onChange={(e) => setBurialContact(e.target.value)} placeholder="SĐT/email (không bắt buộc)" className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs" />
                      </div>
                      <textarea value={burialNote} onChange={(e) => setBurialNote(e.target.value)} placeholder="Ghi chú: mộ nằm hàng nào, nghĩa trang nào, dấu hiệu nhận biết…" rows={2} className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs resize-none" />
                      <button type="submit" disabled={burialSubmitting} className="w-full rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">{burialSubmitting ? 'Đang gửi…' : 'Gửi đề xuất để Ban Quản Trị xác nhận'}</button>
                      {burialMessage && <p className="text-[11px] leading-relaxed text-blue-800">{burialMessage}</p>}
                      <p className="text-[10px] text-slate-500">Vị trí chỉ được cập nhật vào hệ thống sau khi Ban Quản Trị kiểm tra và duyệt.</p>
                    </form>
                  )}
                </div>
              )}

              {/* Biography & Achievements */}
              {member.bio && (
                <div className="space-y-1.5">
                  <h4 className="font-serif font-bold text-amber-950 uppercase tracking-wide text-xs">
                    Tiểu Sử & Sự Nghiệp
                  </h4>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    {member.bio}
                  </p>
                </div>
              )}

              {/* Achievements */}
              {member.achievements && member.achievements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-serif font-bold text-amber-950 uppercase tracking-wide text-xs flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    Công Đức, Bằng Khen & Thành Tựu
                  </h4>
                  <ul className="space-y-1.5">
                    {member.achievements.map((ach, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2 font-medium"
                      >
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{ach}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Family Relationships (Cha, Mẹ đẻ, Các Phu nhân & Con cái theo từng mẹ) */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="font-serif font-bold text-amber-950 uppercase tracking-wide text-xs flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-600" />
                  Mối Quan Hệ Gia Đình Trực Hệ
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Father & Mother */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-semibold text-slate-500 text-[11px] block">Thân Phụ & Mẫu Thân:</span>
                    {father ? (
                      <button
                        type="button"
                        onClick={() => onSelectRelative(father)}
                        className="text-left font-bold text-blue-700 hover:underline block truncate"
                      >
                        Thân phụ: {father.fullName} (Đời {father.generation})
                      </button>
                    ) : (
                      <span className="text-slate-400 italic block">Thân phụ: Chưa rõ</span>
                    )}

                    {mother ? (
                      <button
                        type="button"
                        onClick={() => onSelectRelative(mother)}
                        className="text-left font-bold text-rose-700 hover:underline block truncate"
                      >
                        Mẫu thân: {mother.fullName} {mother.orderTitle ? `(${mother.orderTitle})` : ''}
                      </button>
                    ) : (
                      <span className="text-slate-400 italic block">Mẫu thân: Chưa rõ</span>
                    )}
                  </div>

                  {/* Spouses List */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-semibold text-slate-500 text-[11px] block">
                      Phối Ngẫu ({spouses.length} người):
                    </span>
                    {spouses.length > 0 ? (
                      spouses.map((sp) => (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => onSelectRelative(sp)}
                          className="text-left font-bold text-rose-700 hover:underline block truncate"
                        >
                          {member.gender === 'male' ? 'Phu nhân' : 'Phu quân'}: {sp.fullName}{' '}
                          {sp.orderTitle && (
                            <span className="text-[10px] text-slate-500 font-normal">({sp.orderTitle})</span>
                          )}
                        </button>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">Chưa ghi chép phối ngẫu</span>
                    )}
                  </div>
                </div>

                {/* Children List: Grouped by Mother if multiple spouses exist */}
                {allChildren.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <span className="font-semibold text-slate-500 text-[11px] block">
                      Hậu Duệ / Con Cái ({allChildren.length} người):
                    </span>

                    {/* If multiple spouses exist, show children grouped by each spouse */}
                    {spouses.length > 1 ? (
                      spouses.map((sp) => {
                        const kids = childrenBySpouseMap.get(sp.id) || [];
                        return (
                          <div key={sp.id} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5">
                            <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
                              <Heart className="w-3 h-3 text-rose-500" />
                              Con của {sp.fullName} ({sp.orderTitle || 'Phu nhân'}) - {kids.length} con:
                            </span>
                            {kids.length > 0 ? (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {kids.map((child) => (
                                  <button
                                    key={child.id}
                                    type="button"
                                    onClick={() => onSelectRelative(child)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 hover:border-amber-400 text-slate-800 font-semibold text-xs transition-colors"
                                  >
                                    {child.fullName}{' '}
                                    <span className="text-[10px] text-slate-400">({child.orderTitle || 'Con'})</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic">Chưa ghi nhận con</p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {allChildren.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => onSelectRelative(child)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-slate-800 font-semibold text-xs transition-colors"
                          >
                            {child.fullName}{' '}
                            <span className="text-[10px] text-slate-400">({child.orderTitle || 'Con'})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Compact Modal Footer with Member ID & Contact Notice */}
        <div className="bg-slate-50 px-4 sm:px-6 py-2.5 sm:py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shrink-0">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 text-slate-500 text-[11px] flex-wrap">
              <span className="font-semibold text-slate-600">Mã định danh thành viên:</span>
              <span className="font-mono font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded text-[10.5px]">
                {member.id}
              </span>
            </div>
            <p className="text-[11px] text-amber-900/90 leading-normal">
              {clanInfo?.contactNotice || 'Gia phả hiện đang cập nhật, nếu có sai sót hoặc cần bổ sung vui lòng liên hệ Ban Quản Trị:'}{' '}
              {clanInfo?.contactPhone && (
                <a
                  href={`tel:${clanInfo.contactPhone}`}
                  className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-0.5 mr-2"
                >
                  <Phone className="w-3 h-3 text-emerald-600 shrink-0 inline" /> {clanInfo.contactPhone}
                </a>
              )}
              {clanInfo?.contactEmail && (
                <a
                  href={`mailto:${clanInfo.contactEmail}`}
                  className="font-bold text-blue-700 hover:underline inline-flex items-center gap-0.5"
                >
                  <Mail className="w-3 h-3 text-blue-600 shrink-0 inline" /> {clanInfo.contactEmail}
                </a>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="self-end sm:self-center px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors text-xs active:scale-95 cursor-pointer shrink-0"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

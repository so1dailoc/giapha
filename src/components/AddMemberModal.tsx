import React, { useState } from 'react';
import { Member, Branch, Gender } from '../types';
import { UserPlus, Heart, X, Sparkles, MapPin, GitBranch, Award, Plus, Trash2 } from 'lucide-react';
import { MemberPicker } from './MemberPicker';

interface AddMemberModalProps {
  parentMember?: Member | null;
  spouseForMember?: Member | null;
  branches: Branch[];
  allMembers: Member[];
  onClose: () => void;
  onAddMember: (newMember: Member) => void;
  deceasedAgeThreshold?: number;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  parentMember,
  spouseForMember,
  branches,
  allMembers,
  onClose,
  onAddMember,
  deceasedAgeThreshold = 100,
}) => {
  const isAddingChild = Boolean(parentMember);
  const isAddingSpouse = Boolean(spouseForMember);

  const initialGeneration = parentMember
    ? parentMember.generation + 1
    : spouseForMember
    ? spouseForMember.generation
    : 3;

  const initialBranchId = parentMember
    ? parentMember.branchId
    : spouseForMember
    ? spouseForMember.branchId
    : branches[0]?.id || 'branch-1';

  // Form states: Mặc định để trống hoàn toàn theo yêu cầu người dùng
  const [generation, setGeneration] = useState<number>(initialGeneration);
  const [branchId, setBranchId] = useState<string>(initialBranchId);
  const [phaiName, setPhaiName] = useState<string>('');
  const [chiName, setChiName] = useState<string>('');
  const [nhanhName, setNhanhName] = useState<string>('');
  const [birthPlace, setBirthPlace] = useState<string>('');

  const [fullName, setFullName] = useState('');
  const [courtesyName, setCourtesyName] = useState('');
  const [posthumousName, setPosthumousName] = useState('');
  const [gender, setGender] = useState<Gender>(
    isAddingSpouse && spouseForMember?.gender === 'male' ? 'female' : 'male'
  );
  const suggestedOrderInFamily = React.useMemo(() => {
    if (!isAddingChild) return 1;
    const siblings = allMembers.filter((m) =>
      (m.fatherId || null) === (parentMember?.gender === 'male' ? parentMember?.id || null : null) &&
      (m.motherId || null) === (parentMember?.gender === 'female' ? parentMember?.id || null : null)
    );
    return Math.max(0, ...siblings.map((m) => Number(m.orderInFamily) || 0)) + 1;
  }, [allMembers, isAddingChild, parentMember]);
  const [orderInFamily, setOrderInFamily] = useState<number>(suggestedOrderInFamily);

  const [orderTitle, setOrderTitle] = useState(
    isAddingSpouse
      ? spouseForMember?.gender === 'male'
        ? 'Phu nhân (Vợ)'
        : 'Phu quân (Chồng)'
      : isAddingChild
      ? 'Trưởng nam'
      : 'Thành viên'
  );

  // Parents selection
  const [fatherId, setFatherId] = useState<string>(
    isAddingChild && parentMember?.gender === 'male' ? parentMember.id : ''
  );
  const [motherId, setMotherId] = useState<string>(
    isAddingChild && parentMember?.gender === 'female'
      ? parentMember.id
      : isAddingChild && parentMember?.spouseIds && parentMember.spouseIds.length === 1
      ? parentMember.spouseIds[0]
      : ''
  );
  const [selectedSpouseId, setSelectedSpouseId] = useState<string>(
    isAddingSpouse && spouseForMember ? spouseForMember.id : ''
  );

  const [birthDate, setBirthDate] = useState('');
  const [birthDateLunar, setBirthDateLunar] = useState('');
  const [isAlive, setIsAlive] = useState(true);
  const [ageNotice, setAgeNotice] = useState<string | null>(null);
  const [deathDateLunar, setDeathDateLunar] = useState('');
  const [burialLocation, setBurialLocation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newAchievementInput, setNewAchievementInput] = useState('');

  const handleAddAchievement = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!newAchievementInput.trim()) return;
    setAchievements((prev) => [...prev, newAchievementInput.trim()]);
    setNewAchievementInput('');
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements((prev) => prev.filter((_, idx) => idx !== index));
  };

  const selectedFather = allMembers.find((m) => m.id === fatherId);
  const fatherWives = selectedFather?.spouseIds
    ? allMembers.filter((f) => selectedFather.spouseIds?.includes(f.id))
    : [];

  // Thông báo tính toán tự động đời
  const [autoGenNotice, setAutoGenNotice] = useState<string | null>(() => {
    if (parentMember) {
      return `Tự động nhảy sang Đời thứ ${parentMember.generation + 1} (con của ${parentMember.fullName} - Đời ${parentMember.generation})`;
    }
    if (spouseForMember) {
      return `Tự động đặt Đời thứ ${spouseForMember.generation} (cùng thế hệ với phối ngẫu ${spouseForMember.fullName})`;
    }
    return null;
  });

  const getNextSiblingOrder = (nextFatherId: string, nextMotherId: string) => {
    const siblings = allMembers.filter((m) =>
      (m.fatherId || null) === (nextFatherId || null) &&
      (m.motherId || null) === (nextMotherId || null)
    );
    return Math.max(0, ...siblings.map((m) => Number(m.orderInFamily) || 0)) + 1;
  };

  const handleFatherChange = (newFatherId: string) => {
    setFatherId(newFatherId);
    const father = allMembers.find((m) => m.id === newFatherId);
    if (father) {
      const nextGen = father.generation + 1;
      setGeneration(nextGen);
      setOrderInFamily(getNextSiblingOrder(newFatherId, motherId));
      setAutoGenNotice(`Tự động nhảy sang Đời thứ ${nextGen} (con của ${father.fullName} - Đời thứ ${father.generation})`);
      // Kế thừa phái, chi, nhánh nếu đang để trống
      if (!phaiName && father.phaiName) setPhaiName(father.phaiName);
      if (!chiName && father.chiName) setChiName(father.chiName);
      if (!nhanhName && father.nhanhName) setNhanhName(father.nhanhName);
      if (father.branchId) setBranchId(father.branchId);
      if (!birthPlace && father.birthPlace) setBirthPlace(father.birthPlace);
    } else {
      setAutoGenNotice(null);
    }
  };

  const handleMotherChange = (newMotherId: string) => {
    setMotherId(newMotherId);
    setOrderInFamily(getNextSiblingOrder(fatherId, newMotherId));
    if (!fatherId) {
      const mother = allMembers.find((m) => m.id === newMotherId);
      if (mother) {
        const nextGen = mother.generation + 1;
        setGeneration(nextGen);
        setAutoGenNotice(`Tự động nhảy sang Đời thứ ${nextGen} (con của ${mother.fullName} - Đời thứ ${mother.generation})`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const newId = `mem-${Date.now()}`;
    const newSpouseIds = isAddingSpouse && spouseForMember
      ? [spouseForMember.id]
      : selectedSpouseId
      ? [selectedSpouseId]
      : [];

    const newMember: Member = {
      id: newId,
      fullName: fullName.trim(),
      courtesyName: courtesyName.trim() || undefined,
      posthumousName: !isAlive && posthumousName.trim() ? posthumousName.trim() : undefined,
      gender,
      generation,
      branchId,
      phaiName: phaiName.trim() || undefined,
      chiName: chiName.trim() || undefined,
      nhanhName: nhanhName.trim() || undefined,
      birthPlace: birthPlace.trim() || undefined,
      orderInFamily: Math.max(1, Number(orderInFamily) || 1),
      orderTitle: orderTitle.trim() || undefined,
      birthDate: birthDate || undefined,
      birthDateLunar: birthDateLunar || undefined,
      isAlive,
      deathDateLunar: !isAlive ? deathDateLunar : undefined,
      burialLocation: !isAlive ? burialLocation : undefined,
      occupation: occupation.trim() || undefined,
      bio: bio.trim() || undefined,
      achievements: achievements.length > 0 ? achievements : undefined,
      fatherId: fatherId || null,
      motherId: motherId || null,
      spouseIds: newSpouseIds,
    };

    onAddMember(newMember);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border-2 border-amber-500/40 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#400207] via-[#5c0612] to-[#400207] px-6 py-4 border-b border-amber-500/40 text-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isAddingSpouse ? (
              <Heart className="w-5 h-5 text-rose-400" />
            ) : (
              <UserPlus className="w-5 h-5 text-amber-400" />
            )}
            <div>
              <h3 className="text-base font-bold font-serif text-amber-200">
                {isAddingChild
                  ? `Thêm Con Cho: ${parentMember?.fullName}`
                  : isAddingSpouse
                  ? `Thêm Phối Ngẫu (Vợ/Chồng) Cho: ${spouseForMember?.fullName}`
                  : 'Thêm Thành Viên Vào Gia Phả (Đời Bất Kỳ)'}
              </h3>
              <p className="text-[11px] text-amber-300/80">
                Thứ tự phân cấp: Đời &gt; Phái &gt; Chi &gt; Nhánh
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-amber-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-800">
          {/* Section 1: Thông tin cơ bản */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Họ và Tên đầy đủ *</label>
              <input
                type="text"
                required
                placeholder="VD: Nguyễn Văn An"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none text-sm font-semibold uppercase"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Tên trên cây gia phả sẽ tự động được viết HOA chuẩn quốc ngữ
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Giới tính *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">Đời (Thế Hệ) *</label>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                  Đời thứ {generation}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(1, generation - 1);
                    setGeneration(next);
                    setAutoGenNotice(null);
                  }}
                  className="w-10 h-10 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base flex items-center justify-center transition-colors active:scale-95"
                  title="Giảm 1 đời"
                >
                  -
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={generation}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1) {
                        setGeneration(val);
                        setAutoGenNotice(null);
                      }
                    }}
                    className="w-full p-2.5 text-center border rounded-lg focus:border-amber-600 focus:outline-none font-bold text-base text-amber-900 bg-amber-50/50"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none hidden sm:inline">
                    (Tùy ý)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = generation + 1;
                    setGeneration(next);
                    setAutoGenNotice(null);
                  }}
                  className="w-10 h-10 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base flex items-center justify-center transition-colors active:scale-95"
                  title="Tăng 1 đời"
                >
                  +
                </button>
              </div>
              {autoGenNotice && (
                <div className="mt-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-md px-2 py-1 flex items-center gap-1">
                  <span>⚡</span>
                  <span className="truncate">{autoGenNotice}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Phân cấp gia tộc: Phái > Chi > Nhánh */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-3">
            <div className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
              <GitBranch className="w-3.5 h-3.5 text-amber-600" />
              <span>Phân Cấp Gia Tộc: Đời &gt; Phái &gt; Chi &gt; Nhánh</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên Phái (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Phái II Xuyên Tây, Phái IV Đại Lộc"
                  value={phaiName}
                  onChange={(e) => setPhaiName(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:border-amber-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chi (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Chi 1, Chi 2, Chi Giáp"
                  value={chiName}
                  onChange={(e) => setChiName(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:border-amber-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nhánh (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Nhánh 3, Nhánh 1"
                  value={nhanhName}
                  onChange={(e) => setNhanhName(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:border-amber-600 focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* Nơi sinh */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-600" />
                Nơi sinh (Quê quán / Bản quán)
              </label>
              <input
                type="text"
                placeholder="VD: Xuyên Tây, Duy Xuyên, Quảng Nam"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                className="w-full p-2 border rounded-lg focus:border-amber-600 focus:outline-none bg-white"
              />
            </div>
          </div>

          {/* Section 3: Quan hệ - chọn bằng tìm kiếm, không dùng dropdown dài */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div>
              <div className="font-bold text-slate-900">Quan hệ gia đình</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Có thể tìm theo tên không dấu, đời, phái, chi, nhánh. Khi chọn cha/mẹ hệ thống tự tính đời và gợi ý phân cấp.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MemberPicker members={allMembers} value={fatherId} onChange={handleFatherChange} label="Người Cha (Phụ thân)" gender="male" excludeIds={[motherId]} hint="Cha" />
              <MemberPicker members={allMembers} value={motherId} onChange={handleMotherChange} label="Người Mẹ (Mẫu thân)" gender="female" excludeIds={[fatherId]} hint={fatherWives.length > 1 ? 'Cha có nhiều phối ngẫu' : 'Mẹ'} />
            </div>
            {fatherWives.length > 1 && <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">Cha đã chọn có {fatherWives.length} phối ngẫu. Hãy chọn đúng người mẹ sinh ra thành viên này.</div>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Thứ bậc trong gia đình</label>
              <input type="text" placeholder="Trưởng nam, Thứ nam, Trưởng nữ..." value={orderTitle} onChange={(e) => setOrderTitle(e.target.value)} className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none" />
              <label className="block font-bold text-slate-700 mt-3 mb-1">Thứ tự trong gia đình</label>
              <input type="number" min={1} max={999} value={orderInFamily} onChange={(e) => setOrderInFamily(Math.max(1, Number(e.target.value) || 1))} className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none" />
              <p className="text-[10px] text-slate-500 mt-1">1 = trưởng; 2, 3, 4... là thứ tự. Con nhập sau sẽ tự nối vào cuối nếu chưa đặt lại thứ tự.</p>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên Tự (Tên Chữ)</label>
              <input type="text" placeholder="VD: Văn Minh" value={courtesyName} onChange={(e) => setCourtesyName(e.target.value)} className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none" />
            </div>
          </div>

          {/* Section 4: Ngày sinh / Ngày mất */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Năm / Ngày sinh Dương lịch</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setBirthDate(value);
                  if (!value || !deceasedAgeThreshold) { setAgeNotice(null); return; }
                  const birth = new Date(`${value}T00:00:00`);
                  const now = new Date();
                  let age = now.getFullYear() - birth.getFullYear();
                  const md = now.getMonth() - birth.getMonth();
                  if (md < 0 || (md === 0 && now.getDate() < birth.getDate())) age--;
                  if (age >= deceasedAgeThreshold) {
                    setIsAlive(false);
                    setAgeNotice(`Tuổi hiện tại khoảng ${age}; hệ thống mặc định “Đã tạ thế” theo ngưỡng ${deceasedAgeThreshold} tuổi. Bạn vẫn có thể đổi lại.`);
                  } else setAgeNotice(null);
                }}
                className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngày sinh Âm lịch</label>
              <input
                type="text"
                placeholder="VD: 15/01/Giáp Tý"
                value={birthDateLunar}
                onChange={(e) => setBirthDateLunar(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tình trạng hiện tại *</label>
              <select
                value={isAlive ? 'true' : 'false'}
                onChange={(e) => setIsAlive(e.target.value === 'true')}
                className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none font-semibold"
              >
                <option value="true">Còn sống</option>
                <option value="false">Đã tạ thế (Hưởng thọ)</option>
              </select>
            </div>

            {!isAlive && (
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-amber-700">
                  Ngày giỗ chính (Âm lịch) *
                </label>
                <input
                  type="text"
                  placeholder="VD: 19/10/Ất Dậu"
                  value={deathDateLunar}
                  onChange={(e) => setDeathDateLunar(e.target.value)}
                  className="w-full p-2.5 border border-amber-400 rounded-lg focus:border-amber-600 focus:outline-none bg-amber-50/50"
                />
              </div>
            )}
          </div>

          {!isAlive && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <label className="block font-bold text-blue-900 mb-1">Nơi an táng / Mộ phần</label>
              <input type="text" placeholder="VD: Nghĩa trang..., khu..., hàng..." value={burialLocation} onChange={(e) => setBurialLocation(e.target.value)} className="w-full p-2.5 border rounded-lg focus:border-blue-500 focus:outline-none bg-white" />
              <p className="text-[10px] text-blue-700 mt-1">Nếu chưa biết, để trống. Người thân có thể gửi GPS/Google Maps sau để Admin xác nhận.</p>
            </div>
          )}

          {!isAddingSpouse && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <MemberPicker members={allMembers} value={selectedSpouseId} onChange={(id) => { setSelectedSpouseId(id); const sp = allMembers.find((m) => m.id === id); if (sp) { setGeneration(sp.generation); setBranchId(sp.branchId || branchId); setAutoGenNotice(`Đặt Đời ${sp.generation} theo phối ngẫu ${sp.fullName}`); } }} label="Phối ngẫu (tùy chọn)" excludeIds={[fatherId, motherId]} hint="Ví dụ: thêm bà A là vợ ông B" />
              <p className="text-[10px] text-rose-700 mt-1">Nếu chọn một thành viên hiện có, hệ thống sẽ tạo liên kết vợ/chồng hai chiều tự động. Phối ngẫu được đặt cùng đời với người được chọn.</p>
            </div>
          )}

          {!isAlive && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <label className="block font-bold text-blue-900 mb-1">Nơi an táng / Mộ phần</label>
              <input type="text" placeholder="VD: Nghĩa trang..., khu..., hàng..." value={burialLocation} onChange={(e) => setBurialLocation(e.target.value)} className="w-full p-2.5 border rounded-lg focus:border-blue-500 focus:outline-none bg-white" />
              <p className="text-[10px] text-blue-700 mt-1">Nếu chưa biết, để trống. Người thân có thể gửi GPS/Google Maps sau để Admin xác nhận.</p>
            </div>
          )}

          {/* Section 5: Nghề nghiệp, Công Đức & Tiểu sử */}
          <div className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nghề nghiệp / Học vị / Chức vụ</label>
              <input
                type="text"
                placeholder="VD: Tiến sĩ Hán Nôm, Kỹ sư, Thương gia..."
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none"
              />
            </div>

            {/* Công đức, Bằng khen & Thành tựu */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                  <Award className="w-4 h-4 text-amber-600" />
                  Công Đức, Bằng Khen & Thành Tựu ({achievements.length})
                </label>
                <span className="text-[10px] text-amber-800 italic">Nhấn Enter hoặc bấm Thêm</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="VD: Huân chương Lao động, Công đức trùng tu Từ đường..."
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

              {/* Danh sách thành tựu đã nhập */}
              {achievements.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {achievements.map((ach, idx) => (
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

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tiểu sử tóm tắt & Ghi chú</label>
              <textarea
                rows={2}
                placeholder="Ghi chú về cuộc đời, đóng góp cho gia tộc và xã hội..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5 shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              Lưu Vào Gia Phả
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

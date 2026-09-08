import React, { useState, useMemo } from 'react';
import { Member, Branch, UserRole } from '../types';
import { matchVietnamese } from '../utils/vietnameseSearch';
import { Search, Filter, Eye, Compass, Phone, MapPin, Calendar, Heart, ShieldAlert } from 'lucide-react';

interface SmartSearchProps {
  members: Member[];
  branches: Branch[];
  userRole: UserRole;
  onSelectMember: (member: Member) => void;
  onJumpToTree: (memberId: string) => void;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  members,
  branches,
  userRole,
  onSelectMember,
  onJumpToTree,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');

  const branchMap = useMemo(() => {
    const map = new Map<string, Branch>();
    branches.forEach((b) => map.set(b.id, b));
    return map;
  }, [branches]);

  // Extract all generations present
  const generations = useMemo(() => {
    const set = new Set<number>(members.map((m) => m.generation));
    return Array.from(set).sort((a, b) => a - b);
  }, [members]);

  // Filter logic using Vietnamese unaccent matching
  const filteredResults = useMemo(() => {
    return members.filter((m) => {
      // 1. Text Search (Full name, courtesy name, posthumous name, bio, occupation)
      if (searchQuery.trim()) {
        const textToMatch = `${m.fullName} ${m.courtesyName || ''} ${m.posthumousName || ''} ${m.occupation || ''} ${m.currentAddress || ''}`;
        if (!matchVietnamese(textToMatch, searchQuery)) {
          return false;
        }
      }

      // 2. Generation filter
      if (selectedGeneration !== 'all' && m.generation !== Number(selectedGeneration)) {
        return false;
      }

      // 3. Branch filter
      if (selectedBranch !== 'all' && m.branchId !== selectedBranch) {
        return false;
      }

      // 4. Status filter
      if (selectedStatus === 'alive' && !m.isAlive) return false;
      if (selectedStatus === 'deceased' && m.isAlive) return false;

      // 5. Gender filter
      if (selectedGender !== 'all' && m.gender !== selectedGender) {
        return false;
      }

      return true;
    });
  }, [members, searchQuery, selectedGeneration, selectedBranch, selectedStatus, selectedGender]);

  const isVisitor = userRole === 'visitor';

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-[#400207] via-[#5c0612] to-[#400207] p-6 rounded-2xl border-2 border-amber-500/40 shadow-xl text-amber-50">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest font-semibold mb-1">
            <Search className="w-4 h-4" />
            Tra Cứu Thông Minh Chuẩn Tiếng Việt
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-serif text-amber-200">
            Tìm Kiếm Thành Viên & Phả Hệ Dòng Họ
          </h2>
          <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
            Hỗ trợ tìm kiếm tiếng Việt không dấu (Gõ <i>&ldquo;van ba lac&rdquo;</i> hoặc <i>&ldquo;Văn Bá Lạc&rdquo;</i> đều ra kết quả chuẩn xác). Lọc theo thế hệ, chi nhánh, quê quán và trạng thái.
          </p>

          {/* Main Search Input */}
          <div className="relative mt-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập tên thành viên, tên tự, tên húy, nghề nghiệp, nơi sinh sống..."
              className="w-full text-sm px-4 py-3 pl-11 rounded-xl bg-black/40 border border-amber-500/50 text-amber-100 placeholder-amber-400/50 focus:outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-500/30 transition-all shadow-inner"
            />
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-400 hover:text-amber-200 bg-amber-950/80 px-2 py-1 rounded"
              >
                Xóa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Multi-criteria Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            Bộ lọc:
          </span>

          {/* Generation Filter */}
          <select
            value={selectedGeneration}
            onChange={(e) => setSelectedGeneration(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:border-amber-600"
          >
            <option value="all">Tất cả thế hệ (Đời)</option>
            {generations.map((gen) => (
              <option key={gen} value={gen}>
                Đời thứ {gen}
              </option>
            ))}
          </select>

          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:border-amber-600"
          >
            <option value="all">Tất cả chi phái</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Living / Deceased Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:border-amber-600"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="alive">Đang sinh sống</option>
            <option value="deceased">Đã quy tiên (Hưởng thọ)</option>
          </select>

          {/* Gender Filter */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:border-amber-600"
          >
            <option value="all">Tất cả giới tính</option>
            <option value="male">Nam (Đinh)</option>
            <option value="female">Nữ</option>
          </select>
        </div>

        {/* Results Counter */}
        <div className="text-xs text-slate-500 font-medium">
          Tìm thấy <span className="font-bold text-amber-700">{filteredResults.length}</span> kết quả phù hợp
        </div>
      </div>

      {/* Visitor Privacy Notice */}
      {isVisitor && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            Bạn đang xem với vai trò <b>Khách (Visitor)</b>. Các thông tin cá nhân nhạy cảm như Số điện thoại, Email, Địa chỉ cư trú chi tiết được bảo mật ẩn tự động theo chuẩn RLS.
          </span>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResults.map((m) => {
          const branch = branchMap.get(m.branchId);
          return (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-300/80 bg-amber-50 flex-shrink-0">
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt={m.fullName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-amber-800">
                          {m.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm font-serif">{m.fullName}</h4>
                      {(m.courtesyName || m.posthumousName) && (
                        <p className="text-[11px] text-slate-500 italic">
                          {m.courtesyName ? `Tự: ${m.courtesyName}` : `Thụy: ${m.posthumousName}`}
                        </p>
                      )}
                      <span className="inline-block mt-0.5 text-[10.5px] px-2 py-0.5 rounded font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        {m.isRootAncestor ? 'Thủy Tổ' : `Đời thứ ${m.generation}`}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      m.isAlive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {m.isAlive ? 'Còn sống' : 'Đã mất'}
                  </span>
                </div>

                {/* Details list */}
                <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Chi nhánh:</span>
                    <span className="font-medium text-slate-800">{branch?.name || 'Chi phái'}</span>
                  </div>

                  {m.orderTitle && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Thứ bậc:</span>
                      <span className="font-medium text-slate-800">{m.orderTitle}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Năm sinh / mất:</span>
                    <span className="font-medium text-slate-800">
                      {m.birthDate ? m.birthDate.split('-')[0] : '????'} -{' '}
                      {m.isAlive ? 'Nay' : m.deathDate ? m.deathDate.split('-')[0] : 'Đã khuất'}
                    </span>
                  </div>

                  {!m.isAlive && m.deathDateLunar && (
                    <div className="flex items-center justify-between text-[11px] text-amber-700 bg-amber-50/60 px-2 py-1 rounded">
                      <span className="font-medium">Ngày giỗ âm:</span>
                      <span className="font-bold">{m.deathDateLunar}</span>
                    </div>
                  )}

                  {/* Privacy protected fields */}
                  {m.isAlive && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        {isVisitor ? 'Đông Ngạc, Hà Nội (Ẩn chi tiết)' : m.currentAddress || 'Đang cập nhật'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectMember(m)}
                  className="flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Xem hồ sơ
                </button>
                <button
                  type="button"
                  onClick={() => onJumpToTree(m.id)}
                  className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 transition-colors shadow-sm"
                  title="Định vị thành viên này trên Cây Phả Hệ"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Xem trên cây
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredResults.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-base font-bold text-slate-700">Không tìm thấy thành viên phù hợp</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Vui lòng thử gõ từ khoá khác hoặc đặt lại các bộ lọc thế hệ / chi nhánh.
          </p>
        </div>
      )}
    </div>
  );
};

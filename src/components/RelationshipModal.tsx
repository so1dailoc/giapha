import React, { useState, useMemo, useEffect } from 'react';
import { Member, RelationshipResult } from '../types';
import { calculateRelationship } from '../utils/relationshipCalculator';
import { GitCompare, Users, ArrowRight, Sparkles, BookOpen, Crown, CheckCircle2, Search, X } from 'lucide-react';
import { removeVietnameseTones } from '../utils/vietnameseSearch';

interface RelationshipModalProps {
  members: Member[];
  initialPersonAId?: string;
  initialPersonBId?: string;
  onClose?: () => void;
  onSelectMember: (member: Member) => void;
}


interface MemberSearchIndexItem {
  member: Member;
  normalizedName: string;
  normalizedSearchText: string;
}

interface MemberPickerProps {
  label: string;
  number: string;
  member: Member | undefined;
  members: Member[];
  searchIndex: MemberSearchIndexItem[];
  value: string;
  accent: 'amber' | 'blue';
  onChange: (member: Member) => void;
}

const MemberPicker: React.FC<MemberPickerProps> = ({
  label,
  number,
  member,
  members,
  searchIndex,
  value,
  accent,
  onChange,
}) => {
  const [query, setQuery] = useState(member?.fullName || '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(member?.fullName || '');
  }, [member?.id, member?.fullName]);

  const results = useMemo(() => {
    const q = removeVietnameseTones(query.trim());
    if (!q) return searchIndex.slice(0, 20).map((item) => item.member);
    const words = q.split(/\s+/).filter(Boolean);
    return searchIndex
      .filter((item) => words.every((word) => item.normalizedSearchText.includes(word)))
      .sort((a, b) => {
        const aq = a.normalizedName.startsWith(q) ? 0 : 1;
        const bq = b.normalizedName.startsWith(q) ? 0 : 1;
        return aq - bq || a.member.fullName.localeCompare(b.member.fullName, 'vi');
      })
      .slice(0, 30)
      .map((item) => item.member);
  }, [searchIndex, query]);

  const accentClasses = accent === 'amber'
    ? { badge: 'bg-amber-600', focus: 'focus:border-amber-500 focus:ring-amber-500/20', dot: 'bg-amber-600', selected: 'bg-amber-50 border-amber-200' }
    : { badge: 'bg-blue-600', focus: 'focus:border-blue-500 focus:ring-blue-500/20', dot: 'bg-blue-600', selected: 'bg-blue-50 border-blue-200' };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <span className={`w-5 h-5 rounded-full ${accentClasses.badge} text-white flex items-center justify-center text-[10px] font-bold`}>{number}</span>
          {label}
        </label>
        {member && (
          <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${accentClasses.selected}`}>
            Đời thứ {member.generation}
          </span>
        )}
      </div>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
              if (e.key === 'Enter' && results[0]) {
                e.preventDefault();
                onChange(results[0]);
                setOpen(false);
              }
            }}
            placeholder="Gõ tên thành viên, không cần dấu..."
            className={`w-full text-sm pl-9 pr-9 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium outline-none focus:ring-2 ${accentClasses.focus}`}
            aria-label={`Tìm ${label.toLowerCase()}`}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setOpen(true); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-200 flex items-center justify-center"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {open && (
          <>
            <button type="button" aria-label="Đóng danh sách thành viên" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
            <div className="absolute left-0 right-0 top-full mt-1 z-40 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl overscroll-contain">
              <div className="sticky top-0 px-3 py-2 bg-slate-50 border-b text-[10px] font-semibold text-slate-500">
                {query ? `Tìm thấy ${results.length}${results.length === 30 ? '+' : ''} thành viên` : 'Gợi ý thành viên'} • Nhấn Enter để chọn kết quả đầu tiên
              </div>
              {results.length ? results.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { onChange(m); setQuery(m.fullName); setOpen(false); }}
                  className={`w-full px-3 py-2.5 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-center gap-3 ${m.id === value ? 'bg-amber-50' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full ${accentClasses.dot} shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800 truncate">{m.fullName}</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {m.isRootAncestor ? 'Thủy Tổ' : `Đời ${m.generation}`} {m.orderTitle ? `• ${m.orderTitle}` : ''} {m.branchName ? `• ${m.branchName}` : ''}
                    </div>
                  </div>
                  {m.id === value && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              )) : (
                <div className="p-5 text-center text-xs text-slate-500">Không tìm thấy thành viên phù hợp.</div>
              )}
            </div>
          </>
        )}
      </div>

      {member && (
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className={`w-10 h-10 rounded-full overflow-hidden border ${accent === 'amber' ? 'border-amber-300 bg-amber-100' : 'border-blue-300 bg-blue-100'} flex-shrink-0`}>
            {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" /> : <div className={`w-full h-full flex items-center justify-center font-bold ${accent === 'amber' ? 'text-amber-800' : 'text-blue-800'}`}>{member.fullName.charAt(0)}</div>}
          </div>
          <div className="truncate">
            <p className="font-bold text-slate-800 truncate font-serif">{member.fullName}</p>
            <p className="text-[11px] text-slate-500 truncate">{member.courtesyName ? `Tự: ${member.courtesyName}` : member.orderTitle || 'Thành viên'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const RelationshipModal: React.FC<RelationshipModalProps> = ({
  members,
  initialPersonAId,
  initialPersonBId,
  onSelectMember,
}) => {
  const [personAId, setPersonAId] = useState<string>(
    initialPersonAId || (members.length > 0 ? members[0].id : '')
  );
  const [personBId, setPersonBId] = useState<string>(
    initialPersonBId || (members.length > 5 ? members[5].id : members[0]?.id || '')
  );

  const searchIndex = useMemo<MemberSearchIndexItem[]>(() => {
    return members.map((m) => ({
      member: m,
      normalizedName: removeVietnameseTones(m.fullName),
      normalizedSearchText: removeVietnameseTones(
        [m.fullName, m.courtesyName, m.orderTitle, m.branchName, m.chiName, m.phaiName, String(m.generation)]
          .filter(Boolean)
          .join(' ')
      ),
    }));
  }, [members]);

  const result: RelationshipResult | null = useMemo(() => {
    if (!personAId || !personBId) return null;
    return calculateRelationship(personAId, personBId, members);
  }, [personAId, personBId, members]);

  const personA = members.find((m) => m.id === personAId);
  const personB = members.find((m) => m.id === personBId);

  return (
    <div className="space-y-6">
      {/* Title & Introduction Banner */}
      <div className="bg-gradient-to-r from-[#400207] via-[#5c0612] to-[#400207] p-6 rounded-2xl border-2 border-amber-500/40 shadow-xl text-amber-50">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest font-semibold mb-1">
            <GitCompare className="w-4 h-4" />
            Sơ Đồ & Thuật Toán Mối Quan Hệ Thân Tộc
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-serif text-amber-200">
            Tra Cứu Vai Vế & Lời Xưng Hô Chuẩn Tục Lệ Việt Nam
          </h2>
          <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
            Trong văn hóa gia tộc Việt Nam: <i>&ldquo;Bé bằng củ khoai, cứ vai mà gọi&rdquo;</i>. Hệ thống tự động truy vết nhánh gốc, xác định tổ tiên chung gần nhất (LCA) và tính toán chính xác cách xưng hô giữa hai thành viên bất kỳ.
          </p>
        </div>
      </div>

      {/* Searchable member selectors — optimized for large family trees */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <MemberPicker
          label="Tìm Thành Viên Thứ Nhất (Người A)"
          number="1"
          member={personA}
          members={members}
          searchIndex={searchIndex}
          value={personAId}
          accent="amber"
          onChange={(member) => setPersonAId(member.id)}
        />
        <MemberPicker
          label="Tìm Thành Viên Thứ Hai (Người B)"
          number="2"
          member={personB}
          members={members}
          searchIndex={searchIndex}
          value={personBId}
          accent="blue"
          onChange={(member) => setPersonBId(member.id)}
        />
      </div>

      {/* Relationship Result Card */}
      {result && (
        <div className="bg-white rounded-2xl border-2 border-amber-400 p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                Kết Quả Phân Tích Mối Quan Hệ
              </h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase bg-amber-100 text-amber-900 border border-amber-300">
              {result.kinshipType}
            </span>
          </div>

          {/* Visual Kinship Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Person B calls Person A */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/80 p-5 rounded-xl border border-amber-200 space-y-2">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide block">
                {result.personB.fullName} xưng hô với {result.personA.fullName}:
              </span>
              <div className="text-2xl font-black text-amber-900 font-serif">
                {result.relationshipTitleAtoB}
              </div>
              <p className="text-xs text-amber-700/90">
                (Gọi là <b>{result.relationshipTitleAtoB}</b>, xưng là{' '}
                <b>{result.relationshipTitleBtoA}</b>)
              </p>
            </div>

            {/* Person A calls Person B */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/80 p-5 rounded-xl border border-blue-200 space-y-2">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide block">
                {result.personA.fullName} xưng hô với {result.personB.fullName}:
              </span>
              <div className="text-2xl font-black text-blue-900 font-serif">
                {result.relationshipTitleBtoA}
              </div>
              <p className="text-xs text-blue-700/90">
                (Gọi là <b>{result.relationshipTitleBtoA}</b>, xưng là{' '}
                <b>{result.relationshipTitleAtoB}</b>)
              </p>
            </div>
          </div>

          {/* Kinship Diagnostics & Common Ancestor */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Chi tiết phả hệ & Đường dẫn huyết thống:</span>
            </div>

            <p className="text-slate-600 leading-relaxed font-medium">
              {result.pathDescription}
            </p>

            {result.commonAncestor && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800">Tổ tiên chung gần nhất:</span>{' '}
                  <span className="font-bold text-amber-800">{result.commonAncestor.fullName}</span>{' '}
                  (Đời thứ {result.commonAncestor.generation})
                </div>
              </div>
            )}

            {result.culturalNote && (
              <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Ghi chú phong tục tập quán:</span> {result.culturalNote}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Member, RelationshipResult } from '../types';
import { calculateRelationship } from '../utils/relationshipCalculator';
import { GitCompare, Users, ArrowRight, Sparkles, BookOpen, Crown, CheckCircle2 } from 'lucide-react';

interface RelationshipModalProps {
  members: Member[];
  initialPersonAId?: string;
  initialPersonBId?: string;
  onClose?: () => void;
  onSelectMember: (member: Member) => void;
}

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

      {/* Selectors Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {/* Person A Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              Chọn Thành Viên Thứ Nhất (Người A):
            </label>
            {personA && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                Đời thứ {personA.generation}
              </span>
            )}
          </div>

          <select
            value={personAId}
            onChange={(e) => setPersonAId(e.target.value)}
            className="w-full text-sm p-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} ({m.isRootAncestor ? 'Thủy Tổ' : `Đời ${m.generation}`} - {m.orderTitle || (m.gender === 'male' ? 'Nam' : 'Nữ')})
              </option>
            ))}
          </select>

          {/* Quick preview person A */}
          {personA && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-300 bg-amber-100 flex-shrink-0">
                {personA.avatarUrl ? (
                  <img src={personA.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-amber-800">
                    {personA.fullName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="truncate">
                <p className="font-bold text-slate-800 truncate font-serif">{personA.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {personA.courtesyName ? `Tự: ${personA.courtesyName}` : personA.orderTitle || 'Thành viên'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Person B Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              Chọn Thành Viên Thứ Hai (Người B):
            </label>
            {personB && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                Đời thứ {personB.generation}
              </span>
            )}
          </div>

          <select
            value={personBId}
            onChange={(e) => setPersonBId(e.target.value)}
            className="w-full text-sm p-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} ({m.isRootAncestor ? 'Thủy Tổ' : `Đời ${m.generation}`} - {m.orderTitle || (m.gender === 'male' ? 'Nam' : 'Nữ')})
              </option>
            ))}
          </select>

          {/* Quick preview person B */}
          {personB && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-blue-300 bg-blue-100 flex-shrink-0">
                {personB.avatarUrl ? (
                  <img src={personB.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-blue-800">
                    {personB.fullName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="truncate">
                <p className="font-bold text-slate-800 truncate font-serif">{personB.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {personB.courtesyName ? `Tự: ${personB.courtesyName}` : personB.orderTitle || 'Thành viên'}
                </p>
              </div>
            </div>
          )}
        </div>
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

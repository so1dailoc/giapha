import React, { useMemo, useState } from 'react';
import { Check, Search, UserRound, X } from 'lucide-react';
import { Member } from '../types';
import { removeVietnameseTones } from '../utils/vietnameseSearch';

interface MemberPickerProps {
  members: Member[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  gender?: 'male' | 'female';
  excludeIds?: string[];
  hint?: string;
  emptyLabel?: string;
}

export const MemberPicker: React.FC<MemberPickerProps> = ({ members, value, onChange, label, gender, excludeIds = [], hint, emptyLabel = 'Chưa chọn' }) => {
  const [query, setQuery] = useState('');
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const selected = memberById.get(value);
  const searchIndex = useMemo(() => members.map((m) => ({
    m,
    text: removeVietnameseTones([m.fullName, m.courtesyName, m.posthumousName, m.phaiName, m.chiName, m.nhanhName, m.orderTitle, `doi ${m.generation}`].filter(Boolean).join(' ')),
    name: removeVietnameseTones(m.fullName),
  })), [members]);
  const results = useMemo(() => {
    const q = removeVietnameseTones(query);
    return searchIndex
      .filter(({ m }) => (!gender || m.gender === gender) && !excluded.has(m.id))
      .filter(({ text }) => !q || q.split(/\s+/).every((w) => text.includes(w)))
      .sort((a, b) => {
        if (!q) return a.m.generation - b.m.generation || a.m.fullName.localeCompare(b.m.fullName);
        const as = a.name.startsWith(q) ? 0 : a.name.includes(q) ? 1 : 2;
        const bs = b.name.startsWith(q) ? 0 : b.name.includes(q) ? 1 : 2;
        return as - bs || a.m.generation - b.m.generation;
      })
      .slice(0, 30)
      .map(({ m }) => m);
  }, [searchIndex, gender, excluded, query]);

  return <div className="space-y-1.5">
    <div className="flex items-center justify-between gap-2"><label className="block font-bold text-slate-700">{label}</label>{hint && <span className="text-[10px] text-slate-500">{hint}</span>}</div>
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Gõ tên ${gender === 'male' ? 'cha' : gender === 'female' ? 'mẹ' : 'thành viên'}…`} className="w-full pl-9 pr-9 p-2.5 border rounded-lg focus:border-amber-600 focus:outline-none bg-white" />
      {query && <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
    </div>
    {selected ? <button type="button" onClick={() => onChange('')} className="w-full text-left p-2 rounded-lg border border-emerald-300 bg-emerald-50 flex items-center gap-2 group">
      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5" /></div>
      <div className="min-w-0 flex-1"><div className="font-bold truncate">{selected.fullName}</div><div className="text-[10px] text-slate-500">Đời {selected.generation}{selected.orderTitle ? ` • ${selected.orderTitle}` : ''}</div></div>
      <span className="text-[10px] text-emerald-700">Đổi</span>
    </button> : <div className="text-[10px] text-slate-400 px-1">{emptyLabel}</div>}
    {query && <div className="max-h-52 overflow-y-auto border rounded-lg bg-white shadow-lg divide-y">
      {results.length ? results.map((m) => <button key={m.id} type="button" onClick={() => { onChange(m.id); setQuery(''); }} className="w-full text-left p-2.5 hover:bg-amber-50 flex items-center gap-2">
        <UserRound className="w-4 h-4 text-amber-600 shrink-0" /><div className="min-w-0"><div className="font-bold truncate">{m.fullName}</div><div className="text-[10px] text-slate-500">Đời {m.generation} • {m.phaiName || m.chiName || m.nhanhName || m.orderTitle || 'Chưa phân loại'}</div></div>
      </button>) : <div className="p-3 text-xs text-slate-500">Không tìm thấy thành viên phù hợp.</div>}
      {results.length === 30 && <div className="p-2 text-[10px] text-slate-400 bg-slate-50">Đang hiển thị 30 kết quả đầu tiên. Gõ thêm họ/tên/đời/chi để thu hẹp.</div>}
    </div>}
  </div>;
};

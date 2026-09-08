import React, { useState } from 'react';
import { DocumentItem, UserRole } from '../types';
import { Scroll, FileText, Image as ImageIcon, Eye, Tag, Download, Search, X, Sparkles, BookOpen } from 'lucide-react';

interface ArchivesManagerProps {
  documents: DocumentItem[];
  userRole: UserRole;
}

export const ArchivesManager: React.FC<ArchivesManagerProps> = ({ documents, userRole }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  const categories = [
    { key: 'all', label: 'Tất cả tư liệu' },
    { key: 'sac_phong', label: 'Sắc phong triều đình' },
    { key: 'pha_ky', label: 'Gia phả cổ chữ Nôm' },
    { key: 'huong_uoc', label: 'Hương ước & Gia quy' },
    { key: 'van_khan', label: 'Văn khấn cổ truyền' },
  ];

  const filteredDocs = documents.filter((doc) => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const match = `${doc.title} ${doc.description} ${doc.dynastyEra || ''} ${doc.tags.join(' ')}`;
      if (!match.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#400207] via-[#5c0612] to-[#400207] p-6 rounded-2xl border-2 border-amber-500/40 shadow-xl text-amber-50">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest font-semibold mb-1">
            <Scroll className="w-4 h-4" />
            Tàng Thư Các & Di Sản Tổ Tiên
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-serif text-amber-200">
            Kho Lưu Trữ Tài Liệu Lịch Sử & Sắc Phong Cổ
          </h2>
          <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
            Nơi số hóa và lưu trữ nguyên bản các bản sắc phong vua ban, phả ký chữ Nôm chép tay, hương ước làng xã và văn cúng tế cổ truyền nhằm bảo tồn vẹn nguyên cho muôn đời sau.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat.key
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sắc phong, niên hiệu..."
            className="w-full text-xs px-3 py-2 pl-8 rounded-lg border border-slate-300 focus:outline-none focus:border-amber-600"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Document Thumbnail Banner */}
              <div className="relative h-44 bg-slate-900 overflow-hidden">
                <img
                  src={doc.fileUrl}
                  alt={doc.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/90 text-amber-950 shadow">
                  {doc.categoryLabel}
                </span>

                {doc.dynastyEra && (
                  <span className="absolute bottom-3 left-3 text-xs text-amber-200 font-serif font-semibold">
                    {doc.dynastyEra}
                  </span>
                )}
              </div>

              {/* Info Body */}
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm font-serif line-clamp-2 leading-snug">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {doc.description}
                </p>

                {doc.authorOrPreserver && (
                  <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                    Lưu truyền: {doc.authorOrPreserver}
                  </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {doc.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="p-4 pt-0">
              <button
                type="button"
                onClick={() => setPreviewDoc(doc)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Xem Nguyên Bản Chi Tiết
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border-2 border-amber-500/40 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-[#400207] to-[#5c0612] px-6 py-4 text-amber-100 flex items-center justify-between">
              <h3 className="text-base font-bold font-serif text-amber-200 line-clamp-1">
                {previewDoc.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-full hover:bg-white/10 text-amber-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="rounded-xl overflow-hidden border border-slate-200 max-h-80 bg-black flex items-center justify-center">
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.title}
                  referrerPolicy="no-referrer"
                  className="max-h-80 object-contain w-auto"
                />
              </div>

              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-amber-900 font-semibold">
                  <span>Phân loại: {previewDoc.categoryLabel}</span>
                  <span>Thời kỳ: {previewDoc.dynastyEra || 'Cổ truyền'}</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-xs">
                  {previewDoc.description}
                </p>
                {previewDoc.authorOrPreserver && (
                  <p className="text-[11px] text-slate-500 italic">
                    Ghi chú bảo quản: {previewDoc.authorOrPreserver}
                  </p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-slate-600 text-[11px] leading-relaxed">
                <b>Cơ chế lưu trữ đám mây Supabase Storage:</b> File gốc chất lượng cao được lưu trong bucket <code>family-archives</code> bảo mật với RLS policy chỉ cho phép thành viên dòng họ xem và tải xuống.
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t flex items-center justify-between text-xs">
              <span className="text-slate-500">Mã tư liệu: {previewDoc.id}</span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

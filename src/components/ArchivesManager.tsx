import React, { useState } from 'react';
import { DocumentItem, DocumentImage, UserRole } from '../types';
import {
  Scroll,
  FileText,
  Image as ImageIcon,
  Eye,
  Tag,
  Download,
  Search,
  X,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Calendar,
  Shield,
  Layers,
} from 'lucide-react';

interface ArchivesManagerProps {
  documents: DocumentItem[];
  userRole: UserRole;
}

export const ArchivesManager: React.FC<ArchivesManagerProps> = ({ documents, userRole }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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

  const getDocImages = (doc: DocumentItem): DocumentImage[] => {
    if (doc.images && doc.images.length > 0) {
      return doc.images;
    }
    return [
      {
        id: 'main-img',
        url: doc.fileUrl,
        caption: `Bản chụp tài liệu nguyên bản: ${doc.title}`,
      },
    ];
  };

  const openDocPreview = (doc: DocumentItem) => {
    setPreviewDoc(doc);
    setActiveImageIndex(0);
    setIsLightboxOpen(false);
  };

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
            Nơi số hóa và lưu trữ nguyên bản các bản sắc phong vua ban, phả ký chữ Nôm chép tay, hương ước làng xã và văn cúng tế cổ truyền. Hỗ trợ hiển thị nhiều ảnh chất lượng cao kèm chú thích báo chí chuyên sâu.
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
        {filteredDocs.map((doc) => {
          const docImages = getDocImages(doc);
          const hasMultipleImages = docImages.length > 1;

          return (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Document Thumbnail Banner */}
                <div className="relative h-48 bg-slate-900 overflow-hidden">
                  <img
                    src={doc.fileUrl}
                    alt={doc.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/90 text-amber-950 shadow">
                    {doc.categoryLabel}
                  </span>

                  {/* Multi-image badge */}
                  {hasMultipleImages && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full bg-black/70 text-amber-200 border border-amber-400/40 backdrop-blur-sm flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {docImages.length} ảnh
                    </span>
                  )}

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
                  onClick={() => openDocPreview(doc)}
                  className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-700" />
                  Xem Tư Liệu & Ảnh Báo Chí ({docImages.length})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Newspaper-Style Photo Essay Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#fcfaf7] w-full max-w-4xl rounded-2xl shadow-2xl border-2 border-amber-500/50 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#400207] via-[#5c0612] to-[#400207] px-6 py-4 text-amber-100 flex items-center justify-between border-b border-amber-500/40">
              <div className="flex items-center gap-2">
                <Scroll className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="text-[10px] text-amber-300 uppercase tracking-widest font-semibold block">
                    Di Sản Tàng Thư • Chuyên Trang Báo Chí
                  </span>
                  <h3 className="text-sm md:text-base font-bold font-serif text-amber-100 line-clamp-1">
                    {previewDoc.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-amber-200 transition-colors"
                title="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 md:p-7 overflow-y-auto space-y-6 flex-1 text-xs text-slate-800">
              {/* Document Metadata Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/80">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-600 text-white">
                    {previewDoc.categoryLabel}
                  </span>
                  <span className="font-serif font-semibold text-amber-900 text-xs">
                    {previewDoc.dynastyEra || 'Thời đại cổ truyền'}
                  </span>
                </div>
                {previewDoc.recordedDate && (
                  <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>Thời điểm ghi chép: {previewDoc.recordedDate}</span>
                  </div>
                )}
              </div>

              {/* Main Headline & Editorial Description */}
              <div className="space-y-3">
                <h2 className="text-lg md:text-2xl font-bold font-serif text-[#3e0409] leading-snug">
                  {previewDoc.title}
                </h2>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm leading-relaxed text-slate-700 font-serif text-xs md:text-sm space-y-2">
                  <p className="first-letter:text-3xl first-letter:font-bold first-letter:text-amber-800 first-letter:mr-1 first-letter:float-left">
                    {previewDoc.description}
                  </p>
                  {previewDoc.authorOrPreserver && (
                    <p className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-100">
                      Nguồn bảo tồn / Chấp bút: <b>{previewDoc.authorOrPreserver}</b>
                    </p>
                  )}
                </div>
              </div>

              {/* NEWSPAPER-STYLE PHOTO GALLERY SECTION */}
              {(() => {
                const docImages = getDocImages(previewDoc);
                const currentImg = docImages[activeImageIndex] || docImages[0];

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-amber-700" />
                        <h4 className="font-bold text-slate-900 font-serif text-sm">
                          Bộ Ảnh Tư Liệu & Chú Thích Báo Chí ({docImages.length} bức ảnh)
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Ảnh {activeImageIndex + 1} / {docImages.length}
                      </span>
                    </div>

                    {/* Featured Photo with Newspaper Caption Frame */}
                    <div className="bg-white p-3 rounded-2xl border-2 border-amber-300/80 shadow-md space-y-3">
                      <div className="relative rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[460px] group">
                        <img
                          src={currentImg.url}
                          alt={currentImg.caption || previewDoc.title}
                          referrerPolicy="no-referrer"
                          className="max-h-[440px] w-auto object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]"
                          onClick={() => setIsLightboxOpen(true)}
                        />

                        {/* Navigation arrows if multiple images */}
                        {docImages.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndex((prev) =>
                                  prev > 0 ? prev - 1 : docImages.length - 1
                                );
                              }}
                              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                              title="Ảnh trước"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndex((prev) =>
                                  prev < docImages.length - 1 ? prev + 1 : 0
                                );
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                              title="Ảnh tiếp theo"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => setIsLightboxOpen(true)}
                          className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-white text-[11px] flex items-center gap-1 backdrop-blur-sm"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          Phóng to
                        </button>
                      </div>

                      {/* NEWSPAPER CAPTION UNDER PHOTO */}
                      <div className="p-3 bg-amber-50/90 rounded-xl border-l-4 border-amber-600 text-slate-800">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-700 font-bold text-xs uppercase tracking-wider flex-shrink-0">
                            📷 Ảnh {activeImageIndex + 1}:
                          </span>
                          <p className="text-xs md:text-sm font-serif italic text-slate-800 leading-relaxed">
                            {currentImg.caption || 'Tư liệu lịch sử nguyên bản dòng tộc.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Thumbnail Strip if multiple images */}
                    {docImages.length > 1 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-600">
                          Chọn ảnh xem chi tiết:
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                          {docImages.map((img, idx) => (
                            <button
                              key={img.id || idx}
                              type="button"
                              onClick={() => setActiveImageIndex(idx)}
                              className={`relative flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                                activeImageIndex === idx
                                  ? 'border-amber-600 ring-2 ring-amber-400 scale-105'
                                  : 'border-slate-300 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={img.url}
                                alt={`Thumbnail ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center py-0.5">
                                #{idx + 1}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Newspaper Multi-Photo Essay Stream (Tất cả hình ảnh kèm chú thích trải dài như một bài báo) */}
                    {docImages.length > 1 && (
                      <div className="pt-4 border-t border-slate-200 space-y-4">
                        <h5 className="font-bold font-serif text-slate-900 text-xs uppercase tracking-wider text-amber-900">
                          Toàn Bộ Ảnh & Chú Thích Trong Bài Báo
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {docImages.map((img, idx) => (
                            <div
                              key={img.id || idx}
                              onClick={() => setActiveImageIndex(idx)}
                              className={`p-2.5 bg-white rounded-xl border transition-all cursor-pointer ${
                                activeImageIndex === idx
                                  ? 'border-amber-500 shadow-md ring-1 ring-amber-400'
                                  : 'border-slate-200 hover:border-amber-300'
                              }`}
                            >
                              <div className="h-40 rounded-lg overflow-hidden bg-slate-900 mb-2">
                                <img
                                  src={img.url}
                                  alt={img.caption || `Hình ${idx + 1}`}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <p className="text-[11px] font-serif italic text-slate-700 leading-snug">
                                <b className="text-amber-800 not-italic mr-1">Hình {idx + 1}:</b>
                                {img.caption || 'Tư liệu cổ'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Preservation & Archival Note */}
              <div className="p-3.5 bg-slate-100 rounded-xl text-slate-600 text-[11px] leading-relaxed border border-slate-200">
                <b>Bảo mật & Lưu trữ vĩnh cửu:</b> Tất cả các ảnh sắc phong độ phân giải cao được phân loại theo niên hiệu, lưu giữ an toàn trên hệ thống Supabase Storage với chữ ký số bảo mật, phục vụ cho việc phục chế và tra cứu của con cháu muôn đời sau.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">Mã lưu trữ: {previewDoc.id}</span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-amber-200 font-semibold rounded-xl transition-colors shadow-sm"
              >
                Đóng Tàng Thư
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Fullscreen Modal */}
      {isLightboxOpen && previewDoc && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-lg"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white z-10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {(() => {
            const docImages = getDocImages(previewDoc);
            const currentImg = docImages[activeImageIndex] || docImages[0];

            return (
              <div
                className="max-w-5xl w-full flex flex-col items-center space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative max-h-[75vh] flex items-center justify-center">
                  <img
                    src={currentImg.url}
                    alt={currentImg.caption || previewDoc.title}
                    referrerPolicy="no-referrer"
                    className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
                  />
                  {docImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageIndex((prev) =>
                            prev > 0 ? prev - 1 : docImages.length - 1
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageIndex((prev) =>
                            prev < docImages.length - 1 ? prev + 1 : 0
                          )
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>

                <div className="w-full max-w-2xl bg-black/80 border border-white/20 p-3.5 rounded-xl text-center">
                  <span className="text-amber-400 text-xs font-bold mr-1">
                    Ảnh {activeImageIndex + 1}/{docImages.length}:
                  </span>
                  <span className="text-white text-xs md:text-sm font-serif italic">
                    {currentImg.caption || previewDoc.title}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { PostItem, FundRecord, UserRole } from '../types';
import {
  MessageSquare,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Heart,
  Share2,
  Award,
  Send,
  Plus,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CommunityAndFundProps {
  posts: PostItem[];
  funds: FundRecord[];
  userRole: UserRole;
  onAddPost?: (post: PostItem) => void;
  onAddFund?: (fund: FundRecord) => void;
}

export const CommunityAndFund: React.FC<CommunityAndFundProps> = ({
  posts,
  funds,
  userRole,
  onAddPost,
  onAddFund,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'news' | 'funds'>('news');
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Post form state
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<PostItem['category']>('khuyen_hoc');

  // Fund calculations
  const totalIncome = funds
    .filter((f) => f.type === 'income')
    .reduce((sum, f) => sum + f.amount, 0);
  const totalExpense = funds
    .filter((f) => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleLike = (postId: string, initialLikes: number) => {
    if (likedPosts.has(postId)) return;
    const current = likes[postId] ?? initialLikes;
    setLikes((prev) => ({ ...prev, [postId]: current + 1 }));
    setLikedPosts((prev) => new Set(prev).add(postId));
    confetti({
      particleCount: 20,
      spread: 50,
      origin: { y: 0.8 },
    });
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const newPost: PostItem = {
      id: `post-${Date.now()}`,
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      category: newPostCategory,
      authorName: userRole === 'super_admin' ? 'Hội đồng Trưởng tộc' : 'Thành viên dòng họ',
      authorRole: userRole === 'super_admin' ? 'Trưởng Tộc' : 'Thành viên',
      createdAt: 'Hôm nay',
      likesCount: 1,
      commentsCount: 0,
    };

    if (onAddPost) onAddPost(newPost);
    setNewPostTitle('');
    setNewPostContent('');
    confetti({ particleCount: 30, spread: 60 });
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs navigation */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveSubTab('news')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeSubTab === 'news'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Bảng Tin & Mạng Xã Hội Dòng Tộc
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('funds')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeSubTab === 'funds'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Sổ Quỹ Gia Tộc (Thu Chi Minh Bạch)
          </button>
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline italic">
          Cố kết tình thân • Đồng lòng xây dựng dòng họ
        </span>
      </div>

      {activeSubTab === 'news' ? (
        /* Community News Section */
        <div className="space-y-6">
          {/* Post Creation Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              Đăng Tin Thông Báo / Vinh Danh Con Cháu
            </h3>
            <form onSubmit={handleCreatePost} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Tiêu đề bài viết (VD: Mừng thọ cụ bà, Vinh danh học giỏi...)"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="sm:col-span-2 text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-amber-600"
                />
                <select
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value as PostItem['category'])}
                  className="text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-amber-600 bg-slate-50 font-medium"
                >
                  <option value="khuyen_hoc">Vinh danh & Khuyến học</option>
                  <option value="thong_bao">Thông báo gia tộc</option>
                  <option value="hi_su">Hỷ sự (Đám cưới / Thôi nôi)</option>
                  <option value="tang_su">Tang sự & Phân ưu</option>
                </select>
              </div>

              <textarea
                required
                rows={2}
                placeholder="Nội dung bài viết chia sẻ cùng các bác, các cô chú anh chị em trong họ..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:border-amber-600"
              />

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Đăng Bài Viết
                </button>
              </div>
            </form>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.map((p) => {
              const currentLikes = likes[p.id] ?? p.likesCount;
              const isLiked = likedPosts.has(p.id);

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
                >
                  {/* Author header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-amber-800 text-sm">
                        {p.authorName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">{p.authorName}</h4>
                        <p className="text-[11px] text-slate-400">
                          {p.authorRole} • {p.createdAt}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10.5px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                      {p.category === 'khuyen_hoc'
                        ? 'Khuyến Học'
                        : p.category === 'thong_bao'
                        ? 'Thông Báo'
                        : p.category === 'hi_su'
                        ? 'Hỷ Sự'
                        : 'Tin Gia Tộc'}
                    </span>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 font-serif leading-snug mb-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{p.content}</p>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleLike(p.id, p.likesCount)}
                      className={`flex items-center gap-1.5 font-semibold transition-colors ${
                        isLiked ? 'text-rose-600' : 'hover:text-rose-600'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600' : ''}`} />
                      <span>{currentLikes} Thích</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span>{p.commentsCount} bình luận</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Fund Management Section */
        <div className="space-y-6">
          {/* Fund Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Số Dư Quỹ Hiện Tại
              </span>
              <div className="text-2xl font-black text-amber-700 font-serif">
                {balance.toLocaleString('vi-VN')} VNĐ
              </div>
              <p className="text-[11px] text-slate-400">Được giám sát bởi Ban Tài chính Gia tộc</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Tổng Thu & Công Đức
              </span>
              <div className="text-2xl font-black text-emerald-700 font-serif">
                +{totalIncome.toLocaleString('vi-VN')} VNĐ
              </div>
              <p className="text-[11px] text-slate-400">Từ con cháu nội ngoại & các chi nhánh</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider block flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                Tổng Chi Tế Tự & Khuyến Học
              </span>
              <div className="text-2xl font-black text-red-700 font-serif">
                -{totalExpense.toLocaleString('vi-VN')} VNĐ
              </div>
              <p className="text-[11px] text-slate-400">Chi cúng tế sóc vọng, học bổng con cháu</p>
            </div>
          </div>

          {/* Fund Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Bảng Kê Chi Tiết Thu Chi Minh Bạch
              </h3>
              <span className="text-xs text-slate-500">Cập nhật niên khóa 2026</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="p-3">Mã phiếu</th>
                    <th className="p-3">Khoản mục</th>
                    <th className="p-3">Người đóng góp / Thụ hưởng</th>
                    <th className="p-3">Chi phái</th>
                    <th className="p-3">Ngày</th>
                    <th className="p-3 text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {funds.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono font-medium text-slate-500">{f.receiptNumber || f.id}</td>
                      <td className="p-3 font-semibold text-slate-800">{f.title}</td>
                      <td className="p-3 text-slate-600">{f.contributorOrReceiver}</td>
                      <td className="p-3 text-slate-500">{f.branchName || 'Đại tộc'}</td>
                      <td className="p-3 text-slate-500">{f.date}</td>
                      <td
                        className={`p-3 text-right font-bold ${
                          f.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {f.type === 'income' ? '+' : '-'}
                        {f.amount.toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

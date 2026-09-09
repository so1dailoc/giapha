import React, { useState } from 'react';
import { PostItem, UserRole } from '../types';
import {
  MessageSquare,
  Heart,
  Share2,
  Award,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CommunityAndFundProps {
  posts: PostItem[];
  userRole: UserRole;
  onAddPost?: (post: PostItem) => void;
}

export const CommunityAndFund: React.FC<CommunityAndFundProps> = ({
  posts,
  userRole,
  onAddPost,
}) => {
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Post form state
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<PostItem['category']>('khuyen_hoc');

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
      {/* Community News Section */}
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
    </div>
  );
};

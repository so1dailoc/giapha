import React, { useState } from 'react';
import { ClanUser, UserRole } from '../types';
import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';
import {
  X,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ClanUser | null;
  clanUsers: ClanUser[];
  onLoginWithGoogle: () => void;
  onLogout: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  clanUsers,
  onLoginWithGoogle,
  onLogout,
}) => {
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Không còn đăng nhập giả bằng email. Danh tính và vai trò phải đến từ Supabase Auth.
  const handleSupabaseOAuthLogin = async () => {
    if (!supabase) {
      setErrorMsg('Ứng dụng chưa được cấu hình Supabase. Hãy thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể đăng nhập Google.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1e0204] border-2 border-amber-500/50 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-amber-50 text-xs">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3c0308] via-[#5c0612] to-[#3c0308] p-5 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md">
              <svg className="w-full h-full" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold font-serif text-amber-200 uppercase tracking-wide">
                Đăng Nhập Google Tài Khoản Dòng Tộc
              </h2>
              <p className="text-[11px] text-amber-300/70">
                Xác thực danh tính con cháu & Phân quyền quản trị
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-amber-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Currently logged-in status (if any) */}
          {currentUser && (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover border border-emerald-400 flex-shrink-0"
                />
                <div className="truncate">
                  <div className="font-bold text-emerald-200 text-xs flex items-center gap-1.5 truncate">
                    <span>{currentUser.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 uppercase font-mono">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-300/80 font-mono truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-500/40 text-[11px] font-semibold whitespace-nowrap transition-colors"
              >
                Đăng Xuất
              </button>
            </div>
          )}

          <div className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-950/70 to-[#250104] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow">
                <svg className="w-7 h-7" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-serif font-bold text-amber-200">Đăng nhập an toàn bằng Google</h3>
                <p className="text-[11px] text-amber-300/70">Vai trò quản trị được kiểm tra trên Supabase, không thể tự nhập email để giả mạo tài khoản.</p>
              </div>
            </div>

            <button type="button" onClick={handleSupabaseOAuthLogin} disabled={loading || !isSupabaseConfigured}
              className="w-full px-4 py-3 rounded-xl bg-white text-slate-800 font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <span className="w-4 h-4 rounded-full border-2 border-slate-500 border-t-transparent animate-spin"/> : <ArrowRight className="w-4 h-4"/>}
              {loading ? 'Đang chuyển sang Google…' : 'Tiếp tục với Google'}
            </button>

            {!isSupabaseConfigured && (
              <div className="rounded-xl bg-amber-900/30 border border-amber-500/30 p-3 text-[11px] text-amber-200">
                Chưa cấu hình Supabase. Sau khi thêm biến môi trường VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trên Vercel, nút đăng nhập sẽ hoạt động.
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl bg-red-950/60 border border-red-500/40 p-3 text-[11px] text-red-200 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0"/>{errorMsg}
              </div>
            )}
          </div>

          <div className="text-[10px] text-amber-300/60 leading-relaxed">
            <b>Lưu ý:</b> Google chỉ xác thực danh tính. Quyền Super Admin/Trưởng Chi/Editor do bảng <code>clan_users</code> trong Supabase quyết định.
          </div>
        </div>
      </div>
    </div>
  );
};

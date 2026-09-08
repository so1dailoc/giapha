import React, { useState } from 'react';
import type { ClanUser } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { X, ShieldCheck, AlertCircle, LogOut, UserCheck } from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ClanUser | null;
  clanUsers: ClanUser[];
  onLoginWithGoogle: (user: ClanUser) => void;
  onLogout: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ isOpen, onClose, currentUser, onLogout }) => {
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;

  const login = async () => {
    if (!supabase || !isSupabaseConfigured) {
      setErrorMsg('Supabase chưa được cấu hình. Hãy thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trên Vercel.');
      return;
    }
    try {
      setLoading(true); setErrorMsg('');
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể kết nối Google OAuth.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#1e0204] border-2 border-amber-500/50 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-amber-50 text-xs">
        <div className="bg-gradient-to-r from-[#3c0308] via-[#5c0612] to-[#3c0308] p-5 border-b border-amber-500/30 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif text-amber-200 uppercase tracking-wide">Đăng nhập tài khoản dòng tộc</h2>
            <p className="text-[11px] text-amber-300/70">Xác thực bằng Google và phân quyền từ Supabase</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full text-amber-300 hover:text-white hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          {currentUser ? (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-emerald-300" />
                <div className="min-w-0">
                  <div className="font-bold text-emerald-200 truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-emerald-300/80 font-mono truncate">{currentUser.email}</div>
                  <div className="text-[10px] text-amber-300 mt-1">Quyền: {currentUser.role}</div>
                </div>
              </div>
              <button type="button" onClick={onLogout} className="w-full py-2 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-500/40 font-semibold flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" /> Đăng xuất
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-amber-500/30 bg-black/30 p-4 space-y-3">
                <div className="font-bold text-amber-200 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Đăng nhập an toàn</div>
                <p className="text-[11px] text-amber-300/70 leading-relaxed">Bạn phải xác thực bằng tài khoản Google thật. Website không cho phép nhập email để giả lập đăng nhập. Sau khi Google xác thực, quyền được đọc từ bảng <code>clan_users</code>.</p>
                {errorMsg && <div className="p-2 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-[11px] flex items-center gap-2"><AlertCircle className="w-4 h-4" />{errorMsg}</div>}
                <button type="button" onClick={login} disabled={loading} className="w-full py-2.5 bg-white text-slate-800 rounded-xl font-bold flex items-center justify-center gap-2 shadow hover:bg-slate-100 disabled:opacity-60">
                  <span className="text-lg font-black">G</span>{loading ? 'Đang chuyển sang Google...' : 'Tiếp tục với Google'}
                </button>
              </div>
              <p className="text-[10px] text-amber-400/60 text-center">Tài khoản mới được tạo với quyền member. Chỉ quản trị viên được cấp quyền cao hơn.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

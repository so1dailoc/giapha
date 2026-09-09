import React, { useState } from 'react';
import { ClanUser, UserRole } from '../types';
import {
  DEFAULT_SUPER_ADMIN_EMAIL,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';
import {
  X,
  Crown,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Mail,
  UserCheck,
  Sparkles,
  ArrowRight,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ClanUser | null;
  clanUsers: ClanUser[];
  onLoginWithGoogle: (user: ClanUser) => void;
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
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Sign in as the designated Super Admin
  const handleSelectSuperAdmin = () => {
    const adminUser = clanUsers.find((u) => u.email === DEFAULT_SUPER_ADMIN_EMAIL) || {
      id: 'user-phucthinh',
      email: DEFAULT_SUPER_ADMIN_EMAIL,
      name: 'Phúc Thịnh (Hội Đồng Trưởng Tộc)',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      role: 'super_admin' as UserRole,
      createdAt: new Date().toISOString(),
      status: 'active' as const,
      notes: 'Super Admin Tối Cao',
    };

    onLoginWithGoogle(adminUser);
    confetti({ particleCount: 50, spread: 70 });
    onClose();
  };

  // Sign in with another existing clan user
  const handleSelectUser = (user: ClanUser) => {
    onLoginWithGoogle(user);
    confetti({ particleCount: 30, spread: 60 });
    onClose();
  };

  // Sign in with custom Google Email
  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = customEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập định dạng email Google hợp lệ (@gmail.com)!');
      return;
    }

    // Check if this email already exists in configured clanUsers
    const existing = clanUsers.find((u) => u.email.toLowerCase() === email);
    if (existing) {
      onLoginWithGoogle(existing);
    } else {
      // If email is DEFAULT_SUPER_ADMIN_EMAIL
      const isSuperAdminEmail = email === DEFAULT_SUPER_ADMIN_EMAIL.toLowerCase();
      const newUser: ClanUser = {
        id: `user-${Date.now()}`,
        email,
        name: customName.trim() || email.split('@')[0],
        role: isSuperAdminEmail ? 'super_admin' : 'member',
        createdAt: new Date().toISOString(),
        status: 'active',
        notes: isSuperAdminEmail
          ? 'Tài khoản Super Admin Tối Cao sáng lập hệ thống'
          : 'Tài khoản thành viên dòng họ đăng nhập bằng Google',
      };
      onLoginWithGoogle(newUser);
    }

    confetti({ particleCount: 35, spread: 65 });
    onClose();
  };

  // Official Supabase Google OAuth (if configured)
  const handleSupabaseOAuthLogin = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi kích hoạt Google OAuth trên Supabase');
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

          {/* Primary Designated Super Admin Box */}
          <div className="rounded-xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-950/80 via-[#3a060b] to-[#250104] p-4 shadow-xl space-y-3 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-amber-950 flex items-center gap-1 shadow">
              <Crown className="w-3 h-3" />
              Super Admin Tối Cao
            </div>

            <div className="space-y-1">
              <div className="text-amber-300 font-serif font-bold text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Tài Khoản Quản Trị Viên Trưởng Tộc
              </div>
              <p className="text-[11px] text-amber-200/80">
                Đã cấp sẵn toàn quyền quản trị tối cao cho Email của bạn:
              </p>
            </div>

            <div className="bg-black/40 rounded-xl p-2.5 border border-amber-500/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center font-bold text-amber-300">
                  PT
                </div>
                <div>
                  <div className="font-bold text-amber-100 font-mono text-xs">
                    {DEFAULT_SUPER_ADMIN_EMAIL}
                  </div>
                  <div className="text-[10px] text-amber-400/90">
                    Phúc Thịnh • Hội Đồng Trưởng Tộc (Toàn Quyền Quản Trị)
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSelectSuperAdmin}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold rounded-lg shadow-md flex items-center gap-1.5 transition-all text-xs flex-shrink-0"
              >
                Đăng Nhập Ngay
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Select Configured Clan Accounts */}
          <div className="space-y-2">
            <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>Hoặc Chọn Tài Khoản Đã Cấp Quyền Khác:</span>
              <span className="text-[10px] text-amber-400/60 font-normal">
                {clanUsers.length} tài khoản
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {clanUsers
                .filter((u) => u.email !== DEFAULT_SUPER_ADMIN_EMAIL)
                .map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-400/40 transition-all flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-amber-900/60 border border-amber-500/40 flex items-center justify-center font-bold text-amber-200 text-[11px] flex-shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-amber-100 group-hover:text-amber-300 truncate">
                          {u.name}
                        </div>
                        <div className="text-[10px] text-amber-400/70 font-mono truncate">
                          {u.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-mono">
                        {u.role === 'branch_admin'
                          ? 'Trưởng Chi'
                          : u.role === 'editor'
                          ? 'Ban Thư Ký'
                          : u.role}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Form: Login with any other Google Email */}
          <form
            onSubmit={handleCustomGoogleSubmit}
            className="rounded-xl border border-amber-500/20 bg-black/30 p-4 space-y-3"
          >
            <div className="font-bold text-amber-200 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-amber-400" />
              Đăng Nhập Bằng Email Google Tự Do
            </div>
            <p className="text-[11px] text-amber-300/70">
              Nhập email Google của thành viên con cháu để đăng nhập xem phả hệ hoặc nhận quyền:
            </p>

            {errorMsg && (
              <div className="p-2 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-bold text-amber-300 mb-0.5 uppercase">
                  Địa Chỉ Email Google (@gmail.com) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="VD: nguyenvanan@gmail.com"
                  value={customEmail}
                  onChange={(e) => {
                    setCustomEmail(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full p-2 rounded-lg bg-black/50 border border-amber-500/40 text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-400 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-300 mb-0.5 uppercase">
                  Họ Và Tên Hiển Thị (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Văn Bá An"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-2 rounded-lg bg-black/50 border border-amber-500/40 text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              Đăng Nhập Với Email Này
            </button>
          </form>

          {/* Real Supabase OAuth notice */}
          {isSupabaseConfigured && (
            <div className="pt-2 border-t border-amber-500/20">
              <button
                type="button"
                onClick={handleSupabaseOAuthLogin}
                disabled={loading}
                className="w-full py-2.5 bg-white text-slate-800 rounded-xl font-bold flex items-center justify-center gap-2 shadow hover:bg-slate-100 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                {loading ? 'Đang kết nối Google...' : 'Đăng nhập chính thức qua Supabase OAuth'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

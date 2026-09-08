import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, FolderTree, ShieldCheck, Sparkles, Server, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

export const DatabaseSchemaView: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'nextjs' | 'deploy'>('sql');

  const supabaseSqlScript = `-- =========================================================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU GIA PHẢ ĐẠI TỘC TRÊN SUPABASE POSTGRESQL (0đ)
-- Hỗ trợ: Unaccent Extension, RLS Policy, RBAC, Triggers, Storage
-- =========================================================================

-- 1. BẬT TIỆN ÍCH TÌM KIẾM TIẾNG VIỆT KHÔNG DẤU (UNACCENT)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. TẠO BẢNG PHÂN QUYỀN NGƯỜI DÙNG (USERS PROFILE VÀ ROLES)
CREATE TYPE user_role_enum AS ENUM ('super_admin', 'branch_admin', 'member', 'visitor');

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role user_role_enum DEFAULT 'visitor' NOT NULL,
  branch_id UUID,
  member_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TẠO BẢNG CHI PHÁI DÒNG HỌ (BRANCHES)
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  leader_id UUID,
  description TEXT,
  ancestor_name TEXT,
  color_accent TEXT DEFAULT '#dc2626',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TẠO BẢNG THÀNH VIÊN GIA PHẢ (MEMBERS)
CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY, -- vd: mem-101
  full_name TEXT NOT NULL,
  courtesy_name TEXT, -- Tên tự / Tên chữ
  posthumous_name TEXT, -- Tên thụy / Tên húy
  gender TEXT CHECK (gender IN ('male', 'female', 'other')) NOT NULL,
  generation INT NOT NULL, -- Đời thứ mấy (1, 2, 3...)
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  order_in_family INT DEFAULT 1,
  order_title TEXT, -- Trưởng nam, Thứ nam, Trưởng nữ...
  
  -- Ngày sinh / Ngày mất (Hỗ trợ cả Dương lịch & Âm lịch)
  birth_date DATE,
  birth_date_lunar TEXT,
  is_alive BOOLEAN DEFAULT true NOT NULL,
  death_date DATE,
  death_date_lunar TEXT, -- Dùng để tính ngày giỗ hàng năm
  burial_location TEXT, -- Nơi an táng / Mộ phần
  burial_coordinates JSONB, -- Tọa độ GPS Google Maps { lat, lng }
  burial_lat DOUBLE PRECISION, -- Tọa độ vĩ độ
  burial_lng DOUBLE PRECISION, -- Tọa độ kinh độ
  
  -- Thông tin cá nhân & Liên hệ
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  current_address TEXT,
  occupation TEXT,
  bio TEXT,
  achievements TEXT[], -- Mảng thành tựu, khen thưởng
  
  -- Quan hệ huyết thống trực hệ
  father_id TEXT REFERENCES public.members(id) ON DELETE SET NULL,
  mother_id TEXT REFERENCES public.members(id) ON DELETE SET NULL,
  spouse_ids TEXT[], -- Mảng ID phối ngẫu
  
  is_root_ancestor BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index tăng tốc tìm kiếm tiếng Việt không dấu & lọc phả hệ
CREATE INDEX IF NOT EXISTS idx_members_generation ON public.members(generation);
CREATE INDEX IF NOT EXISTS idx_members_branch ON public.members(branch_id);
CREATE INDEX IF NOT EXISTS idx_members_name_unaccent ON public.members USING gin (to_tsvector('simple', unaccent(full_name)));

-- 5. TẠO BẢNG SỰ KIỆN & NGÀY GIỖ (EVENTS)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- death_anniversary, clan_meeting, tomb_cleaning...
  member_id TEXT REFERENCES public.members(id) ON DELETE CASCADE,
  lunar_day INT NOT NULL,
  lunar_month INT NOT NULL,
  lunar_year INT,
  description TEXT,
  location TEXT,
  responsible_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TẠO BẢNG KHO TƯ LIỆU & SẮC PHONG (DOCUMENTS)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- sac_phong, pha_ky, huong_uoc, van_khan
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  description TEXT,
  recorded_date DATE,
  dynasty_era TEXT, -- Triều Lê, Triều Nguyễn...
  author_or_preserver TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TẠO BẢNG BÀI VIẾT & VINH DANH (POSTS)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  images TEXT[],
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TẠO BẢNG SỔ QUỸ DÒNG HỌ THU CHI (FUNDS)
CREATE TABLE IF NOT EXISTS public.funds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  amount BIGINT NOT NULL,
  contributor_or_receiver TEXT NOT NULL,
  purpose TEXT,
  branch_name TEXT,
  receipt_number TEXT,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - BẢO MẬT DỮ LIỆU PHÂN QUYỀN CHẶT CHẼ
-- =========================================================================

-- Bật RLS trên toàn bộ bảng
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;

-- Helper Function: Lấy Role của User hiện tại
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS user_role_enum AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS BẢNG MEMBERS:
-- Khách & Member chỉ được xem dữ liệu (Visitor bị client ẩn SĐT/Địa chỉ)
CREATE POLICY "Cho phép tất cả mọi người xem cây gia phả"
  ON public.members FOR SELECT USING (true);

-- Trưởng Tộc (super_admin) & Trưởng Chi (branch_admin) có quyền thêm/sửa
CREATE POLICY "Trưởng Tộc và Trưởng Chi được quyền thêm thành viên"
  ON public.members FOR INSERT WITH CHECK (
    public.get_current_role() IN ('super_admin', 'branch_admin')
  );

CREATE POLICY "Trưởng Tộc và Trưởng Chi được quyền sửa thành viên"
  ON public.members FOR UPDATE USING (
    public.get_current_role() IN ('super_admin', 'branch_admin')
  );

CREATE POLICY "Chỉ Trưởng Tộc được quyền xóa thành viên"
  ON public.members FOR DELETE USING (
    public.get_current_role() = 'super_admin'
  );

-- RLS BẢNG FUNDS: Minh bạch cho toàn tộc xem, chỉ Admin thêm sửa
CREATE POLICY "Toàn họ được xem sổ quỹ"
  ON public.funds FOR SELECT USING (true);

CREATE POLICY "Ban tài chính và Trưởng tộc quản lý quỹ"
  ON public.funds FOR ALL USING (
    public.get_current_role() IN ('super_admin', 'branch_admin')
  );`;

  const nextJsStructure = `my-family-tree/ (Next.js 15 App Router)
├── app/
│   ├── layout.tsx                   # Root layout (Theme provider, Fonts)
│   ├── page.tsx                     # Trang chủ & Cây gia phả tương tác
│   ├── tim-kiem/
│   │   └── page.tsx                 # Tra cứu thông minh unaccent & bộ lọc
│   ├── tinh-quan-he/
│   │   └── page.tsx                 # Relationship calculator & xưng hô
│   ├── ngay-gio/
│   │   └── page.tsx                 # Lịch âm, ngày giỗ, đếm ngược
│   ├── tu-lieu/
│   │   └── page.tsx                 # Kho tư liệu, sắc phong, gia phả cổ
│   ├── bang-tin/
│   │   └── page.tsx                 # Mạng xã hội dòng họ & Sổ quỹ tộc
│   └── api/
│       ├── members/route.ts         # Supabase client route
│       └── backup/route.ts          # Edge function backup dữ liệu định kỳ
├── components/
│   ├── tree/
│   │   ├── FamilyTree.tsx           # Canvas @xyflow/react chính
│   │   ├── FamilyTreeNode.tsx       # Custom Node truyền thống Đỏ/Vàng
│   │   └── TreeControls.tsx         # Bộ chuyển theme, zoom, toggles
│   ├── modals/
│   │   ├── MemberModal.tsx          # Xem & Sửa chi tiết tiểu sử
│   │   └── AddMemberModal.tsx       # Thêm con / phối ngẫu trực quan
│   └── ui/                          # Button, Modal, Tabs, Badges
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # createBrowserClient()
│   │   └── server.ts                # createServerClient()
│   ├── lunar/
│   │   └── lunarCalendar.ts         # Chuyển đổi Âm lịch - Dương lịch
│   └── utils/
│       ├── vietnameseSearch.ts      # Unaccent matching
│       └── relationshipCalc.ts      # Thuật toán tính LCA & vai vế
├── supabase/
│   ├── schema.sql                   # Toàn bộ database DDL & RLS
│   └── functions/
│       └── backup-clan-data/        # Edge function tự động backup 0đ
├── package.json
└── tailwind.config.ts`;

  const handleCopy = () => {
    navigator.clipboard.writeText(supabaseSqlScript);
    setCopiedSql(true);
    confetti({ particleCount: 25, spread: 60 });
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#400207] via-[#5c0612] to-[#400207] p-6 rounded-2xl border-2 border-amber-500/40 shadow-xl text-amber-50">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest font-semibold mb-1">
            <Server className="w-4 h-4" />
            Kiến Trúc Backend & Database Supabase 0đ
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-serif text-amber-200">
            Database Schema & Hướng Dẫn Triển Khai Miễn Phí
          </h2>
          <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
            Thiết kế hoàn chỉnh theo tiêu chuẩn cơ sở dữ liệu quan hệ PostgreSQL trên Supabase: Phân quyền RLS chặt chẽ, tối ưu unaccent tiếng Việt và sẵn sàng chạy trên Next.js / GitHub Pages / Vercel với chi phí 0đ trọn đời.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'sql'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          Mã Nguồn SQL Supabase (1-Click Copy)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('nextjs')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'nextjs'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Cấu Trúc Thư Mục Next.js (App Router)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('deploy')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'deploy'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-4 h-4" />
          Quy Trình Triển Khai 0đ (Vercel + Supabase)
        </button>
      </div>

      {activeTab === 'sql' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
          <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-bold text-slate-200">supabase_schema_family_tree.sql</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 transition-colors text-xs"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  Đã Copy Toàn Bộ SQL!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Sao Chép Mã SQL (1-Click)
                </>
              )}
            </button>
          </div>

          <pre className="p-5 text-emerald-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[500px]">
            <code>{supabaseSqlScript}</code>
          </pre>
        </div>
      )}

      {activeTab === 'nextjs' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl p-5">
          <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <FolderTree className="w-4 h-4" />
            Cấu trúc dự án chuẩn Next.js 15 App Router & Clean Architecture
          </div>
          <pre className="text-amber-100 font-mono text-xs leading-relaxed overflow-x-auto p-4 bg-slate-950 rounded-xl border border-slate-800">
            <code>{nextJsStructure}</code>
          </pre>
        </div>
      )}

      {activeTab === 'deploy' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs text-slate-700">
          <h3 className="text-base font-bold text-slate-900 font-serif">
            Hướng Dẫn Tối Ưu Chi Phí 0đ (Zero-Cost Deployment)
          </h3>
          <ol className="list-decimal pl-5 space-y-2.5 leading-relaxed">
            <li>
              <b>Bước 1: Tạo dự án Supabase miễn phí (0đ):</b> Đăng ký tài khoản tại <code>supabase.com</code>, tạo một Project mới. Vào mục <b>SQL Editor</b>, dán mã nguồn SQL ở Tab trên và nhấn <b>Run</b> để tạo bảng, indexes và RLS policies.
            </li>
            <li>
              <b>Bước 2: Tạo Storage Bucket:</b> Vào mục <b>Storage</b> trong Supabase Dashboard, tạo 2 buckets: <code>family-avatars</code> (Public) và <code>family-archives</code> (Private, cấp quyền xem cho authenticated users).
            </li>
            <li>
              <b>Bước 3: Tích hợp Frontend Next.js:</b> Đẩy mã nguồn lên GitHub. Cung cấp 2 biến môi trường: <code>NEXT_PUBLIC_SUPABASE_URL</code> và <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
            </li>
            <li>
              <b>Bước 4: Deploy lên Vercel hoặc GitHub Pages:</b> Kết nối Repo GitHub với Vercel (Hobby plan miễn phí 100%). Website sẽ tự động build và có chứng chỉ SSL HTTPS miễn phí trọn đời.
            </li>
            <li>
              <b>Bước 5: Sao lưu dữ liệu tự động (Edge Function):</b> Kích hoạt Cron Trigger trên Supabase hàng tuần xuất file JSON dump dữ liệu và gửi vào bucket lưu trữ phòng ngừa rủi ro.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};

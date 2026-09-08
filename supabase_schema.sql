-- ========================================================
-- CƠ SỞ DỮ LIỆU GIA PHẢ TỘC VĂN (SUPABASE POSTGRESQL 0Đ)
-- Tự động phân quyền RLS & Tích hợp Google OAuth
-- Tài khoản Quản trị tối cao (Super Admin): 13.phucthinh@gmail.com
-- ========================================================

-- 1. BẬT TIỆN ÍCH MÃ HÓA UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. BẢNG QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN (CLAN_USERS)
CREATE TABLE IF NOT EXISTS public.clan_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'branch_admin', 'editor', 'member', 'visitor')),
    member_id TEXT, -- Khóa ngoại liên kết tới hồ sơ cá nhân trên cây gia phả
    branch_id TEXT, -- Nếu là Trưởng Chi, quản lý chi nào
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'blocked')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Khởi tạo sẵn Super Admin Tối Cao cho Phúc Thịnh
INSERT INTO public.clan_users (email, name, role, status, notes)
VALUES (
    '13.phucthinh@gmail.com',
    'Phúc Thịnh (Hội Đồng Trưởng Tộc)',
    'super_admin',
    'active',
    'Tài khoản Super Admin Tối Cao sáng lập hệ thống Gia Phả'
)
ON CONFLICT (email) DO UPDATE 
SET role = 'super_admin', status = 'active';

-- 3. BẢNG THÔNG TIN ĐẠI TỘC & TỪ ĐƯỜNG (CLAN_INFO)
CREATE TABLE IF NOT EXISTS public.clan_info (
    id TEXT PRIMARY KEY DEFAULT 'main_clan',
    name TEXT NOT NULL,
    branch_subtitle TEXT,
    ancestral_hall TEXT,
    address TEXT,
    founding_year INT,
    motto TEXT,
    motto_meaning TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. BẢNG PHÂN CHI / PHÁI (BRANCHES)
CREATE TABLE IF NOT EXISTS public.branches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    leader_id TEXT,
    description TEXT,
    ancestor_id TEXT,
    color_accent TEXT DEFAULT '#d97706',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. BẢNG THÀNH VIÊN CÂY GIA PHẢ (MEMBERS)
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    courtesy_name TEXT,
    posthumous_name TEXT,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    generation INT NOT NULL,
    branch_id TEXT,
    phai_name TEXT,
    chi_name TEXT,
    nhanh_name TEXT,
    order_in_family INT DEFAULT 1,
    order_title TEXT,
    birth_place TEXT,
    birth_date TEXT,
    birth_date_lunar TEXT,
    is_alive BOOLEAN DEFAULT true,
    death_date TEXT,
    death_date_lunar TEXT,
    burial_location TEXT,
    avatar_url TEXT,
    phone TEXT,
    email TEXT,
    current_address TEXT,
    occupation TEXT,
    bio TEXT,
    achievements JSONB DEFAULT '[]'::jsonb,
    father_id TEXT,
    mother_id TEXT,
    spouse_ids JSONB DEFAULT '[]'::jsonb,
    is_root_ancestor BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. BẢNG SẮC PHONG & TƯ LIỆU HÁN NÔM (DOCUMENTS)
CREATE TABLE IF NOT EXISTS public.documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('sac_phong', 'pha_ky', 'huong_uoc', 'van_khan', 'hinh_anh_mo_to', 'khac')),
    category_label TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT DEFAULT 'image',
    description TEXT,
    dynasty_era TEXT,
    author_or_preserver TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. BẢNG LỊCH GIỖ & TẾ LỄ ÂM LỊCH (EVENTS)
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    member_id TEXT,
    lunar_day INT NOT NULL,
    lunar_month INT NOT NULL,
    lunar_year INT,
    description TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. BẢNG SỔ CÔNG ĐỨC & QUỸ TỘC (FUNDS)
CREATE TABLE IF NOT EXISTS public.funds (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC NOT NULL,
    contributor_or_receiver TEXT NOT NULL,
    date TEXT NOT NULL,
    purpose TEXT NOT NULL,
    branch_name TEXT,
    receipt_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. BẢNG BẢNG TIN & VINH DANH KHUYẾN HỌC (POSTS)
CREATE TABLE IF NOT EXISTS public.posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    avatar_url TEXT,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- THIẾT LẬP BẢO MẬT & PHÂN QUYỀN HÀNG (ROW LEVEL SECURITY)
-- ========================================================
ALTER TABLE public.clan_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Hàm kiểm tra quyền Super Admin (đối chiếu email từ token Google của Supabase Auth)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() ->> 'email' = '13.phucthinh@gmail.com'
        OR EXISTS (
            SELECT 1 FROM public.clan_users
            WHERE email = auth.jwt() ->> 'email'
              AND role = 'super_admin'
              AND status = 'active'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Chính sách đọc: Mọi người dùng (kể cả khách) đều có thể xem dữ liệu gia phả công khai
CREATE POLICY "Public Read Members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Public Read Branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Public Read Documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Public Read Events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public Read Funds" ON public.funds FOR SELECT USING (true);
CREATE POLICY "Public Read Posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public Read Clan Info" ON public.clan_info FOR SELECT USING (true);
CREATE POLICY "Public Read Clan Users" ON public.clan_users FOR SELECT USING (true);

-- Chính sách ghi: Chỉ Super Admin hoặc tài khoản quản trị được sửa dữ liệu phả hệ
CREATE POLICY "Super Admin Manage Members" ON public.members 
FOR ALL USING (public.is_super_admin() OR auth.role() = 'service_role');

CREATE POLICY "Super Admin Manage Documents" ON public.documents 
FOR ALL USING (public.is_super_admin() OR auth.role() = 'service_role');

CREATE POLICY "Super Admin Manage Events" ON public.events 
FOR ALL USING (public.is_super_admin() OR auth.role() = 'service_role');

CREATE POLICY "Super Admin Manage Clan Users" ON public.clan_users 
FOR ALL USING (public.is_super_admin() OR auth.role() = 'service_role');

CREATE POLICY "Super Admin Manage Clan Info" ON public.clan_info 
FOR ALL USING (public.is_super_admin() OR auth.role() = 'service_role');

CREATE POLICY "Authenticated Members Create Posts" ON public.posts 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ========================================================
-- PHẦN BỔ SUNG: ĐỒNG BỘ FRONTEND VỚI SUPABASE + RLS AN TOÀN
-- Có thể chạy lại nhiều lần sau schema cũ.
-- ========================================================
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS burial_coordinates JSONB;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS responsible_branch_id TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS recorded_date TEXT;

-- Hàm lấy role của người đang đăng nhập.
CREATE OR REPLACE FUNCTION public.current_clan_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.clan_users
  WHERE lower(email) = lower(auth.jwt() ->> 'email')
    AND status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email','')) = '13.phucthinh@gmail.com'
      OR EXISTS (
        SELECT 1 FROM public.clan_users
        WHERE lower(email) = lower(auth.jwt() ->> 'email')
          AND role = 'super_admin'
          AND status = 'active'
      );
$$;

-- Tự tạo hồ sơ clan_users sau khi Google Auth tạo user.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.clan_users (email, name, avatar_url, role, status, notes)
  VALUES (
    lower(NEW.email),
    coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url',
    CASE WHEN lower(NEW.email) = '13.phucthinh@gmail.com' THEN 'super_admin' ELSE 'member' END,
    'active',
    'Tài khoản được tạo tự động từ Google OAuth'
  )
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    avatar_url = coalesce(EXCLUDED.avatar_url, public.clan_users.avatar_url),
    role = CASE WHEN lower(EXCLUDED.email) = '13.phucthinh@gmail.com' THEN 'super_admin' ELSE public.clan_users.role END,
    status = CASE WHEN public.clan_users.status = 'blocked' THEN 'blocked' ELSE 'active' END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_clan_user ON auth.users;
CREATE TRIGGER on_auth_user_created_clan_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Bỏ các policy public clan_users cũ để không lộ danh sách email/phân quyền.
DROP POLICY IF EXISTS "Public Read Clan Users" ON public.clan_users;
DROP POLICY IF EXISTS "Super Admin Manage Clan Users" ON public.clan_users;
CREATE POLICY "Users Read Own Clan User" ON public.clan_users
  FOR SELECT USING (lower(email) = lower(auth.jwt() ->> 'email') OR public.is_super_admin());
CREATE POLICY "Super Admin Manage Clan Users V2" ON public.clan_users
  FOR ALL USING (public.is_super_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_super_admin() OR auth.role() = 'service_role');

-- Xoá các policy cũ có thể quá rộng, rồi tạo lại quyền ghi.
DROP POLICY IF EXISTS "Super Admin Manage Members" ON public.members;
DROP POLICY IF EXISTS "Super Admin Manage Documents" ON public.documents;
DROP POLICY IF EXISTS "Super Admin Manage Events" ON public.events;
DROP POLICY IF EXISTS "Super Admin Manage Clan Info" ON public.clan_info;
DROP POLICY IF EXISTS "Authenticated Members Create Posts" ON public.posts;

CREATE POLICY "Admins Manage Members" ON public.members
  FOR ALL USING (
    public.is_super_admin()
    OR public.current_clan_role() IN ('editor')
    OR (public.current_clan_role() = 'branch_admin' AND branch_id = (SELECT branch_id FROM public.clan_users WHERE lower(email)=lower(auth.jwt()->>'email') LIMIT 1))
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    public.is_super_admin()
    OR public.current_clan_role() IN ('editor')
    OR (public.current_clan_role() = 'branch_admin' AND branch_id = (SELECT branch_id FROM public.clan_users WHERE lower(email)=lower(auth.jwt()->>'email') LIMIT 1))
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Admins Manage Documents V2" ON public.documents
  FOR ALL USING (public.is_super_admin() OR public.current_clan_role() IN ('editor') OR auth.role()='service_role')
  WITH CHECK (public.is_super_admin() OR public.current_clan_role() IN ('editor') OR auth.role()='service_role');

CREATE POLICY "Admins Manage Events V2" ON public.events
  FOR ALL USING (
    public.is_super_admin() OR public.current_clan_role() IN ('editor')
    OR (public.current_clan_role() = 'branch_admin' AND (responsible_branch_id = (SELECT branch_id FROM public.clan_users WHERE lower(email)=lower(auth.jwt()->>'email') LIMIT 1) OR EXISTS (SELECT 1 FROM public.members mm WHERE mm.id = member_id AND mm.branch_id = (SELECT branch_id FROM public.clan_users WHERE lower(email)=lower(auth.jwt()->>'email') LIMIT 1))))
    OR auth.role()='service_role'
  )
  WITH CHECK (
    public.is_super_admin() OR public.current_clan_role() IN ('editor')
    OR (public.current_clan_role() = 'branch_admin' AND (responsible_branch_id = (SELECT branch_id FROM public.clan_users WHERE lower(email)=lower(auth.jwt()->>'email') LIMIT 1) OR EXISTS (SELECT 1 FROM public.members mm WHERE mm.id = member_id AND mm.branch_id = (SELECT branch_id FROM public.clan_users WHERE lower(email)=lower(auth.jwt()->>'email') LIMIT 1))))
    OR auth.role()='service_role'
  );

CREATE POLICY "Admins Manage Clan Info V2" ON public.clan_info
  FOR ALL USING (public.is_super_admin() OR auth.role()='service_role')
  WITH CHECK (public.is_super_admin() OR auth.role()='service_role');

DROP POLICY IF EXISTS "Admins Manage Branches" ON public.branches;
CREATE POLICY "Admins Manage Branches" ON public.branches
  FOR ALL USING (public.is_super_admin() OR public.current_clan_role() = 'editor' OR auth.role()='service_role')
  WITH CHECK (public.is_super_admin() OR public.current_clan_role() = 'editor' OR auth.role()='service_role');

CREATE POLICY "Authenticated Create Posts V2" ON public.posts
  FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "Admins Update Delete Posts V2" ON public.posts
  FOR UPDATE USING (public.is_super_admin() OR public.current_clan_role() IN ('editor') OR auth.role()='service_role')
  WITH CHECK (public.is_super_admin() OR public.current_clan_role() IN ('editor') OR auth.role()='service_role');

-- Quỹ tài chính: chỉ Super Admin/editor quản lý.
DROP POLICY IF EXISTS "Admins Manage Funds" ON public.funds;
CREATE POLICY "Admins Manage Funds" ON public.funds
  FOR ALL USING (public.is_super_admin() OR public.current_clan_role() IN ('editor') OR auth.role()='service_role')
  WITH CHECK (public.is_super_admin() OR public.current_clan_role() IN ('editor') OR auth.role()='service_role');

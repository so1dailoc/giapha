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
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
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

ALTER TABLE public.clan_users ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

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
    default_tree_settings JSONB DEFAULT '{}'::jsonb,
    allow_user_view_customization BOOLEAN DEFAULT true,
    contact_notice TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.clan_info ADD COLUMN IF NOT EXISTS default_tree_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.clan_info ADD COLUMN IF NOT EXISTS allow_user_view_customization BOOLEAN DEFAULT true;
ALTER TABLE public.clan_info ADD COLUMN IF NOT EXISTS contact_notice TEXT;
ALTER TABLE public.clan_info ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.clan_info ADD COLUMN IF NOT EXISTS contact_email TEXT;

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
    burial_coordinates JSONB, -- Lưu { lat: number, lng: number } tọa độ Google Maps mộ phần
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
    recorded_date TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
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
    responsible_branch_id TEXT,
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

-- Bổ sung an toàn cho database đã tạo từ phiên bản cũ.
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS recorded_date TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS responsible_branch_id TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS burial_coordinates JSONB;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS burial_location TEXT;

CREATE INDEX IF NOT EXISTS idx_members_generation ON public.members(generation);
CREATE INDEX IF NOT EXISTS idx_members_generation_full_name ON public.members(generation ASC, full_name ASC);
CREATE INDEX IF NOT EXISTS idx_members_branch_generation ON public.members(branch_id, generation ASC);
CREATE INDEX IF NOT EXISTS idx_members_phai_generation ON public.members(phai_name, generation ASC);
CREATE INDEX IF NOT EXISTS idx_members_branch_id ON public.members(branch_id);
CREATE INDEX IF NOT EXISTS idx_members_father_id ON public.members(father_id);
CREATE INDEX IF NOT EXISTS idx_members_mother_id ON public.members(mother_id);
CREATE INDEX IF NOT EXISTS idx_events_member_id ON public.events(member_id);
CREATE INDEX IF NOT EXISTS idx_events_lunar ON public.events(lunar_month, lunar_day);
CREATE INDEX IF NOT EXISTS idx_clan_users_email ON public.clan_users(lower(email));

-- ========================================================
-- THIẾT LẬP BẢO MẬT & PHÂN QUYỀN HÀNG (RLS)
-- ========================================================
ALTER TABLE public.clan_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Đồng bộ hồ sơ Google Auth -> clan_users.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.clan_users (auth_user_id, email, name, avatar_url, role, status)
  VALUES (
    NEW.id,
    lower(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN lower(NEW.email) = '13.phucthinh@gmail.com' THEN 'super_admin' ELSE 'member' END,
    'active'
  )
  ON CONFLICT (email) DO UPDATE
  SET auth_user_id = EXCLUDED.auth_user_id,
      name = COALESCE(NULLIF(EXCLUDED.name, ''), public.clan_users.name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.clan_users.avatar_url);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clan_users
    WHERE auth_user_id = auth.uid()
      AND role = 'super_admin'
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.clan_users WHERE auth_user_id = auth.uid() AND status = 'active'),
    'visitor'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_branch_admin(target_branch_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
      OR EXISTS (
        SELECT 1 FROM public.clan_users
        WHERE auth_user_id = auth.uid()
          AND status = 'active'
          AND role = 'branch_admin'
          AND branch_id = target_branch_id
      );
$$;

-- Xóa policy cũ để script có thể chạy lại nhiều lần.
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('clan_users','clan_info','branches','members','documents','events','funds','posts')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- Dữ liệu gia phả công khai: chỉ đọc các bảng không chứa thông tin tài khoản riêng.
CREATE POLICY "Public read members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Public read branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Public read documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public read clan info" ON public.clan_info FOR SELECT USING (true);
CREATE POLICY "Public read posts" ON public.posts FOR SELECT USING (true);

-- Sổ quỹ mặc định chỉ người đã đăng nhập mới xem.
CREATE POLICY "Authenticated read funds" ON public.funds
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Người dùng chỉ xem hồ sơ tài khoản của mình; Super Admin xem toàn bộ.
CREATE POLICY "Users read own profile" ON public.clan_users
FOR SELECT USING (auth.uid() = auth_user_id OR public.is_super_admin());

-- Super Admin toàn quyền.
CREATE POLICY "Super admin members" ON public.members
FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin branches" ON public.branches
FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin documents" ON public.documents
FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin events" ON public.events
FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin funds" ON public.funds
FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin posts" ON public.posts
FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin clan info" ON public.clan_info
FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin clan users" ON public.clan_users
FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Trưởng Chi chỉ được sửa thành viên trong chi của mình.
CREATE POLICY "Branch admin manage members" ON public.members
FOR ALL
USING (public.is_branch_admin(branch_id))
WITH CHECK (public.is_branch_admin(branch_id));

-- Editor được chỉnh tài liệu/bài viết, không được đổi tài khoản hay thành viên.
CREATE POLICY "Editor manage documents" ON public.documents
FOR ALL USING (public.current_user_role() IN ('editor','super_admin'))
WITH CHECK (public.current_user_role() IN ('editor','super_admin'));

CREATE POLICY "Editor manage posts" ON public.posts
FOR INSERT WITH CHECK (public.current_user_role() IN ('editor','member','super_admin'));

-- Người dùng đã xác thực có thể cập nhật chính hồ sơ của mình ở mức thông tin đồng bộ,
-- nhưng không được tự nâng role vì UPDATE clan_users chỉ Super Admin.
-- Dữ liệu hiện có: liên kết tài khoản cũ với auth.users nếu email trùng.
UPDATE public.clan_users cu
SET auth_user_id = au.id
FROM auth.users au
WHERE lower(cu.email) = lower(au.email)
  AND cu.auth_user_id IS NULL;

NOTIFY pgrst, 'reload schema';

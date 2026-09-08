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

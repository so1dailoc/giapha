-- Chạy 1 lần nếu database đã được tạo bằng schema.sql phiên bản cũ.
ALTER TABLE public.clan_info ADD COLUMN IF NOT EXISTS default_tree_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.clan_info ADD COLUMN IF NOT EXISTS allow_user_view_customization BOOLEAN DEFAULT true;
ALTER TABLE public.clan_info ADD COLUMN IF NOT EXISTS contact_notice TEXT;
ALTER TABLE public.clan_info ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.clan_info ADD COLUMN IF NOT EXISTS contact_email TEXT;
NOTIFY pgrst, 'reload schema';

-- Gia Phả Đại Tộc: mobile/reactflow settings
-- Chạy sau schema.sql nếu database đã tồn tại.
ALTER TABLE public.clan_info
  ADD COLUMN IF NOT EXISTS default_tree_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS allow_user_view_customization BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS contact_notice TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

UPDATE public.clan_info
SET default_tree_settings = COALESCE(default_tree_settings, '{}'::jsonb)
WHERE default_tree_settings IS NULL;

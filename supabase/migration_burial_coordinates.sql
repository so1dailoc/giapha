-- ========================================================
-- LỆNH SỬA LỖI NHANH: CỘT burial_coordinates TRÊN SUPABASE
-- Dán đoạn mã này vào Supabase SQL Editor và nhấn "RUN"
-- ========================================================

-- 1. Bổ sung cột burial_coordinates dạng JSONB (chứa { lat, lng })
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS burial_coordinates JSONB;

-- 2. Bổ sung cột burial_location dạng TEXT nếu thiếu
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS burial_location TEXT;

-- 3. Làm mới Schema Cache của PostgREST Supabase ngay lập tức
NOTIFY pgrst, 'reload schema';

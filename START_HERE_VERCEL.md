# GIA PHẢ – BẢN SẠCH ĐỂ DEPLOY VERCEL + SUPABASE

## 1. Cấu trúc bắt buộc

Các file `index.html`, `package.json`, `vercel.json` và thư mục `src/` phải nằm ở ROOT của GitHub repository.

## 2. Vercel

- Framework: Vite
- Root Directory: ./
- Build Command: npm run build
- Output Directory: dist
- Install Command: npm install --no-audit --no-fund

## 3. Environment Variables

Thêm cả 2 biến cho Production, Preview và Development:

- VITE_SUPABASE_URL = Project URL trong Supabase
- VITE_SUPABASE_ANON_KEY = Publishable/anon key của Supabase

KHÔNG đưa service_role key vào frontend.

## 4. Supabase

Sau khi database/schema hiện tại đã có dữ liệu, chạy `supabase_migration_vercel.sql` trong Supabase SQL Editor.

## 5. Google OAuth

Supabase Dashboard -> Authentication -> URL Configuration:
- Site URL = domain Vercel của website
- Redirect URL = domain Vercel + `/auth/v1/callback` nếu cấu hình provider yêu cầu; đồng thời kiểm tra URL callback Google OAuth do Supabase cung cấp trong Authentication -> Providers -> Google.

## 6. Nếu Vercel vẫn hiển thị commit cũ

Tạo deployment mới từ commit mới nhất trên branch `main`, hoặc xóa project Vercel rồi Import lại repository.

## 7. Kiểm tra trước deploy

ROOT phải có:
- index.html
- package.json
- vercel.json
- vite.config.ts
- src/main.tsx

Không được đặt toàn bộ project bên trong thêm một thư mục con.

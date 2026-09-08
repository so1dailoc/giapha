# Hướng dẫn deploy Gia Phả Tộc Văn lên Vercel + Supabase

## 1. GitHub
Đẩy toàn bộ thư mục này lên repository và bảo đảm `index.html`, `package.json`, `src/` nằm cùng một cấp ở root repository.

Cấu trúc bắt buộc:

```text
index.html
package.json
vite.config.ts
vercel.json
src/main.tsx
src/App.tsx
src/lib/supabase.ts
src/lib/database.ts
```

Nếu GitHub có thêm một thư mục bao ngoài, hãy đặt **Root Directory** của Vercel vào thư mục chứa `index.html` và `package.json`.

## 2. Vercel
Thiết lập:

- Framework Preset: Vite
- Build Command: `bun run build`
- Output Directory: `dist`
- Install Command: `bun install`

Thêm Environment Variables:

- `VITE_SUPABASE_URL` = URL project Supabase
- `VITE_SUPABASE_ANON_KEY` = anon/publishable key của Supabase

Không đưa `service_role` key vào frontend.

## 3. Supabase SQL
Nếu database của bạn đã có các bảng theo schema cũ, chạy:

`supabase_migration_vercel.sql`

trong Supabase SQL Editor.

Migration này bổ sung:

- `members.burial_coordinates`
- `events.responsible_branch_id`
- `documents.recorded_date`
- trigger tự tạo `clan_users` sau Google OAuth
- RLS cho role quản trị
- bỏ quyền đọc công khai danh sách `clan_users`
- quyền ghi cho branches/funds và các bảng quản trị

Nếu tạo project database mới hoàn toàn, có thể chạy `supabase_schema.sql` sau đó kiểm tra lại migration.

## 4. Google OAuth
Trong Supabase:

Authentication → Providers → Google: bật Google provider.

Authentication → URL Configuration:

- Site URL = domain Vercel của website
- Redirect URLs = domain Vercel của website, ví dụ `https://ten-site.vercel.app/`

Nếu có domain riêng, thêm domain đó vào Redirect URLs.

## 5. Cách phân quyền
Google OAuth là xác thực thật. Người dùng không thể tự nhập email để giả lập đăng nhập.

- `13.phucthinh@gmail.com`: Super Admin
- tài khoản Google mới: `member`
- Super Admin có thể cấp `branch_admin` hoặc `editor` trong AdminCP

## 6. Dữ liệu
Ứng dụng hiện đọc dữ liệu từ Supabase khi khởi động. Khi Supabase có dữ liệu, giao diện ưu tiên dữ liệu database; dữ liệu mẫu chỉ làm fallback nếu bảng tương ứng đang rỗng.

Các thao tác CRUD chính được đồng bộ:

- members
- branches
- events
- documents
- posts
- funds
- clan_info
- clan_users

## 7. Nếu Vercel vẫn báo `Failed to resolve /src/main.tsx`
Đừng sửa Supabase. Kiểm tra Vercel → Settings → General → Root Directory.

Thư mục Root Directory phải chứa trực tiếp:

```text
index.html
package.json
src/main.tsx
```

Lỗi này xảy ra trước khi ứng dụng chạy và không phải lỗi database.

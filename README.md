# Gia Phả Đại Tộc — bản production

Ứng dụng React + Vite + Tailwind CSS + Supabase dành cho quản lý gia phả, cây phả hệ, ngày giỗ, tư liệu, bảng tin và sổ quỹ.

## Điểm đã hoàn thiện

- Cây gia phả 2D với `@xyflow/react`, thu gọn/mở rộng nhánh và chế độ sổ phả.
- Tìm kiếm tiếng Việt không dấu.
- Tính quan hệ họ hàng xử lý đồng thời liên kết Cha và Mẹ, không còn chọn duy nhất một phía.
- Chuyển đổi âm lịch Việt Nam bằng thuật toán thiên văn, không còn ước lượng 29,53 ngày.
- Đồng bộ thành viên với Supabase.
- Đồng bộ tài khoản quản trị với Supabase Auth + Google OAuth.
- RBAC ở cả giao diện và RLS: Super Admin, Trưởng Chi, Editor, Member.
- Không còn cơ chế nhập email tùy ý để giả lập đăng nhập.
- Không lưu phiên đăng nhập/role trong `localStorage`.
- RLS được viết lại để không công khai danh sách email tài khoản.
- Bổ sung index cho các truy vấn gia phả thường dùng.
- Schema có migration an toàn cho các cột cũ như `burial_coordinates`.
- Giao diện mobile có bottom navigation, drawer, vùng an toàn cho iPhone và input không tự zoom.
- Hỗ trợ `prefers-reduced-motion`.
- Seed dữ liệu hỗ trợ members, branches, events, documents, funds và posts.
- Vite config phù hợp deploy Vercel.

## 1. Chạy local

Yêu cầu Node.js 20+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở `http://localhost:3000`.

### Biến môi trường

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Chỉ dùng **anon/publishable key** ở frontend. Không đưa `service_role` key vào GitHub, `.env`, Vercel frontend hoặc mã nguồn.

## 2. Cấu hình Supabase

1. Tạo project trên Supabase.
2. Vào **SQL Editor**.
3. Mở file `src/lib/supabase.ts`.
4. Sao chép phần `SUPABASE_SQL_SCHEMA` hoặc dùng `public/supabase_import.sql` cho dữ liệu.
5. Chạy schema trước.
6. Sau đó nhập dữ liệu mẫu nếu cần.
7. Vào **Authentication → Providers → Google** và bật Google.
8. Cấu hình Google OAuth Client ID/Secret theo hướng dẫn của Supabase.
9. Trong Supabase Authentication → URL Configuration:
   - Site URL: URL Vercel của ứng dụng.
   - Redirect URL: URL Vercel của ứng dụng.
10. Đăng nhập Google bằng tài khoản Super Admin đã được khai báo trong schema. Trigger sẽ liên kết tài khoản Supabase Auth với `clan_users`.

### Quyền quản trị

Role không được quyết định bởi email nhập trong giao diện. Quyền được lấy từ `public.clan_users` và được RLS kiểm tra ở database.

- `super_admin`: toàn quyền.
- `branch_admin`: quản lý thành viên thuộc `branch_id` được giao.
- `editor`: quản lý tư liệu/bài viết theo policy.
- `member`: tài khoản thành viên.
- `visitor`: khách chưa đăng nhập.

## 3. Deploy Vercel

### Cách làm khuyến nghị

1. Tạo repository GitHub mới.
2. Upload toàn bộ mã nguồn của thư mục này.
3. Vào Vercel → **Add New Project** → chọn repository.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Thêm Environment Variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

8. Deploy.
9. Copy domain Vercel vào Supabase Authentication → URL Configuration.
10. Kiểm tra đăng nhập Google.

## 4. Kiểm tra trước khi deploy

```bash
npm install
npm run check
npm run build
```

Nếu môi trường hiện tại chưa cài dependencies thì `npm run check` sẽ báo thiếu module; sau `npm install` hãy chạy lại.

## 5. Import dữ liệu

Các file dữ liệu:

- `public/clan_data_full.json`: dữ liệu JSON đầy đủ.
- `public/clan_data_doi7_8.json`: dữ liệu các đời được tách riêng.
- `public/supabase_import.sql`: dữ liệu SQL để nhập vào Supabase.

Nên sao lưu database trước khi import lại dữ liệu lớn.

## 6. Lưu ý bảo mật

Không commit:

- `.env.local`
- `VITE_*` secret ngoài các public client keys
- `SUPABASE_SERVICE_ROLE_KEY`
- Google Client Secret
- token/session thủ công

Frontend chỉ sử dụng Supabase anon/publishable key; quyền thực tế phải được bảo vệ bằng RLS.

## 7. Cấu trúc chính

```text
src/
  components/       UI và các màn hình
  data/             dữ liệu mẫu
  lib/              Supabase client/service
  utils/            tìm kiếm, lịch âm, quan hệ họ hàng
  App.tsx           ứng dụng chính
  types.ts          kiểu dữ liệu
public/
  clan_data_full.json
  clan_data_doi7_8.json
  supabase_import.sql
scripts/
  generate_sql.ts
  generate_doi7_8.ts
  update_full_data.ts
```

## 8. Các lệnh

- `npm run dev` — chạy development.
- `npm run build` — build production.
- `npm run preview` — xem bản production local.
- `npm run check` — kiểm tra TypeScript.


## Tính năng đề xuất vị trí mộ qua Google Maps

Thành viên có thể mở hồ sơ người đã khuất, chọn **Gửi vị trí Google Maps**, dán link Google Maps hoặc lấy GPS hiện tại trên điện thoại. Đề xuất được lưu ở trạng thái `pending` và chưa làm thay đổi dữ liệu chính thức.

Ban quản trị vào **AdminCP → Xác Nhận Vị Trí Mộ** để mở Google Maps kiểm tra, ghi chú và **Xác nhận** hoặc **Từ chối**. Chỉ khi xác nhận, `members.burial_coordinates` mới được cập nhật.

Chạy file `supabase/migration_burial_location_submissions.sql` một lần trên Supabase SQL Editor nếu database hiện tại chưa có bảng đề xuất vị trí mộ. Schema đầy đủ trong AdminCP cũng đã bao gồm bảng này.

> Trên iPhone/Android, chức năng GPS yêu cầu website chạy HTTPS và người dùng cho phép trình duyệt truy cập vị trí.

## Chuẩn vai vế Hán-Việt & xưng hô xứ Quảng

Hệ thống tra cứu quan hệ hiện tách thành **2 lớp danh xưng**:

- **Phả ký / văn cúng:** Phụ thân, Mẫu thân, Hiển khảo, Hiển tỷ, Tổ phụ, Tổ mẫu, Tằng tổ, Cao tổ; xuống dưới là Tử/Nữ, Tôn, Tằng tôn, Huyền tôn, Lai tôn và các đời sâu hơn.
- **Giao tiếp dân gian:** Cha/Mẹ, Ông/Bà, Cố, Sơ; Con, Cháu, Chắt, Chút, Chít; bàng hệ ưu tiên Bác/Chú/Cô (O), Cậu/Dì khi dữ liệu cha/mẹ và thứ tự anh chị em đủ để xác định.

Vai vế được ưu tiên theo **đời + quan hệ phả hệ + Phái/Chi/Nhánh**, không tự động đổi chỉ vì chênh lệch tuổi. Khi dữ liệu chưa đủ, hệ thống dùng danh xưng an toàn thay vì đoán Bác/Chú/Cậu/Dì.

AdminCP có thêm **Kiểm tra tính toàn vẹn gia phả** để phát hiện liên kết cha/mẹ mồ côi, phối ngẫu không đối xứng, đời không khớp với cha/mẹ, quan hệ tự trỏ và các lỗi cơ bản trước khi biên soạn văn bản.

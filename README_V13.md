# Gia Phả Đại Tộc — V13

## Mục tiêu V13
- Thẻ ngang và thẻ dọc có bố cục độc lập.
- Tên thành viên độc lập màu giao diện website.
- Thông tin tùy chọn (avatar, phối ngẫu, ngày tháng, nơi sinh, phái/chi/nhánh) tự mở rộng chiều cao thẻ.
- Hai nút chính luôn bằng nhau: Chi tiết / Nhánh.
- Công cụ quản trị tách thành hàng riêng, icon-only để không phá bố cục.
- Nút thu gọn/mở rộng nằm dưới thẻ ngang và bên phải giữa thẻ dọc.
- Kéo thẻ trên ReactFlow hoạt động lại và vị trí được nhớ trên thiết bị theo cấu hình layout.
- Có nút Bố cục tự động để xóa vị trí kéo thủ công và dựng lại layout.
- Vercel build dùng asset entry ổn định + kiểm tra dist sau build.

## Deploy cho người mới
1. Giải nén ZIP.
2. Upload **các file bên trong ZIP** lên GitHub, để `package.json` nằm ngay ở thư mục gốc repository.
3. Trên Vercel chọn repository đó.
4. Framework: Vite (Vercel thường tự nhận).
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Không đặt Root Directory thành một thư mục con nếu `package.json` đang ở root.
8. Sau khi deploy, nếu website vẫn giữ HTML cũ: Vercel → Deployments → Redeploy; trình duyệt dùng Ctrl+Shift+R.

## Supabase
Không xóa database/backend. Các schema và migration vẫn nằm trong repository để AdminCP tiếp tục vận hành dữ liệu thực tế.

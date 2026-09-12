# V14 — Card composition & collapse control

## Đã hoàn thiện
- Toolbar của thẻ ngang/dọc luôn nằm ở đáy thẻ, không tranh chỗ với nội dung tùy chọn.
- Hai nút chính luôn cùng kích thước theo grid 50/50.
- Tên thành viên có vùng tên riêng, tự căn giữa ngang/dọc theo bố cục thẻ; không còn dùng màu chữ giao diện website.
- Thẻ ngang và thẻ dọc tiếp tục có kích thước, font, màu nền, viền, nền tên và màu tên độc lập.
- Avatar, phối ngẫu, ngày sinh/mất, nơi sinh, tước hiệu và phân cấp được đặt trong vùng nội dung co giãn; chiều cao layout được tính theo nội dung.
- Nút Thu gọn/Mở rộng con cháu được đưa xuống dưới thẻ ở cả hai loại thẻ, luôn căn giữa.
- AdminCP có thiết lập `Nút thu gọn dưới thẻ` (0–120px), đồng thời thuật toán khoảng cách thế hệ tự dành chỗ an toàn cho nút này.
- Preview trong AdminCP phản ánh bố cục mới: vùng tên trung tâm + toolbar đáy + nút thu gọn phía dưới.
- Bổ sung `collapseControlOffset` vào FamilyTreeSettings và default settings.
- Layout signature bao gồm khoảng cách nút thu gọn để vị trí kéo cũ không gây chồng thẻ khi thay đổi cấu hình.

## Kiểm tra
- `tsc --noEmit` đã chạy để bắt lỗi cú pháp/type; môi trường kiểm tra không có `node_modules`, nên các lỗi còn lại là lỗi thiếu dependency, không phải lỗi parse JSX mới.
- `npm install` trong môi trường kiểm tra bị timeout; không tuyên bố production build đã chạy thành công.

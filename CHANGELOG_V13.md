# V13 — Card System & UX Foundation

## Đã sửa
- Tách card theme khỏi interface theme.
- Màu tên card không còn bị theme website ghi đè.
- Thẻ ngang/dọc có toolbar riêng, bố cục không phụ thuộc hover.
- Desktop/mobile dùng cùng mô hình thao tác; mobile vẫn có vùng chạm đủ lớn.
- Admin tools tách thành hàng icon riêng.
- Collapse: ngang ở giữa đáy; dọc ở giữa cạnh phải.
- Vertical card thực sự render Avatar/Nơi sinh/Phái-Chi-Nhánh khi được bật.
- Horizontal card render Nơi sinh độc lập với tùy chọn Tước hiệu.
- Chiều cao layout tăng theo nội dung + quyền admin.
- Kéo thẻ được lưu theo layout signature trong localStorage; đổi cấu hình hình học sẽ tạo bố cục mới.
- Có nút "Bố cục tự động" để xóa vị trí kéo thủ công.
- Vercel config được làm sạch; bỏ cấu trúc headers/rewrites sai của V12.
- Asset entry JS/CSS ổn định, HTML và entry không cache; asset chunk hash được cache immutable.
- Thêm verify-dist vào build để chặn deploy khi index.html trỏ tới asset không tồn tại.

## Kiểm tra
- JSON `vercel.json`: OK.
- Transpile syntax toàn bộ TS/TSX bằng TypeScript 5.8.3: OK.
- Không chạy được `npm install` trong môi trường này do timeout mạng; vì vậy chưa thể thực hiện production build tại đây.

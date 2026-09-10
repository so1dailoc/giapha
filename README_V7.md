# Gia Phả Đại Tộc – v7

## Các sửa lỗi chính
- Khôi phục kéo/thả thẻ ReactFlow: `nodesDraggable=true`; các nút thao tác trên thẻ vẫn dùng `nodrag/nopan`.
- Kích thước thẻ ngang và thẻ dọc được tách riêng hoàn toàn trong AdminCP.
- Layout dùng chính kích thước cấu hình của thẻ để tính khoảng cách, tránh thẻ chồng nhau.
- Có reset toàn bộ thiết kế thẻ và reset riêng thẻ ngang/thẻ dọc.
- Preview AdminCP hiển thị độc lập hai loại thẻ.
- Hỗ trợ màu chữ, nền tên, nền thẻ, viền và cỡ chữ riêng cho từng loại thẻ.
- Tối ưu chiều cao layout khi dùng chiều cao thẻ tùy chỉnh.
- Bộ tính xưng hô bổ sung quan hệ thông gia: cha/mẹ chồng, cha/mẹ vợ, con dâu, con rể, anh/chị/em dâu/rể; ưu tiên quan hệ hôn phối trực tiếp trước quan hệ huyết thống xa.
- Giữ nguyên Database/Supabase trong AdminCP; không đưa Database ra menu công khai.

## Kiểm tra
- Đã kiểm tra cân bằng dấu ngoặc TS/TSX: không phát hiện lỗi.
- Chưa chạy production build do môi trường không có node_modules.

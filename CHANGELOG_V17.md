# V17 — Layout Engine V3 + quan hệ thông minh

- Sửa nút thu gọn/mở rộng: anchor full-width + flex center, không còn lệch trái theo wrapper ReactFlow.
- Màu nút thu gọn dùng token inline thống nhất với AdminCP; preview và cây thật cùng nguồn màu.
- Thêm setting màu mở/thu gọn, chữ, viền và reset.
- Layout Engine V3: collision pass theo chiều rộng/chiều cao thực, family cluster clearance, recenter và Y-band reservation.
- Edge routing dùng Bottom → Top + smoothstep offset để giảm connector chồng/chéo.
- Đời của thành viên được chuẩn hóa theo cha/mẹ khi sửa; hậu duệ tiếp tục được lan truyền đời tự động.
- MemberModal có nút đồng bộ Đời theo cha/mẹ và cảnh báo khi dữ liệu chưa khớp.

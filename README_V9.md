# Gia Phả Đại Tộc – V9

## V9: kiểm thử xưng hô sâu + trình thiết kế giao diện AdminCP

### 1. Xưng hô
- Tách trực hệ, bàng hệ và hôn phối.
- Xác định dâu/rể với cha mẹ của phối ngẫu.
- Hỗ trợ bậc trên của phối ngẫu: ông/bà nội/ngoại chồng/vợ, cố chồng/vợ và bậc sâu hơn.
- Hỗ trợ vợ/chồng, anh/chị/em của phối ngẫu và thông gia khi dữ liệu đủ.
- Không đoán vai vế khi thiếu đường Cha/Mẹ; trả về trạng thái chưa xác định để tránh ghi sai phả hệ.
- Giữ chuẩn phả ký Hán Việt và cách gọi dân gian tách biệt.

### 2. Bộ kiểm thử
`tests/relationshipCalculator.deep.test.ts` kiểm tra:
- cha chồng ↔ con dâu;
- ông nội chồng ↔ cháu dâu;
- vợ/chồng;
- cô/chú ↔ cháu;
- tổ phụ ↔ tôn.

Chạy trong môi trường đã cài dependencies:
`npm run test:relationships`

### 3. Thiết kế giao diện
AdminCP cho phép cấu hình độc lập thẻ ngang/dọc và theme toàn website.
Theme toàn website có thêm token:
- Header
- Menu
- Nút và màu chữ nút
- Chữ phụ
- Nền trang/bề mặt
- Font và bo góc

Preview trực tiếp trong AdminCP, không cần sửa code.

### 4. ReactFlow
- `nodesDraggable=true` được giữ nguyên.
- Không reset vị trí thủ công khi chỉ re-render.
- Layout sử dụng cùng kích thước card thực tế để hạn chế chồng thẻ.
- Nút thao tác trên card giữ `nodrag`/`nopan`.

### 5. Database
Database/Supabase vẫn giữ đầy đủ trong AdminCP; các thay đổi theme mới dùng JSONB `defaultTreeSettings`, không yêu cầu migration bắt buộc.

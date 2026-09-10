# V8 – Bộ kiểm thử xưng hô + Theme toàn website + ổn định kéo thẻ

## Các thay đổi chính
- Khôi phục và bảo vệ thao tác kéo thẻ ReactFlow: re-render không còn reset vị trí người dùng đã kéo nếu layout chưa thay đổi.
- Layout dùng cùng kích thước thẻ thực tế, giảm chồng thẻ do width/height giữa layout và DOM không đồng nhất.
- Tách thiết kế thẻ ngang/dọc; thêm reset riêng và reset giao diện toàn website.
- Thêm theme mặc định toàn website: truyền thống, giấy gia phả, hiện đại, ngọc lục bảo, dạ lam; màu chủ đạo/nhấn/nền/chữ, font và bo góc.
- Nâng cấp quan hệ hôn phối: cha/mẹ chồng, cha/mẹ vợ, con dâu/con rể, anh/chị/em chồng/vợ và quan hệ dâu/rể liên quan.
- Bộ test hồi quy xưng hô tại `tests/relationshipCalculator.test.ts`.

## Chạy kiểm thử
Sau khi cài dependencies:
- `npm run check`
- `npx tsx tests/relationshipCalculator.test.ts`
- `npm run build`

## Lưu ý
Database/Supabase vẫn giữ nguyên trong AdminCP. Theme được lưu trong `clan_info.default_tree_settings` (JSONB), không cần migration riêng.

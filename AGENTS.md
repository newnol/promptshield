# AGENTS.md — PromptShield

Hướng dẫn cho AI/agent (và contributor) khi làm việc trong repo này.

## Mục tiêu dự án

- **Python package** (`src/promptshield/`): quét/redact secrets (API keys, PII), nén prompt, CLI.
- **Web MVP** (`web/`): chỉ chạy client-side — dán/upload prompt, prune API keys (rules load từ JSON), tùy chọn PII. Không gửi dữ liệu ra server của PromptShield.

## Cấu trúc quan trọng

| Khu vực | Vai trò |
|--------|---------|
| `src/promptshield/detector/api_key_rules.json` | Nguồn chuẩn regex API keys (Python detector đọc trực tiếp). |
| `web/api_key_rules.json` | Bản phục vụ static deploy; đồng bộ từ file detector. |
| `scripts/sync_api_key_rules.py` | Copy detector rules → `web/api_key_rules.json`. |
| `vercel.json` | Vercel dùng `outputDirectory: web` để deploy UI tĩnh một click. |

## Skills (workflow cho agent)

1. **Thêm provider / pattern API key mới**  
   Sửa `src/promptshield/detector/api_key_rules.json` → chạy `python3 scripts/sync_api_key_rules.py` → cập nhật test nếu cần (`tests/test_detector.py`). Web sẽ dùng rules sau khi sync.

2. **Chỉ đụng web**  
   Giữ logic trong `web/app.js` gọn; patterns API key không hard-code — luôn từ `web/api_key_rules.json`.

3. **Commit**  
   Dùng [Conventional Commits](https://www.conventionalcommits.org/): `feat`, `fix`, `docs`, `chore`, `refactor`, kèm scope nếu hợp lý (`web`, `detector`, `vercel`, …).

4. **Bảo mật**  
   Không log nội dung secret trong output; tránh regex gây ReDoS; giới hạn độ dài input hợp lý nếu thêm xử lý nặng.

## Rules (Cursor)

Rule chi tiết nằm trong `.cursor/rules/*.mdc` — xem frontmatter `globs` / `alwaysApply`.

## Tài liệu thêm

- API Python: `docs/api.md`
- Đóng góp: `docs/CONTRIBUTING.md`

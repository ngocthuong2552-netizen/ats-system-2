# AIV ATS — Recruitment System

Hệ thống ATS (Applicant Tracking System) cho AI for Vietnam, theo PRD v1.0.
Next.js (App Router) + Prisma + SQLite + NextAuth + Claude API.

## 1. Cài đặt

```bash
npm install
```

## 2. Cấu hình môi trường

File `.env` đã có sẵn (copy từ `.env.example`). Mặc định dùng **SQLite** — không cần
cài đặt database server, dữ liệu lưu tại `prisma/dev.db` (persist trên đĩa).

Cần điền:
- `NEXTAUTH_SECRET` — chạy `openssl rand -base64 32` để tạo
- `ANTHROPIC_API_KEY` — API key Claude, dùng cho CV parsing / JD generator / matching score

> Muốn dùng Postgres (Supabase/Neon) cho production: đổi `provider = "sqlite"` thành
> `"postgresql"` trong `prisma/schema.prisma`, và set `DATABASE_URL` tương ứng.

## 3. Khởi tạo database + seed dữ liệu

```bash
npx prisma db push      # tạo bảng theo schema
npm run seed             # seed 12 email template + 4 tài khoản demo
```

Tài khoản demo (đã lưu thật trong DB, có thể login ngay):

| Email | Mật khẩu | Role |
|---|---|---|
| [email protected] | Admin@123 | ADMIN |
| [email protected] | Hr@12345 | HR |
| [email protected] | Manager@123 | HIRING_MANAGER |
| [email protected] | Interview@123 | INTERVIEWER |

Người dùng mới cũng có thể tự **Đăng ký** tại `/register` — tài khoản được lưu
vào bảng `User` (mật khẩu hash bằng bcrypt), đăng nhập lại vẫn còn nguyên.

## 4. Chạy

```bash
npm run dev
```

Mở http://localhost:3000 — sẽ tự chuyển tới `/login`.

## 5. Luồng sử dụng (theo §13 PRD)

1. Login → **Hiring Requests** → tạo request mới (vai trò Hiring Manager) hoặc Approve (HR)
2. Approve request → tự tạo **Job Opening**
3. Vào **Openings** → mở opening → **Generate JD (AI)** → Save
4. **+ Add Candidate** → tạo candidate + application ở stage Applied
5. Vào **Candidates** → mở profile → dán CV text → **Parse CV (AI)** để AI điền skills/experience
6. Quay lại Opening → kéo card sang stage CV Screening → Advance/Reject (email draft tự sinh)
7. Tại Candidate Profile: Schedule Interview, submit Evaluation, Mark email Sent, update DocuSign status
8. Theo dõi toàn bộ qua **Dashboard** (Active Candidates, New Applicants, Funnel, Open Requests)

## 6. Cấu trúc chính

```
prisma/schema.prisma     # toàn bộ data model (User, HiringRequest, JobOpening,
                          # Candidate, Application, Interview, Evaluation,
                          # EmailTemplate, EmailLog, Note, ActivityLog)
prisma/seed.ts            # 12 email template + 4 tài khoản demo
lib/auth.ts                # NextAuth config (Credentials provider, bcrypt)
lib/stage-transitions.ts   # rule engine §8.2 — stage -> outcome -> template keys
app/api/...                 # toàn bộ REST API (requests, openings, candidates,
                            # applications/transition, interviews, evaluations,
                            # emails, dashboard, jd/generate, parse-cv, match-score)
app/(dashboard)/...          # UI: dashboard, requests, openings, candidates
```

## 7. Đã bổ sung đầy đủ (không còn thiếu so với PRD MoSCoW Must/Should/Could)

- **Upload CV file thật (PDF/DOCX)**: `/api/upload` dùng `pdf-parse`/`mammoth` để trích xuất text,
  lưu file vào `public/uploads/`, tự động gọi AI parse ngay sau khi thêm candidate
  (cả ở form "Add Candidate" trong Opening và ở trang Candidate Profile để re-upload).
- **Talent Pool** (`/talent-pool`, FR-10.1): toggle "Add to Talent Pool" trên Candidate Profile,
  trang search theo tên/kỹ năng/quốc gia.
- **AI HR Assistant chatbot** (`/assistant`, FR-12.1): hỏi trạng thái ứng viên theo tên hoặc
  câu hỏi quy trình SOP, trả lời dựa trên dữ liệu thật trong DB + SOP tĩnh (RAG-lite).

## 8. Việc còn lại mang tính vận hành (không phải thiếu chức năng)

- [ ] Thay nội dung 12 template trong `prisma/seed.ts` bằng **nguyên văn** từ tài liệu
      Email Template của People team (hiện đang là placeholder copy đúng cấu trúc/merge field).
- [ ] Production: đổi Prisma datasource sang Postgres nếu cần nhiều người dùng đồng thời
      (SQLite phù hợp cho dev / hackathon demo, single-writer).

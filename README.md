# Fullstack App (React + TypeScript + Tailwind | Node.js + TypeScript + PostgreSQL)

## Cấu trúc

```
.
├── backend/        # Node.js + Express + TypeScript + pg
├── frontend/       # React + Vite + TypeScript + Tailwind CSS
├── .env.example    # Mẫu biến môi trường
├── .env            # Cấu hình dev local (copy từ .env.example)
```

## Chạy dự án

1. Cài và chạy backend (terminal 1):

```bash
cd backend
npm i
npm run dev
```

Backend chạy tại http://localhost:4000 — kiểm tra: http://localhost:4000/api/health

2 Cài và chạy frontend (terminal 2):

```bash
cd frontend
npm i
npm run dev
```

Frontend chạy tại http://localhost:5173

## Biến môi trường

Tất cả biến nằm ở file `.env` ở thư mục gốc. Nếu chưa có, chạy:

```bash
cp .env.example .env
```

Khi đổi port hoặc thông tin database, sửa trong `.env` rồi chạy lại dev server.

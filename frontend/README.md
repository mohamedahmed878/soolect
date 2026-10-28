# SOALECT — Frontend (React + Vite)

## تشغيل محلي
    npm install
    cp .env.example .env     # سيبه فاضي = وضع تجريبي (بدون باك اند)
    npm run dev

## ربط الباك اند
- `VITE_API_URL` = رابط مشروع الباك اند على Vercel (من غير /api في الآخر)
- `VITE_PUSHER_KEY` / `VITE_PUSHER_CLUSTER` = الـ key العام من Pusher (الـ secret يتحط في الباك اند بس)

## الـ API اللي الفرونت مستني الباك اند يوفره
POST /api/auth/register · POST /api/auth/login · GET /api/auth/me
GET /api/products · GET /api/products/:id
POST /api/orders · GET /api/orders/my · GET /api/orders/:id

## Pusher (Real-time)
Channel: `orders-<userId>` — Event: `order-updated` — Payload: الأوردر كامل بعد التحديث.

## النشر على Vercel
New Project → Root Directory = `frontend` → Framework: Vite → ضيف الـ Environment Variables.

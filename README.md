# SOOLECT

Single-store e-commerce site (EGP). React + Vite frontend, Express + MongoDB backend, deployed as **one Vercel project**.

```
frontend/   React app (Vite)
backend/    Express app: routes, models, services, tests
api/        Vercel serverless entry (api/index.js -> backend/app.js)
vercel.json routes /api/* to the function, everything else to the SPA
```

## Run locally
```bash
cp .env.example .env        # fill MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm --prefix frontend install
npm run dev:api             # API on http://localhost:4000
npm run dev:web             # site on http://localhost:5173 (proxies /api to the API)
npm test                    # pricing + validation tests (no database needed)
```
Leave `VITE_API_URL` empty in `frontend/.env` to run the site in demo mode without a backend.

## Deploy (Vercel)
1. Import the repo with **Root Directory = the repo root** (not `frontend`).
2. Add the environment variables from `.env.example` (`MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `VITE_API_URL=/`).
3. In MongoDB Atlas allow Vercel to connect (Network Access, `0.0.0.0/0` is the usual choice for serverless).

## How it works
- **Guests can buy.** Checkout needs no account. The order response includes a secret `accessToken`; the browser keeps it so the guest can reopen the order. Guests can also look an order up with **order number + phone** (`POST /api/orders/track`).
- **The server decides every price.** The browser sends only product, color, size and quantity. The API reads prices from MongoDB, checks stock, applies the coupon and computes shipping (standard 50 EGP, free from 1000; express 100; "free" only from 1000). Stock is reserved atomically per variant and released if anything fails.
- **One admin** comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD`; log in with the normal login form. Customers live in MongoDB.
- **Variants:** each product has variants (color + size) with their own SKU, price (falls back to the product price), stock and image.
- **Real-time:** when the admin changes an order status, Pusher (`orders-<userId>` / `order-updated`) updates the customer's open page. Optional; works without it.

## API
Public: `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` · `GET /api/products[?category=&q=]` · `GET /api/products/:id` · `POST /api/coupons/validate` · `POST /api/orders` (guest or logged in) · `POST /api/orders/track` · `GET /api/orders/:id[?token=]` · `GET /api/orders/my`

Customer (JWT): `GET|PUT /api/me/wishlist` · `GET|PUT /api/me/addresses`

Admin (JWT with admin role): `GET /api/admin/stats` · `GET|POST|PUT|DELETE /api/admin/products` · `GET /api/admin/orders[?status=]` · `PATCH /api/admin/orders/:id/status` · `PATCH /api/admin/orders/:id/payment` · `GET|POST|PUT|DELETE /api/admin/coupons`

Order status flow: `processing -> shipped -> delivered`, or `cancelled` from processing/shipped (stock and coupon use are restored).

## Not done yet
- `/admin` screen in the frontend (the admin API exists; until then use any HTTP client with the admin token).
- Online payment gateway. Orders paid by card / PayPal / Vodafone Cash are saved with `paymentStatus: pending` and the admin confirms payment (`PATCH .../payment`). Cash on delivery becomes `paid` when delivered.
- Product image upload (variants and products store image URLs).
- Wishlist and addresses are still saved in the browser; the `/api/me/*` endpoints are ready for the frontend to sync with.

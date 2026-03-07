# Tanishq Store (User / Store Owner Frontend)

Store-owner facing frontend for placing bulk orders. Login required to checkout; payment is offline.

## Setup

```bash
cd client
npm install
cp .env.example .env   # set VITE_API_URL if backend is not on localhost:3000
npm run dev
```

Open http://localhost:5174 (or the port Vite prints).

## Features

- **Header**: Logo, Home, Categories, Cart icon (opens sidebar), Login / Logout
- **Cart sidebar**: Slide-out cart, update qty, remove, “Proceed to Checkout” (redirects to login if not logged in)
- **Home**: List of approved products from API, Add to cart
- **Categories**: Same products with category filters (All, Rings, Necklaces, etc.)
- **Product page**: Single product detail, quantity, Add to cart
- **Login**: Email/password, uses backend `POST /auth/login`
- **Checkout** (login required): Contact/delivery info, PO reference, order summary, Place order → `POST /stores/orders`

## Backend

Ensure the API is running (e.g. `cd backend && bun run dev`) and CORS allows the client origin. Create a **Store** and a **User** with `role: STORE_OWNER` and `storeId` (or `Store.ownerId`) linked so that `GET /stores/me` and `POST /stores/orders` work.

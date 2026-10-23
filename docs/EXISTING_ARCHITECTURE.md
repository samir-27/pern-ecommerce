# Existing Architecture Report

## 1. Overview
The current repository is a full-stack e-commerce application named **MINIMAL.** tailored for clothing and fashion.
The architecture is structured as a decoupled monorepo containing:
- `backend/`: Node.js Express REST API with PostgreSQL database connectivity via `pg`.
- `frontend/`: React single-page application built with Vite and Tailwind CSS.

---

## 2. Technology Stack & Dependencies

### Backend
- **Runtime & Framework**: Node.js (v24), Express.js (`^5.2.1`)
- **Database Engine**: PostgreSQL (`pern_ecommerce` database)
- **Database Access / Driver**: Native `pg` (`^8.22.0`) connection pool (`backend/db.js`). Direct parameterized SQL queries.
- **Authentication**: `jsonwebtoken` (`^9.0.3`), `bcrypt` (`^6.0.0`). Bearer token authentication in HTTP Authorization header.
- **Payments**: Razorpay (`^2.9.8`) with INR currency, server-side HMAC-SHA256 signature verification (`crypto.timingSafeEqual`).
- **File & Media Storage**: Cloudinary (`^2.10.0`) with `multer` (`^2.2.0`) memory storage.
- **Environment**: `dotenv` (`^17.4.2`).

### Frontend
- **Framework & Tooling**: React (`^19.2.8`), React DOM (`^19.2.8`), Vite (`^8.2.0`).
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, `^4.3.3`) with CSS variable tokens (`--dominant`, `--secondary`, `--accent`) supporting light and dark themes.
- **Routing**: React Router DOM (`^7.18.2`).
- **Icons**: Lucide React (`^1.28.0`), React Icons (`^5.7.0`).
- **HTTP Client**: Axios (`^1.19.0`) with request/response interceptors for token attachment and 401 redirection.
- **State Management**: React Context (`CartContext`) persisted in browser `localStorage` (`min_cart`).

---

## 3. Database Schema Baseline

The PostgreSQL database currently contains 7 tables:

1. **`users`**
   - Columns: `id` (SERIAL PK), `email` (VARCHAR UNIQUE), `password_hash` (VARCHAR), `first_name` (VARCHAR), `last_name` (VARCHAR), `role` (VARCHAR DEFAULT 'user'), `created_at` (TIMESTAMPTZ).
   - Existing data: 1 administrator record (`sumrasamir27@gmail.com`, role `admin`).

2. **`categories`**
   - Columns: `id` (SERIAL PK), `name` (VARCHAR NOT NULL), `description` (TEXT).

3. **`products`**
   - Columns: `id` (SERIAL PK), `category_id` (INT FK -> categories), `name` (VARCHAR), `description` (TEXT), `base_price` (NUMERIC), `gender` (VARCHAR DEFAULT 'Unisex'), `created_at` (TIMESTAMPTZ).
   - *Current limitation*: Products are global with no seller/store ownership, moderation status, or fashion attributes (fabric, fit, season).

4. **`product_variants`**
   - Columns: `id` (SERIAL PK), `product_id` (INT FK -> products), `sku` (VARCHAR), `size` (VARCHAR), `color` (VARCHAR), `stock_quantity` (INT), `price_override` (NUMERIC), `image_urls` (TEXT[]).

5. **`orders`**
   - Columns: `id` (SERIAL PK), `user_id` (INT FK -> users), `total_amount` (NUMERIC), `status` (VARCHAR DEFAULT 'pending'), `shipping_address` (TEXT), `razorpay_payment_id` (VARCHAR UNIQUE), `created_at` (TIMESTAMPTZ).

6. **`order_items`**
   - Columns: `id` (SERIAL PK), `order_id` (INT FK -> orders), `variant_id` (INT FK -> product_variants), `quantity` (INT), `price_at_purchase` (NUMERIC).

7. **`reviews`**
   - Columns: `id` (SERIAL PK), `product_id` (INT FK -> products), `user_id` (INT FK -> users), `rating` (INT CHECK 1-5), `content` (TEXT), `created_at` (TIMESTAMPTZ).

---

## 4. Current Application Routes & Features

### Backend API Endpoints
- `POST /api/auth/register` - Create customer account
- `POST /api/auth/login` - Authenticate customer or admin, return JWT
- `GET /api/auth/profile` - Fetch current user profile
- `PUT /api/auth/profile` - Update name/email
- `PUT /api/auth/password` - Update password
- `GET /api/products` - Catalog search with filters (category, gender, color, size, text query) and pagination
- `GET /api/products/categories` - Fetch all category list
- `GET /api/products/colors` - Distinct variant colors
- `GET /api/products/:id` - Fetch single product with all variants
- `POST /api/products` - Admin creates product with multiple variants and Cloudinary uploads
- `PUT /api/products/:id` - Admin updates product
- `DELETE /api/products/:id` - Admin deletes product (with empty category cleanup)
- `GET /api/products/:id/reviews` - Fetch reviews for product
- `POST /api/products/:id/reviews` - Post customer review
- `POST /api/orders/payment/order` - Create Razorpay order with server-side inventory and pricing calculation
- `POST /api/orders/payment/verify` - Verify Razorpay signature, commit order, decrement stock
- `GET /api/orders/myorders` - Fetch customer order history
- `GET /api/admin/overview` - Stats count (products, orders, users)
- `GET /api/admin/products` - Admin product list with variant aggregation
- `GET /api/admin/orders` - Admin order list with joined order items

### Frontend Routes
- `/login`, `/register` - Authentication forms
- `/` - Home landing page (Hero, Categories, Featured items)
- `/products` - Product listing page with responsive filters
- `/product/:id` - Product details, size/color variant selection, reviews
- `/checkout` - Multi-step shipping and Razorpay payment checkout
- `/profile` - Customer profile management and past order history
- `/admin` - Admin dashboard (overview, product creation/management, orders)

---

## 5. Architectural Gaps for Multi-Vendor Marketplace

1. **Seller Isolation**: No concept of sellers, seller onboarding, business documents, or seller permissions. Everything is currently binary (`user` vs `admin`).
2. **Product Ownership**: Products are unassigned. There is no store profile or seller storefront.
3. **Multi-Vendor Checkout & Fulfillment**: An order currently has a single status and no sub-orders or seller-specific fulfillment items. If multiple sellers sell in one checkout, sellers cannot see or fulfill only their items.
4. **Commissions & Payouts**: Zero accounting for marketplace platform commission vs seller net earnings.
5. **Product Moderation**: Any admin product is instantly live; no draft/pending approval workflow exists.
6. **AI Layer**: No AI capabilities or modular AI provider currently configured.
7. **Real-time Notifications**: No WebSocket/Socket.IO server or client notification center.

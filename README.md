# MINIMAL. — Multi-Vendor Fashion & Clothing Marketplace (PERN Stack)

An enterprise clothing marketplace built with PostgreSQL, Express.js, React 19, and Node.js. Architected into three distinct applications: **Buyer Storefront**, **Brand Seller Studio**, and **Super Admin Command Center**.

---

## 🏛️ Architecture Overview

```
ecommerce-platform/
├── apps/
│   ├── buyer-web/          # Modern High-Fashion Buyer Storefront
│   ├── brand-seller-web/   # Professional Brand Operations & Dispatch Hub
│   └── super-admin-web/    # Standalone Executive Governance & Security Console
├── backend/                # Shared Express.js REST API with PostgreSQL & AI Services
├── database/               # PostgreSQL schema, migrations, and seeds
└── frontend/               # Root Vite runtime orchestrating application routing
```

---

## 🚀 Port & Route Map

| Application | Route Path | Description | Access Role |
| :--- | :--- | :--- | :--- |
| **Buyer Storefront** | `/` | Editorial home, fashion catalog, cart, checkout, tracking | Public / Buyer |
| **Garment Catalog** | `/products` | Multi-facet filtering (sizes, colors, gender, categories) | Public |
| **Brand Directory** | `/brands` | Verified independent brand studios & brand profiles | Public |
| **Buyer Authentication**| `/login`, `/register` | Dual-mode customer and brand registration | Public |
| **Brand Seller Portal**| `/seller/*` | Garments, variant stock, order dispatch, revenue | `seller` / `brand` |
| **Super Admin Console** | `/admin/*` | Executive oversight, brand approvals, audit logs | `super_admin` |
| **Super Admin Login** | `/admin/login` | Dedicated high-security administrator gateway | Administrator |

---

## 🔑 Default Credentials

- **Super Administrator**:
  - Email: `admin@minimal.com`
  - Password: `Admin@12345`
  - Alternative: `sumrasamir27@gmail.com` / `Admin@12345`

- **Brand Seller**:
  - Register directly at `/register` under the **Brand Seller** tab, or sign in at `/login`.

---

## 💻 Running the Applications

### 1. Database (PostgreSQL 18)
Ensure PostgreSQL is active on port 5432:
```bash
# Windows auto-starter:
./start-postgres.bat
```

### 2. Backend API Server (Port 5000)
```bash
cd backend
npm install
npm run dev
```
To run the automated verification test suite:
```bash
npm test
```

### 3. Frontend Applications (Port 5173)
```bash
cd frontend
npm install
npm run dev
```
To create a production build:
```bash
npm run build
```

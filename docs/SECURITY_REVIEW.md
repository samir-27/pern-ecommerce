# Security Review & Hardening Specifications

## 1. Current State Security Findings

### Strengths
- Passwords hashed using bcrypt with salt rounds 10.
- Payment HMAC verification uses `crypto.timingSafeEqual` in `order.controller.js` to protect against timing attacks.
- SQL queries use parameterized arguments (`$1`, `$2`), minimizing direct SQL injection vulnerabilities.

### Vulnerabilities & Architectural Risks
1. **Frontend Role Trust**: `AdminRoute` in `App.jsx` relied on `localStorage.getItem('userRole')`. An attacker could manipulate localStorage to view administrative UI components.
   *Remediation*: Frontend routes must verify auth status with a server round-trip / `/api/auth/profile` check, and backend APIs must strictly enforce `req.user.role` from the verified JWT with real-time DB role checking for sensitive endpoints.
2. **Missing Rate Limiting**: Authentication (`/api/auth/login`, `/api/auth/register`) lacks brute-force rate limiting.
   *Remediation*: Introduce express rate-limiting middleware for auth and payment endpoints.
3. **Missing Seller Isolation Enforcement**: No tenant boundaries existed. Any route modifying products only checked if user was `admin`.
   *Remediation*: Implement `sellerRoute` middleware and check `product.seller_id === req.user.id` or `req.user.role === 'admin' || req.user.role === 'super_admin'`.
4. **Unprotected File Uploads**: Cloudinary uploads in `product.controller.js` accepted any files without MIME-type or image header validation.
   *Remediation*: Validate image MIME types (`image/jpeg`, `image/png`, `image/webp`) in multer and limit payload sizes.
5. **Lack of Audit Logging**: Critical actions (role changes, commission modifications, refund approvals, seller bans) left no audit trail.
   *Remediation*: Insert records into `audit_logs` table for all administrative mutations.

---

## 2. Multi-Vendor Authorization Matrix

| Domain / Resource | Customer | Seller | Admin / Super Admin |
|---|---|---|---|
| **Public Store & Catalog** | Read approved only | Read all approved | Read all (including draft/pending) |
| **Seller Store Profile** | Read public store | Read & Edit own store | Read, Edit, Suspend any store |
| **Product Listings** | Read approved | Create, Read, Edit own | Read, Moderate, Delete any |
| **Variant Inventory** | Read in-stock | Manage own variants | Manage any variants |
| **Orders** | Read own orders | Read own sub-orders only | Read all orders & sub-orders |
| **Fulfillment / Tracking** | View tracking | Update tracking for own items | Override / Update any |
| **Earnings & Payouts** | None | Read own payouts & balance | Configure, Approve, Process all |
| **Seller Applications** | Submit own application | View own application | Review, Approve, Reject all |
| **Audit Logs** | None | None | Read all audit logs |

---

## 3. Data Protection & Secrets Hygiene
- No Stripe secret keys, Razorpay secret keys, or database passwords exposed in client builds or API responses.
- PII (customer shipping addresses, phone numbers) masked in seller packing views to show only what is strictly required for delivery.
- Sensitive verification documents (tax IDs, business licenses) accessible only to authorized Super Admins.

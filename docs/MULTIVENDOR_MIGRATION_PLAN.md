# Multi-Vendor Marketplace Migration Plan

## 1. Migration Goals & Principles
1. **Preserve Continuity**: Keep the existing customer storefront, branding ("MINIMAL."), checkout, and admin access working seamlessly.
2. **Strict Seller Isolation**: Sellers must only query, view, edit, or fulfill their own stores, products, inventory, orders, conversations, and earnings.
3. **Super Admin Sovereignty**: Platform-level oversight over all sellers, commissions, moderation, disputes, payouts, and system audit logs.
4. **Safe Phased Rollout**: Incrementally extend database models, backend API routes, and frontend views without destructive resets.

---

## 2. Multi-Vendor Roles & Permissions Model

| Role | Capabilities | Dashboards / Routes |
|---|---|---|
| **Customer (`customer` / `user`)** | Browse catalog, search/filter, multi-vendor cart, checkout, view tracking, request returns, write reviews, interact with AI shopping assistant, apply to become seller. | `/`, `/products`, `/stores/:slug`, `/checkout`, `/profile` |
| **Seller (`seller`)** | Manage store profile, submit seller application, add/edit products & variants, manage stock, view assigned sub-orders, print pack-slips, add tracking numbers, process return requests, view net earnings & payout ledger, use AI listing assistant. | `/seller`, `/seller/products`, `/seller/orders`, `/seller/inventory`, `/seller/payouts`, `/seller/settings` |
| **Super Admin (`super_admin` / `admin`)** | Approve/reject seller applications, suspend stores, moderate listings, configure global/seller/category commission rules, track payouts, review audit logs, manage CMS & platform settings, use Super Admin AI analytics. | `/admin`, `/admin/sellers`, `/admin/products`, `/admin/orders`, `/admin/commissions`, `/admin/payouts`, `/admin/audit-logs` |

---

## 3. Core Multi-Vendor Workflows

### A. Seller Onboarding Workflow
1. Authenticated customer accesses `/seller/register` or `/seller/apply`.
2. Submits store name, slug, phone, business registration/tax details, store description, and bank/payout details.
3. Status set to `pending`. Super Admin receives notification.
4. Super Admin reviews application in `/admin/sellers`:
   - `approved`: User role elevated to `seller`, `seller_stores` activated, seller dashboard unlocked.
   - `rejected`: Reason recorded, email/in-app notification dispatched.
   - `suspended`: Seller cannot publish new items or edit active listings.

### B. Multi-Seller Catalog & Storefronts
- **Catalog**: Unified marketplace catalog at `/products` displaying approved products from active sellers.
- **Storefronts**: Dedicated `/stores/:slug` showing seller banner, store bio, seller rating, and seller catalog.
- **Product Moderation**: Sellers submit products in `pending_approval` status. Super Admin approves or requests changes before the product appears in the public marketplace catalog.

### C. Multi-Seller Cart, Order Splitting & Fulfillment
1. Customer adds variants from Seller A and Seller B to the same cart.
2. At checkout, backend recalculates items, shipping, tax, platform commission, and seller earnings.
3. Upon payment verification:
   - Parent `orders` (Marketplace Order) record created.
   - Individual `seller_orders` (Fulfillment groups) created for Seller A and Seller B.
   - Order items mapped to their respective `seller_order_id` and `seller_id`.
   - Inventory decremented with atomic SQL checking.
4. Fulfillment isolation:
   - Seller A sees and fulfills only Seller A's sub-order (adds carrier tracking, marks shipped/delivered).
   - Seller B cannot inspect Seller A's items or financial details.
   - Customer sees an aggregated timeline with independent parcel tracking for each seller.

### D. Returns & Exchanges
- Customer submits return request for a specific order item with reason and optional photo.
- Seller receives notification; can approve or dispute.
- Super Admin mediates escalated disputes.
- Inventory restocking flag is explicit (preventing automatic restocking of damaged goods).

### E. Financial Ledger & Payouts
- System computes:
  - `gross_amount` = sum of seller line items.
  - `commission_amount` = `gross_amount * (commission_rate / 100)`.
  - `seller_net_amount` = `gross_amount - commission_amount`.
- Recorded in `seller_payouts` with status (`pending`, `ready_for_payout`, `completed`).
- Auditable transaction IDs logged.

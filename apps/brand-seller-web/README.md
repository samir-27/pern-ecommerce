# Brand Seller Web Application (`brand-seller-web`)

A dedicated operations portal designed exclusively for independent fashion brands selling apparel on the marketplace.

## Key Features
- **Brand Operations Console**: Live overview of gross sales, net brand payouts, catalog size, pending fulfillment, and inventory health.
- **Brand Profile & Credentials**: Manage brand identity, story, official website, contact email/phone, CIN registration number, GSTIN, and custom return/shipping policies.
- **Clothing Catalog & Variant Manager**:
  - Full support for clothing attributes (Clothing type, fabric/material, fit, pattern, season, care instructions).
  - Variant inventory table tracking size and color combinations with individual SKUs and low-stock alerts.
- **Order Fulfillment & Dispatch Hub**:
  - Filter customer orders containing garments from this brand.
  - Dispatch orders with carrier selection (BlueDart, Delhivery, FedEx, DHL, Shadowfax, DTDC) and AWB tracking numbers.
- **Revenue & Commission Analytics**:
  - 30-day gross sales, platform fee deductions, and net payout tracking.
  - Top-performing garments by units sold and revenue.
- **Brand Isolation**: Enforced by backend middleware ensuring one brand cannot access or mutate another brand's products, orders, or financials.

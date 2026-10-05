# TakinMart — Bhutan Artisan E-Commerce Platform Implementation Plan
**Domain:** `takinmart.bt`  
**Repository:** `remix-of-remix-of-end-to-end-solutions`  
**Status:** In Progress — Decoupling from Lovable & Migrating to Self-Owned Architecture

---

## 1. Executive Summary & Value Proposition

TakinMart (`takinmart.bt`) is the premier online marketplace for authentic Bhutanese handicrafts, sacred arts, traditional textiles, and organic Himalayan agro-products.

Operated in official sourcing collaboration with the **Handicraft Association of Bhutan**, TakinMart provides certified origin, fair artisan compensation, and direct international fulfillment to global customers and travelers returning from Bhutan.

### Core Architectural Mandates:
- **Decoupled Architecture:** 100% independent from Lovable dependencies (`@lovable.dev/cloud-auth-js` and `@lovable.dev/vite-tanstack-config`).
- **Self-Owned PostgreSQL Database:** Clean, direct PostgreSQL connection (`init-db.sql`) with no vendor lock-in.
- **Handicraft Association Sourcing:** Verified handicraft seal of authenticity, artisan biography spotlights, and direct association consignment tracking.
- **Multi-Currency Global Checkout:** Real-time localized pricing and settlement in **USD ($), INR (₹), AUD (A$), EUR (€), and GBP (£)**.
- **Official Enterprise Email Routing:**
  1. `info@takinmart.bt` — Product inquiries & catalog requests
  2. `office@takinmart.bt` — Warehouse operations & inventory dispatch
  3. `gm@takinmart.bt` — General Manager escalations & trade compliance
  4. `ceo@takinmart.bt` — Executive leadership & artisan cooperative alliances
  5. `bdm@takinmart.bt` — Wholesale bulk orders & international distributor partnerships
  6. `support@takinmart.bt` — Customer support, order tracking & returns
- **Worldwide Logistics Desk:** Bhutan Post EMS and DHL Express international shipping with phytosanitary and export clearance certification.

---

## 2. Decoupling & Independent Tech Stack

### 2.1 Dependency Elimination
- Remove `@lovable.dev/cloud-auth-js` from `package.json` and replace with standard JWT/PostgreSQL session authentication.
- Remove `@lovable.dev/vite-tanstack-config` and replace with clean `@tanstack/start/vite` + Tailwind CSS v4.
- Clean out editor preview markers (`stripPreviewSourceMarkers`).
- Decouple from remote Lovable-controlled Supabase cloud to **Self-Owned PostgreSQL** (`postgres://...` / `database/init-db.sql`).

---

## 3. Product Catalog & Handicraft Association Sourcing

### 3.1 Curated Categories & Hero Products
1. **Handwoven Textiles & Wearables:**
   - *Authentic Bumthang Yathra Pure Wool Blanket:* Handspun sheep wool dyed with walnut husk and madder root.
   - *Royal Lhuentse Kishuthara Raw Silk Scarf:* Intricate supplementary-weft backstrap weaving from Khoma village.
   - *Traditional Kira & Gho Sets:* Ceremonial and casual handloom Bhutanese national dress.
2. **Buddhist Sacred Art & Ritual Objects:**
   - *Medicine Buddha & Guru Rinpoche Mineral Pigment Thangkas:* Painted with crushed lapis lazuli, malachite, and 24K gold leaf by master painters of the National Institute of Zorig Chusum.
   - *Consecrated Bronze Statues:* Lost-wax casting polished by traditional artisans.
   - *Hand-Turned Wooden Prayer Wheels:* Loaded with sacred mantras and cedarwood incense.
3. **Traditional Woodcraft & Masks:**
   - *Turned Wooden Dappa Bowls (Airtight Pair):* Carved from mountain maple burl wood with friction-fit lids.
   - *Sacred Cham Dance Masks:* Hand-carved wooden Mahakala, Guru Tshengye, and animal spirit masks.
4. **Himalayan Organic Agro-Wellness & Teas:**
   - *Certified Bhutan Wild Cordyceps Sinensis (Grade A):* Government-auctioned, wild-harvested at 4,200m+ in Lunana meadows with official export seal.
   - *Raw Organic Bumthang Clover Honey:* Cold-extracted high-altitude honey rich in bioactive enzymes.
   - *Tsirang Organic Green & Herbal Teas:* Organically cultivated Himalayan loose-leaf teas.

---

## 4. Multi-Currency Engine & Payment Gateway Routing

| Currency | Symbol | Primary Market | Gateway Integration | Supported Settlement |
| :--- | :--- | :--- | :--- | :--- |
| **USD** | $ | United States, Global, Asia | Stripe / PayPal Express | Direct Credit Card / PayPal |
| **INR** | ₹ | India, Nepal, Bhutan (Nu.) | Razorpay / Cashfree | UPI QR, RuPay, Net Banking |
| **AUD** | A$ | Australia & New Zealand | Stripe International | Apple Pay, Google Pay, Cards |
| **EUR** | € | European Union, Switzerland | Stripe / SEPA Direct | Bancontact, iDEAL, Cards |
| **GBP** | £ | United Kingdom | Stripe / BACS | Direct Bank / Cards |

*Note: For wholesale dealer orders exceeding $2,000 / ₹1,50,000, direct Bank of Bhutan / Bhutan National Bank SWIFT wire instructions are automatically generated with invoice.*

---

## 5. Store Frontend & Admin Panel Features

### 5.1 Storefront Experience
- **Dynamic Header:** Multi-currency dropdown switcher, responsive cart drawer, real-time search, and category navigation.
- **Product Details Page (`/product/$slug`):** High-resolution image zoom, artisan story tab, authenticity certification badge, weight and dimensions for shipping calculation, and verified buyer reviews.
- **Cart & Checkout (`/cart`, `/checkout`):** Automatic international shipping rate calculator, coupon code discount validator, tax/customs estimate, and address auto-save.
- **Traveler Store Integration:** Cross-promotional banner linking guests from `goldentakinholidays.bt` with exclusive voucher codes.

### 5.2 Store Admin Operations Panel (`/admin/*`)
- **Product & Inventory Manager:** Real-time stock alerts, batch CSV import/export, multi-currency price override.
- **Order Fulfillment Pipeline:** Order statuses (`processing` -> `dispatched` -> `in_transit` -> `delivered`), DHL/EMS tracking number assignment, and automatic customer notification emails.
- **Artisan Consignment Ledger:** Revenue-share reporting for the Handicraft Association of Bhutan.
- **Coupon & Promotion Engine:** Percentage and fixed-amount discount codes.

---

## 6. Global Contact Desks & Support Channels

- **Bhutan HQ & Fulfillment Center:** Norzin Lam, Thimphu, Bhutan | 📞 +975 17700185 / +975 1611 2222
- **India Support Desk:** Jaigaon / Kolkata | 📞 +91 98320 00000 / +91 94340 00000
- **Australia Support Desk:** Sydney | 📞 +61 2 8000 0000
- **United Kingdom Support Desk:** London | 📞 +44 20 7946 0000

### Official Department Inboxes:
- General Inquiries: `info@takinmart.bt`
- Fulfillment & Logistics: `office@takinmart.bt`
- General Manager: `gm@takinmart.bt`
- Executive Leadership: `ceo@takinmart.bt`
- Artisan Partnerships & Wholesale: `bdm@takinmart.bt`
- Customer Care & Returns: `support@takinmart.bt`

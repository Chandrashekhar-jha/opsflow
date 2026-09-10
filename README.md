# OpsFlow - Mini ERP + CRM Operational Portal

OpsFlow is a full stack Operations Portal designed for wholesale and distribution enterprises. Built with Node.js, Express, TypeScript, Supabase PostgreSQL, and React with Vite.

---

## Technical Overview

- Frontend: React 18, TypeScript, Vite, Bespoke CSS Token System (Dark and Light Themes), jsPDF Invoice Generator
- Backend: Node.js, Express.js, TypeScript, Supabase Client SDK, JWT Authentication, Role Based Access Control
- Database: Supabase Cloud PostgreSQL Database

---

## Features

1. Role Based Access Control:
   - Admin: Full system permissions
   - Sales: Customer management and sales order creation
   - Warehouse: Stock management and inventory audit logs
   - Accounts: Financial views, billing reports, and PDF invoice downloads

2. Customer CRM Module:
   - Complete customer directory (Retail, Wholesale, Distributor)
   - Status pipeline tracking (Lead, Active, Inactive)
   - Timed follow up dates and interaction notes log

3. Product and Inventory Module:
   - Product catalog with SKU codes and warehouse locations
   - Real time low stock alerts
   - Stock movement audit logs (IN and OUT adjustments)

4. Sales Challan Module:
   - Automated sequential challan numbering (CH-2026-XXXX)
   - Frozen customer and product snapshot data for accurate historical record keeping
   - Stock fulfillment logic: Draft status holds order; Confirmed status automatically decrements inventory
   - Insufficient stock validation prevents negative inventory

5. Bonus PDF Invoice Export:
   - One click client side PDF invoice generation for sales challans

---

## Test Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| Admin | admin@erp.com | password123 | Full System Access |
| Sales | sales@erp.com | password123 | Customers and Sales Challans |
| Warehouse | warehouse@erp.com | password123 | Product Catalog and Stock IN/OUT |
| Accounts | accounts@erp.com | password123 | Billing Views and Invoice Export |

---

## Local Setup Instructions

### 1. Backend Setup

```bash
cd server
npm install
npm run dev
```

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev
```

---

## Deployment Setup

### Backend (Render)
- Root Directory: `server`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`

### Frontend (Vercel)
- Framework Preset: `Vite`
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

---

## Documentation Links

- API Documentation: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- Architecture Explanation: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Known Limitations: [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md)

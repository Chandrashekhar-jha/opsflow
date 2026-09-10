# Mini ERP + CRM Operations Portal

A full-stack Operations Portal designed for a wholesale & distribution business. Built with **Node.js, Express, TypeScript, Prisma (SQLite/PostgreSQL), and React (Vite)**.

---

## 🌟 Highlights & Features

1. **Role-Based Authentication (RBAC)**:
   - 4 Role Levels: `Admin`, `Sales`, `Warehouse`, `Accounts`.
   - Preset 1-Click Login buttons on the login page for instant reviewer demoing.
2. **Customer CRM Module**:
   - Manage Customer directory (Retail, Wholesale, Distributor).
   - Track status (`Lead` ➔ `Active` ➔ `Inactive`).
   - Recorded follow-up notes with dates & interaction logs.
3. **Product & Inventory Module**:
   - Track stock levels, SKU codes, categories, and warehouse bin locations.
   - Real-time **Low Stock Alert** indicators when stock falls below threshold.
   - Complete **Stock Movement Audit Log** (IN/OUT adjustments with audit reasons).
4. **Sales Challan & Order Fulfillment Module**:
   - Generate unique sequential Sales Challans (`CH-2026-0001`).
   - Freeze **Customer & Product snapshot data** (preserves historical pricing even if catalog prices change).
   - **Smart Stock Fulfillment Logic**:
     - `Draft` status holds order without changing inventory.
     - `Confirmed` status automatically reduces stock in an atomic database transaction.
     - **Negative Stock Protection**: API returns clean errors if requested quantity exceeds available stock.
5. **Bonus - Export Invoice as PDF**:
   - 1-Click printable PDF export feature for any sales order/challan.
6. **Postman Collection Included**:
   - Pre-configured [`postman_collection.json`](./postman_collection.json) in project root.

---

## 🔑 Test Credentials (All Roles)

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| 👑 **Admin** | `admin@erp.com` | `password123` | Full System Access & Override Rights |
| 💼 **Sales** | `sales@erp.com` | `password123` | Customer CRM & Create/Confirm Sales Challans |
| 📦 **Warehouse** | `warehouse@erp.com` | `password123` | Inventory Catalog & Stock IN/OUT Adjustments |
| 💳 **Accounts** | `accounts@erp.com` | `password123` | Financial Views, Customer Reports & Order Tracking |

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### 1. Setup & Run Backend (`/server`)

```bash
cd server

# Install dependencies
npm install

# Push Prisma Schema to database & generate client
npx prisma generate
npx prisma db push

# Seed sample data (users, customers, products, stock logs, challans)
npm run seed

# Start backend dev server (Runs on http://localhost:5000)
npm run dev
```

### 2. Setup & Run Frontend (`/client`)

```bash
cd client

# Install dependencies
npm install

# Start Vite dev server (Runs on http://localhost:5173)
npm run dev
```

---

## 📂 Project Architecture

```
ERP-CRM/
├── postman_collection.json   # Exported Postman API Collection
├── README.md                 # Project Setup & Documentation
├── server/                   # Node.js + Express + TypeScript Backend
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma ORM Database Schema
│   │   └── seed.ts           # Demo Data Seeder Script
│   ├── src/
│   │   ├── middleware/       # Auth JWT & RBAC Middlewares
│   │   ├── routes/           # Auth, Customer, Product, Challan REST APIs
│   │   └── server.ts         # Main Express Application Entry point
│   ├── .env
│   └── package.json
└── client/                   # React + TypeScript + Vite Frontend
    ├── src/
    │   ├── components/       # Login, Dashboard, Customer, Product, Challan Modules
    │   ├── services/         # API Fetch Helpers with Auth Token injection
    │   ├── utils/            # jsPDF Invoice Export Helper
    │   ├── App.tsx           # Main App with Sidebar Navigation
    │   └── index.css         # Glassmorphism & Custom HSL CSS Design System
    └── package.json
```

---

## ☁️ Deployment Instructions

### Deploying Backend (Render / Railway / Fly.io)
1. Push repository to GitHub.
2. Create a Web Service on **Render** pointing to `/server`.
3. Build Command: `npm install && npx prisma generate && npx prisma db push && npm run seed`
4. Start Command: `npm run start`
5. Environment Variables:
   - `PORT=5000`
   - `DATABASE_URL=file:./dev.db` (or PostgreSQL connection string)
   - `JWT_SECRET=your_jwt_secret_key`

### Deploying Frontend (Vercel / Netlify / Render Static)
1. Create a Static Site on **Vercel / Netlify** pointing to `/client`.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Update `API_BASE` in `client/src/services/api.ts` to match your live backend URL.

---

## 📝 Assumptions & Known Limitations

- **Local Database**: Built with SQLite via Prisma for instant local setup with zero external DB installation required. Can switch to PostgreSQL by changing `provider = "postgresql"` in `schema.prisma`.
- **JWT Expiry**: Set to 24 hours for evaluation convenience.

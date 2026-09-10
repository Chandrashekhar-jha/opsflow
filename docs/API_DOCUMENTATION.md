# OpsFlow API Documentation

OpsFlow is a Mini ERP and CRM Operational Portal for wholesale and distribution enterprises. This document outlines the complete REST API specification for developer integration.

Base Server URL: `https://opsflow-bbo7.onrender.com/api`

---

## 1. Authentication Endpoints

### 1.1 Login User
Authenticate user credentials and receive JWT bearer token.

- Endpoint: `POST /auth/login`
- Access: Public
- Request Body:
```json
{
  "email": "admin@erp.com",
  "password": "password123"
}
```
- Response (200 OK):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "u-101",
    "name": "System Admin",
    "email": "admin@erp.com",
    "role": "Admin"
  }
}
```

### 1.2 Get Authenticated Profile
Retrieve current logged in user details.

- Endpoint: `GET /auth/me`
- Access: Authenticated (Bearer Token required)
- Response (200 OK):
```json
{
  "id": "u-101",
  "name": "System Admin",
  "email": "admin@erp.com",
  "role": "Admin",
  "createdAt": "2026-09-10T19:45:00.000Z"
}
```

---

## 2. Customer CRM Endpoints

### 2.1 List Customers
Get paginated customer directory with search and status filtering.

- Endpoint: `GET /customers`
- Query Parameters: `page` (default 1), `limit` (default 10), `search`, `status` (Lead, Active, Inactive)
- Access: Authenticated
- Response (200 OK):
```json
{
  "data": [
    {
      "id": "cust-01",
      "name": "Apex Retailers",
      "mobile": "+91 98765 43210",
      "email": "contact@apexretail.com",
      "businessName": "Apex Electronics Pvt Ltd",
      "gstNumber": "27AAAAA0000A1Z5",
      "customerType": "Wholesale",
      "address": "Plot 42, Industrial Area, Mumbai",
      "status": "Active",
      "followUpDate": "2026-09-15T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 2.2 Create Customer
Add a new customer record to the CRM pipeline.

- Endpoint: `POST /customers`
- Access: Admin, Sales
- Request Body:
```json
{
  "name": "TechMart Solutions",
  "mobile": "+91 91234 56789",
  "email": "procurement@techmart.in",
  "businessName": "TechMart Enterprises",
  "gstNumber": "07BBBBB1111B2Z6",
  "customerType": "Distributor",
  "address": "108 Commercial Tower, New Delhi",
  "status": "Lead",
  "notes": "Interested in bulk keyboard purchases"
}
```

### 2.3 Add Customer Follow Up Note
Record an interaction note against a customer profile.

- Endpoint: `POST /customers/:id/notes`
- Access: Admin, Sales
- Request Body:
```json
{
  "note": "Meeting completed. Quotation sent via email.",
  "followUpDate": "2026-09-20"
}
```

---

## 3. Product & Inventory Endpoints

### 3.1 List Products
Query inventory stock items.

- Endpoint: `GET /products`
- Query Parameters: `search`, `category`, `lowStock` (true/false)
- Access: Authenticated

### 3.2 Adjust Stock Quantity (IN/OUT)
Record stock movement and update current inventory level.

- Endpoint: `POST /products/:id/stock`
- Access: Admin, Warehouse
- Request Body:
```json
{
  "quantityChanged": 20,
  "movementType": "IN",
  "reason": "New shipment received from vendor"
}
```

### 3.3 Query Stock Audit Movements
View inventory stock movement audit logs.

- Endpoint: `GET /products/movements`
- Access: Authenticated

---

## 4. Sales Challan Endpoints

### 4.1 Create Sales Challan
Generate a new sales order challan with product snapshots.

- Endpoint: `POST /challans`
- Access: Admin, Sales
- Request Body:
```json
{
  "customerId": "cust-01",
  "items": [
    {
      "productId": "prod-01",
      "quantity": 5
    }
  ],
  "status": "Confirmed"
}
```

### 4.2 Update Challan Status
Transition order status between Draft, Confirmed, and Cancelled.

- Endpoint: `PUT /challans/:id/status`
- Access: Admin, Sales
- Request Body:
```json
{
  "status": "Confirmed"
}
```

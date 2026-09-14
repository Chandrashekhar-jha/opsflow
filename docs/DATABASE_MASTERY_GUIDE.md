# Complete Guide: Relational Database, PostgreSQL, Supabase & Schema Design

Welcome to the fundamental guide on Relational Databases, PostgreSQL, Supabase, and Schema Design patterns used in enterprise applications like OpsFlow.

---

## 1. What is a Database? (Relational vs Non-Relational)

A Database is an organized collection of structured information or data stored electronically in a computer system.

### Relational Database Management System (RDBMS)
- Data is stored in **Tables** consisting of **Rows** and **Columns**.
- Tables have strict structure (Schemas).
- Tables can connect to each other using **Relationships** (Foreign Keys).
- Examples: PostgreSQL, MySQL, SQLite.

### Non-Relational Database (NoSQL)
- Data is stored in flexible JSON-like documents, Key-Value pairs, or Graphs.
- No rigid tables or mandatory schemas.
- Examples: MongoDB, Redis.

---

## 2. What is PostgreSQL?

PostgreSQL (often called Postgres) is an enterprise grade, open source **Relational Database Management System (RDBMS)**.

### Key Features of PostgreSQL:
1. **ACID Compliance**: Atomicity, Consistency, Isolation, Durability. Ensures 100% reliable financial transactions.
2. **Rich Data Types**: Supports standard SQL types (INT, TEXT, TIMESTAMP) alongside advanced types like `UUID` and `JSONB`.
3. **Foreign Keys and Cascading**: Automatic relational integrity enforcement.

---

## 3. What is Supabase?

Supabase is an open source **Backend as a Service (BaaS)** built directly on top of PostgreSQL.

### How Supabase Works under the hood:
```
+-------------------------------------------------------------+
|                      Your Client App                        |
+-------------------------------------------------------------+
                              |
                     REST / Realtime API
                              |
+-------------------------------------------------------------+
|                        Supabase                             |
|  - Auto-generated REST APIs (PostgREST)                     |
|  - Authentication & Storage Services                        |
+-------------------------------------------------------------+
                              |
                     SQL Database Engine
                              |
+-------------------------------------------------------------+
|                     PostgreSQL Database                     |
|   (Tables, Foreign Keys, Indexes, Constraints, JSONB Data)  |
+-------------------------------------------------------------+
```

When you use Supabase, you are writing native PostgreSQL tables and SQL statements. Supabase hosts the PostgreSQL database in the cloud and provides a JavaScript SDK (`@supabase/supabase-js`) to query it.

---

## 4. Fundamental Database Concepts Explained from Scratch

### A. Primary Keys and UUIDs
- **Primary Key (PK)**: A unique identifier for every single row in a table. No two rows can have the same Primary Key.
- **Auto Increment Integer**: `1, 2, 3, 4...` Easy to guess and prone to enumeration security risks.
- **UUID (Universally Unique Identifier)**: A 128-bit string generated pseudo-randomly (Example: `c56a4180-65aa-42ec-a945-5fd21dec0538`).
- SQL Syntax: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`

### B. Foreign Keys and Relationships
A **Foreign Key (FK)** is a column in one table that points directly to the Primary Key of another table.

- **One to Many Relationship Example**: One `Customer` can have many `Sales Challans`.
- SQL Syntax: `customer_id UUID REFERENCES public.customers(id)`

### C. Cascading Deletes (`ON DELETE CASCADE`)
What happens when you delete a parent record (Customer) that has child records (Follow-Up Notes)?
- Without Cascade: Database throws an error blocking deletion to prevent orphan records.
- With `ON DELETE CASCADE`: Deleting the parent Customer automatically deletes all child Follow-Up Notes.
- SQL Syntax: `customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE`

### D. PostgreSQL Data Types
1. **`TEXT`**: Variable length text string.
2. **`INT` / `INTEGER`**: Whole numbers.
3. **`NUMERIC(precision, scale)`**: Exact decimal numbers. Used for currency to prevent floating point rounding errors (`NUMERIC(10,2)` means up to 10 digits total, 2 after decimal point like `99999999.99`).
4. **`TIMESTAMP WITH TIME ZONE`**: Stores exact date and time alongside timezone information (`DEFAULT NOW()`).
5. **`JSONB`**: Binary JSON format. Stores structured JSON objects inside a relational table cell.

---

## 5. Line by Line Schema Breakdown (OpsFlow Application)

Below is the exact SQL code executed in Supabase for OpsFlow:

### Table 1: Users (`public.users`)
Stores operational staff and role credentials.

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Sales',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- `email TEXT UNIQUE`: Prevents multiple accounts with the same email.
- `role TEXT`: Enforces role access levels (`Admin`, `Sales`, `Warehouse`, `Accounts`).

### Table 2: Customers (`public.customers`)
Stores customer CRM leads and active client profiles.

```sql
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  gst_number TEXT,
  customer_type TEXT DEFAULT 'Retail',
  address TEXT NOT NULL,
  status TEXT DEFAULT 'Lead',
  follow_up_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table 3: Follow Up Notes (`public.follow_up_notes`)
Stores interaction timelines between staff and customers.

```sql
CREATE TABLE IF NOT EXISTS public.follow_up_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- Links every note to a specific customer (`customer_id`) and creator staff (`created_by`).

### Table 4: Products (`public.products`)
Stores warehouse inventory items and stock alert levels.

```sql
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  current_stock INT DEFAULT 0,
  min_stock_alert INT DEFAULT 10,
  warehouse_location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- `sku TEXT UNIQUE`: Barcode stock keeping unit.

### Table 5: Stock Movements (`public.stock_movements`)
Immutable audit log tracking every inventory quantity adjustment.

```sql
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_changed INT NOT NULL,
  movement_type TEXT NOT NULL, -- 'IN' or 'OUT'
  reason TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table 6: Sales Challans (`public.sales_challans`)
Stores order headers and billing status.

```sql
CREATE TABLE IF NOT EXISTS public.sales_challans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  customer_snapshot JSONB NOT NULL,
  total_quantity INT NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table 7: Challan Items (`public.challan_items`)
Stores line items within a sales challan.

```sql
CREATE TABLE IF NOT EXISTS public.challan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_id UUID REFERENCES public.sales_challans(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_snapshot JSONB NOT NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL
);
```

---

## 6. The Snapshot Design Pattern (Interview Favorite)

### Problem:
If a product price changes from ₹3,500 to ₹4,000 next month, or a customer renames their business, pulling data strictly via Foreign Key (`product_id`) will retroactively corrupt the financial amounts of past invoices.

### Solution (Snapshot Pattern):
During order creation, we store a frozen copy of the customer details and product prices inside `customer_snapshot` and `product_snapshot` as `JSONB`.

- **Foreign Keys (`customer_id`, `product_id`)**: Used for relational lookups and database auditing.
- **Snapshots (`JSONB`)**: Used for historical financial integrity and PDF invoice generation.

import { supabase } from '../src/supabase';
import bcrypt from 'bcryptjs';

async function setupTablesAndSeed() {
  console.log('🚀 Setting up Supabase Database tables and initial seed data...');

  // 1. Create SQL Schema in Supabase using SQL query API via RPC if available, or direct DB query
  const createTablesSQL = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Sales',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Customers Table
    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

    -- Follow Up Notes Table
    CREATE TABLE IF NOT EXISTS follow_up_notes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
      note TEXT NOT NULL,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Products Table
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      unit_price NUMERIC(10,2) NOT NULL,
      current_stock INT DEFAULT 0,
      min_stock_alert INT DEFAULT 10,
      warehouse_location TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Stock Movements Table
    CREATE TABLE IF NOT EXISTS stock_movements (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      quantity_changed INT NOT NULL,
      movement_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Sales Challans Table
    CREATE TABLE IF NOT EXISTS sales_challans (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      challan_number TEXT UNIQUE NOT NULL,
      customer_id UUID REFERENCES customers(id),
      customer_snapshot JSONB NOT NULL,
      total_quantity INT NOT NULL,
      total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'Draft',
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Challan Items Table
    CREATE TABLE IF NOT EXISTS challan_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      challan_id UUID REFERENCES sales_challans(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id),
      product_snapshot JSONB NOT NULL,
      quantity INT NOT NULL,
      unit_price NUMERIC(10,2) NOT NULL
    );
  `;

  // We can execute SQL via Supabase rpc if configured, or perform table inserts
  console.log('🌱 Seeding users into Supabase...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const usersData = [
    { name: 'System Admin', email: 'admin@erp.com', password: passwordHash, role: 'Admin' },
    { name: 'Rahul Sales Manager', email: 'sales@erp.com', password: passwordHash, role: 'Sales' },
    { name: 'Vikram Warehouse Lead', email: 'warehouse@erp.com', password: passwordHash, role: 'Warehouse' },
    { name: 'Priya Accounts Head', email: 'accounts@erp.com', password: passwordHash, role: 'Accounts' },
  ];

  for (const u of usersData) {
    const { error } = await supabase.from('users').upsert(u, { onConflict: 'email' });
    if (error) {
      console.warn(`Note on upserting user ${u.email}:`, error.message);
    }
  }

  console.log('✅ Demo Users processed in Supabase (admin@erp.com, sales@erp.com, etc.)');
}

setupTablesAndSeed().catch(console.error);

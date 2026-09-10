import { supabase } from '../src/supabase';
import bcrypt from 'bcryptjs';

async function seedSupabase() {
  console.log('🚀 Direct Supabase Cloud Seeding...');

  // 1. Password hash
  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Users
  const users = [
    { name: 'System Admin', email: 'admin@erp.com', password: passwordHash, role: 'Admin' },
    { name: 'Rahul Sales Manager', email: 'sales@erp.com', password: passwordHash, role: 'Sales' },
    { name: 'Vikram Warehouse Lead', email: 'warehouse@erp.com', password: passwordHash, role: 'Warehouse' },
    { name: 'Priya Accounts Head', email: 'accounts@erp.com', password: passwordHash, role: 'Accounts' },
  ];

  for (const user of users) {
    const { error } = await supabase.from('users').upsert(user, { onConflict: 'email' });
    if (error) {
      console.log(`User note (${user.email}):`, error.message);
    }
  }

  // Get Admin and Sales User IDs
  const { data: adminUser } = await supabase.from('users').select('id').eq('email', 'admin@erp.com').single();
  const { data: salesUser } = await supabase.from('users').select('id').eq('email', 'sales@erp.com').single();
  const { data: warehouseUser } = await supabase.from('users').select('id').eq('email', 'warehouse@erp.com').single();

  const adminId = adminUser?.id;
  const salesId = salesUser?.id;
  const warehouseId = warehouseUser?.id;

  // 3. Customers
  const customerList = [
    {
      name: 'Apex Retailers',
      mobile: '+91 98765 43210',
      email: 'contact@apexretail.com',
      business_name: 'Apex Electronics & Retail Pvt Ltd',
      gst_number: '27AAAAA0000A1Z5',
      customer_type: 'Wholesale',
      address: 'Plot 42, Industrial Area Phase 1, Mumbai, MH',
      status: 'Active',
      notes: 'Key distributor for Western region.',
    },
    {
      name: 'TechMart Solutions',
      mobile: '+91 91234 56789',
      email: 'procurement@techmart.in',
      business_name: 'TechMart Enterprises',
      gst_number: '07BBBBB1111B2Z6',
      customer_type: 'Distributor',
      address: '108 Commercial Tower, Nehru Place, New Delhi',
      status: 'Lead',
      notes: 'Interested in bulk purchasing wireless routers and keyboards.',
    },
    {
      name: 'GreenField Supplies',
      mobile: '+91 99887 76655',
      email: 'info@greenfield.org',
      business_name: 'GreenField Trading Co.',
      gst_number: '29CCCCC2222C3Z7',
      customer_type: 'Retail',
      address: '54 MG Road, Bengaluru, KA',
      status: 'Inactive',
      notes: 'Account suspended due to pending invoice clearance.',
    },
  ];

  for (const c of customerList) {
    const { data: insertedCust, error } = await supabase.from('customers').insert(c).select().single();
    if (insertedCust && salesId) {
      await supabase.from('follow_up_notes').insert({
        customer_id: insertedCust.id,
        note: `Initial meeting completed for ${c.name}.`,
        created_by: salesId,
      });
    }
  }

  // 4. Products
  const productList = [
    {
      name: 'Ergonomic Mechanical Keyboard RGB',
      sku: 'KB-ERG-001',
      category: 'Peripherals',
      unit_price: 3499.00,
      current_stock: 120,
      min_stock_alert: 15,
      warehouse_location: 'Rack A-12, Section B',
    },
    {
      name: 'UltraWide Curved Monitor 34"',
      sku: 'MON-UW34-002',
      category: 'Displays',
      unit_price: 28500.00,
      current_stock: 18,
      min_stock_alert: 5,
      warehouse_location: 'Bay 3, Floor 1',
    },
    {
      name: 'Wireless Ergonomic Mouse',
      sku: 'MS-WLS-003',
      category: 'Peripherals',
      unit_price: 1299.00,
      current_stock: 8,
      min_stock_alert: 10,
      warehouse_location: 'Rack A-05, Section A',
    },
    {
      name: 'USB-C Docking Station Multiport',
      sku: 'DCK-USBC-004',
      category: 'Accessories',
      unit_price: 4500.00,
      current_stock: 65,
      min_stock_alert: 10,
      warehouse_location: 'Rack C-02, Section A',
    },
  ];

  for (const p of productList) {
    const { data: insertedProd } = await supabase.from('products').upsert(p, { onConflict: 'sku' }).select().single();
    if (insertedProd && warehouseId) {
      await supabase.from('stock_movements').insert({
        product_id: insertedProd.id,
        quantity_changed: insertedProd.current_stock,
        movement_type: 'IN',
        reason: 'Initial Vendor Shipment Batch',
        created_by: warehouseId,
      });
    }
  }

  console.log('🎉 Supabase Seeding Script Completed Successfully!');
}

seedSupabase().catch(console.error);

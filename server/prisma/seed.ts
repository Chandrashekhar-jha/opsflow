import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Users for all 4 roles
  const passwordHash = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@erp.com',
      password: passwordHash,
      role: 'Admin',
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@erp.com' },
    update: {},
    create: {
      name: 'Rahul Sales Manager',
      email: 'sales@erp.com',
      password: passwordHash,
      role: 'Sales',
    },
  });

  const warehouseUser = await prisma.user.upsert({
    where: { email: 'warehouse@erp.com' },
    update: {},
    create: {
      name: 'Vikram Warehouse Lead',
      email: 'warehouse@erp.com',
      password: passwordHash,
      role: 'Warehouse',
    },
  });

  const accountsUser = await prisma.user.upsert({
    where: { email: 'accounts@erp.com' },
    update: {},
    create: {
      name: 'Priya Accounts Head',
      email: 'accounts@erp.com',
      password: passwordHash,
      role: 'Accounts',
    },
  });

  console.log('✅ Users created with default password "password123":');
  console.log('   - admin@erp.com (Admin)');
  console.log('   - sales@erp.com (Sales)');
  console.log('   - warehouse@erp.com (Warehouse)');
  console.log('   - accounts@erp.com (Accounts)');

  // 2. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Apex Retailers',
      mobile: '+91 98765 43210',
      email: 'contact@apexretail.com',
      businessName: 'Apex Electronics & Retail Pvt Ltd',
      gstNumber: '27AAAAA0000A1Z5',
      customerType: 'Wholesale',
      address: 'Plot 42, Industrial Area Phase 1, Mumbai, MH',
      status: 'Active',
      followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Key distributor for Western region.',
      notesList: {
        create: [
          {
            note: 'Initial meeting completed. Requested 10% wholesale discount.',
            createdBy: salesUser.id,
          },
          {
            note: 'Approved discount structure for orders over 50 units.',
            createdBy: adminUser.id,
          },
        ],
      },
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'TechMart Solutions',
      mobile: '+91 91234 56789',
      email: 'procurement@techmart.in',
      businessName: 'TechMart Enterprises',
      gstNumber: '07BBBBB1111B2Z6',
      customerType: 'Distributor',
      address: '108 Commercial Tower, Nehru Place, New Delhi',
      status: 'Lead',
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Interested in bulk purchasing wireless routers and keyboards.',
      notesList: {
        create: [
          {
            note: 'Sent product catalog via email.',
            createdBy: salesUser.id,
          },
        ],
      },
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'GreenField Supplies',
      mobile: '+91 99887 76655',
      email: 'info@greenfield.org',
      businessName: 'GreenField Trading Co.',
      gstNumber: '29CCCCC2222C3Z7',
      customerType: 'Retail',
      address: '54 MG Road, Bengaluru, KA',
      status: 'Inactive',
      notes: 'Account suspended due to pending invoice clearance.',
    },
  });

  console.log('✅ Sample customers created.');

  // 3. Create Products
  const p1 = await prisma.product.create({
    data: {
      name: 'Ergonomic Mechanical Keyboard RGB',
      sku: 'KB-ERG-001',
      category: 'Peripherals',
      unitPrice: 3499.00,
      currentStock: 120,
      minStockAlert: 15,
      warehouseLocation: 'Rack A-12, Section B',
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'UltraWide Curved Monitor 34"',
      sku: 'MON-UW34-002',
      category: 'Displays',
      unitPrice: 28500.00,
      currentStock: 18,
      minStockAlert: 5,
      warehouseLocation: 'Bay 3, Floor 1',
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: 'Wireless Ergonomic Mouse',
      sku: 'MS-WLS-003',
      category: 'Peripherals',
      unitPrice: 1299.00,
      currentStock: 8, // Low stock!
      minStockAlert: 10,
      warehouseLocation: 'Rack A-05, Section A',
    },
  });

  const p4 = await prisma.product.create({
    data: {
      name: 'USB-C Docking Station Multiport',
      sku: 'DCK-USBC-004',
      category: 'Accessories',
      unitPrice: 4500.00,
      currentStock: 65,
      minStockAlert: 10,
      warehouseLocation: 'Rack C-02, Section A',
    },
  });

  console.log('✅ Sample products created.');

  // 4. Initial Stock Movements
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: p1.id,
        quantityChanged: 120,
        movementType: 'IN',
        reason: 'Initial Vendor Shipment Batch #8912',
        createdBy: warehouseUser.id,
      },
      {
        productId: p2.id,
        quantityChanged: 20,
        movementType: 'IN',
        reason: 'Factory Direct Supply',
        createdBy: warehouseUser.id,
      },
      {
        productId: p2.id,
        quantityChanged: 2,
        movementType: 'OUT',
        reason: 'Damaged during unloading audit',
        createdBy: warehouseUser.id,
      },
      {
        productId: p3.id,
        quantityChanged: 10,
        movementType: 'IN',
        reason: 'Stock replenishment',
        createdBy: warehouseUser.id,
      },
    ],
  });

  console.log('✅ Initial stock movements logged.');

  // 5. Create Sample Sales Challans
  // Challan 1: Confirmed
  const challan1No = 'CH-2026-0001';
  const customerSnapshot1 = JSON.stringify({
    id: customer1.id,
    name: customer1.name,
    businessName: customer1.businessName,
    mobile: customer1.mobile,
    email: customer1.email,
    address: customer1.address,
    gstNumber: customer1.gstNumber,
  });

  const challan1 = await prisma.salesChallan.create({
    data: {
      challanNumber: challan1No,
      customerId: customer1.id,
      customerSnapshot: customerSnapshot1,
      totalQuantity: 5,
      totalAmount: p1.unitPrice * 5,
      status: 'Confirmed',
      createdBy: salesUser.id,
      items: {
        create: [
          {
            productId: p1.id,
            productSnapshot: JSON.stringify({
              id: p1.id,
              name: p1.name,
              sku: p1.sku,
              unitPrice: p1.unitPrice,
            }),
            quantity: 5,
            unitPrice: p1.unitPrice,
          },
        ],
      },
    },
  });

  // Log stock reduction for Confirmed Challan 1
  await prisma.product.update({
    where: { id: p1.id },
    data: { currentStock: { decrement: 5 } },
  });

  await prisma.stockMovement.create({
    data: {
      productId: p1.id,
      quantityChanged: 5,
      movementType: 'OUT',
      reason: `Challan Confirmed: ${challan1No}`,
      createdBy: salesUser.id,
    },
  });

  // Challan 2: Draft
  const challan2No = 'CH-2026-0002';
  await prisma.salesChallan.create({
    data: {
      challanNumber: challan2No,
      customerId: customer2.id,
      customerSnapshot: JSON.stringify({
        id: customer2.id,
        name: customer2.name,
        businessName: customer2.businessName,
        mobile: customer2.mobile,
        email: customer2.email,
        address: customer2.address,
        gstNumber: customer2.gstNumber,
      }),
      totalQuantity: 4,
      totalAmount: p2.unitPrice * 1 + p4.unitPrice * 3,
      status: 'Draft',
      createdBy: salesUser.id,
      items: {
        create: [
          {
            productId: p2.id,
            productSnapshot: JSON.stringify({
              id: p2.id,
              name: p2.name,
              sku: p2.sku,
              unitPrice: p2.unitPrice,
            }),
            quantity: 1,
            unitPrice: p2.unitPrice,
          },
          {
            productId: p4.id,
            productSnapshot: JSON.stringify({
              id: p4.id,
              name: p4.name,
              sku: p4.sku,
              unitPrice: p4.unitPrice,
            }),
            quantity: 3,
            unitPrice: p4.unitPrice,
          },
        ],
      },
    },
  });

  console.log('✅ Sample Sales Challans created.');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

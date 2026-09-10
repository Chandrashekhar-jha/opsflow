import { Router, Response } from 'express';
import { supabase } from '../supabase';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/challans
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('sales_challans')
      .select('id, challan_number, customer_id, customer_snapshot, total_quantity, total_amount, status, created_at, customers(id, name, business_name, mobile, email), users(id, name, role)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`challan_number.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: challans, count, error } = await query.range(from, to);

    if (error) throw error;

    const formatted = (challans || []).map((c: any) => ({
      id: c.id,
      challanNumber: c.challan_number,
      customerSnapshot: c.customer_snapshot,
      totalQuantity: c.total_quantity,
      totalAmount: parseFloat(c.total_amount),
      status: c.status,
      createdAt: c.created_at,
      customer: c.customers ? {
        id: c.customers.id,
        name: c.customers.name,
        businessName: c.customers.business_name,
        mobile: c.customers.mobile,
        email: c.customers.email,
      } : null,
      user: c.users ? { id: c.users.id, name: c.users.name, role: c.users.role } : null,
    }));

    return res.json({
      data: formatted,
      meta: {
        total: count || formatted.length,
        page,
        limit,
        totalPages: Math.ceil((count || formatted.length) / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching sales challans', error: error.message });
  }
});

// GET /api/challans/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: challan, error } = await supabase
      .from('sales_challans')
      .select('*, customers(*), users(id, name, email, role)')
      .eq('id', id)
      .single();

    if (error || !challan) {
      return res.status(404).json({ message: 'Sales Challan not found' });
    }

    const { data: items } = await supabase
      .from('challan_items')
      .select('*, products(*)')
      .eq('challan_id', id);

    const formattedItems = (items || []).map((i: any) => ({
      id: i.id,
      productId: i.product_id,
      productSnapshot: i.product_snapshot,
      quantity: i.quantity,
      unitPrice: parseFloat(i.unit_price),
      product: i.products ? { id: i.products.id, name: i.products.name, sku: i.products.sku } : null,
    }));

    return res.json({
      id: challan.id,
      challanNumber: challan.challan_number,
      customerSnapshot: challan.customer_snapshot,
      totalQuantity: challan.total_quantity,
      totalAmount: parseFloat(challan.total_amount),
      status: challan.status,
      createdAt: challan.created_at,
      customer: challan.customers ? {
        id: challan.customers.id,
        name: challan.customers.name,
        businessName: challan.customers.business_name,
        mobile: challan.customers.mobile,
        email: challan.customers.email,
        address: challan.customers.address,
        gstNumber: challan.customers.gst_number,
      } : null,
      user: challan.users ? { id: challan.users.id, name: challan.users.name, role: challan.users.role } : null,
      items: formattedItems,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching sales challan', error: error.message });
  }
});

// POST /api/challans - Create Sales Challan
router.post('/', authenticateToken, requireRole(['Admin', 'Sales']), async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, items, status } = req.body;

    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Customer ID and non-empty items array are required' });
    }

    if (!req.user) return res.status(401).json({ message: 'User reference missing' });

    const targetStatus = ['Draft', 'Confirmed'].includes(status) ? status : 'Draft';

    // Fetch customer
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (custErr || !customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customerSnapshot = {
      id: customer.id,
      name: customer.name,
      businessName: customer.business_name,
      mobile: customer.mobile,
      email: customer.email,
      address: customer.address,
      gstNumber: customer.gst_number,
    };

    // Validate products & stock
    const productIds = items.map((i: any) => i.productId);
    const { data: dbProducts, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (prodErr || !dbProducts) {
      return res.status(404).json({ message: 'Products not found' });
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    let totalQuantity = 0;
    let totalAmount = 0;
    const itemsToInsert: any[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }

      const qty = parseInt(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ message: `Invalid quantity for product ${product.name}` });
      }

      if (targetStatus === 'Confirmed' && product.current_stock < qty) {
        return res.status(400).json({
          message: `Insufficient stock for product "${product.name}". Available: ${product.current_stock}, Requested: ${qty}`,
        });
      }

      totalQuantity += qty;
      const unitPrice = parseFloat(product.unit_price);
      totalAmount += unitPrice * qty;

      itemsToInsert.push({
        productId: product.id,
        productSnapshot: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice,
        },
        quantity: qty,
        unitPrice,
      });
    }

    // Generate Challan Number
    const { count } = await supabase.from('sales_challans').select('*', { count: 'exact', head: true });
    const nextSeq = ((count || 0) + 1).toString().padStart(4, '0');
    const year = new Date().getFullYear();
    const challanNumber = `CH-${year}-${nextSeq}`;

    // Insert Challan Header
    const { data: createdChallan, error: createErr } = await supabase
      .from('sales_challans')
      .insert({
        challan_number: challanNumber,
        customer_id: customer.id,
        customer_snapshot: customerSnapshot,
        total_quantity: totalQuantity,
        total_amount: totalAmount,
        status: targetStatus,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (createErr) throw createErr;

    // Insert Line Items
    const formattedItems = itemsToInsert.map((i) => ({
      challan_id: createdChallan.id,
      product_id: i.productId,
      product_snapshot: i.productSnapshot,
      quantity: i.quantity,
      unit_price: i.unitPrice,
    }));

    await supabase.from('challan_items').insert(formattedItems);

    // If Confirmed, reduce stock
    if (targetStatus === 'Confirmed') {
      for (const item of itemsToInsert) {
        const product = productMap.get(item.productId);
        if (product) {
          const newStock = product.current_stock - item.quantity;
          await supabase.from('products').update({ current_stock: newStock }).eq('id', item.productId);

          await supabase.from('stock_movements').insert({
            product_id: item.productId,
            quantity_changed: item.quantity,
            movement_type: 'OUT',
            reason: `Sales Challan Confirmed: ${challanNumber}`,
            created_by: req.user.id,
          });
        }
      }
    }

    return res.status(201).json({
      id: createdChallan.id,
      challanNumber: createdChallan.challan_number,
      totalQuantity: createdChallan.total_quantity,
      totalAmount: parseFloat(createdChallan.total_amount),
      status: createdChallan.status,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error creating sales challan', error: error.message });
  }
});

// PUT /api/challans/:id/status - Update Status (e.g. Draft -> Confirmed)
router.put('/:id/status', authenticateToken, requireRole(['Admin', 'Sales']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Draft', 'Confirmed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (!req.user) return res.status(401).json({ message: 'User reference missing' });

    const { data: challan, error: fetchErr } = await supabase
      .from('sales_challans')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !challan) {
      return res.status(404).json({ message: 'Sales Challan not found' });
    }

    if (challan.status === status) {
      return res.json(challan);
    }

    const { data: items } = await supabase
      .from('challan_items')
      .select('*')
      .eq('challan_id', id);

    // Transition Draft -> Confirmed
    if (challan.status === 'Draft' && status === 'Confirmed') {
      for (const item of (items || [])) {
        const { data: prod } = await supabase.from('products').select('*').eq('id', item.product_id).single();
        if (!prod || prod.current_stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for product "${prod?.name || item.product_id}"`,
          });
        }
      }

      for (const item of (items || [])) {
        const { data: prod } = await supabase.from('products').select('current_stock').eq('id', item.product_id).single();
        if (prod) {
          const newStock = prod.current_stock - item.quantity;
          await supabase.from('products').update({ current_stock: newStock }).eq('id', item.product_id);

          await supabase.from('stock_movements').insert({
            product_id: item.product_id,
            quantity_changed: item.quantity,
            movement_type: 'OUT',
            reason: `Sales Challan Confirmed: ${challan.challan_number}`,
            created_by: req.user.id,
          });
        }
      }
    }

    const { data: updated } = await supabase
      .from('sales_challans')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

export default router;

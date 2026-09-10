import { Router, Response } from 'express';
import { supabase } from '../supabase';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/products
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const lowStockOnly = req.query.lowStock === 'true';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,category.ilike.%${search}%,warehouse_location.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: products, count, error } = await query.range(from, to);

    if (error) throw error;

    let formatted = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: parseFloat(p.unit_price),
      currentStock: p.current_stock,
      minStockAlert: p.min_stock_alert,
      warehouseLocation: p.warehouse_location,
      createdAt: p.created_at,
    }));

    if (lowStockOnly) {
      formatted = formatted.filter((p: any) => p.currentStock <= p.minStockAlert);
    }

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
    return res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// GET /api/products/movements - Audit logs
router.get('/movements', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: movements, count, error } = await supabase
      .from('stock_movements')
      .select('id, quantity_changed, movement_type, reason, created_at, products(id, name, sku), users(id, name, role)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const formatted = (movements || []).map((m: any) => ({
      id: m.id,
      quantityChanged: m.quantity_changed,
      movementType: m.movement_type,
      reason: m.reason,
      createdAt: m.created_at,
      product: m.products ? { id: m.products.id, name: m.products.name, sku: m.products.sku } : null,
      user: m.users ? { id: m.users.id, name: m.users.name, role: m.users.role } : null,
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
    return res.status(500).json({ message: 'Error fetching stock movements', error: error.message });
  }
});

// POST /api/products
router.post('/', authenticateToken, requireRole(['Admin', 'Warehouse']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, category, unitPrice, currentStock, minStockAlert, warehouseLocation } = req.body;

    if (!name || !sku || !category || unitPrice === undefined || !warehouseLocation) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const initialStock = parseInt(currentStock) || 0;

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        sku,
        category,
        unit_price: parseFloat(unitPrice),
        current_stock: initialStock,
        min_stock_alert: parseInt(minStockAlert) || 10,
        warehouse_location: warehouseLocation,
      })
      .select()
      .single();

    if (error) throw error;

    if (initialStock > 0 && req.user) {
      await supabase.from('stock_movements').insert({
        product_id: product.id,
        quantity_changed: initialStock,
        movement_type: 'IN',
        reason: 'Initial stock setup on creation',
        created_by: req.user.id,
      });
    }

    return res.status(201).json({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      unitPrice: parseFloat(product.unit_price),
      currentStock: product.current_stock,
      minStockAlert: product.min_stock_alert,
      warehouseLocation: product.warehouse_location,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// POST /api/products/:id/stock - Adjust Stock IN/OUT
router.post('/:id/stock', authenticateToken, requireRole(['Admin', 'Warehouse']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantityChanged, movementType, reason } = req.body;

    const qty = parseInt(quantityChanged);
    if (!qty || qty <= 0 || !['IN', 'OUT'].includes(movementType) || !reason) {
      return res.status(400).json({ message: 'Invalid quantityChanged, movementType, or reason' });
    }

    const { data: product, error: fetchErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (movementType === 'OUT' && product.current_stock < qty) {
      return res.status(400).json({
        message: `Insufficient stock! Available: ${product.current_stock}, Requested reduction: ${qty}`,
      });
    }

    const newStock = movementType === 'IN' ? product.current_stock + qty : product.current_stock - qty;

    const { data: updatedProduct, error: updateErr } = await supabase
      .from('products')
      .update({ current_stock: newStock })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    if (req.user) {
      await supabase.from('stock_movements').insert({
        product_id: id,
        quantity_changed: qty,
        movement_type: movementType,
        reason,
        created_by: req.user.id,
      });
    }

    return res.json({
      message: 'Stock updated successfully',
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        currentStock: updatedProduct.current_stock,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error adjusting stock', error: error.message });
  }
});

export default router;

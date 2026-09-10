import { Router, Response } from 'express';
import { supabase } from '../supabase';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/customers - List, search, filter, paginate via Supabase
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const customerType = (req.query.customerType as string) || '';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,business_name.ilike.%${search}%,email.ilike.%${search}%,mobile.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (customerType) {
      query = query.eq('customer_type', customerType);
    }

    const { data: customers, count, error } = await query.range(from, to);

    if (error) {
      throw error;
    }

    const formattedCustomers = (customers || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      mobile: c.mobile,
      email: c.email,
      businessName: c.business_name,
      gstNumber: c.gst_number,
      customerType: c.customer_type,
      address: c.address,
      status: c.status,
      followUpDate: c.follow_up_date,
      notes: c.notes,
      createdAt: c.created_at,
    }));

    const total = count || 0;

    return res.json({
      data: formattedCustomers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
});

// GET /api/customers/:id - Single customer with notes
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Fetch notes list with user info
    const { data: notes } = await supabase
      .from('follow_up_notes')
      .select('id, note, created_at, users (id, name, role)')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    const formattedNotes = (notes || []).map((n: any) => ({
      id: n.id,
      note: n.note,
      createdAt: n.created_at,
      user: n.users ? { id: n.users.id, name: n.users.name, role: n.users.role } : null,
    }));

    return res.json({
      id: customer.id,
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      businessName: customer.business_name,
      gstNumber: customer.gst_number,
      customerType: customer.customer_type,
      address: customer.address,
      status: customer.status,
      followUpDate: customer.follow_up_date,
      notes: customer.notes,
      createdAt: customer.created_at,
      notesList: formattedNotes,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching customer details', error: error.message });
  }
});

// POST /api/customers - Add Customer
router.post('/', authenticateToken, requireRole(['Admin', 'Sales']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = req.body;

    if (!name || !mobile || !email || !businessName || !address) {
      return res.status(400).json({ message: 'Name, mobile, email, businessName, and address are required' });
    }

    const { data: newCust, error } = await supabase
      .from('customers')
      .insert({
        name,
        mobile,
        email,
        business_name: businessName,
        gst_number: gstNumber || null,
        customer_type: customerType || 'Retail',
        address,
        status: status || 'Lead',
        follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    if (notes && req.user) {
      await supabase.from('follow_up_notes').insert({
        customer_id: newCust.id,
        note: `Initial Note: ${notes}`,
        created_by: req.user.id,
      });
    }

    return res.status(201).json(newCust);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error creating customer', error: error.message });
  }
});

// POST /api/customers/:id/notes - Add Follow up note
router.post('/:id/notes', authenticateToken, requireRole(['Admin', 'Sales']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note, followUpDate } = req.body;

    if (!note) return res.status(400).json({ message: 'Note text is required' });
    if (!req.user) return res.status(401).json({ message: 'User reference missing' });

    const { data: newNote, error } = await supabase
      .from('follow_up_notes')
      .insert({
        customer_id: id,
        note,
        created_by: req.user.id,
      })
      .select('id, note, created_at')
      .single();

    if (error) throw error;

    if (followUpDate) {
      await supabase
        .from('customers')
        .update({ follow_up_date: new Date(followUpDate).toISOString() })
        .eq('id', id);
    }

    return res.status(201).json({
      id: newNote.id,
      note: newNote.note,
      createdAt: newNote.created_at,
      user: { id: req.user.id, name: req.user.name, role: req.user.role },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error adding note', error: error.message });
  }
});

export default router;

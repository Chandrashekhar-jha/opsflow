import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { generateChallanPDF } from '../utils/pdfExport';
import { Plus, Search, Filter, Download, CheckCircle, Trash2, Eye, X } from 'lucide-react';

interface ChallanModuleProps {
  userRole: string;
}

export const ChallanModule: React.FC<ChallanModuleProps> = ({ userRole }) => {
  const [challans, setChallans] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Create Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [challanItems, setChallanItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 },
  ]);
  const [creationStatus, setCreationStatus] = useState<'Draft' | 'Confirmed'>('Confirmed');
  const [formError, setFormError] = useState('');

  const canCreate = ['Admin', 'Sales'].includes(userRole);

  useEffect(() => {
    fetchChallans();
    fetchCustomersAndProducts();
  }, [search, statusFilter]);

  const fetchChallans = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter) query.append('status', statusFilter);

      const res = await apiFetch(`/challans?${query.toString()}`);
      setChallans(res.data || []);
    } catch (err) {
      console.error('Failed to fetch challans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersAndProducts = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        apiFetch('/customers?limit=100'),
        apiFetch('/products?limit=100'),
      ]);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error('Failed to fetch customer/product metadata:', err);
    }
  };

  const handleAddItemRow = () => {
    setChallanItems([...challanItems, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (challanItems.length === 1) return;
    setChallanItems(challanItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...challanItems];
    updated[index] = { ...updated[index], [field]: value };
    setChallanItems(updated);
  };

  const calculateFormTotal = () => {
    const prodMap = new Map(products.map((p) => [p.id, p]));
    let total = 0;
    challanItems.forEach((item) => {
      const p = prodMap.get(item.productId);
      if (p) {
        total += p.unitPrice * (item.quantity || 0);
      }
    });
    return total;
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedCustomerId) {
      setFormError('Please select a customer');
      return;
    }

    const invalidItems = challanItems.some((item) => !item.productId || item.quantity <= 0);
    if (invalidItems) {
      setFormError('All item rows must have a valid product selected and quantity > 0');
      return;
    }

    try {
      await apiFetch('/challans', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: challanItems,
          status: creationStatus,
        }),
      });

      setShowCreateModal(false);
      setSelectedCustomerId('');
      setChallanItems([{ productId: '', quantity: 1 }]);
      fetchChallans();
    } catch (err: any) {
      setFormError(err.message || 'Error creating Sales Challan');
    }
  };

  const handleStatusUpdate = async (challanId: string, newStatus: string) => {
    try {
      await apiFetch(`/challans/${challanId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchChallans();
      if (selectedChallan && selectedChallan.id === challanId) {
        setSelectedChallan({ ...selectedChallan, status: newStatus });
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleViewChallan = async (id: string) => {
    try {
      const res = await apiFetch(`/challans/${id}`);
      setSelectedChallan(res);
      setShowDetailModal(true);
    } catch (err: any) {
      alert(err.message || 'Error fetching challan details');
    }
  };

  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Sales Challan Module</h1>
          <p className="page-subtitle">Generate sales orders, freeze item snapshots, and control inventory fulfillment</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Create Sales Challan
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '38px' }}
            placeholder="Search by Challan No (e.g. CH-2026-0001) or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            className="form-control"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Challan Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Challan No</th>
              <th>Customer</th>
              <th>Total Qty</th>
              <th>Total Value</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading sales challans...
                </td>
              </tr>
            ) : challans.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No sales challans found.
                </td>
              </tr>
            ) : (
              challans.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{c.challanNumber}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.customer?.name || 'Customer'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.customer?.businessName}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.totalQuantity} items</td>
                  <td style={{ fontWeight: 700 }}>₹{c.totalAmount.toLocaleString('en-IN')}</td>
                  <td>
                    <span
                      className={`badge ${
                        c.status === 'Confirmed'
                          ? 'badge-success'
                          : c.status === 'Draft'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td>{c.user?.name || 'Sales Staff'}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleViewChallan(c.id)}>
                        <Eye size={14} /> View
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--accent)' }}
                        onClick={() => generateChallanPDF(c)}
                        title="Download PDF Invoice"
                      >
                        <Download size={14} /> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Sales Challan Builder */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Create New Sales Challan</h2>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowCreateModal(false)} />
            </div>

            {formError && (
              <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '16px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateChallan}>
              <div className="form-group">
                <label className="form-label">Select Customer *</label>
                <select
                  className="form-control"
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} ({cust.businessName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Table */}
              <div style={{ margin: '20px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="form-label">Challan Line Items</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItemRow}>
                    <Plus size={14} /> Add Product Line
                  </button>
                </div>

                {challanItems.map((item, idx) => {
                  const selectedProd = products.find((p) => p.id === item.productId);
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                      <select
                        className="form-control"
                        style={{ flex: 2 }}
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      >
                        <option value="">-- Select Product --</option>
                        {products.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.name} (SKU: {prod.sku}) - Stock: {prod.currentStock} - ₹{prod.unitPrice}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        className="form-control"
                        style={{ flex: 1 }}
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                      />

                      <div style={{ flex: 1, fontSize: '13px', fontWeight: 700, textAlign: 'right' }}>
                        ₹{selectedProd ? (selectedProd.unitPrice * (item.quantity || 1)).toFixed(2) : '0.00'}
                      </div>

                      {challanItems.length > 1 && (
                        <Trash2
                          size={18}
                          color="var(--danger)"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleRemoveItemRow(idx)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Total & Save Option */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '4px' }}>Challan Order Action</label>
                  <select
                    className="form-control"
                    style={{ width: '220px' }}
                    value={creationStatus}
                    onChange={(e) => setCreationStatus(e.target.value as any)}
                  >
                    <option value="Confirmed">Confirmed (Reduces Stock Now)</option>
                    <option value="Draft">Draft (Hold - No Stock Change)</option>
                  </select>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Calculated Total Amount</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--success)' }}>
                    ₹{calculateFormTotal().toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate Sales Challan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Challan View Detail & PDF */}
      {showDetailModal && selectedChallan && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{selectedChallan.challanNumber}</h2>
                <span className={`badge ${selectedChallan.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>
                  {selectedChallan.status}
                </span>
              </div>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowDetailModal(false)} />
            </div>

            {/* Customer Snapshot Card */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Billed Customer Snapshot</div>
              <div style={{ fontWeight: 700 }}>{selectedChallan.customer?.name || 'Customer'}</div>
              <div style={{ fontSize: '13px' }}>{selectedChallan.customer?.businessName}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Phone: {selectedChallan.customer?.mobile} | Email: {selectedChallan.customer?.email}
              </div>
            </div>

            {/* Items Table */}
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Order Snapshot Items</h3>
            <div className="table-container" style={{ marginBottom: '20px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product Item</th>
                    <th>Unit Price</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedChallan.items?.map((item: any) => {
                    const snap = typeof item.productSnapshot === 'string'
                      ? JSON.parse(item.productSnapshot)
                      : (item.product || {});
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{snap.name || 'Product'}</td>
                        <td>₹{item.unitPrice.toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td style={{ fontWeight: 700 }}>₹{(item.quantity * item.unitPrice).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Actions & Status Change */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn btn-secondary"
                style={{ color: 'var(--accent)' }}
                onClick={() => generateChallanPDF(selectedChallan)}
              >
                <Download size={16} /> Export PDF Invoice
              </button>

              {canCreate && selectedChallan.status === 'Draft' && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleStatusUpdate(selectedChallan.id, 'Confirmed')}
                >
                  <CheckCircle size={16} /> Confirm Challan (Deduct Stock)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

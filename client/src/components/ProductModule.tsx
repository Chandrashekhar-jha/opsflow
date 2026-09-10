import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { Preloader } from './Preloader';
import { Plus, Search, Package, AlertTriangle, ArrowUpRight, ArrowDownLeft, History, X } from 'lucide-react';

interface ProductModuleProps {
  userRole: string;
}

export const ProductModule: React.FC<ProductModuleProps> = ({ userRole }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');
  const [loading, setLoading] = useState(true);

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: '',
    currentStock: '0',
    minStockAlert: '10',
    warehouseLocation: '',
  });

  const [stockForm, setStockForm] = useState({
    quantityChanged: '',
    movementType: 'IN',
    reason: '',
  });

  const canEdit = ['Admin', 'Warehouse'].includes(userRole);

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchProducts();
    } else {
      fetchMovements();
    }
  }, [search, lowStockFilter, activeTab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (lowStockFilter) query.append('lowStock', 'true');

      const res = await apiFetch(`/products?${query.toString()}`);
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/products/movements?limit=30');
      setMovements(res.data || []);
    } catch (err) {
      console.error('Failed to fetch stock movements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(productForm),
      });
      setShowAddProductModal(false);
      setProductForm({
        name: '',
        sku: '',
        category: '',
        unitPrice: '',
        currentStock: '0',
        minStockAlert: '10',
        warehouseLocation: '',
      });
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Error creating product record');
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await apiFetch(`/products/${selectedProduct.id}/stock`, {
        method: 'POST',
        body: JSON.stringify(stockForm),
      });
      setShowStockModal(false);
      setStockForm({ quantityChanged: '', movementType: 'IN', reason: '' });
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Error updating stock quantity');
    }
  };

  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Inventory & Stock Module</h1>
          <p className="page-subtitle">Product catalog, warehouse locations, and stock audit logs</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowAddProductModal(true)}>
            <Plus size={15} /> Add New Product
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Package size={15} /> Inventory Catalog
        </button>
        <button
          className={`btn ${activeTab === 'movements' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('movements')}
        >
          <History size={15} /> Audit Log History
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
          <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '36px' }}
                placeholder="Search products by SKU, name, category, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Custom Styled Checkbox replacing default browser checkbox */}
            <label className="custom-checkbox-container">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
              />
              <span className="checkbox-checkmark"></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} color="var(--amber-warning)" /> Show Low Stock Items Only
              </span>
            </label>
          </div>

          <div className="table-card">
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>SKU Code</th>
                    <th>Category</th>
                    <th>Unit Price</th>
                    <th>Current Stock</th>
                    <th>Alert Limit</th>
                    <th>Warehouse Location</th>
                    {canEdit && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                        <Preloader />
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                        No product records found.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const isLow = p.currentStock <= p.minStockAlert;
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 700, color: 'var(--text-title)' }}>{p.name}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--emerald-primary)' }}>
                            {p.sku}
                          </td>
                          <td>
                            <span className="badge badge-neutral">{p.category}</span>
                          </td>
                          <td style={{ fontWeight: 700 }}>₹{p.unitPrice.toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>
                              {p.currentStock} units
                            </span>
                          </td>
                          <td>{p.minStockAlert} units</td>
                          <td>{p.warehouseLocation}</td>
                          {canEdit && (
                            <td>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setShowStockModal(true);
                                }}
                              >
                                Adjust Stock
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="table-card">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>Movement Type</th>
                  <th>Quantity</th>
                  <th>Reason Reference</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                      <Preloader />
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                      No stock movements logged yet.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id}>
                      <td>{new Date(m.createdAt).toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>{m.product?.name || 'Product'}</td>
                      <td>
                        <span className={`badge ${m.movementType === 'IN' ? 'badge-success' : 'badge-danger'}`}>
                          {m.movementType === 'IN' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          {m.movementType}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{m.quantityChanged} units</td>
                      <td>{m.reason}</td>
                      <td>{m.user?.name || 'User'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-title)' }}>Add New Product</h2>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowAddProductModal(false)} />
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">SKU Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    style={{ fontFamily: 'var(--font-mono)' }}
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={productForm.unitPrice}
                    onChange={(e) => setProductForm({ ...productForm, unitPrice: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    value={productForm.currentStock}
                    onChange={(e) => setProductForm({ ...productForm, currentStock: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Alert Limit</label>
                  <input
                    type="number"
                    className="form-control"
                    value={productForm.minStockAlert}
                    onChange={(e) => setProductForm({ ...productForm, minStockAlert: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Warehouse Bin Location *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Rack A-12, Section B"
                  value={productForm.warehouseLocation}
                  onChange={(e) => setProductForm({ ...productForm, warehouseLocation: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddProductModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Product Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-title)' }}>Adjust Stock Quantity</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{selectedProduct.name} ({selectedProduct.sku})</p>
              </div>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowStockModal(false)} />
            </div>

            <form onSubmit={handleStockAdjustment}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Movement Type *</label>
                  <select
                    className="form-control"
                    value={stockForm.movementType}
                    onChange={(e) => setStockForm({ ...stockForm, movementType: e.target.value })}
                  >
                    <option value="IN">IN (Stock Addition)</option>
                    <option value="OUT">OUT (Stock Reduction)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity Changed *</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    min="1"
                    value={stockForm.quantityChanged}
                    onChange={(e) => setStockForm({ ...stockForm, quantityChanged: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason Reference *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Shipment arrival, Damaged in audit"
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStockModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

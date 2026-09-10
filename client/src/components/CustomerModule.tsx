import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { Preloader } from './Preloader';
import { Search, Filter, Phone, Mail, Calendar, StickyNote, UserPlus, Eye, X } from 'lucide-react';

interface CustomerModuleProps {
  userRole: string;
}

export const CustomerModule: React.FC<CustomerModuleProps> = ({ userRole }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'Retail',
    address: '',
    status: 'Lead',
    followUpDate: '',
    notes: '',
  });

  const canEdit = ['Admin', 'Sales'].includes(userRole);

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter) query.append('status', statusFilter);

      const res = await apiFetch(`/customers?${query.toString()}`);
      setCustomers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/customers', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowAddModal(false);
      setFormData({
        name: '',
        mobile: '',
        email: '',
        businessName: '',
        gstNumber: '',
        customerType: 'Retail',
        address: '',
        status: 'Lead',
        followUpDate: '',
        notes: '',
      });
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Error creating customer record');
    }
  };

  const handleViewCustomer = async (id: string) => {
    try {
      const res = await apiFetch(`/customers/${id}`);
      setSelectedCustomer(res);
      setShowDetailModal(true);
    } catch (err: any) {
      alert(err.message || 'Error fetching customer details');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newNoteText.trim()) return;

    try {
      const addedNote = await apiFetch(`/customers/${selectedCustomer.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: newNoteText }),
      });

      setSelectedCustomer({
        ...selectedCustomer,
        notesList: [addedNote, ...(selectedCustomer.notesList || [])],
      });
      setNewNoteText('');
    } catch (err: any) {
      alert(err.message || 'Error adding note');
    }
  };

  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Customer CRM</h1>
          <p className="page-subtitle">Manage customer directory, lead pipeline, and follow-up activities</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={15} /> Add New Customer
          </button>
        )}
      </div>

      <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '36px' }}
            placeholder="Search by customer name, business, mobile, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="var(--text-muted)" />
          <select
            className="form-control"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="table-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Business Name</th>
                <th>Contact Info</th>
                <th>Type</th>
                <th>Status</th>
                <th>Follow-up Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    <Preloader />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                    No customer records found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-title)' }}>{c.name}</td>
                    <td>{c.businessName}</td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} /> {c.mobile}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} /> {c.email}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{c.customerType}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          c.status === 'Active'
                            ? 'badge-success'
                            : c.status === 'Lead'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>
                      {c.followUpDate ? (
                        <span style={{ fontSize: '13px', color: 'var(--emerald-primary)', fontWeight: 600 }}>
                          <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {new Date(c.followUpDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>None</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleViewCustomer(c.id)}>
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-title)' }}>Add New Customer</h2>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowAddModal(false)} />
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">GST Number (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Type</label>
                  <select
                    className="form-control"
                    value={formData.customerType}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                  >
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Complete Address *</label>
                <textarea
                  className="form-control"
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Lead">Lead</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Follow-up Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Customer Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-title)' }}>{selectedCustomer.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{selectedCustomer.businessName}</p>
              </div>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowDetailModal(false)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Mobile</div>
                <div style={{ fontWeight: 600 }}>{selectedCustomer.mobile}</div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Email</div>
                <div style={{ fontWeight: 600 }}>{selectedCustomer.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>GST Number</div>
                <div style={{ fontWeight: 600 }}>{selectedCustomer.gstNumber || 'None'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Type / Status</div>
                <div>
                  <span className="badge badge-neutral" style={{ marginRight: '6px' }}>{selectedCustomer.customerType}</span>
                  <span className="badge badge-success">{selectedCustomer.status}</span>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-title)' }}>
              <StickyNote size={15} style={{ display: 'inline', marginRight: '6px' }} /> Follow-Up Activity Log
            </h3>

            {canEdit && (
              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type new follow-up interaction note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  Add Note
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
              {selectedCustomer.notesList?.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No interaction notes recorded yet.</div>
              ) : (
                selectedCustomer.notesList?.map((n: any) => (
                  <div key={n.id} style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--emerald-primary)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-title)' }}>{n.note}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>By: {n.user?.name || 'Staff'}</span>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

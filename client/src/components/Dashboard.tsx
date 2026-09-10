import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { Preloader } from './Preloader';
import { Users, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeLeads: 0,
    totalProducts: 0,
    lowStockCount: 0,
    totalChallans: 0,
    confirmedRevenue: 0,
  });
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [recentChallans, setRecentChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [custRes, prodRes, challanRes] = await Promise.all([
        apiFetch('/customers?limit=100'),
        apiFetch('/products?limit=100'),
        apiFetch('/challans?limit=10'),
      ]);

      const customers = custRes.data || [];
      const products = prodRes.data || [];
      const challans = challanRes.data || [];

      const lowStock = products.filter((p: any) => p.currentStock <= p.minStockAlert);
      const revenue = challans
        .filter((c: any) => c.status === 'Confirmed')
        .reduce((sum: number, c: any) => sum + c.totalAmount, 0);

      setStats({
        totalCustomers: custRes.meta?.total || customers.length,
        activeLeads: customers.filter((c: any) => c.status === 'Lead').length,
        totalProducts: prodRes.meta?.total || products.length,
        lowStockCount: lowStock.length,
        totalChallans: challanRes.meta?.total || challans.length,
        confirmedRevenue: revenue,
      });

      setLowStockItems(lowStock);
      setRecentChallans(challans.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Preloader />;
  }

  return (
    <div>
      <div className="header-bar">
        <div>
          <h1 className="page-title">Operations Dashboard</h1>
          <p className="page-subtitle">Real-time overview of Wholesale ERP & CRM metrics</p>
        </div>
      </div>

      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Customers</span>
            <div className="stat-icon" style={{ background: 'var(--emerald-light)', color: 'var(--emerald-primary)' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.totalCustomers}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {stats.activeLeads} active leads in pipeline
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Stock Alerts</span>
            <div className="stat-icon" style={{ background: 'var(--amber-light)', color: 'var(--amber-warning)' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: stats.lowStockCount > 0 ? 'var(--amber-warning)' : 'inherit' }}>
            {stats.lowStockCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Items below minimum threshold
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Orders</span>
            <div className="stat-icon" style={{ background: 'var(--cyan-light)', color: 'var(--cyan-accent)' }}>
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.totalChallans}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Generated Sales Challans
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Confirmed Revenue</span>
            <div className="stat-icon" style={{ background: 'var(--emerald-light)', color: 'var(--emerald-primary)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '24px' }}>
            ₹{stats.confirmedRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Total billed value
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Low Stock Alert Table */}
        <div className="table-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={18} color="var(--amber-warning)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-title)' }}>Low Stock Inventory Alert</h3>
          </div>

          {lowStockItems.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>All inventory items are well stocked.</div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Current Stock</th>
                    <th>Alert Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{item.sku}</td>
                      <td>
                        <span className="badge badge-warning">{item.currentStock} units</span>
                      </td>
                      <td>{item.minStockAlert} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Orders Table */}
        <div className="table-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-title)', marginBottom: '16px' }}>
            Recent Sales Orders
          </h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Challan Number</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentChallans.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--emerald-primary)' }}>
                      {c.challanNumber}
                    </td>
                    <td>{c.customer?.name || 'Customer'}</td>
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
                    <td style={{ fontWeight: 700 }}>₹{c.totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

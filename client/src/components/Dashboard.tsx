import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { Users, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  userRole?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ userRole = 'Admin' }) => {
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
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading operations dashboard...</div>;
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
        <div className="glass-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
            <Users size={22} />
          </div>
          <div className="stat-value">{stats.totalCustomers}</div>
          <div className="stat-label">Total Customers ({stats.activeLeads} Leads)</div>
        </div>

        <div className="glass-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-value" style={{ color: stats.lowStockCount > 0 ? 'var(--warning)' : 'inherit' }}>
            {stats.lowStockCount}
          </div>
          <div className="stat-label">Low Stock Alerts</div>
        </div>

        <div className="glass-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
            <ShoppingCart size={22} />
          </div>
          <div className="stat-value">{stats.totalChallans}</div>
          <div className="stat-label">Total Sales Orders / Challans</div>
        </div>

        <div className="glass-card">
          <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: 'var(--secondary)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-value">₹{stats.confirmedRevenue.toLocaleString('en-IN')}</div>
          <div className="stat-label">Confirmed Revenue</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Low Stock Alerts */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={18} color="var(--warning)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Critical Low Stock Alert</h3>
          </div>

          {lowStockItems.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>All inventory items are well stocked!</div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Current Stock</th>
                    <th>Min Alert Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>{item.sku}</td>
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

        {/* Recent Challans */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Recent Sales Challans</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Challan No</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentChallans.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.challanNumber}</td>
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

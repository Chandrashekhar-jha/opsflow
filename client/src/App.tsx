import React, { useState, useEffect } from 'react';
import { getCurrentUser, removeAuthToken } from './services/api';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { CustomerModule } from './components/CustomerModule';
import { ProductModule } from './components/ProductModule';
import { ChallanModule } from './components/ChallanModule';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  LogOut,
  Building2,
  Sun,
  Moon,
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'products' | 'challans'>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <Building2 size={22} />
          </div>
          <div>
            <div className="brand-title">OpsFlow</div>
            <div className="brand-subtitle">Mini ERP + CRM Portal</div>
          </div>
        </div>

        <ul className="nav-list">
          <li
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={17} /> Dashboard
          </li>
          
          {['Admin', 'Sales', 'Accounts'].includes(currentUser.role) && (
            <li
              className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              <Users size={17} /> Customer CRM
            </li>
          )}

          {['Admin', 'Warehouse', 'Sales'].includes(currentUser.role) && (
            <li
              className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <Package size={17} /> Inventory & Stock
            </li>
          )}

          {['Admin', 'Sales', 'Accounts'].includes(currentUser.role) && (
            <li
              className={`nav-item ${activeTab === 'challans' ? 'active' : ''}`}
              onClick={() => setActiveTab('challans')}
            >
              <FileText size={17} /> Sales Challans
            </li>
          )}
        </ul>

        <div className="sidebar-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-info">
            <span className="user-name">{currentUser.name}</span>
            <span className={`role-badge role-${currentUser.role}`}>{currentUser.role}</span>
          </div>
          <LogOut
            size={17}
            style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
            onClick={handleLogout}
          />
        </div>
      </aside>

      {/* Main Workspace View */}
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'customers' && <CustomerModule userRole={currentUser.role} />}
        {activeTab === 'products' && <ProductModule userRole={currentUser.role} />}
        {activeTab === 'challans' && <ChallanModule userRole={currentUser.role} />}
      </main>
    </div>
  );
};

export default App;

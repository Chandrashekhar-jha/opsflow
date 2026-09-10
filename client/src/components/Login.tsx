import React, { useState } from 'react';
import { apiFetch, setAuthToken, setCurrentUser } from '../services/api';
import { ShieldCheck, UserCheck, Warehouse, CreditCard, Lock, Mail } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@erp.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAuthToken(response.token);
      setCurrentUser(response.user);
      onLoginSuccess(response.user);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const setRolePreset = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/favicon.jpg"
            alt="OpsFlow Logo"
            style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', objectFit: 'cover', margin: '0 auto 12px auto', display: 'block' }}
          />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-title)' }}>OpsFlow Operations Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Wholesale ERP & Customer CRM Operations
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--rose-light)',
            color: 'var(--rose-danger)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            marginBottom: '16px',
            textAlign: 'center',
            border: '1px solid rgba(244, 63, 94, 0.3)'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Instant Role Presets
          </label>
          <div className="role-switcher">
            <button type="button" className="role-btn" onClick={() => setRolePreset('admin@erp.com')}>
              <ShieldCheck size={13} style={{ display: 'inline', marginRight: '4px' }} /> Admin
            </button>
            <button type="button" className="role-btn" onClick={() => setRolePreset('sales@erp.com')}>
              <UserCheck size={13} style={{ display: 'inline', marginRight: '4px' }} /> Sales
            </button>
            <button type="button" className="role-btn" onClick={() => setRolePreset('warehouse@erp.com')}>
              <Warehouse size={13} style={{ display: 'inline', marginRight: '4px' }} /> Warehouse
            </button>
            <button type="button" className="role-btn" onClick={() => setRolePreset('accounts@erp.com')}>
              <CreditCard size={13} style={{ display: 'inline', marginRight: '4px' }} /> Accounts
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px', padding: '11px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>
      </div>
    </div>
  );
};

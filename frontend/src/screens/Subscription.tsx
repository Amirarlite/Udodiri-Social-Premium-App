import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';

interface SubInfo {
  subscription: {
    userId: string;
    tier: string;
    isActive: boolean;
    start_date?: string;
    end_date?: string;
  };
}

const Subscription: React.FC = () => {
  const { user } = useAuth();
  const [sub, setSub] = useState<SubInfo['subscription'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [gateway, setGateway] = useState('paystack');

  const fetchSub = useCallback(async () => {
    try {
      const { data } = await api.get('/subscriptions');
      setSub(data.subscription);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSub(); }, [fetchSub]);

  const handleUpgrade = async () => {
    setProcessing(true);
    try {
      const { data } = await api.post('/subscriptions/premium', { paymentGateway: gateway });
      // Simulate payment completion
      await api.post('/subscriptions/verify', { reference: data.reference, gateway });
      fetchSub();
      alert('Upgraded to Premium! 🎉');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Upgrade failed');
    } finally { setProcessing(false); }
  };

  if (loading) return <div className="empty-state"><p>Loading...</p></div>;

  return (
    <div>
      <h1 className="page-title">⭐ Subscription</h1>

      <div className="dashboard-grid">
        {/* Free tier card */}
        <div className="dash-card" style={{ borderColor: 'var(--border)' }}>
          <div className="dash-card-icon">🆓</div>
          <h3>Free</h3>
          <p>Basic features, limited chat, standard support</p>
          <p style={{ marginTop: 12, fontSize: '1.5rem', fontWeight: 700 }}>₦0</p>
          {sub?.tier === 'free' && <span className="badge badge-primary" style={{ marginTop: 8 }}>Current Plan</span>}
        </div>

        {/* Premium tier card */}
        <div className="dash-card" style={{ borderColor: sub?.tier === 'premium' ? 'var(--primary)' : 'var(--border)', background: sub?.tier === 'premium' ? 'rgba(26,115,232,0.05)' : undefined }}>
          <div className="dash-card-icon">⭐</div>
          <h3>Premium</h3>
          <p>Full access, unlimited chat, priority support, exclusive events</p>
          <p style={{ marginTop: 12, fontSize: '1.5rem', fontWeight: 700 }}>₦5,000<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/year</span></p>
          {sub?.tier === 'premium' && sub?.isActive && (
            <div style={{ marginTop: 12 }}>
              <span className="badge badge-success">Active Premium</span>
              {sub.end_date && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  Expires: {new Date(sub.end_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
          {sub?.tier !== 'premium' && (
            <div style={{ marginTop: 16 }}>
              <select
                value={gateway}
                onChange={e => setGateway(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)', marginBottom: 8, width: '100%' }}
              >
                <option value="paystack">Paystack</option>
                <option value="flutterwave">Flutterwave</option>
              </select>
              <button className="btn-primary" disabled={processing} onClick={handleUpgrade}>
                {processing ? 'Processing...' : 'Upgrade to Premium'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscription;

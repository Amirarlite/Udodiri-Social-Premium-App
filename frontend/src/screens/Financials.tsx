import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: string;
  status: string;
  date: string;
  user_id: string | null;
}

const Financials: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchFinancials = useCallback(async () => {
    try {
      const { data } = await api.get('/financials');
      setTransactions(data.transactions || []);
    } catch (err: any) {
      // Non-admins get 403
      if (err.response?.status === 403) {
        setIsAdmin(false);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (user?.role === 'Admin' || user?.role === 'Executive') {
      setIsAdmin(true);
      fetchFinancials();
    } else {
      setLoading(false);
    }
  }, [user, fetchFinancials]);

  if (loading) return <div className="empty-state"><p>Loading financials...</p></div>;

  if (!isAdmin) {
    return (
      <div>
        <h1 className="page-title">💰 Financials</h1>
        <div className="empty-state">
          <div className="icon">🔒</div>
          <p>Financial records are visible only to Admins and Executives</p>
        </div>
      </div>
    );
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <h1 className="page-title">💰 Financials</h1>
      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <div className="dash-card" style={{ borderColor: 'var(--success)' }}>
          <div className="dash-card-icon">📈</div>
          <h3>Income</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>₦{totalIncome.toLocaleString()}</p>
        </div>
        <div className="dash-card" style={{ borderColor: 'var(--secondary)' }}>
          <div className="dash-card-icon">📉</div>
          <h3>Expenses</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--secondary)' }}>₦{totalExpense.toLocaleString()}</p>
        </div>
        <div className="dash-card">
          <div className="dash-card-icon">💎</div>
          <h3>Net Balance</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>₦{(totalIncome - totalExpense).toLocaleString()}</p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Recent Transactions</h3>
        {transactions.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No transactions recorded</p>}
        {transactions.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 20).map(t => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>
                    <span className={`badge ${t.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td>₦{t.amount.toLocaleString()}</td>
                  <td><span className="badge badge-success">{t.status}</span></td>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Financials;

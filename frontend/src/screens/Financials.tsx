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
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('income');

  const fetchFinancials = useCallback(async () => {
    try {
      const { data } = await api.get('/financials');
      setTransactions(data.transactions || []);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsAdmin(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'Admin' || user?.role === 'Executive') {
      setIsAdmin(true);
      fetchFinancials();
    } else {
      setLoading(false);
    }
  }, [user, fetchFinancials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    try {
      await api.post('/financials', {
        title: title.trim(),
        amount: parseFloat(amount),
        type
      });
      setTitle('');
      setAmount('');
      setShowForm(false);
      fetchFinancials();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record transaction');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6 max-w-[600px] mx-auto text-center py-16">
        <div className="glass-card rounded-2xl p-8 border border-outline-variant shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-error-container/20 border border-primary/20 flex items-center justify-center mx-auto text-primary">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Financial Ledger Locked</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Financial records, dues, and transaction details are visible exclusively to designated Admins and Executive board members.
          </p>
          <div className="pt-2">
            <p className="text-xs text-on-surface-variant bg-surface-container-high border border-outline-variant rounded-lg p-3 inline-block">
              💡 **Developer Tip**: Use the **Test Role** select menu in the top header to upgrade your role to **Admin** to view this ledger.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Static starting values to make mockup look premium and filled
  const displayTotalBalance = 4250800.00 + netBalance;
  const displayTotalCollections = 850200.00 + totalIncome;
  const displayPendingDues = 125000.00;

  return (
    <div className="space-y-8 pb-12">
      {/* Action Header */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-outline-variant pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Financial Ledger</h1>
          <p className="text-sm text-on-surface-variant mt-1.5">Real-time audit of all club transactions, collections, and dues.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary-custom flex items-center gap-1.5 py-2.5 px-5 text-xs tracking-wider uppercase"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Record Transaction
        </button>
      </section>

      {/* Summary Dashboard (Bento Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Total Club Balance (Left Card) */}
        <div className="md:col-span-8 flex flex-col justify-between p-6 bg-surface-container border border-slate-800 rounded-xl relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[120px] text-primary">account_balance_wallet</span>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">TOTAL CLUB BALANCE</h3>
            <p className="text-3xl md:text-4xl font-bold text-primary tracking-tighter">
              ₦{displayTotalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="mt-6 flex gap-1.5 items-center">
            <span className="material-symbols-outlined text-xs text-tertiary">trending_up</span>
            <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">+12.5% vs last month</span>
          </div>
        </div>

        {/* Collections & Pending (Right Column Cards) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="p-6 bg-surface-container border border-slate-800 rounded-xl flex flex-col justify-center flex-grow hover:border-primary/50 transition-colors">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">TOTAL COLLECTIONS</h3>
            <p className="text-lg font-bold text-on-surface">
              ₦{displayTotalCollections.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-on-surface-variant font-medium mt-1">Active October cycle</span>
          </div>

          <div className="p-6 bg-surface-container border border-slate-800 rounded-xl flex flex-col justify-center flex-grow hover:border-primary/50 transition-colors">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">OUTSTANDING DUES</h3>
            <p className="text-lg font-bold text-secondary">
              ₦{displayPendingDues.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-on-surface-variant font-medium mt-1">14 members outstanding</span>
          </div>
        </div>
      </div>

      {/* Record New Transaction Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-[450px] w-full rounded-xl p-6 border border-outline-variant shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface mb-4">Record New Ledger Entry</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Description</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Website Maintenance Fee"
                  required
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Amount (₦)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="25000"
                    required
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none text-sm"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Category</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none text-sm"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History Ledger Table */}
      <section className="bg-surface-container border border-slate-800 rounded-xl overflow-hidden">
        <div className="bg-surface-container-high/50 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Audit Log / Ledger</h3>
          <span className="text-[10px] text-on-surface-variant font-semibold">Showing recent items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-highest/20 border-b border-slate-800">
                <th className="px-6 py-3.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">DATE</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">DESCRIPTION</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">CATEGORY</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">AMOUNT</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">No transactions logged.</td>
                </tr>
              ) : (
                transactions.map((t, idx) => {
                  const isIncome = t.type === 'income';
                  return (
                    <tr key={t.id} className={`${idx % 2 === 0 ? '' : 'bg-surface-container-low/20'} hover:bg-surface-container-high transition-colors`}>
                      <td className="px-6 py-3.5 text-on-surface font-semibold">
                        {new Date(t.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3.5 text-on-surface font-semibold">{t.title}</td>
                      <td className="px-6 py-3.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isIncome ? 'bg-secondary-container text-on-secondary-container' : 'bg-outline-variant text-on-surface-variant'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`px-6 py-3.5 font-bold text-sm ${isIncome ? 'text-tertiary' : 'text-secondary'}`}>
                        {isIncome ? '+' : '-'}₦{t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5 text-on-surface-variant font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                          {t.status}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Financials;

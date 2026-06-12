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
  const { user, refreshUser } = useAuth();
  const [sub, setSub] = useState<SubInfo['subscription'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [gateway, setGateway] = useState('paystack');

  const fetchSub = useCallback(async () => {
    try {
      const { data } = await api.get('/subscriptions');
      setSub(data.subscription);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSub();
  }, [fetchSub]);

  const handleUpgrade = async () => {
    setProcessing(true);
    try {
      const { data } = await api.post('/subscriptions/premium', { paymentGateway: gateway });
      
      // Simulate completing checkout: hit verify
      await api.post('/subscriptions/verify', { reference: data.reference, gateway });
      
      await fetchSub();
      await refreshUser(); // Update the top-level user role/tier
      alert('Upgraded to Premium successfully! 🎉 Enjoy your premium perks.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Upgrade failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isPremium = sub?.tier === 'premium' && sub?.isActive;

  return (
    <div className="space-y-8 pb-12">
      {/* Current Status Section */}
      <section className="border-b border-outline-variant pb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Premium Membership</h1>
        <p className="text-sm text-on-surface-variant mt-1.5">Manage your billing and unlock exclusive club benefits.</p>
      </section>

      {/* Plan Status Banner */}
      <section>
        <div className="glass-card rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-widest">CURRENT MEMBERSHIP</h2>
            <p className="text-xl md:text-2xl font-bold text-on-surface">
              {isPremium ? 'Premium Legacy Access' : 'Standard Social Member'}
            </p>
            {isPremium && sub?.end_date && (
              <p className="text-xs text-on-surface-variant mt-1">
                Subscription active until {new Date(sub.end_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${
            isPremium
              ? 'bg-secondary-container text-on-secondary-container border-secondary/20 shadow-md'
              : 'bg-surface-container-highest text-on-surface border-outline-variant'
          }`}>
            {isPremium ? '⭐ PREMIUM' : 'FREE ACCESS'}
          </div>
        </div>
      </section>

      {/* Bento Grid Benefits */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Hero Premium Card */}
        <div className="md:col-span-8 premium-gradient rounded-xl p-8 flex flex-col justify-between min-h-[320px] relative overflow-hidden shadow-2xl border border-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          
          <div className="z-10 space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-on-primary-container tracking-wide">Unlock Legacy.</h1>
            <p className="text-sm md:text-base text-on-primary-container/80 max-w-md leading-relaxed">
              Gain access to the full Udodiri experience with exclusive perks designed for our most distinguished members.
            </p>
          </div>
          
          <div className="z-10 flex flex-wrap gap-2.5 mt-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 flex items-center gap-1.5 shadow-md">
              <span className="material-symbols-outlined text-sm text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              <span className="text-[10px] font-bold text-on-primary-container uppercase tracking-wider">PREMIUM BADGE</span>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 flex items-center gap-1.5 shadow-md">
              <span className="material-symbols-outlined text-sm text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                history
              </span>
              <span className="text-[10px] font-bold text-on-primary-container uppercase tracking-wider">EXTENDED ARCHIVE</span>
            </div>
          </div>
        </div>

        {/* Premium Pricing Card */}
        <div className="md:col-span-4 bg-surface-container border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
          <div>
            <h3 className="text-base font-bold text-primary mb-1">Premium Tier</h3>
            
            <div className="flex items-baseline gap-1.5 mb-6">
              <span className="text-3xl md:text-4xl font-bold text-on-surface">₦5,000</span>
              <span className="text-xs text-on-surface-variant font-semibold">/ year</span>
            </div>
            
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-xs font-semibold text-on-surface-variant">Priority Meeting Invites</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-xs font-semibold text-on-surface-variant">Unlimited Chat History</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-xs font-semibold text-on-surface-variant">Exclusive Event Access</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 space-y-3">
            {!isPremium && (
              <>
                <select
                  value={gateway}
                  onChange={e => setGateway(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-xs font-bold text-on-surface focus:border-primary focus:ring-0 outline-none cursor-pointer"
                >
                  <option value="paystack">Paystack Checkout</option>
                  <option value="flutterwave">Flutterwave Checkout</option>
                </select>
                
                <button
                  onClick={handleUpgrade}
                  disabled={processing}
                  className="w-full bg-primary-container hover:bg-on-primary-fixed-variant text-on-primary-container py-3.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-primary-container/20 border border-primary/20"
                >
                  {processing ? 'Processing Payment...' : 'Upgrade to Premium'}
                </button>
              </>
            )}
            
            {isPremium && (
              <div className="bg-secondary-container/10 border border-secondary/20 p-4 rounded-lg text-center">
                <span className="material-symbols-outlined text-secondary text-2xl mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <p className="text-xs font-bold text-secondary uppercase tracking-widest">Plan Active</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Payment Gateways Assurance Footer */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-surface-container border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col gap-2">
          <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">SECURE CHECKOUT BACKED BY</h4>
          <div className="flex items-center gap-4">
            <div className="h-9 px-4 bg-surface-container-high rounded border border-outline-variant flex items-center justify-center">
              <span className="text-xs font-bold tracking-tighter text-on-surface-variant">Paystack</span>
            </div>
            <div className="h-9 px-4 bg-surface-container-high rounded border border-outline-variant flex items-center justify-center">
              <span className="text-xs font-bold tracking-tighter text-on-surface-variant">Flutterwave</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-start gap-3 bg-surface-container-low p-4 rounded-lg border border-outline-variant">
          <span className="material-symbols-outlined text-on-surface-variant mt-0.5">lock</span>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            All transaction tunnels are fully encrypted, tokenized, and secured. Subscriptions can be configured or cancelled anytime from member profiles.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Subscription;

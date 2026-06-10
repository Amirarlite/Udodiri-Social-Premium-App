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
      await api.post('/subscriptions/verify', { reference: data.reference, gateway });
      fetchSub();
      alert('Upgraded to Premium! 🎉');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Upgrade failed');
    } finally { setProcessing(false); }
  };

  if (loading) return <div className="empty-state"><p>Loading...</p></div>;

  return (
    <div className="min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="flex justify-between items-center px-margin-mobile h-16 w-full bg-surface dark:bg-surface-dim border-b border-surface-variant dark:border-outline-variant sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-on-primary-container" style={{fontSize: '20px'}}>star</span>
          </div>
          <span className="font-title-md text-title-md font-bold text-primary">Udodiri Young Social Club</span>
        </div>
        <div className="cursor-pointer active:opacity-80 hover:bg-surface-container-high transition-colors p-2 rounded-full">
          <span className="material-symbols-outlined text-primary">notifications</span>
        </div>
      </header>

      <main className="w-full max-w-[1200px] mt-0 mb-24 px-margin-mobile md:px-margin-desktop flex flex-col gap-md mx-auto">
        {/* Current Status Section */}
        <section className="w-full">
          <div className="bg-surface-container-low rounded-xl p-md flex flex-col md:flex-row justify-between items-start md:items-center gap-sm border border-outline-variant hover:border-primary transition-all duration-300">
            <div>
              <h2 className="font-label-caps text-label-caps text-on-surface-variant mb-base">CURRENT PLAN</h2>
              <p className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface">
                {sub?.tier === 'premium' ? 'Premium Member' : 'Standard Member'}
              </p>
            </div>
            <div className={`px-md py-xs rounded-full border ${sub?.tier === 'premium' ? 'bg-tertiary text-on-tertiary border-tertiary' : 'bg-surface-container-highest text-on-surface border-outline-variant'}`}>
              <span className="font-label-caps text-label-caps">{sub?.tier === 'premium' && sub?.isActive ? 'ACTIVE PREMIUM' : 'FREE ACCESS'}</span>
            </div>
          </div>
        </section>

        {/* Bento Grid Benefits */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-md">
          {/* Hero Premium Card */}
          <div className="md:col-span-8 bg-gradient-to-br from-primary-container to-primary/80 rounded-xl p-lg flex flex-col justify-between min-h-[320px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="z-10">
              <h1 className="font-display-lg text-display-lg text-on-primary-container mb-xs">Unlock Legacy.</h1>
              <p className="font-body-lg text-body-lg text-on-primary-container/80 max-w-md">Gain access to the full Udodiri experience with exclusive perks designed for our most distinguished members.</p>
            </div>
            <div className="z-10 flex flex-wrap gap-sm mt-md">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-md py-xs flex items-center gap-xs">
                <span className="material-symbols-outlined text-on-primary-container" style={{fontVariationSettings: "'FILL' 1;"}}>verified</span>
                <span className="font-label-caps text-label-caps text-on-primary-container">PREMIUM BADGE</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-md py-xs flex items-center gap-xs">
                <span className="material-symbols-outlined text-on-primary-container" style={{fontVariationSettings: "'FILL' 1;"}}>history</span>
                <span className="font-label-caps text-label-caps text-on-primary-container">EXTENDED ARCHIVE</span>
              </div>
            </div>
          </div>

          {/* Premium Pricing Card */}
          <div className="md:col-span-4 bg-surface-container-high border border-outline-variant rounded-xl p-md flex flex-col justify-between hover:border-primary transition-all duration-300">
            <div>
              <h3 className="font-title-md text-title-md text-primary mb-base">Premium Tier</h3>
              <div className="flex items-baseline gap-xs mb-md">
                <span className="font-display-lg text-display-lg text-on-surface">₦5,000</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">/ year</span>
              </div>
              <ul className="space-y-sm">
                <li className="flex items-start gap-xs">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
                  <span className="font-body-sm text-body-sm">Priority Meeting Invites</span>
                </li>
                <li className="flex items-start gap-xs">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
                  <span className="font-body-sm text-body-sm">Unlimited Chat History</span>
                </li>
                <li className="flex items-start gap-xs">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
                  <span className="font-body-sm text-body-sm">Exclusive Event Access</span>
                </li>
              </ul>
            </div>
            {sub?.tier !== 'premium' ? (
              <div className="w-full mt-lg">
                <select
                  value={gateway}
                  onChange={e => setGateway(e.target.value)}
                  className="w-full mb-md px-md py-sm rounded-lg bg-surface border border-outline-variant text-on-surface font-body-sm mb-md"
                >
                  <option value="paystack">Paystack</option>
                  <option value="flutterwave">Flutterwave</option>
                </select>
                <button 
                  onClick={handleUpgrade}
                  disabled={processing}
                  className="w-full bg-primary-container hover:bg-primary-container/90 text-on-primary-container py-md rounded-lg font-title-md text-title-md transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(190,30,45,0.3)] disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Upgrade to Premium'}
                </button>
              </div>
            ) : (
              <div className="w-full mt-lg">
                <div className="bg-tertiary/20 border border-tertiary rounded-lg p-md text-center">
                  <span className="font-label-caps text-label-caps text-tertiary">✓ PREMIUM ACTIVE</span>
                  {sub.end_date && (
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                      Valid until {new Date(sub.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Payment Methods & Assurance */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-md items-center py-md">
          <div className="flex flex-col gap-xs">
            <h4 className="font-label-caps text-label-caps text-on-surface-variant">SECURE CHECKOUT BY</h4>
            <div className="flex items-center gap-md opacity-70 grayscale hover:grayscale-0 transition-all">
              <div className="h-8 w-24 bg-surface-container-highest rounded border border-outline-variant flex items-center justify-center p-xs">
                <span className="font-title-md text-title-md tracking-tighter text-on-surface-variant">Paystack</span>
              </div>
              <div className="h-8 w-24 bg-surface-container-highest rounded border border-outline-variant flex items-center justify-center p-xs">
                <span className="font-title-md text-title-md tracking-tighter text-on-surface-variant">Flutterwave</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-sm bg-surface-container-low p-sm rounded-lg border border-outline-variant">
            <span className="material-symbols-outlined text-on-surface-variant">lock</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Transactions are encrypted and secured using industry-standard protocols. Cancel anytime from settings.</p>
          </div>
        </section>
      </main>

      {/* BottomNavBar */}
      <nav className="flex justify-around items-center h-20 w-full px-xs pb-safe bg-surface-container dark:bg-surface-container-low border-t border-surface-variant dark:border-outline-variant fixed bottom-0 z-50">
        <div className="flex flex-col items-center justify-center text-on-surface-variant cursor-pointer scale-95 active:scale-90 transition-transform hover:text-primary">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-caps text-label-caps">Dashboard</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-surface-variant cursor-pointer scale-95 active:scale-90 transition-transform hover:text-primary">
          <span className="material-symbols-outlined">campaign</span>
          <span className="font-label-caps text-label-caps">Alerts</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-surface-variant cursor-pointer scale-95 active:scale-90 transition-transform hover:text-primary">
          <span className="material-symbols-outlined">chat</span>
          <span className="font-label-caps text-label-caps">Chat</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-surface-variant cursor-pointer scale-95 active:scale-90 transition-transform hover:text-primary">
          <span className="material-symbols-outlined">event</span>
          <span className="font-label-caps text-label-caps">Meetings</span>
        </div>
      </nav>
    </div>
  );
};

export default Subscription;

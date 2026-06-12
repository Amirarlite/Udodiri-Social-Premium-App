import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        if (!name.trim()) { setError('Name is required'); setLoading(false); return; }
        await register(email, password, name.trim());
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-background to-surface-container-low px-4 py-8 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] -z-10"></div>
      
      <div className="glass-card max-w-[420px] w-full rounded-2xl p-8 border border-outline-variant shadow-2xl relative">
        <div className="flex justify-center mb-6">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-primary shadow-md bg-surface">
            <img
              src="/udodiri-app-logo.png"
              alt="Udodiri App Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-on-surface mb-2">Udodiri Social Club</h1>
        <p className="text-center text-xs text-on-surface-variant mb-6 uppercase tracking-widest">Legacy & Brotherhood</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                required
                className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 outline-none text-sm transition-colors"
              />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 outline-none text-sm transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 outline-none text-sm transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container hover:bg-on-primary-fixed-variant text-on-primary-container font-bold py-3.5 rounded-lg transition-all active:scale-[0.98] text-sm uppercase tracking-wider shadow-md shadow-primary-container/10"
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {error && <p className="text-error text-center text-xs font-medium mt-4">{error}</p>}

        <p className="text-center text-xs text-on-surface-variant mt-6">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <span
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-primary font-bold hover:underline cursor-pointer ml-1"
          >
            {isRegister ? 'Sign In' : 'Sign Up'}
          </span>
        </p>

        {/* Sponsor/Builder Footer */}
        <div className="w-full border-t border-outline-variant mt-8 pt-4 text-center">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest leading-relaxed">
            Sponsored by <span className="font-bold text-primary">Chief Nicodemus (Nicojet)</span> <br />
            Built by <span className="font-bold text-secondary">SRDGINTEL.COM</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

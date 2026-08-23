'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProviderLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    const { data: user } = await supabase.from('users').select('role').eq('id', data.user.id).single();
    if (user?.role !== 'provider') { await supabase.auth.signOut(); setError('Access denied. Provider accounts only.'); setLoading(false); return; }
    router.push('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 70%)' }}>
      <div className="glass" style={{ width: '100%', maxWidth: 420, padding: '48px', margin: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>👷</div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Provider Portal</h1>
          <p style={{ color: '#94a3b8', marginTop: 8, fontSize: 14 }}>Sign in to manage your assignments</p>
        </div>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Email</label>
            <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="provider@example.com" required />
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Password</label>
            <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 12, color: '#ef4444', fontSize: 14 }}>{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8, padding: '14px', fontSize: 15 }}>
            {loading ? 'Signing in...' : 'Sign In as Provider'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#94a3b8' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>Register Now</Link>
        </p>
      </div>
    </div>
  );
}

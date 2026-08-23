'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProviderSignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [serviceType, setServiceType] = useState('Cleaning');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, phone, serviceType })
    });

    const data = await res.json();

    if (!res.ok) { 
      setError(data.error || 'Failed to register provider'); 
      setLoading(false); 
      return; 
    }

    // Log the user in to establish the session on the client
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 70%)' }}>
      <div className="glass" style={{ width: '100%', maxWidth: 420, padding: '48px', margin: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>👷</div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Provider Registration</h1>
          <p style={{ color: '#94a3b8', marginTop: 8, fontSize: 14 }}>Join the platform and offer your services</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[['Full Name', 'text', name, setName, 'Jane Doe'], ['Email', 'email', email, setEmail, 'provider@example.com'], ['Phone', 'tel', phone, setPhone, '+91 98765 43210'], ['Password', 'password', password, setPassword, '••••••••']].map(([label, type, value, setter, placeholder]) => (
            <div key={label as string}>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>{label as string}</label>
              <input className="input-field" type={type as string} value={value as string} onChange={e => (setter as (v: string) => void)(e.target.value)} placeholder={placeholder as string} required />
            </div>
          ))}

          <div>
            <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Primary Service Type</label>
            <select className="input-field" value={serviceType} onChange={e => setServiceType(e.target.value)} required style={{ background: '#1e293b' }}>
              <option value="Cleaning">Cleaning</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="AC Repair">AC Repair</option>
              <option value="Painting">Painting</option>
            </select>
          </div>

          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', color: '#ef4444', fontSize: 14 }}>{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8, padding: '14px', fontSize: 15, background: '#10b981' }}>
            {loading ? 'Creating account...' : 'Register as Provider'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#94a3b8' }}>
          Already registered?{' '}
          <Link href="/login" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

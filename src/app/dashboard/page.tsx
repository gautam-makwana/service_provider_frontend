'use client';
import { useState, useEffect } from 'react';
import { supabase, BACKEND_URL } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Assignment = {
  id: string; status: string; notes: string; assigned_at: string;
  bookings: {
    id: string; address: string; date: string; time_slot: string; status: string; total_price: number; notes: string;
    booking_services: { services: { name: string; price: number } }[];
  };
  providers: { id: string; name: string; service_type: string; phone: string };
};

const STATUS_LABEL: Record<string, string> = { pending: '⏳ Awaiting Acceptance', accepted: '🔧 In Progress', completed: '✅ Completed', rejected: '❌ Rejected' };

export default function ProviderDashboard() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [completionModal, setCompletionModal] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');
  const [providerId, setProviderId] = useState<string | null>(null);

  const load = async (pid: string) => {
    const res = await fetch(`${BACKEND_URL}/api/assignments?provider_id=${pid}`);
    setAssignments(await res.json() || []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single();
      if (user?.role !== 'provider') { router.push('/login'); return; }
      // Get provider record linked to this user
      const { data: provider } = await supabase.from('providers').select('id, name, service_type').eq('user_id', session.user.id).single();
      if (!provider) {
        // Provider account not linked – try by email for demo  
        setLoading(false); return;
      }
      setProviderId(provider.id);
      load(provider.id);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleStatus = async (assignmentId: string, status: 'accepted' | 'rejected') => {
    setProcessingId(assignmentId);
    await fetch(`${BACKEND_URL}/api/assignments/${assignmentId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (providerId) await load(providerId);
    setProcessingId(null);
  };

  const handleComplete = async () => {
    if (!completionModal) return;
    setProcessingId(completionModal);
    await fetch(`${BACKEND_URL}/api/assignments/${completionModal}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed', notes }) });
    setCompletionModal(null); setNotes('');
    if (providerId) await load(providerId);
    setProcessingId(null);
  };

  const filtered = filter === 'all' ? assignments : assignments.filter(a => a.status === filter);
  const stats = { total: assignments.length, pending: assignments.filter(a => a.status === 'pending').length, active: assignments.filter(a => a.status === 'accepted').length, done: assignments.filter(a => a.status === 'completed').length };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading assignments...</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 100% 0%, rgba(16,185,129,0.08) 0%, transparent 60%)' }}>
      {/* Navbar */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(8,15,14,0.9)', backdropFilter: 'blur(20px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>👷</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#10b981' }}>Provider Hub</span>
        </div>
        <button className="btn-secondary" onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} style={{ padding: '8px 16px', fontSize: 13 }}>Logout</button>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
          {[{ label: 'Total Jobs', value: stats.total, color: '#94a3b8', icon: '📋' }, { label: 'Awaiting', value: stats.pending, color: '#f59e0b', icon: '⏳' }, { label: 'In Progress', value: stats.active, color: '#22d3ee', icon: '🔧' }, { label: 'Completed', value: stats.done, color: '#10b981', icon: '✅' }].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['all', 'pending', 'accepted', 'completed'] as const).map(tab => (
            <button key={tab} onClick={() => setFilter(tab)} style={{ padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: filter === tab ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)', color: filter === tab ? 'white' : '#94a3b8' }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Assignments */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
            <p style={{ fontSize: 18 }}>No assignments found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {filtered.map(a => {
              const booking = a.bookings;
              return (
                <div key={a.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>
                        {booking?.booking_services?.map(bs => bs.services?.name).join(', ')}
                      </p>
                      <p style={{ color: '#94a3b8', fontSize: 13 }}>
                        📅 {new Date(booking?.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} &nbsp;·&nbsp; 🕐 {booking?.time_slot}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className={`badge status-${a.status === 'accepted' ? 'in_progress' : a.status}`} style={{ textTransform: 'none', fontSize: 12 }}>
                        {STATUS_LABEL[a.status] || a.status}
                      </span>
                      <span style={{ fontWeight: 700, color: '#10b981', fontSize: 16 }}>₹{booking?.total_price?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>📍 Service Location</p>
                    <p style={{ fontSize: 13, color: '#94a3b8' }}>{booking?.address}</p>
                    {booking?.notes && <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>📝 Customer Note: {booking.notes}</p>}
                  </div>

                  {/* Services breakdown */}
                  <div style={{ marginBottom: 16 }}>
                    {booking?.booking_services?.map((bs, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 }}>
                        <span>{bs.services?.name}</span>
                        <span style={{ color: '#10b981' }}>₹{bs.services?.price?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Completion notes */}
                  {a.notes && a.status === 'completed' && (
                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13 }}>
                      <p style={{ color: '#10b981', fontWeight: 600, marginBottom: 4 }}>Completion Notes:</p>
                      <p style={{ color: '#94a3b8' }}>{a.notes}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  {a.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn-success" disabled={processingId === a.id} onClick={() => handleStatus(a.id, 'accepted')} style={{ flex: 1, padding: 12, fontSize: 15, fontWeight: 600 }}>
                        ✓ Accept Job
                      </button>
                      <button className="btn-danger" disabled={processingId === a.id} onClick={() => handleStatus(a.id, 'rejected')} style={{ flex: 1, padding: 12, fontSize: 15 }}>
                        ✕ Reject
                      </button>
                    </div>
                  )}

                  {a.status === 'accepted' && (
                    <button className="btn-primary" disabled={processingId === a.id} onClick={() => setCompletionModal(a.id)} style={{ width: '100%', padding: 14, fontSize: 15 }}>
                      🏁 Mark as Completed
                    </button>
                  )}

                  <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)', marginTop: 12 }}>Assigned: {new Date(a.assigned_at).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {completionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)' }}>
          <div className="glass" style={{ padding: 40, maxWidth: 440, width: '90%' }}>
            <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>🏁 Mark Job Complete</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>Add completion notes before marking the job as done.</p>
            <div>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Completion Notes (Optional)</label>
              <textarea className="input-field" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Describe what was done, any issues encountered..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="btn-primary" onClick={handleComplete} disabled={!!processingId} style={{ flex: 1, padding: 14 }}>Confirm Completion</button>
              <button className="btn-secondary" onClick={() => { setCompletionModal(null); setNotes(''); }} style={{ flex: 1, padding: 14 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import AICopilot from '../../components/AICopilot';
import { apiCall } from '../../utils/api';

const DRIVER_STATUSES = ['All', 'Available', 'On Trip', 'Off Duty', 'Suspended'];
const LICENSE_CATS = ['LMV', 'HMV', 'LMV-TR', 'HMV-TR'];

// Avatar with initials
function DriverAvatar({ name }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';
  const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4'];
  const color = colors[name?.charCodeAt(0) % colors.length] || '#3b82f6';
  return (
    <div style={{ width:32, height:32, borderRadius:'50%', background:`linear-gradient(135deg, ${color}, ${color}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
      {initials}
    </div>
  );
}

// Safety score badge
function SafetyBadge({ score }) {
  const pct = Math.min(100, Math.max(0, parseFloat(score) || 0));
  let label, color, bg;
  if (pct >= 90)      { label='Excellent'; color='#10b981'; bg='rgba(16,185,129,0.12)'; }
  else if (pct >= 75) { label='Good';      color='#3b82f6'; bg='rgba(59,130,246,0.12)'; }
  else if (pct >= 60) { label='Warning';   color='#f59e0b'; bg='rgba(245,158,11,0.12)'; }
  else                { label='Flagged';   color='#ef4444'; bg='rgba(239,68,68,0.12)'; }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600, background:bg, color }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:color, display:'inline-block' }} />
        {label}
      </span>
      <span style={{ fontSize:12, color:'#62748e' }}>{Math.round(pct)}%</span>
    </div>
  );
}

// Trip compliance progress bar
function ComplianceBar({ score }) {
  const pct = Math.min(150, Math.max(0, parseFloat(score) || 0));
  const color = pct >= 90 ? '#10b981' : pct >= 70 ? '#3b82f6' : '#f59e0b';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ width:80, height:4, background:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ width:`${Math.min(100, pct)}%`, height:'100%', background:color, borderRadius:99, transition:'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize:12, color:'#90a1b9', minWidth:32 }}>{Math.round(pct)}%</span>
    </div>
  );
}

// Driver status badge
function DriverStatusBadge({ status }) {
  const map = {
    'Available':  { bg:'rgba(16,185,129,0.15)', color:'#10b981', border:'1px solid rgba(16,185,129,0.4)' },
    'On Trip':    { bg:'rgba(59,130,246,0.15)',  color:'#3b82f6', border:'1px solid rgba(59,130,246,0.4)' },
    'Off Duty':   { bg:'rgba(100,116,139,0.15)', color:'#64748b', border:'1px solid rgba(100,116,139,0.4)' },
    'Suspended':  { bg:'rgba(239,68,68,0.15)',   color:'#ef4444', border:'1px solid rgba(239,68,68,0.4)' },
  };
  const s = map[status] || map['Off Duty'];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, fontSize:12, fontWeight:600, background:s.bg, color:s.color, border:s.border }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:s.color, display:'inline-block' }} />
      {status}
    </span>
  );
}

// License expiry — highlight expired
function ExpiryCell({ expiry }) {
  if (!expiry) return <span style={{ color:'#45556c' }}>—</span>;
  const date = new Date(expiry);
  const isExpired = date < new Date();
  const formatted = date.toLocaleDateString('en-GB', { month:'2-digit', year:'numeric' }).replace('/', '/');
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <span style={{ fontSize:13, color: isExpired ? '#ef4444' : '#e2e8f0', fontWeight: isExpired ? 600 : 400 }}>
        {formatted}
      </span>
      {isExpired && (
        <span style={{ fontSize:10, fontWeight:700, color:'#ef4444', background:'rgba(239,68,68,0.12)', padding:'1px 6px', borderRadius:99, textTransform:'uppercase' }}>
          Expired
        </span>
      )}
    </div>
  );
}

// Add Driver modal
function DriverModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name:'', license_number:'', license_category:'LMV', license_expiry:'', contact_number:'', safety_score:10, status:'Available' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await apiCall('/drivers', { method:'POST', body: JSON.stringify({ ...form, safety_score: parseFloat(form.safety_score) }) });
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#0d1526', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, width:'100%', maxWidth:480, boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h2 style={{ fontSize:18, fontWeight:700, color:'#fff' }}>+ Add Driver</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:20 }}>✕</button>
        </div>
        {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.6px', color:'#90a1b9', display:'block', marginBottom:6 }}>Full Name</label>
            <input className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'11px 14px' }} required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Alex Mercer" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.6px', color:'#90a1b9', display:'block', marginBottom:6 }}>License No.</label>
              <input className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'11px 14px' }} required value={form.license_number} onChange={e=>setForm({...form,license_number:e.target.value})} placeholder="DL-88215" />
            </div>
            <div>
              <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.6px', color:'#90a1b9', display:'block', marginBottom:6 }}>Category</label>
              <select className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'11px 14px' }} value={form.license_category} onChange={e=>setForm({...form,license_category:e.target.value})}>
                {LICENSE_CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.6px', color:'#90a1b9', display:'block', marginBottom:6 }}>License Expiry</label>
              <input type="date" className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'11px 14px' }} required value={form.license_expiry} onChange={e=>setForm({...form,license_expiry:e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.6px', color:'#90a1b9', display:'block', marginBottom:6 }}>Contact</label>
              <input className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'11px 14px' }} value={form.contact_number} onChange={e=>setForm({...form,contact_number:e.target.value})} placeholder="98765-xxxxx" />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.6px', color:'#90a1b9', display:'block', marginBottom:6 }}>Safety Score (0-10)</label>
              <input type="number" min="0" max="10" step="0.1" className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'11px 14px' }} value={form.safety_score} onChange={e=>setForm({...form,safety_score:e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.6px', color:'#90a1b9', display:'block', marginBottom:6 }}>Status</label>
              <select className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'11px 14px' }} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                {['Available','Off Duty','Suspended'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <button type="button" onClick={onClose} style={{ padding:'10px 20px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#90a1b9', cursor:'pointer', fontSize:14 }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding:'10px 24px', borderRadius:10, fontSize:14 }}>{saving ? 'Saving...' : 'Add Driver'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);

  const fetchDrivers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      const res = await apiCall('/drivers');
      setDrivers(res.drivers || []);
    } catch (err) {
      if (err.message?.includes('401')) router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const handleExport = () => {
    const csv = ['Driver,License No.,Category,Expiry,Contact,Safety Score,Status']
      .concat(filtered.map(d => `${d.name},${d.license_number},${d.license_category},${d.license_expiry?.split('T')[0]},${d.contact_number},${d.safety_score},${d.status}`))
      .join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='drivers.csv'; a.click();
  };

  const filtered = drivers.filter(d => {
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    const matchSearch = !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.license_number?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // count expired licenses
  const expiredCount = drivers.filter(d => d.license_expiry && new Date(d.license_expiry) < new Date()).length;
  const suspendedCount = drivers.filter(d => d.status === 'Suspended').length;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <TopHeader />
        <div className="page-content">

          {/* Page header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:20 }}>
            <div>
              <h1 style={{ fontSize:24, fontWeight:700, color:'#fff' }}>Drivers & Safety Profiles</h1>
              <p style={{ fontSize:13, color:'#62748e', marginTop:4 }}>
                {drivers.length} drivers registered · Safety scores updated weekly
              </p>
            </div>
            <button onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'linear-gradient(135deg, #f59e0b, #d97706)', border:'none', borderRadius:10, color:'#0b1120', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Driver
            </button>
          </div>

          {/* Search + Export */}
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'7px 14px', flex:'0 1 260px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#45556c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input style={{ background:'transparent', border:'none', outline:'none', color:'#e2e8f0', fontSize:13, width:'100%' }} placeholder="Search driver or license..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <button onClick={handleExport} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#90a1b9', fontSize:13, cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
          </div>

          {/* Status filter pills */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'1px', color:'#45556c', marginBottom:8 }}>Toggle Status Filter</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {DRIVER_STATUSES.map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  padding:'5px 14px', borderRadius:99, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s', border:'none',
                  background: statusFilter === s ? (s==='All'?'#3b82f6': s==='Available'?'#10b981': s==='On Trip'?'#3b82f6': s==='Off Duty'?'#64748b':'#ef4444') : 'rgba(255,255,255,0.05)',
                  color: statusFilter === s ? '#fff' : '#64748b',
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Rule notice */}
          {(expiredCount > 0 || suspendedCount > 0) && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:10, marginBottom:16, fontSize:12, color:'#f59e0b' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Rule: Expired license or Suspended status → blocked from trip assignment
              {expiredCount > 0 && <span style={{ marginLeft:8, background:'rgba(239,68,68,0.15)', color:'#ef4444', padding:'1px 8px', borderRadius:99, fontSize:11 }}>{expiredCount} expired</span>}
              {suspendedCount > 0 && <span style={{ marginLeft:4, background:'rgba(239,68,68,0.15)', color:'#ef4444', padding:'1px 8px', borderRadius:99, fontSize:11 }}>{suspendedCount} suspended</span>}
            </div>
          )}

          {/* Table */}
          <div className="section-card" style={{ padding:0, overflow:'hidden' }}>
            {loading ? (
              <div style={{ padding:'48px 0', textAlign:'center', color:'#45556c', fontSize:14 }}>Loading drivers...</div>
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                      <th style={{ padding:'14px 20px' }}>Driver</th>
                      <th>License No.</th>
                      <th>Category</th>
                      <th>Expiry</th>
                      <th>Contact</th>
                      <th>Trip Compl.</th>
                      <th>Safety</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d) => {
                      const safetyPct = Math.min(100, Math.max(0, parseFloat(d.safety_score) * 10));
                      return (
                        <tr key={d.id}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.025)'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                          style={{ transition:'background 0.15s' }}>
                          <td style={{ padding:'14px 20px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <DriverAvatar name={d.name} />
                              <span style={{ fontSize:14, fontWeight:600, color:'#e2e8f0' }}>{d.name}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontFamily:'monospace', fontSize:13, color:'#3b82f6', fontWeight:600 }}>{d.license_number}</span>
                          </td>
                          <td>
                            <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:700, background:'rgba(255,255,255,0.06)', color:'#90a1b9', letterSpacing:'0.5px' }}>
                              {d.license_category}
                            </span>
                          </td>
                          <td><ExpiryCell expiry={d.license_expiry} /></td>
                          <td style={{ fontSize:13, color:'#90a1b9' }}>
                            {d.contact_number ? `${d.contact_number.toString().slice(0,5)}-xxxxx` : '—'}
                          </td>
                          <td><ComplianceBar score={safetyPct} /></td>
                          <td><SafetyBadge score={safetyPct} /></td>
                          <td><DriverStatusBadge status={d.status} /></td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign:'center', padding:'40px 0', color:'#45556c', fontSize:14 }}>No drivers found</td></tr>
                    )}
                  </tbody>
                </table>
                <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'#62748e' }}>Showing {filtered.length} of {drivers.length} drivers</span>
                  <span style={{ fontSize:12, color:'#62748e' }}>Page 1 of 1</span>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {showModal && (
        <DriverModal
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchDrivers(); }}
        />
      )}

      <AICopilot />
    </div>
  );
}

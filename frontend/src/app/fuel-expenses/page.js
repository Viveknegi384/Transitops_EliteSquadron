'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import AICopilot from '../../components/AICopilot';
import { apiCall } from '../../utils/api';

// ─── Modals ─────────────────────────────────────────────────────────────────

function FuelModal({ vehicles, onClose, onSave }) {
  const [form, setForm] = useState({ vehicle_id: '', liters: '', cost: '', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    setSaving(true);
    try {
      await apiCall('/expenses/fuel', { method: 'POST', body: JSON.stringify({ vehicle_id: parseInt(form.vehicle_id), liters: parseFloat(form.liters), cost: parseFloat(form.cost), date: form.date }) });
      onSave();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#0d1526', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, width:'100%', maxWidth:400, boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:17, fontWeight:700, color:'#fff' }}>⛽ Log Fuel</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:20 }}>✕</button>
        </div>
        {error && <div style={{ padding:'8px 12px', borderRadius:8, fontSize:12, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', marginBottom:14 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:13 }}>
          <div>
            <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'block', marginBottom:5 }}>Vehicle</label>
            <select required className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={form.vehicle_id} onChange={e=>setForm({...form,vehicle_id:e.target.value})}>
              <option value="">Select vehicle...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.reg_number} — {v.model}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'block', marginBottom:5 }}>Liters (L)</label>
              <input required type="number" step="0.1" className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={form.liters} onChange={e=>setForm({...form,liters:e.target.value})} placeholder="42" />
            </div>
            <div>
              <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'block', marginBottom:5 }}>Cost (₹)</label>
              <input required type="number" className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} placeholder="3150" />
            </div>
          </div>
          <div>
            <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'block', marginBottom:5 }}>Date</label>
            <input type="date" className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
            <button type="button" onClick={onClose} style={{ padding:'10px 18px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, color:'#90a1b9', cursor:'pointer', fontSize:13 }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding:'10px 22px', borderRadius:9, fontSize:13 }}>{saving ? 'Saving...' : 'Log Fuel'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExpenseModal({ vehicles, onClose, onSave }) {
  const [form, setForm] = useState({ vehicle_id: '', type: 'Toll', cost: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    setSaving(true);
    try {
      await apiCall('/expenses/general', { method: 'POST', body: JSON.stringify({ vehicle_id: parseInt(form.vehicle_id), type: form.type, cost: parseFloat(form.cost), date: form.date, description: form.description }) });
      onSave();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#0d1526', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, width:'100%', maxWidth:400, boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:17, fontWeight:700, color:'#fff' }}>💰 Add Expense</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:20 }}>✕</button>
        </div>
        {error && <div style={{ padding:'8px 12px', borderRadius:8, fontSize:12, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', marginBottom:14 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:13 }}>
          <div>
            <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'block', marginBottom:5 }}>Vehicle</label>
            <select required className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={form.vehicle_id} onChange={e=>setForm({...form,vehicle_id:e.target.value})}>
              <option value="">Select vehicle...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.reg_number} — {v.model}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'block', marginBottom:5 }}>Type</label>
              <select className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                {['Toll','Parking','Repair','Misc'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'block', marginBottom:5 }}>Amount (₹)</label>
              <input required type="number" className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} placeholder="500" />
            </div>
          </div>
          <div>
            <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'block', marginBottom:5 }}>Date</label>
            <input type="date" className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'block', marginBottom:5 }}>Description</label>
            <input className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Optional note..." />
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
            <button type="button" onClick={onClose} style={{ padding:'10px 18px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, color:'#90a1b9', cursor:'pointer', fontSize:13 }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding:'10px 22px', borderRadius:9, fontSize:13 }}>{saving ? 'Saving...' : 'Add Expense'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Fuel bar width helper ────────────────────────────────────────────────────
function FuelBar({ liters, max }) {
  const pct = Math.min(100, (liters / (max || 1)) * 100);
  const color = pct > 60 ? '#f59e0b' : pct > 30 ? '#3b82f6' : '#10b981';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ width:80, height:3, background:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:99 }} />
      </div>
      <span style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{liters} L</span>
    </div>
  );
}

// ─── Trip status badge ────────────────────────────────────────────────────────
function TripBadge({ status }) {
  const map = {
    Completed:{ bg:'rgba(16,185,129,0.15)', color:'#10b981', border:'rgba(16,185,129,0.4)' },
    'In Shop': { bg:'rgba(245,158,11,0.15)', color:'#f59e0b', border:'rgba(245,158,11,0.4)' },
    Draft:     { bg:'rgba(100,116,139,0.15)',color:'#64748b', border:'rgba(100,116,139,0.4)' },
    Dispatched:{ bg:'rgba(59,130,246,0.15)', color:'#3b82f6', border:'rgba(59,130,246,0.4)' },
  };
  const s = map[status] || map.Draft;
  return <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:s.bg, color:s.color, border:`1px solid ${s.border}` }}><span style={{ width:4, height:4, borderRadius:'50%', background:s.color, display:'inline-block' }}/>{status}</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FuelExpensesPage() {
  const router = useRouter();
  const [data, setData] = useState({ fuel_logs: [], expenses: [] });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'fuel' | 'expense' | null

  const fetchAll = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      const [expRes, vehicleRes] = await Promise.all([
        apiCall('/expenses'),
        apiCall('/vehicles'),
      ]);
      setData(expRes);
      setVehicles(vehicleRes.vehicles || []);
    } catch (err) {
      if (err.message?.includes('401')) router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleExport = () => {
    const rows = [
      ['Type','Vehicle','Details','Cost (₹)','Date'],
      ...data.fuel_logs.map(f => ['Fuel', f.reg_number, `${f.liters}L`, f.cost, f.date?.split('T')[0]]),
      ...data.expenses.map(e => ['Expense', e.reg_number, e.type, e.cost, e.date?.split('T')[0]]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='fuel_expenses.csv'; a.click();
  };

  const maxLiters = Math.max(...(data.fuel_logs.map(f => parseFloat(f.liters) || 0)), 1);
  const totalFuel = data.fuel_logs.reduce((s, f) => s + (parseFloat(f.cost) || 0), 0);
  const totalOther = data.expenses.reduce((s, e) => s + (parseFloat(e.cost) || 0), 0);
  const totalOps = totalFuel + totalOther;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <TopHeader />
        <div className="page-content">

          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:24 }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:700, color:'#fff' }}>Fuel & Expenses</h1>
              <p style={{ fontSize:12, color:'#62748e', marginTop:3 }}>Operational cost tracking across the fleet</p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setModal('fuel')} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:10, color:'#3b82f6', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                + Log Fuel
              </button>
              <button onClick={() => setModal('expense')} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'linear-gradient(135deg,#f59e0b,#d97706)', border:'none', borderRadius:10, color:'#0b1120', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                + Add Expense
              </button>
            </div>
          </div>

          {/* Summary bar */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
            {[
              { label:'Total Fuel Cost', value:`₹${totalFuel.toLocaleString('en-IN')}`, sub:`${data.fuel_logs.length} entries`, color:'#3b82f6' },
              { label:'Other Expenses', value:`₹${totalOther.toLocaleString('en-IN')}`, sub:`${data.expenses.length} entries`, color:'#f59e0b' },
              { label:'Total Operational Cost', value:`₹${totalOps.toLocaleString('en-IN')}`, sub:'Fuel + Maintenance', color:'#10b981' },
            ].map(s => (
              <div key={s.label} style={{ background:'#0d1526', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'16px 20px', borderTop:`2px solid ${s.color}` }}>
                <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>{s.value}</div>
                <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.5px', color:s.color, marginTop:2 }}>{s.label}</div>
                <div style={{ fontSize:11, color:'#45556c', marginTop:4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Fuel Logs */}
          <div className="section-card" style={{ padding:0, overflow:'hidden', marginBottom:20 }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:16 }}>⛽</span>
              <span style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Fuel Logs</span>
              <span style={{ fontSize:11, fontWeight:600, background:'rgba(16,185,129,0.12)', color:'#00d492', border:'1px solid rgba(16,185,129,0.25)', padding:'1px 8px', borderRadius:99 }}>
                {data.fuel_logs.length} entries
              </span>
            </div>
            {loading ? (
              <div style={{ padding:'40px 0', textAlign:'center', color:'#45556c', fontSize:14 }}>Loading...</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                    <th style={{ padding:'12px 20px' }}>Vehicle</th>
                    <th>Driver</th>
                    <th>Route</th>
                    <th>Date</th>
                    <th>Liters</th>
                    <th>Fuel Cost (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fuel_logs.map((f, i) => (
                    <tr key={f.id || i}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.025)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                      style={{ transition:'background 0.15s' }}>
                      <td style={{ padding:'12px 20px' }}>
                        <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:600, color:'#3b82f6' }}>{f.reg_number}</span>
                      </td>
                      <td style={{ fontSize:13, color:'#e2e8f0' }}>{f.driver_name || '—'}</td>
                      <td style={{ fontSize:13, color:'#90a1b9' }}>{f.route || '—'}</td>
                      <td style={{ fontSize:13, color:'#90a1b9' }}>{f.date ? new Date(f.date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</td>
                      <td><FuelBar liters={parseFloat(f.liters) || 0} max={maxLiters} /></td>
                      <td style={{ fontSize:13, fontWeight:700, color:'#f59e0b' }}>₹{parseFloat(f.cost || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {data.fuel_logs.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign:'center', padding:'32px 0', color:'#45556c', fontSize:14 }}>No fuel logs yet — click "+ Log Fuel" to add one</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Other Expenses */}
          <div className="section-card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:16 }}>💰</span>
              <span style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Other Expenses (Toll / Misc)</span>
              <span style={{ fontSize:11, fontWeight:600, background:'rgba(245,158,11,0.12)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.25)', padding:'1px 8px', borderRadius:99 }}>
                {data.expenses.length} trips
              </span>
              <button onClick={handleExport} style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, padding:'5px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#62748e', fontSize:12, cursor:'pointer' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export
              </button>
            </div>
            {loading ? (
              <div style={{ padding:'40px 0', textAlign:'center', color:'#45556c', fontSize:14 }}>Loading...</div>
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                      <th style={{ padding:'12px 20px' }}>Trip</th>
                      <th>Vehicle</th>
                      <th>Toll (₹)</th>
                      <th>Other (₹)</th>
                      <th>Maint. Linked (₹)</th>
                      <th>Total (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenses.map((e, i) => (
                      <tr key={e.id || i}
                        onMouseEnter={el=>el.currentTarget.style.background='rgba(255,255,255,0.025)'}
                        onMouseLeave={el=>el.currentTarget.style.background='transparent'}
                        style={{ transition:'background 0.15s' }}>
                        <td style={{ padding:'12px 20px' }}>
                          <span style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:'#3b82f6' }}>
                            {e.trip_id ? `T${String(e.trip_id).padStart(4,'0')}` : `E${String(e.id || i+1).padStart(4,'0')}`}
                          </span>
                        </td>
                        <td style={{ fontSize:13, color:'#e2e8f0' }}>{e.reg_number}</td>
                        <td style={{ fontSize:13, color:'#e2e8f0' }}>
                          {e.type === 'Toll' ? `₹${parseFloat(e.cost||0).toLocaleString('en-IN')}` : '₹0'}
                        </td>
                        <td style={{ fontSize:13, color:'#e2e8f0' }}>
                          {e.type !== 'Toll' ? `₹${parseFloat(e.cost||0).toLocaleString('en-IN')}` : '₹0'}
                        </td>
                        <td style={{ fontSize:13, color: e.maintenance_linked ? '#e2e8f0' : '#45556c' }}>
                          {e.maintenance_linked ? `₹${parseFloat(e.maintenance_linked).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td style={{ fontSize:13, fontWeight:700, color:'#fff' }}>₹{parseFloat(e.cost || 0).toLocaleString('en-IN')}</td>
                        <td><TripBadge status={e.status || 'Completed'} /></td>
                      </tr>
                    ))}
                    {data.expenses.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign:'center', padding:'32px 0', color:'#45556c', fontSize:14 }}>No expenses yet — click "+ Add Expense" to add one</td></tr>
                    )}
                  </tbody>
                </table>
                <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'#62748e' }}>Total Operational Cost (Auto) = Fuel + Maintenance</span>
                  <span style={{ fontSize:12, color:'#62748e' }}>All time</span>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {modal === 'fuel'    && <FuelModal    vehicles={vehicles} onClose={()=>setModal(null)} onSave={()=>{ setModal(null); fetchAll(); }} />}
      {modal === 'expense' && <ExpenseModal vehicles={vehicles} onClose={()=>setModal(null)} onSave={()=>{ setModal(null); fetchAll(); }} />}

      <AICopilot />
    </div>
  );
}

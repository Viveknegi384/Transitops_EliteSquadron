'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import AICopilot from '../../components/AICopilot';
import { apiCall } from '../../utils/api';

const SERVICE_TYPES = [
  'Oil Change', 'Engine Repair', 'Tyre Replace', 'Brake Service',
  'AC Repair', 'Battery Replace', 'Transmission', 'Suspension', 'Other'
];

const SERVICE_ICONS = {
  'Oil Change':      '🔧',
  'Engine Repair':   '⚙️',
  'Tyre Replace':    '🔩',
  'Brake Service':   '🛑',
  'AC Repair':       '❄️',
  'Battery Replace': '⚡',
  'Transmission':    '⚙️',
  'Suspension':      '🔩',
  'Other':           '🔧',
};

function MaintenanceStatusBadge({ status }) {
  const map = {
    'In Shop':   { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', border: 'rgba(245,158,11,0.4)'  },
    'Completed': { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', border: 'rgba(16,185,129,0.4)'  },
    'Closed':    { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', border: 'rgba(16,185,129,0.4)'  },
  };
  const s = map[status] || map['In Shop'];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, fontSize:12, fontWeight:600, background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:s.color, display:'inline-block' }} />
      {status === 'Closed' ? 'Completed' : status}
    </span>
  );
}

function KpiBox({ label, value, icon, color }) {
  return (
    <div style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, display:'flex', alignItems:'center', justifyContent:'center', background: `${color}18`, flexShrink:0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight:1 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#62748e', marginTop: 4, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ vehicle_id: '', issue: '', cost: '', scheduled_date: '', status: 'Active', notes: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [closingId, setClosingId] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      const [logRes, vehicleRes] = await Promise.all([
        apiCall('/maintenance'),
        apiCall('/vehicles'),
      ]);
      setLogs(logRes.logs || []);
      setVehicles(vehicleRes.vehicles || []);
    } catch (err) {
      if (err.message?.includes('401')) router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(''); setSaveSuccess('');
    if (!form.vehicle_id || !form.issue) { setSaveError('Vehicle and Service Type are required.'); return; }
    setSaving(true);
    try {
      await apiCall('/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          vehicle_id: parseInt(form.vehicle_id),
          issue: form.issue,
          cost: parseFloat(form.cost) || 0,
          scheduled_date: form.scheduled_date || new Date().toISOString().split('T')[0],
        }),
      });
      setSaveSuccess('Service record saved. Vehicle moved to In Shop.');
      setForm({ vehicle_id:'', issue:'', cost:'', scheduled_date:'', status:'Active', notes:'' });
      fetchAll();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (id) => {
    setClosingId(id);
    try {
      await apiCall(`/maintenance/${id}/close`, { method: 'PUT' });
      fetchAll();
    } catch (err) {
      console.error(err);
    } finally {
      setClosingId(null);
    }
  };

  const handleExport = () => {
    const csv = ['Vehicle,Service Type,Cost,Date,Status']
      .concat(filtered.map(l => `${l.reg_number},${l.issue},${l.cost},${l.scheduled_date?.split('T')[0]},${l.status}`))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='maintenance.csv'; a.click();
  };

  const filtered = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.reg_number?.toLowerCase().includes(q) || l.issue?.toLowerCase().includes(q) || l.model?.toLowerCase().includes(q);
  });

  const totalCost = logs.reduce((sum, l) => sum + (parseFloat(l.cost) || 0), 0);
  const inShop    = logs.filter(l => l.status === 'In Shop').length;
  const completed = logs.filter(l => l.status === 'Closed' || l.status === 'Completed').length;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <TopHeader />
        <div className="page-content">
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>

            {/* LEFT — Log Service Record form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Maintenance</h1>
                <p style={{ fontSize: 12, color: '#62748e', marginTop: 3 }}>Log service records for the fleet</p>
              </div>

              <div style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14 }}>🔧</div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Log Service Record</span>
                </div>

                {saveError && <div style={{ padding:'8px 12px', borderRadius:8, fontSize:12, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', marginBottom:12 }}>{saveError}</div>}
                {saveSuccess && <div style={{ padding:'8px 12px', borderRadius:8, fontSize:12, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', color:'#10b981', marginBottom:12 }}>{saveSuccess}</div>}

                <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div>
                    <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'flex', alignItems:'center', gap:4, marginBottom:5 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                      Vehicle
                    </label>
                    <select className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={form.vehicle_id} onChange={e=>setForm({...form,vehicle_id:e.target.value})} required>
                      <option value="">Select vehicle...</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.reg_number} — {v.model}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'flex', alignItems:'center', gap:4, marginBottom:5 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                      Service Type
                    </label>
                    <select className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={form.issue} onChange={e=>setForm({...form,issue:e.target.value})} required>
                      <option value="">Select service type...</option>
                      {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'flex', alignItems:'center', gap:4, marginBottom:5 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      Cost (₹)
                    </label>
                    <input type="number" className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} placeholder="2500" />
                  </div>

                  <div>
                    <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'flex', alignItems:'center', gap:4, marginBottom:5 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#90a1b9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Date
                    </label>
                    <input type="date" className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={form.scheduled_date} onChange={e=>setForm({...form,scheduled_date:e.target.value})} />
                  </div>

                  {/* Status toggle */}
                  <div>
                    <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'block', marginBottom:8 }}>Status</label>
                    <div style={{ display:'flex', gap:8 }}>
                      {['Active','Completed'].map(s => (
                        <button key={s} type="button" onClick={() => setForm({...form,status:s})}
                          style={{ flex:1, padding:'8px', borderRadius:8, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                            background: form.status===s ? (s==='Active'?'linear-gradient(135deg,#f59e0b,#d97706)':'rgba(16,185,129,0.2)') : 'rgba(255,255,255,0.05)',
                            color: form.status===s ? (s==='Active'?'#0b1120':'#10b981') : '#64748b',
                          }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'block', marginBottom:5 }}>Notes (Optional)</label>
                    <textarea className="input-field" rows={3} style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, padding:'10px 13px', fontSize:12, resize:'none' }} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Technician remarks..." />
                  </div>

                  <button type="submit" disabled={saving} className="btn-primary" style={{ padding:'12px', borderRadius:10, fontSize:13, fontWeight:700 }}>
                    {saving ? 'Saving...' : 'Save Record'}
                  </button>
                </form>

                {/* Vehicle State Flow */}
                <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'1px', color:'#45556c', marginBottom:12 }}>Vehicle State Flow</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:12, color:'#10b981', fontWeight:600 }}>Available</span>
                      <svg width="16" height="10" viewBox="0 0 24 14" fill="none" style={{ flex:1 }}>
                        <line x1="0" y1="7" x2="20" y2="7" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="3 2"/>
                        <polyline points="16,3 22,7 16,11" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
                      </svg>
                      <span style={{ fontSize:12, color:'#f59e0b', fontWeight:600 }}>In Shop</span>
                    </div>
                    <div style={{ fontSize:10, color:'#45556c', paddingLeft:2 }}>Logging service record</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                      <span style={{ fontSize:12, color:'#f59e0b', fontWeight:600 }}>In Shop</span>
                      <svg width="16" height="10" viewBox="0 0 24 14" fill="none" style={{ flex:1 }}>
                        <line x1="0" y1="7" x2="20" y2="7" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="3 2"/>
                        <polyline points="16,3 22,7 16,11" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
                      </svg>
                      <span style={{ fontSize:12, color:'#10b981', fontWeight:600 }}>Available</span>
                    </div>
                    <div style={{ fontSize:10, color:'#45556c', paddingLeft:2 }}>Mark Completed</div>
                    <div style={{ fontSize:10, color:'#f59e0b', marginTop:6, display:'flex', alignItems:'flex-start', gap:4 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop:1, flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      In Shop vehicles are removed from the dispatch pool
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — Service Log table */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#90a1b9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  <h2 style={{ fontSize:16, fontWeight:700, color:'#fff' }}>Service Log</h2>
                  <span style={{ fontSize:12, color:'#62748e' }}>Complete maintenance history</span>
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, background:'#1a2640', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'7px 14px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#45556c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input style={{ background:'transparent', border:'none', outline:'none', color:'#e2e8f0', fontSize:13, width:160 }} placeholder="Search vehicle or type..." value={search} onChange={e=>setSearch(e.target.value)} />
                  </div>
                  <button onClick={handleExport} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#90a1b9', fontSize:13, cursor:'pointer' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Export
                  </button>
                </div>
              </div>

              {/* KPI boxes */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
                <KpiBox label="Total Records" value={logs.length}
                  color="#3b82f6"
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>} />
                <KpiBox label="In Shop" value={inShop}
                  color="#f59e0b"
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>} />
                <KpiBox label="Completed" value={completed}
                  color="#10b981"
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>} />
                <KpiBox label="Total Cost" value={`₹${totalCost.toLocaleString('en-IN')}`}
                  color="#8b5cf6"
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
              </div>

              {/* Table */}
              <div className="section-card" style={{ padding:0, overflow:'hidden' }}>
                {loading ? (
                  <div style={{ padding:'48px 0', textAlign:'center', color:'#45556c', fontSize:14 }}>Loading maintenance logs...</div>
                ) : (
                  <>
                    <table className="data-table">
                      <thead>
                        <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                          <th style={{ padding:'14px 20px' }}>Vehicle</th>
                          <th>Service Type</th>
                          <th>Cost</th>
                          <th>Date</th>
                          <th>Technician</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(log => (
                          <tr key={log.id}
                            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.025)'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                            style={{ transition:'background 0.15s' }}>
                            <td style={{ padding:'14px 20px' }}>
                              <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:600, color:'#3b82f6' }}>{log.reg_number}</span>
                            </td>
                            <td>
                              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                                <span style={{ fontSize:14 }}>{SERVICE_ICONS[log.issue] || '🔧'}</span>
                                <span style={{ fontSize:13, color:'#e2e8f0' }}>{log.issue}</span>
                              </div>
                            </td>
                            <td style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>
                              ₹{parseFloat(log.cost || 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ fontSize:13, color:'#90a1b9' }}>
                              {log.scheduled_date ? new Date(log.scheduled_date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                            </td>
                            <td style={{ fontSize:13, color:'#90a1b9' }}>
                              {log.technician || 'Unassigned'}
                            </td>
                            <td><MaintenanceStatusBadge status={log.status} /></td>
                            <td style={{ padding:'14px 20px' }}>
                              {(log.status === 'In Shop') && (
                                <button
                                  onClick={() => handleClose(log.id)}
                                  disabled={closingId === log.id}
                                  style={{ padding:'5px 12px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, color:'#10b981', fontSize:12, cursor:'pointer', fontWeight:600, transition:'all 0.15s', whiteSpace:'nowrap' }}
                                  onMouseEnter={e=>e.currentTarget.style.background='rgba(16,185,129,0.2)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(16,185,129,0.1)'}>
                                  {closingId === log.id ? '...' : 'Mark Done'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filtered.length === 0 && (
                          <tr><td colSpan={7} style={{ textAlign:'center', padding:'40px 0', color:'#45556c', fontSize:14 }}>No maintenance records found</td></tr>
                        )}
                      </tbody>
                    </table>
                    <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:12, color:'#62748e' }}>Showing {filtered.length} records</span>
                      <button onClick={() => {}} style={{ background:'none', border:'none', color:'#3b82f6', fontSize:12, cursor:'pointer' }}>View all →</button>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
      <AICopilot />
    </div>
  );
}

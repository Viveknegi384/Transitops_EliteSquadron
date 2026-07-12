'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import AICopilot from '../../components/AICopilot';
import { apiCall } from '../../utils/api';

const STATUS_OPTIONS = ['Available', 'On Trip', 'In Shop', 'Retired'];
const TYPE_OPTIONS = ['Van', 'Truck', 'Mini'];

function StatusBadge({ status }) {
  const styles = {
    'Available': { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)' },
    'On Trip':   { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6', border: '1px solid rgba(59,130,246,0.4)'  },
    'In Shop':   { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)'  },
    'Retired':   { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)'   },
  };
  const s = styles[status] || styles['Available'];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, fontSize:12, fontWeight:600, background:s.bg, color:s.color, border:s.border }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:s.color, display:'inline-block' }} />
      {status}
    </span>
  );
}

function TypeBadge({ type }) {
  const colors = { Van:'rgba(59,130,246,0.15)', Truck:'rgba(139,92,246,0.15)', Mini:'rgba(16,185,129,0.15)' };
  const text   = { Van:'#3b82f6', Truck:'#8b5cf6', Mini:'#10b981' };
  return (
    <span style={{ padding:'2px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:colors[type]||'rgba(255,255,255,0.06)', color:text[type]||'#90a1b9' }}>
      {type}
    </span>
  );
}

// Add/Edit modal
function VehicleModal({ vehicle, onClose, onSave }) {
  const isEdit = !!vehicle?.id;
  const [form, setForm] = useState({
    reg_number: vehicle?.reg_number || '',
    model: vehicle?.model || '',
    type: vehicle?.type || 'Van',
    max_load: vehicle?.max_load || '',
    odometer: vehicle?.odometer || 0,
    acquisition_cost: vehicle?.acquisition_cost || '',
    status: vehicle?.status || 'Available',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await apiCall(`/vehicles/${vehicle.id}`, { method: 'PUT', body: JSON.stringify({ status: form.status, odometer: form.odometer }) });
      } else {
        await apiCall('/vehicles', { method: 'POST', body: JSON.stringify({ ...form, max_load: parseFloat(form.max_load), odometer: parseFloat(form.odometer), acquisition_cost: parseFloat(form.acquisition_cost) }) });
      }
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
          <h2 style={{ fontSize:18, fontWeight:700, color:'#fff' }}>{isEdit ? 'Update Vehicle' : '+ Add Vehicle'}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:20 }}>✕</button>
        </div>
        {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {!isEdit && (
            <>
              <div>
                <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.6px', color:'#90a1b9', display:'block', marginBottom:6 }}>Registration No.</label>
                <input className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'11px 14px' }} required value={form.reg_number} onChange={e=>setForm({...form,reg_number:e.target.value})} placeholder="e.g. VAN-09" />
              </div>
              <div>
                <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.6px', color:'#90a1b9', display:'block', marginBottom:6 }}>Model</label>
                <input className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'11px 14px' }} required value={form.model} onChange={e=>setForm({...form,model:e.target.value})} placeholder="e.g. VAN-09" />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.6px', color:'#90a1b9', display:'block', marginBottom:6 }}>Type</label>
                  <select className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'11px 14px' }} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                    {TYPE_OPTIONS.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.6px', color:'#90a1b9', display:'block', marginBottom:6 }}>Max Load (kg)</label>
                  <input className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'11px 14px' }} type="number" required value={form.max_load} onChange={e=>setForm({...form,max_load:e.target.value})} placeholder="500" />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.6px', color:'#90a1b9', display:'block', marginBottom:6 }}>Odometer (km)</label>
                  <input className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'11px 14px' }} type="number" value={form.odometer} onChange={e=>setForm({...form,odometer:e.target.value})} placeholder="0" />
                </div>
                <div>
                  <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.6px', color:'#90a1b9', display:'block', marginBottom:6 }}>Acq. Cost (₹)</label>
                  <input className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'11px 14px' }} type="number" value={form.acquisition_cost} onChange={e=>setForm({...form,acquisition_cost:e.target.value})} placeholder="620000" />
                </div>
              </div>
            </>
          )}
          <div style={{ display:'grid', gridTemplateColumns: isEdit ? '1fr 1fr' : '1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.6px', color:'#90a1b9', display:'block', marginBottom:6 }}>Status</label>
              <select className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'11px 14px' }} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            {isEdit && (
              <div>
                <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.6px', color:'#90a1b9', display:'block', marginBottom:6 }}>Odometer (km)</label>
                <input className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'11px 14px' }} type="number" value={form.odometer} onChange={e=>setForm({...form,odometer:e.target.value})} />
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <button type="button" onClick={onClose} style={{ padding:'10px 20px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#90a1b9', cursor:'pointer', fontSize:14 }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding:'10px 24px', borderRadius:10, fontSize:14 }}>{saving ? 'Saving...' : isEdit ? 'Update' : 'Add Vehicle'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | vehicle object

  const fetchVehicles = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      const res = await apiCall(`/vehicles?${params}`);
      setVehicles(res.vehicles || []);
    } catch (err) {
      if (err.message?.includes('401')) router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, router]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleExport = () => {
    const csv = ['Reg No,Model,Type,Max Load (kg),Odometer (km),Acq Cost,Status']
      .concat(filtered.map(v => `${v.reg_number},${v.model},${v.type},${v.max_load},${v.odometer},${v.acquisition_cost},${v.status}`))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'vehicles.csv'; a.click();
  };

  const filtered = vehicles.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.reg_number?.toLowerCase().includes(q) || v.model?.toLowerCase().includes(q);
  });

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <TopHeader />
        <div className="page-content">

          {/* Page header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:20 }}>
            <div>
              <h1 style={{ fontSize:24, fontWeight:700, color:'#fff' }}>Vehicle Registry</h1>
              <p style={{ fontSize:13, color:'#62748e', marginTop:4 }}>
                {vehicles.length} vehicles registered · Registration No. must be unique
              </p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleExport} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#90a1b9', fontSize:13, cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export
              </button>
              <button onClick={() => setModal('add')} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'linear-gradient(135deg, #f59e0b, #d97706)', border:'none', borderRadius:10, color:'#0b1120', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Vehicle
              </button>
            </div>
          </div>

          {/* Filters row */}
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:14 }}>
            <select className="filter-dropdown" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ minWidth:130 }}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
            </select>
            <select className="filter-dropdown" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ minWidth:110 }}>
              <option value="">All Types</option>
              {TYPE_OPTIONS.map(t=><option key={t}>{t}</option>)}
            </select>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'#1a2640', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'7px 14px', flex:'0 1 220px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#45556c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input style={{ background:'transparent', border:'none', outline:'none', color:'#e2e8f0', fontSize:13, width:'100%' }} placeholder="Search reg. no..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
          </div>

          {/* Rule notice */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:10, marginBottom:16, fontSize:12, color:'#f59e0b' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Rule: Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher
          </div>

          {/* Table */}
          <div className="section-card" style={{ padding:0, overflow:'hidden' }}>
            {loading ? (
              <div style={{ padding:'48px 0', textAlign:'center', color:'#45556c', fontSize:14 }}>Loading vehicles...</div>
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                      <th style={{ padding:'14px 20px' }}>Reg No. (Unique)</th>
                      <th>Name / Model</th>
                      <th>Type</th>
                      <th>Capacity</th>
                      <th>Odometer</th>
                      <th>Acq. Cost</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((v) => (
                      <tr key={v.id} style={{ transition:'background 0.15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.025)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'14px 20px' }}>
                          <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:600, color:'#3b82f6' }}>
                            {v.reg_number}
                          </span>
                        </td>
                        <td style={{ fontSize:14, fontWeight:600, color:'#e2e8f0' }}>{v.model}</td>
                        <td><TypeBadge type={v.type} /></td>
                        <td style={{ fontSize:13, color:'#90a1b9' }}>{v.max_load >= 1000 ? `${v.max_load/1000} Ton` : `${v.max_load} kg`}</td>
                        <td style={{ fontSize:13, color:'#90a1b9' }}>{parseInt(v.odometer).toLocaleString('en-IN')} km</td>
                        <td style={{ fontSize:13, color:'#e2e8f0', fontWeight:500 }}>₹{parseFloat(v.acquisition_cost).toLocaleString('en-IN')}</td>
                        <td><StatusBadge status={v.status} /></td>
                        <td style={{ padding:'14px 20px' }}>
                          <button onClick={() => setModal(v)} style={{ padding:'5px 12px', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:8, color:'#3b82f6', fontSize:12, cursor:'pointer', fontWeight:600, transition:'all 0.15s' }}
                            onMouseEnter={e=>e.currentTarget.style.background='rgba(59,130,246,0.2)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(59,130,246,0.1)'}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign:'center', padding:'40px 0', color:'#45556c', fontSize:14 }}>No vehicles found</td></tr>
                    )}
                  </tbody>
                </table>
                <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'#62748e' }}>Showing {filtered.length} of {vehicles.length} vehicles</span>
                  <span style={{ fontSize:12, color:'#62748e' }}>Page 1 of 1</span>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {modal && (
        <VehicleModal
          vehicle={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchVehicles(); }}
        />
      )}

      <AICopilot />
    </div>
  );
}

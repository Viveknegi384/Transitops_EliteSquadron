'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import AICopilot from '../../components/AICopilot';
import { apiCall } from '../../utils/api';

// Trip lifecycle stages
const STAGES = ['Draft', 'Dispatched', 'Complete', 'Cancelled'];

function StageIcon({ stage, isActive }) {
  const icons = {
    Draft: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
    Dispatched: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    ),
    Complete: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    Cancelled: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
  };
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isActive ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${isActive ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
      color: isActive ? '#f59e0b' : '#45556c',
      flexShrink: 0,
    }}>
      {icons[stage]}
    </div>
  );
}

function CompleteModal({ onClose, onSubmit }) {
  const [dist, setDist] = useState('');
  const [fuel, setFuel] = useState('');
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#0d1526', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:24, width:'100%', maxWidth:360 }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:16 }}>Mark Trip Complete</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ fontSize:11, color:'#90a1b9', display:'block', marginBottom:4 }}>Ending Odometer (km)</label>
            <input type="number" className="input-field" style={{ width:'100%', padding:10, borderRadius:8, background:'#1a2640', border:'1px solid rgba(255,255,255,0.07)' }} value={dist} onChange={e=>setDist(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize:11, color:'#90a1b9', display:'block', marginBottom:4 }}>Fuel Used (Liters)</label>
            <input type="number" className="input-field" style={{ width:'100%', padding:10, borderRadius:8, background:'#1a2640', border:'1px solid rgba(255,255,255,0.07)' }} value={fuel} onChange={e=>setFuel(e.target.value)} />
          </div>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <button onClick={onClose} style={{ flex:1, padding:10, borderRadius:8, background:'rgba(255,255,255,0.05)', color:'#fff', border:'none' }}>Cancel</button>
            <button onClick={() => onSubmit(dist, fuel)} disabled={!dist||!fuel} style={{ flex:1, padding:10, borderRadius:8, background:'#10b981', color:'#fff', border:'none', opacity: (!dist||!fuel)?0.5:1 }}>Complete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveTripCard({ trip, onCancel, onComplete }) {
  const statusMap = {
    'Dispatched': { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', label: 'Dispatched' },
    'On Trip':    { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)',  label: 'On Trip'    },
    'Draft':      { color: '#64748b', bg: 'rgba(100,116,139,0.15)',border: 'rgba(100,116,139,0.4)',  label: 'Draft'      },
    'Cancelled':  { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',    label: 'Cancelled'  },
    'Completed':  { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)',  label: 'Completed'  },
  };
  const s = statusMap[trip.status] || statusMap['Draft'];
  const isOnTrip = trip.status === 'On Trip' || trip.status === 'Dispatched';

  return (
    <div style={{
      background: '#0d1a2e',
      border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: 12,
      padding: '14px 18px',
      marginBottom: 10,
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>
              {trip.id ? `TR${String(trip.id).padStart(3,'0')}` : '—'}
            </span>
            <span style={{ fontSize: 12, color: '#62748e' }}>
              {trip.reg_number || '—'} / {trip.driver_name?.split(' ')[0]?.toUpperCase() || 'UNASSIGNED'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            {trip.source} → {trip.destination}
          </div>
          <div style={{ fontSize: 12, color: '#45556c', marginTop: 4 }}>
            {trip.status === 'Draft' ? '+ Awaiting driver' :
             trip.status === 'Cancelled' ? 'Vehicle went to shop' :
             trip.eta ? `+ ${trip.eta} min` : ''}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
          <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, flexShrink: 0 }}>
            {s.label}
          </span>
          {isOnTrip && (
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => onComplete(trip.id)} style={{ background:'rgba(16,185,129,0.1)', color:'#10b981', border:'1px solid rgba(16,185,129,0.2)', padding:'4px 8px', borderRadius:6, fontSize:10, cursor:'pointer' }}>Done</button>
              <button onClick={() => onCancel(trip.id)} style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)', padding:'4px 8px', borderRadius:6, fontSize:10, cursor:'pointer' }}>Cancel</button>
            </div>
          )}
        </div>
      </div>
      {/* Progress bar for active trips */}
      {isOnTrip && (
        <div style={{ marginTop: 10, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: '65%', height: '100%', background: 'linear-gradient(90deg, #10b981, #3b82f6)', borderRadius: 99 }} />
        </div>
      )}
    </div>
  );
}

export default function DispatchPage() {
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('Draft');
  const [form, setForm] = useState({
    source: '',
    destination: '',
    vehicle_id: '',
    driver_id: '',
    cargo_weight: '',
    planned_distance: '',
  });
  const [validation, setValidation] = useState(null);
  const [validating, setValidating] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState('');
  const [dispatchSuccess, setDispatchSuccess] = useState('');
  const [completingId, setCompletingId] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      const [tripRes, vehicleRes, driverRes] = await Promise.all([
        apiCall('/trips'),
        apiCall('/vehicles?status=Available'),
        apiCall('/drivers?valid_only=true'),
      ]);
      setTrips(tripRes.trips || []);
      setVehicles(vehicleRes.vehicles || []);
      setDrivers(driverRes.drivers || []);
    } catch (err) {
      if (err.message?.includes('401')) router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-validate when vehicle + cargo change
  useEffect(() => {
    if (form.vehicle_id && form.driver_id && form.cargo_weight) {
      handleValidate();
    } else {
      setValidation(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.vehicle_id, form.driver_id, form.cargo_weight]);

  const handleValidate = async () => {
    if (!form.vehicle_id || !form.driver_id || !form.cargo_weight) return;
    setValidating(true);
    try {
      const res = await apiCall('/trips/validate', {
        method: 'POST',
        body: JSON.stringify({ vehicle_id: form.vehicle_id, driver_id: form.driver_id, cargo_weight: parseFloat(form.cargo_weight) }),
      });
      setValidation({ ok: true, message: res.message });
    } catch (err) {
      setValidation({ ok: false, message: err.message });
    } finally {
      setValidating(false);
    }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    setDispatchError('');
    setDispatchSuccess('');
    if (!form.source || !form.destination || !form.vehicle_id || !form.driver_id || !form.cargo_weight || !form.planned_distance) {
      setDispatchError('All fields are required.');
      return;
    }
    if (validation && !validation.ok) {
      setDispatchError('Fix validation errors before dispatching.');
      return;
    }
    setDispatching(true);
    try {
      await apiCall('/trips/dispatch', {
        method: 'POST',
        body: JSON.stringify({
          source: form.source, destination: form.destination,
          vehicle_id: form.vehicle_id, driver_id: form.driver_id,
          cargo_weight: parseFloat(form.cargo_weight), planned_distance: parseFloat(form.planned_distance),
        }),
      });
      setDispatchSuccess('Trip dispatched successfully!');
      setForm({ source:'', destination:'', vehicle_id:'', driver_id:'', cargo_weight:'', planned_distance:'' });
      setValidation(null);
      fetchAll();
    } catch (err) {
      setDispatchError(err.message);
    } finally {
      setDispatching(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await apiCall(`/trips/${id}/cancel`, { method: 'POST' });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (dist, fuel) => {
    try {
      await apiCall(`/trips/${completingId}/complete`, { method: 'POST', body: JSON.stringify({ final_odometer: parseFloat(dist), fuel_consumed: parseFloat(fuel), fuel_cost: parseFloat(fuel) * 90 }) });
      setCompletingId(null);
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  // Live board counts
  const active    = trips.filter(t => t.status === 'On Trip' || t.status === 'Dispatched').length;
  const pending   = trips.filter(t => t.status === 'Draft').length;
  const cancelled = trips.filter(t => t.status === 'Cancelled').length;

  const selectedVehicle = vehicles.find(v => String(v.id) === String(form.vehicle_id));
  const canDispatch = validation?.ok && form.source && form.destination && form.planned_distance;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <TopHeader />
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, flex: 1, minHeight: 0 }}>

            {/* LEFT PANEL — Create Trip */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
              {/* Page title */}
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Trip Dispatcher</h1>
                <p style={{ fontSize: 12, color: '#62748e', marginTop: 3 }}>Create and manage trip assignments</p>
              </div>

              {/* Trip lifecycle progress */}
              <div style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: '#45556c', marginBottom: 12 }}>Trip Lifecycle</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {STAGES.map((s, i) => (
                    <React.Fragment key={s}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <StageIcon stage={s} isActive={s === activeStage} />
                        <span style={{ fontSize: 9, color: s === activeStage ? '#f59e0b' : '#45556c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s}</span>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* AI Smart Dispatch button */}
              <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12, color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                AI Smart Dispatch
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', background: 'rgba(139,92,246,0.2)', borderRadius: 4, color: '#a78bfa', marginLeft: 2 }}>BETA</span>
              </button>

              {/* Create Trip form */}
              <div style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px' }}>
                <div style={{ fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: '#45556c', marginBottom: 14 }}>Create Trip</div>
                <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Source */}
                  <div>
                    <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#90a1b9', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                      Source
                    </label>
                    <input className="input-field" style={{ background: '#1a2640', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '10px 13px', fontSize: 13 }} value={form.source} onChange={e=>setForm({...form,source:e.target.value})} placeholder="Gandhinagar Depot" />
                  </div>
                  {/* Destination */}
                  <div>
                    <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#90a1b9', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                      Destination
                    </label>
                    <input className="input-field" style={{ background: '#1a2640', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '10px 13px', fontSize: 13 }} value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} placeholder="Ahmedabad Hub" />
                  </div>
                  {/* Vehicle */}
                  <div>
                    <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#90a1b9', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                      Vehicle (Available only)
                    </label>
                    <select className="input-field" style={{ background: '#1a2640', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '10px 13px', fontSize: 13 }} value={form.vehicle_id} onChange={e=>setForm({...form,vehicle_id:e.target.value})}>
                      <option value="">Select vehicle...</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.reg_number} — {v.model} ({v.max_load}kg cap.)</option>)}
                    </select>
                  </div>
                  {/* Driver */}
                  <div>
                    <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#90a1b9', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Driver (Available only)
                    </label>
                    <select className="input-field" style={{ background: '#1a2640', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '10px 13px', fontSize: 13 }} value={form.driver_id} onChange={e=>setForm({...form,driver_id:e.target.value})}>
                      <option value="">Select driver...</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name} — {d.license_category}</option>)}
                    </select>
                  </div>
                  {/* Cargo + Distance */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#90a1b9', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#90a1b9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                        Cargo Wt. (kg)
                      </label>
                      <input type="number" className="input-field" style={{ background: '#1a2640', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '10px 13px', fontSize: 13 }} value={form.cargo_weight} onChange={e=>setForm({...form,cargo_weight:e.target.value})} placeholder="700" />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#90a1b9', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#90a1b9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        Distance (km)
                      </label>
                      <input type="number" className="input-field" style={{ background: '#1a2640', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '10px 13px', fontSize: 13 }} value={form.planned_distance} onChange={e=>setForm({...form,planned_distance:e.target.value})} placeholder="32" />
                    </div>
                  </div>

                  {/* Validation feedback */}
                  {validating && (
                    <div style={{ fontSize: 12, color: '#62748e', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>Validating...</div>
                  )}
                  {validation && !validating && (
                    <div style={{
                      padding: '10px 12px', borderRadius: 8, fontSize: 12,
                      background: validation.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${validation.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                      color: validation.ok ? '#10b981' : '#ef4444',
                    }}>
                      {!validation.ok && selectedVehicle && (
                        <div style={{ marginBottom: 4, fontSize: 11, color: '#90a1b9' }}>
                          Vehicle Capacity: {selectedVehicle.max_load}kg · Cargo Weight: {form.cargo_weight}kg
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}>
                          {validation.ok ? <polyline points="20 6 9 17 4 12"/> : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
                        </svg>
                        {validation.message}
                        {!validation.ok && <span style={{ marginLeft: 4, color: '#ef4444', fontWeight: 700 }}>— dispatch blocked</span>}
                      </div>
                    </div>
                  )}

                  {dispatchError && (
                    <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>{dispatchError}</div>
                  )}
                  {dispatchSuccess && (
                    <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>{dispatchSuccess}</div>
                  )}

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button type="submit" disabled={!canDispatch || dispatching} style={{
                      flex: 1, padding: '11px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: canDispatch && !dispatching ? 'pointer' : 'not-allowed',
                      background: canDispatch && !dispatching ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(255,255,255,0.06)',
                      color: canDispatch && !dispatching ? '#0b1120' : '#45556c',
                    }}>
                      {dispatching ? 'Dispatching...' : canDispatch ? 'Dispatch' : 'Dispatch (Disabled)'}
                    </button>
                    <button type="button" onClick={() => { setForm({ source:'',destination:'',vehicle_id:'',driver_id:'',cargo_weight:'',planned_distance:'' }); setValidation(null); setDispatchError(''); setDispatchSuccess(''); }} style={{ padding: '11px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#90a1b9', fontSize: 13, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>

                  <p style={{ fontSize: 11, color: '#45556c', marginTop: 2 }}>
                    On complete: odometer → fuel log → expenses → Vehicle &amp; Driver back to Available
                  </p>
                </form>
              </div>
            </div>

            {/* RIGHT PANEL — Live Board */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Live Board</h2>
                  <span style={{ fontSize: 11, fontWeight: 600, background: 'rgba(0,212,146,0.12)', color: '#00d492', border: '1px solid rgba(0,212,146,0.25)', padding: '1px 8px', borderRadius: 99 }}>
                    ● Live
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#62748e' }}>Real-time trip status</p>
              </div>

              {/* Trip cards */}
              {loading ? (
                <div style={{ color: '#45556c', fontSize: 14, padding: '24px 0' }}>Loading trips...</div>
              ) : (
                <div>
                  {trips.slice(0, 8).map(trip => (
                    <LiveTripCard key={trip.id} trip={trip} onCancel={handleCancel} onComplete={id => setCompletingId(id)} />
                  ))}
                  {trips.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#45556c', padding: '40px 0', fontSize: 14 }}>No trips yet — create the first dispatch!</div>
                  )}
                </div>
              )}

              {/* Bottom stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 'auto' }}>
                {[
                  { label: 'Active', value: active, color: '#10b981' },
                  { label: 'Pending', value: pending, color: '#f59e0b' },
                  { label: 'Cancelled', value: cancelled, color: '#ef4444' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 12, color: '#62748e', marginTop: 4 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
      {completingId && <CompleteModal onClose={() => setCompletingId(null)} onSubmit={handleComplete} />}
      <AICopilot />
    </div>
  );
}

'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import AICopilot from '../../components/AICopilot';

// RBAC matrix data
const RBAC_MATRIX = [
  {
    role: 'Fleet Manager',
    color: '#f59e0b',
    permissions: {
      Fleet:     'full',
      Drivers:   'full',
      Trips:     'view',
      FuelExp:   null,
      Analytics: null,
    },
    desc: 'Full: Fleet, Drivers',
  },
  {
    role: 'Dispatcher',
    color: '#3b82f6',
    permissions: {
      Fleet:     'view',
      Drivers:   null,
      Trips:     'full',
      FuelExp:   null,
      Analytics: null,
    },
    desc: 'Full: Trips\nView: Fleet',
  },
  {
    role: 'Safety Officer',
    color: '#10b981',
    permissions: {
      Fleet:     null,
      Drivers:   'full',
      Trips:     'view',
      FuelExp:   null,
      Analytics: null,
    },
    desc: 'Full: Drivers\nView: Trips',
  },
  {
    role: 'Financial Analyst',
    color: '#8b5cf6',
    permissions: {
      Fleet:     null,
      Drivers:   null,
      Trips:     null,
      FuelExp:   'full',
      Analytics: 'full',
    },
    desc: 'Full: FuelExp, Analytics\nView: Fleet',
  },
];

const MODULES = ['Fleet', 'Drivers', 'Trips', 'FuelExp', 'Analytics'];

function AccessPill({ level }) {
  if (level === 'full') return (
    <div style={{ display:'flex', justifyContent:'center' }}>
      <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    </div>
  );
  if (level === 'view') return (
    <div style={{ display:'flex', justifyContent:'center' }}>
      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'rgba(100,116,139,0.15)', color:'#64748b', border:'1px solid rgba(100,116,139,0.3)' }}>View</span>
    </div>
  );
  return <div style={{ textAlign:'center', color:'#2a3751', fontSize:16 }}>—</div>;
}

function Toggle({ checked, onChange }) {
  return (
    <div onClick={onChange} style={{ width:42, height:22, borderRadius:99, background: checked ? '#3b82f6' : 'rgba(255,255,255,0.08)', border:`1px solid ${checked ? '#3b82f6' : 'rgba(255,255,255,0.12)'}`, cursor:'pointer', position:'relative', transition:'all 0.2s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:2, left: checked ? 22 : 2, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }} />
    </div>
  );
}

const TABS = ['General', 'Notifications', 'Security'];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('General');
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    depotName: 'Gandhinagar Depot 324',
    currency: 'INR (₹)',
    distanceUnit: 'Kilometers',
    timezone: 'Asia/Kolkata (IST)',
    autoLogOdometer: true,
    emailAlertsMaintenance: true,
    allowDriverSelfReport: false,
    notifTripDispatch: true,
    notifMaintenanceAlert: true,
    notifSafetyScore: false,
    notifFuelAnomaly: true,
    twoFactor: false,
    sessionTimeout: '30 minutes',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, [router]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <TopHeader />
        <div className="page-content">
          <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20 }}>

            {/* LEFT — Settings form */}
            <div>
              <div style={{ marginBottom:20 }}>
                <h1 style={{ fontSize:22, fontWeight:700, color:'#fff' }}>Settings</h1>
                <p style={{ fontSize:12, color:'#62748e', marginTop:3 }}>Configure your TransitOps workspace</p>
              </div>

              {/* Tab buttons */}
              <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:3, marginBottom:20 }}>
                {TABS.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    flex:1, padding:'7px 0', borderRadius:8, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                    background: activeTab === tab ? 'rgba(59,130,246,0.2)' : 'transparent',
                    color: activeTab === tab ? '#3b82f6' : '#64748b',
                  }}>{tab}</button>
                ))}
              </div>

              {/* General Tab */}
              {activeTab === 'General' && (
                <div style={{ background:'#0d1526', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:18, display:'flex', flexDirection:'column', gap:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18, paddingBottom:14, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width:26, height:26, borderRadius:8, background:'rgba(59,130,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    </div>
                    <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>General</span>
                  </div>

                  {[
                    { label:'Depot Name',    key:'depotName',    type:'text'   },
                    { label:'Currency',      key:'currency',     type:'select', opts:['INR (₹)','USD ($)','EUR (€)'] },
                    { label:'Distance Unit', key:'distanceUnit', type:'select', opts:['Kilometers','Miles'] },
                    { label:'Timezone',      key:'timezone',     type:'select', opts:['Asia/Kolkata (IST)','UTC','US/Eastern'] },
                  ].map(field => (
                    <div key={field.key} style={{ marginBottom:14 }}>
                      <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'block', marginBottom:5 }}>{field.label}</label>
                      {field.type === 'select' ? (
                        <select className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={settings[field.key]} onChange={e=>set(field.key,e.target.value)}>
                          {field.opts.map(o=><option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={settings[field.key]} onChange={e=>set(field.key,e.target.value)} />
                      )}
                    </div>
                  ))}

                  {/* Toggle switches */}
                  {[
                    { label:'Auto-log odometer on trip complete', key:'autoLogOdometer' },
                    { label:'Email alerts for overdue maintenance', key:'emailAlertsMaintenance' },
                    { label:'Allow drivers to self-report issues', key:'allowDriverSelfReport' },
                  ].map(t => (
                    <div key={t.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize:13, color:'#90a1b9' }}>{t.label}</span>
                      <Toggle checked={settings[t.key]} onChange={()=>set(t.key,!settings[t.key])} />
                    </div>
                  ))}

                  <button onClick={handleSave} style={{ marginTop:16, width:'100%', padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#3b82f6,#2563eb)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all 0.2s' }}
                    onMouseEnter={e=>e.currentTarget.style.opacity='0.9'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                    {saved ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Saved!
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'Notifications' && (
                <div style={{ background:'#0d1526', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:18 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:16 }}>🔔 Notification Preferences</div>
                  {[
                    { label:'Trip Dispatch Alerts',       key:'notifTripDispatch',      desc:'Notified when a new trip is dispatched' },
                    { label:'Maintenance Overdue Alerts', key:'notifMaintenanceAlert',   desc:'Alert when vehicle maintenance is overdue' },
                    { label:'Safety Score Updates',       key:'notifSafetyScore',        desc:'Weekly safety score report for drivers' },
                    { label:'Fuel Anomaly Detection',     key:'notifFuelAnomaly',        desc:'Alert on unusual fuel consumption patterns' },
                  ].map(t => (
                    <div key={t.key} style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:500 }}>{t.label}</div>
                        <div style={{ fontSize:11, color:'#45556c', marginTop:2 }}>{t.desc}</div>
                      </div>
                      <Toggle checked={settings[t.key]} onChange={()=>set(t.key,!settings[t.key])} />
                    </div>
                  ))}
                  <button onClick={handleSave} style={{ marginTop:16, width:'100%', padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#3b82f6,#2563eb)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    {saved ? '✓ Saved!' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'Security' && (
                <div style={{ background:'#0d1526', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:18 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:16 }}>🔒 Security</div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:500 }}>Two-Factor Authentication</div>
                      <div style={{ fontSize:11, color:'#45556c', marginTop:2 }}>Add an extra layer of security</div>
                    </div>
                    <Toggle checked={settings.twoFactor} onChange={()=>set('twoFactor',!settings.twoFactor)} />
                  </div>
                  <div style={{ marginTop:14 }}>
                    <label style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'#90a1b9', display:'block', marginBottom:5 }}>Session Timeout</label>
                    <select className="input-field" style={{ background:'#1a2640', border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, padding:'10px 13px', fontSize:13 }} value={settings.sessionTimeout} onChange={e=>set('sessionTimeout',e.target.value)}>
                      {['15 minutes','30 minutes','1 hour','4 hours','Never'].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={{ marginTop:16, padding:'12px 14px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:10, fontSize:12, color:'#ef4444' }}>
                    ⚠️ Changing security settings will log out all active sessions.
                  </div>
                  <button onClick={handleSave} style={{ marginTop:14, width:'100%', padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#3b82f6,#2563eb)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    {saved ? '✓ Saved!' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT — RBAC Matrix */}
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <div>
                  <h2 style={{ fontSize:18, fontWeight:700, color:'#fff' }}>Role-Based Access (RBAC)</h2>
                  <p style={{ fontSize:12, color:'#62748e', marginTop:3 }}>Module-level permissions per role</p>
                </div>
                <div style={{ display:'flex', gap:10, fontSize:11, color:'#62748e', alignItems:'center' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#10b981' }} /> Full access
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#64748b' }} /> View only
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#2a3751' }} /> No access
                  </span>
                </div>
              </div>

              {/* RBAC table */}
              <div style={{ background:'#0d1526', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden', marginBottom:20 }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                      <th style={{ padding:'14px 20px', textAlign:'left', fontSize:11, textTransform:'uppercase', letterSpacing:'0.8px', color:'#45556c', width:'30%' }}>Role</th>
                      {MODULES.map(m => (
                        <th key={m} style={{ padding:'14px 12px', textAlign:'center', fontSize:11, textTransform:'uppercase', letterSpacing:'0.8px', color:'#45556c' }}>
                          <span style={{ padding:'2px 8px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', fontSize:10 }}>
                            {m === 'FuelExp' ? 'Fuel/Exp' : m}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RBAC_MATRIX.map((row, i) => (
                      <tr key={row.role} style={{ borderBottom: i < RBAC_MATRIX.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'16px 20px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:8, height:8, borderRadius:'50%', background:row.color, flexShrink:0 }} />
                            <span style={{ fontSize:14, fontWeight:600, color:'#e2e8f0' }}>{row.role}</span>
                          </div>
                        </td>
                        {MODULES.map(m => (
                          <td key={m} style={{ padding:'16px 12px', textAlign:'center' }}>
                            <AccessPill level={row.permissions[m]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Role summary cards */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {RBAC_MATRIX.map(role => (
                  <div key={role.role} style={{ background:'#0d1526', border:`1px solid rgba(255,255,255,0.07)`, borderLeft:`3px solid ${role.color}`, borderRadius:12, padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:role.color }} />
                      <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{role.role}</span>
                    </div>
                    <div style={{ fontSize:11, color:'#62748e', lineHeight:1.6 }}>
                      {role.desc.split('\n').map((line, i) => (
                        <div key={i}>
                          <span style={{ color: line.startsWith('Full') ? '#10b981' : '#64748b' }}>{line.split(':')[0]}:</span>
                          {' '}{line.split(':').slice(1).join(':').trim()}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Current user info */}
              {user && (
                <div style={{ marginTop:16, padding:'14px 18px', background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:12, display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                    {user.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{user.name}</div>
                    <div style={{ fontSize:11, color:'#3b82f6', marginTop:2 }}>Currently logged in as <strong>{user.role}</strong></div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      <AICopilot />
    </div>
  );
}

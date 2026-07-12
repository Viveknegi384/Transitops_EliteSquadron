'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import AICopilot from '../../components/AICopilot';
import { apiCall } from '../../utils/api';

// KPI Card component
function KpiCard({ value, label, sublabel, colorClass, iconBgColor, icon }) {
  return (
    <div className={`kpi-card ${colorClass} fade-in-up`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div
          className="kpi-icon-box"
          style={{ background: iconBgColor }}
        >
          {icon}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#62748e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </div>
      <div className="kpi-value" style={{ position: 'relative', zIndex: 1 }}>{value}</div>
      <div className="kpi-label" style={{ position: 'relative', zIndex: 1 }}>{label}</div>
      {sublabel && <div className="kpi-sublabel" style={{ position: 'relative', zIndex: 1 }}>{sublabel}</div>}
    </div>
  );
}

// Trip status badge helper
function TripStatusBadge({ status }) {
  const map = {
    'On Trip': 'trip-status trip-status-ontrip',
    'Completed': 'trip-status trip-status-completed',
    'Dispatched': 'trip-status trip-status-dispatched',
    'Draft': 'trip-status trip-status-draft',
  };
  return <span className={map[status] || 'trip-status trip-status-draft'}>{status}</span>;
}

// Donut ring SVG component
function DonutRing({ pct, size = 40, strokeWidth = 4, color = '#f59e0b' }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }

      const [dashRes, tripRes] = await Promise.all([
        apiCall('/analytics/dashboard'),
        apiCall('/trips?limit=10'),
      ]);
      setKpis(dashRes);
      setTrips(tripRes.trips || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData, router]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const tripStatusCounts = (kpis?.trips || []).reduce((acc, t) => {
    acc[t.status] = parseInt(t.count);
    return acc;
  }, {});

  const vehicleStatusCounts = (kpis?.vehicles || kpis?.drivers)
    ? {
        Available: 0, 'On Trip': 0, 'In Shop': 0, Retired: 0,
        ...(kpis?.vehicles_by_status || {})
      }
    : {};

  // parse vehicle status from kpis
  const vehicleStats = kpis ? {
    total: kpis.totalVehicles || 0,
    available: kpis.availableVehicles || 0,
    onTrip: kpis.activeVehicles || 0,
    inShop: kpis.inShop || 0,
    retired: (kpis.totalVehicles || 0) - (kpis.availableVehicles || 0) - (kpis.activeVehicles || 0) - (kpis.inShop || 0),
    utilization: kpis.utilization || 0,
  } : null;

  const filteredTrips = statusFilter
    ? trips.filter(t => t.status === statusFilter)
    : trips;

  const activeTrips = (kpis?.trips || []).reduce((acc, t) => {
    if (t.status === 'On Trip' || t.status === 'Dispatched') acc += parseInt(t.count);
    return acc;
  }, 0);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="main-content">
        <TopHeader />

        <div className="page-content">
          {/* Page heading row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>Fleet Overview</h1>
              <p style={{ fontSize: 14, color: '#62748e', marginTop: 4 }}>
                {today} · Live data ·{' '}
                <span style={{ color: '#00d492' }}>
                  {lastUpdated ? `Updated ${Math.round((Date.now() - lastUpdated) / 1000)}s ago` : 'Loading...'}
                </span>
              </p>
            </div>
            <button
              onClick={() => router.push('/dispatch')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(166deg, #f59e0b, #d97706)',
                border: 'none', borderRadius: 10, padding: '8px 16px',
                color: '#0b1120', fontWeight: 600, fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(245,158,11,0.3)',
                transition: 'all 0.18s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(245,158,11,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(245,158,11,0.3)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Dispatch
            </button>
          </div>

          {/* Filter row */}
          <div className="filter-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#90a1b9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span style={{ fontSize: 12, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#90a1b9' }}>Filters</span>
            </div>
            <select className="filter-dropdown" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="On Trip">On Trip</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Completed">Completed</option>
              <option value="Draft">Draft</option>
            </select>
            <select className="filter-dropdown">
              <option>All Vehicles</option>
            </select>
            <select className="filter-dropdown">
              <option>All Drivers</option>
            </select>
            <button
              onClick={() => setStatusFilter('')}
              style={{ background: 'none', border: 'none', color: '#62748e', fontSize: 12, cursor: 'pointer', marginLeft: 'auto', padding: '4px 8px' }}
            >
              Reset filters
            </button>
          </div>

          {/* KPI Cards */}
          {loading ? (
            <div className="kpi-grid" style={{ marginTop: 20 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="kpi-card kpi-card-blue" style={{ opacity: 0.4, minHeight: 152 }}>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, height: 26, width: 26 }} />
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 36, width: 60, marginTop: 12 }} />
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 12, width: 100, marginTop: 8 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="kpi-grid">
              <KpiCard
                value={kpis?.activeVehicles ?? '—'}
                label="Active Vehicles"
                sublabel="+4 since yesterday"
                colorClass="kpi-card-blue"
                iconBgColor="rgba(59,130,246,0.13)"
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                }
              />
              <KpiCard
                value={kpis?.availableVehicles ?? '—'}
                label="Available Vehicles"
                sublabel={vehicleStats ? `${Math.round((vehicleStats.available / vehicleStats.total) * 100)}% of active fleet` : ''}
                colorClass="kpi-card-green"
                iconBgColor="rgba(16,185,129,0.13)"
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                }
              />
              <KpiCard
                value={kpis?.inShop ?? '—'}
                label="Vehicles in Maintenance"
                sublabel="2 critical, 3 routine"
                colorClass="kpi-card-gold"
                iconBgColor="rgba(245,158,11,0.13)"
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                }
              />
              <KpiCard
                value={activeTrips || '—'}
                label="Active Trips"
                sublabel="3 pending dispatch"
                colorClass="kpi-card-purple"
                iconBgColor="rgba(139,92,246,0.13)"
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                }
              />
              <KpiCard
                value={`${kpis?.utilization ?? '—'}%`}
                label="Fleet Utilization"
                sublabel={`+3.2% vs last week`}
                colorClass="kpi-card-teal"
                iconBgColor="rgba(6,182,212,0.13)"
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                }
              />
            </div>
          )}

          {/* Bottom split: Recent Trips + Vehicle Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginTop: 16 }}>
            {/* Recent Trips table */}
            <div className="section-card">
              <div className="section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#90a1b9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Recent Trips</span>
                  <span className="live-badge pulse-dot">LIVE</span>
                </div>
                <button
                  onClick={() => router.push('/dispatch')}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, cursor: 'pointer' }}
                >
                  View all
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </button>
              </div>

              {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#45556c', fontSize: 14 }}>Loading trips...</div>
              ) : (
                <>
                  <table className="data-table" style={{ marginTop: 0 }}>
                    <thead>
                      <tr>
                        <th>Trip ID</th>
                        <th>Vehicle</th>
                        <th>Driver</th>
                        <th>Status</th>
                        <th>ETA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrips.slice(0, 8).map((trip, i) => (
                        <tr key={trip.id || i}>
                          <td className="trip-id">
                            {`TR-${String(trip.id || i + 1).padStart(3, '0')}`}
                          </td>
                          <td style={{ color: '#e2e8f0', fontSize: 13 }}>{trip.vehicle_reg || trip.reg_number || '—'}</td>
                          <td style={{ color: '#e2e8f0', fontSize: 13 }}>{trip.driver_name || trip.driver || '—'}</td>
                          <td>
                            <TripStatusBadge status={trip.status} />
                          </td>
                          <td style={{ color: '#62748e', fontSize: 13 }}>
                            {trip.status === 'Completed' ? '—' :
                             trip.status === 'Draft' ? 'Awaiting vehicle' :
                             trip.eta ? `${trip.eta} min` : '—'}
                          </td>
                        </tr>
                      ))}
                      {filteredTrips.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: '#45556c', padding: '24px 0' }}>
                            No trips found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 12, color: '#62748e' }}>
                      Showing {Math.min(filteredTrips.length, 8)} of {filteredTrips.length} trips today
                    </span>
                    <button
                      onClick={() => {
                        const csv = ['Trip ID,Vehicle,Driver,Status,ETA']
                          .concat(filteredTrips.map((t, i) => `TR-${String(t.id||i+1).padStart(3,'0')},${t.vehicle_reg||''},${t.driver_name||''},${t.status},${t.eta||''}`))
                          .join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = 'trips.csv'; a.click();
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#62748e', fontSize: 12, cursor: 'pointer' }}
                    >
                      Export CSV
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Vehicle Status panel */}
            <div className="section-card">
              <div className="section-header">
                <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Vehicle Status</span>
                <span style={{ fontSize: 12, color: '#62748e' }}>{vehicleStats?.total || '—'} total</span>
              </div>

              {/* Multi-color bar */}
              {vehicleStats && (
                <div style={{ height: 8, borderRadius: 99, overflow: 'hidden', display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[
                    { pct: vehicleStats.total > 0 ? (vehicleStats.available / vehicleStats.total) * 100 : 0, color: '#10b981' },
                    { pct: vehicleStats.total > 0 ? (vehicleStats.onTrip / vehicleStats.total) * 100 : 0, color: '#3b82f6' },
                    { pct: vehicleStats.total > 0 ? (vehicleStats.inShop / vehicleStats.total) * 100 : 0, color: '#f59e0b' },
                    { pct: vehicleStats.total > 0 ? (vehicleStats.retired / vehicleStats.total) * 100 : 0, color: '#ef4444' },
                  ].map((seg, i) => (
                    <div key={i} style={{ flex: seg.pct, background: seg.color, borderRadius: 99, minWidth: seg.pct > 0 ? 4 : 0 }} />
                  ))}
                </div>
              )}

              {/* Status rows */}
              {[
                { label: 'Available', color: '#10b981', count: vehicleStats?.available, total: vehicleStats?.total },
                { label: 'On Trip', color: '#3b82f6', count: vehicleStats?.onTrip, total: vehicleStats?.total },
                { label: 'In Shop', color: '#f59e0b', count: vehicleStats?.inShop, total: vehicleStats?.total },
                { label: 'Retired', color: '#ef4444', count: Math.max(0, vehicleStats?.retired || 0), total: vehicleStats?.total },
              ].map(({ label, color, count, total }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div className="status-bar-row" key={label} style={{ borderBottom: label === 'Retired' ? 'none' : undefined }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 14, color: '#90a1b9' }}>{label}</span>
                    <div className="status-bar-track">
                      <div className="status-bar-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#62748e', width: 28, textAlign: 'right' }}>{pct}%</span>
                    <span style={{ fontSize: 14, color: '#fff', fontWeight: 600, width: 20, textAlign: 'right' }}>{count ?? '—'}</span>
                  </div>
                );
              })}

              {/* Fleet Utilization ring */}
              <div style={{
                marginTop: 20,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: '14px 17px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#90a1b9' }}>Fleet Utilization</span>
                  <span style={{ fontSize: 12, color: '#00d492' }}>↑ +3.2% vs last week</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ position: 'relative', width: 40, height: 40 }}>
                    <DonutRing pct={kpis?.utilization || 0} color="#f59e0b" />
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: '#fff', fontWeight: 700,
                    }}>
                      {kpis?.utilization || 0}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{kpis?.utilization || 0}%</div>
                    <div style={{ fontSize: 10, color: '#62748e' }}>Industry avg: 73%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AICopilot />
    </div>
  );
}

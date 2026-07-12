'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import Sidebar from '../../components/Sidebar';
import TopHeader from '../../components/TopHeader';
import AICopilot from '../../components/AICopilot';
import { apiCall } from '../../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Metric card matching Figma (top stripe + glow)
function MetricCard({ value, label, sublabel, accent, icon }) {
  return (
    <div style={{
      borderRadius: 14, padding: '18px 20px',
      background: 'linear-gradient(160deg, #111827 0%, #0f1e33 100%)',
      border: `1px solid rgba(255,255,255,0.07)`,
      position: 'relative', overflow: 'hidden',
      boxShadow: `0 0 0 1px ${accent}33, 0 8px 24px rgba(0,0,0,0.3)`,
    }}>
      {/* Top accent line */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      {/* Glow circle */}
      <div style={{ position:'absolute', top:-16, right:-16, width:64, height:64, borderRadius:'50%', background:accent, opacity:0.25, filter:'blur(22px)', pointerEvents:'none' }} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative', zIndex:1 }}>
        <span style={{ fontSize:18, lineHeight:1 }}>{icon}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
        </svg>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing:'-1px', marginTop: 10, position:'relative', zIndex:1 }}>{value}</div>
      <div style={{ fontSize: 11, textTransform:'uppercase', letterSpacing:'0.8px', color: accent, marginTop: 2, position:'relative', zIndex:1 }}>{label}</div>
      {sublabel && <div style={{ fontSize: 11, color:'#45556c', marginTop: 4, position:'relative', zIndex:1 }}>{sublabel}</div>}
    </div>
  );
}

// Cost bar for top costliest vehicles
function CostBar({ name, cost, max, color }) {
  const pct = Math.min(100, (cost / (max || 1)) * 100);
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <span style={{ fontSize:13, color:'#e2e8f0', fontWeight:500 }}>{name}</span>
        <span style={{ fontSize:13, color:'#fff', fontWeight:700 }}>₹{cost.toLocaleString('en-IN')}</span>
      </div>
      <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:99, transition:'width 0.8s ease' }} />
      </div>
    </div>
  );
}

const COST_COLORS = ['#ef4444','#f59e0b','#3b82f6','#10b981','#8b5cf6'];

export default function AnalyticsPage() {
  const router = useRouter();
  const [reports, setReports] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      const [repRes, kpiRes] = await Promise.all([
        apiCall('/analytics/reports'),
        apiCall('/analytics/dashboard'),
      ]);
      setReports(repRes);
      setKpis(kpiRes);
    } catch (err) {
      if (err.message?.includes('401')) router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Build fake monthly revenue from cost data (until backend has time-series)
  const monthlyCosts = reports?.operational_costs || [];
  const totalOpCost  = monthlyCosts.reduce((s, v) => s + (parseFloat(v.total_operational_cost) || 0), 0);
  const totalFuel    = monthlyCosts.reduce((s, v) => s + (parseFloat(v.total_fuel_cost) || 0), 0);
  const totalMaint   = monthlyCosts.reduce((s, v) => s + (parseFloat(v.total_maintenance_cost) || 0), 0);
  const rawAvgROI    = reports?.roi_analysis?.length
    ? (reports.roi_analysis.reduce((s, v) => s + (parseFloat(v.roi) || 0), 0) / reports.roi_analysis.length)
    : null;
  const avgROI       = rawAvgROI !== null ? (Math.abs(rawAvgROI) < 0.05 ? '0.0' : rawAvgROI.toFixed(1)) : '—';
  
  const utilization  = kpis?.utilization ?? '—';
  const fuelEff      = kpis?.fuelEfficiency ?? '0.0';

  // Top costliest vehicles (sorted)
  const topVehicles = [...monthlyCosts]
    .sort((a, b) => parseFloat(b.total_operational_cost) - parseFloat(a.total_operational_cost))
    .slice(0, 5);
  const maxCost = topVehicles[0]?.total_operational_cost || 1;

  // Revenue by Vehicle chart data
  const vehicleNames = reports?.roi_analysis?.map(v => v.reg_number) || [];
  const vehicleRevenues = reports?.roi_analysis?.map(v => parseFloat(v.total_revenue) || 0) || [];

  const barData = {
    labels: vehicleNames.length ? vehicleNames : ['No Data'],
    datasets: [{
      label: 'Revenue (₹)',
      data: vehicleRevenues.length ? vehicleRevenues : [0],
      backgroundColor: 'rgba(59,130,246,0.7)',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0d1526',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#90a1b9',
        bodyColor: '#fff',
        callbacks: { label: ctx => `₹${ctx.raw.toLocaleString('en-IN')}` },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#45556c', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#45556c', font: { size: 11 }, callback: v => `₹${(v/1000).toFixed(0)}k` } },
    },
  };

  // Cost breakdown percentages
  const fuelPct = totalOpCost > 0 ? Math.round((totalFuel / totalOpCost) * 100) : 60;
  const maintPct = totalOpCost > 0 ? Math.round((totalMaint / totalOpCost) * 100) : 35;
  const miscPct = Math.max(0, 100 - fuelPct - maintPct);

  const handleExportPDF = () => window.print();
  const handleExportCSV = () => {
    const rows = [['Vehicle','Total Cost','Fuel Cost','Maint Cost','ROI'],...monthlyCosts.map(v=>[v.reg_number,v.total_operational_cost,v.total_fuel_cost,v.total_maintenance_cost,'—'])].map(r=>r.join(',')).join('\n');
    const blob = new Blob([rows], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='analytics.csv'; a.click();
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <TopHeader />
        <div className="page-content">

          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:24 }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:700, color:'#fff' }}>Reports & Analytics</h1>
              <p style={{ fontSize:12, color:'#62748e', marginTop:3 }}>ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost</p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleExportPDF} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#90a1b9', fontSize:13, cursor:'pointer' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export PDF
              </button>
              <button onClick={handleExportCSV} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#90a1b9', fontSize:13, cursor:'pointer' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* KPI metric cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
            <MetricCard value={`${fuelEff} km/l`} label="Fuel Efficiency" sublabel="+0.6 vs last month" accent="#3b82f6" icon="⛽" />
            <MetricCard value={`${utilization}%`}  label="Fleet Utilization" sublabel="+3.2% vs last week" accent="#10b981" icon="📊" />
            <MetricCard value={`₹${totalOpCost.toLocaleString('en-IN')}`} label="Operational Cost" sublabel="Fuel + Maintenance" accent="#f59e0b" icon="💰" />
            <MetricCard value={`${avgROI}%`} label="Vehicle ROI" sublabel="1.0 industry avg (7%)" accent="#8b5cf6" icon="📈" />
          </div>

          {/* Chart + Right panel */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16 }}>
            {/* Monthly Revenue bar chart */}
            <div className="section-card" style={{ padding:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Revenue by Vehicle</div>
                  <div style={{ fontSize:11, color:'#62748e', marginTop:2 }}>FY 2026 — All vehicles</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#3b82f6' }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:'#3b82f6' }} />
                  Revenue (₹)
                </div>
              </div>
              {loading ? (
                <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'#45556c', fontSize:14 }}>Loading chart...</div>
              ) : (
                <div style={{ height:220 }}>
                  <Bar data={barData} options={chartOptions} />
                </div>
              )}
            </div>

            {/* Right: Top costliest + breakdown */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="section-card" style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:14 }}>Top Costliest Vehicles</div>
                {loading ? (
                  <div style={{ color:'#45556c', fontSize:13 }}>Loading...</div>
                ) : topVehicles.length === 0 ? (
                  <div style={{ color:'#45556c', fontSize:13 }}>No data yet</div>
                ) : (
                  topVehicles.map((v, i) => (
                    <CostBar
                      key={v.reg_number || i}
                      name={v.reg_number || `Vehicle ${i+1}`}
                      cost={parseFloat(v.total_operational_cost) || 0}
                      max={parseFloat(maxCost)}
                      color={COST_COLORS[i] || '#3b82f6'}
                    />
                  ))
                )}

                {/* Cost breakdown */}
                <div style={{ marginTop:16, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'1px', color:'#45556c', marginBottom:10 }}>Cost Breakdown</div>
                  {[
                    { label:'Fuel',        pct:fuelPct,  color:'#f59e0b' },
                    { label:'Maintenance', pct:maintPct, color:'#ef4444' },
                    { label:'Misc / Toll', pct:miscPct,  color:'#3b82f6' },
                  ].map(b => (
                    <div key={b.label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:b.color, flexShrink:0 }} />
                      <span style={{ fontSize:12, color:'#90a1b9', flex:1 }}>{b.label}</span>
                      <div style={{ width:60, height:3, background:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ width:`${b.pct}%`, height:'100%', background:b.color, borderRadius:99 }} />
                      </div>
                      <span style={{ fontSize:11, color:'#62748e', minWidth:28, textAlign:'right' }}>{b.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle ROI table */}
          {reports?.roi_analysis?.length > 0 && (
            <div className="section-card" style={{ padding:0, overflow:'hidden', marginTop:16 }}>
              <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Vehicle ROI Analysis</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                    <th style={{ padding:'12px 20px' }}>Vehicle</th>
                    <th>Acquisition Cost</th>
                    <th>Fuel Cost</th>
                    <th>Maint. Cost</th>
                    <th>Total Op. Cost</th>
                    <th>ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.roi_analysis.map((v, i) => (
                    <tr key={v.reg_number || i}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.025)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                      style={{ transition:'background 0.15s' }}>
                      <td style={{ padding:'12px 20px' }}><span style={{ fontFamily:'monospace', fontSize:13, fontWeight:600, color:'#3b82f6' }}>{v.reg_number}</span></td>
                      <td style={{ fontSize:13, color:'#90a1b9' }}>₹{parseFloat(v.acquisition_cost||0).toLocaleString('en-IN')}</td>
                      <td style={{ fontSize:13, color:'#f59e0b' }}>₹{parseFloat(v.total_fuel_cost||0).toLocaleString('en-IN')}</td>
                      <td style={{ fontSize:13, color:'#ef4444' }}>₹{parseFloat(v.total_maintenance_cost||0).toLocaleString('en-IN')}</td>
                      <td style={{ fontSize:13, color:'#fff', fontWeight:600 }}>₹{parseFloat(v.total_operational_cost||0).toLocaleString('en-IN')}</td>
                      <td>
                        <span style={{ fontSize:13, fontWeight:700, color: parseFloat(v.roi) >= 0 ? '#10b981' : '#ef4444' }}>
                          {parseFloat(v.roi||0).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
      <AICopilot />
    </div>
  );
}

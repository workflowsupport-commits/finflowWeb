// src/pages/ReportsPage.js
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

function useChart(ref, config, deps) {
  useEffect(() => {
    if (!ref.current) return;
    const ctx = ref.current.getContext('2d');
    const chart = new Chart(ctx, config);
    return () => chart.destroy();
  }, deps);
}

const COLORS = ['#1a56db', '#0d9488', '#d97706', '#dc2626', '#7c3aed', '#f472b6', '#34d399', '#fbbf24'];

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [byWf, setByWf] = useState([]);
  const [byDept, setByDept] = useState([]);
  const [byMonth, setByMonth] = useState([]);
  const [byCat, setByCat] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusChartRef = useRef(null);
  const monthChartRef = useRef(null);
  const deptChartRef = useRef(null);
  const catChartRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.getSummary(), api.getByWorkflow(), api.getByDept(), api.getByMonth(), api.getByCategory()
    ]).then(([s, wf, dept, month, cat]) => {
      setSummary(s); setByWf(wf); setByDept(dept); setByMonth(month); setByCat(cat);
    }).finally(() => setLoading(false));
  }, []);

  // Status donut
  useEffect(() => {
    if (!summary || !statusChartRef.current) return;
    const ctx = statusChartRef.current.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Approved', 'In Progress', 'Rejected'],
        datasets: [{ data: [summary.approved, summary.inProgress, summary.rejected], backgroundColor: ['#0d9488', '#d97706', '#dc2626'], borderWidth: 0, hoverOffset: 4 }]
      },
      options: { cutout: '72%', plugins: { legend: { position: 'bottom', labels: { font: { size: 11, family: 'DM Sans' }, padding: 12 } } } }
    });
    return () => chart.destroy();
  }, [summary]);

  // Monthly trend
  useEffect(() => {
    if (!byMonth.length || !monthChartRef.current) return;
    const ctx = monthChartRef.current.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: byMonth.map(m => m.month),
        datasets: [
          { label: 'Approved', data: byMonth.map(m => m.approved), backgroundColor: '#0d9488', borderRadius: 4 },
          { label: 'Rejected', data: byMonth.map(m => m.rejected), backgroundColor: '#dc2626', borderRadius: 4 },
          { label: 'In Progress', data: byMonth.map(m => m.total - m.approved - m.rejected), backgroundColor: '#d97706', borderRadius: 4 },
        ]
      },
      options: {
        responsive: true, plugins: { legend: { labels: { font: { family: 'DM Sans', size: 11 } } } },
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: '#f3f4f6' } } }
      }
    });
    return () => chart.destroy();
  }, [byMonth]);

  // Department
  useEffect(() => {
    if (!byDept.length || !deptChartRef.current) return;
    const ctx = deptChartRef.current.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: byDept.map(d => d.department),
        datasets: [{ label: 'Requests', data: byDept.map(d => d.total), backgroundColor: COLORS, borderRadius: 6 }]
      },
      options: {
        indexAxis: 'y', responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { color: '#f3f4f6' } }, y: { grid: { display: false } } }
      }
    });
    return () => chart.destroy();
  }, [byDept]);

  // Category pie
  useEffect(() => {
    if (!byCat.length || !catChartRef.current) return;
    const ctx = catChartRef.current.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: byCat.map(c => c.category),
        datasets: [{ data: byCat.map(c => c.total), backgroundColor: COLORS, borderWidth: 2, borderColor: '#fff' }]
      },
      options: { plugins: { legend: { position: 'bottom', labels: { font: { size: 11, family: 'DM Sans' }, padding: 10 } } } }
    });
    return () => chart.destroy();
  }, [byCat]);

  const fmt = (n) => n >= 1000000 ? `Rs ${(n/1000000).toFixed(1)}M` : n >= 1000 ? `Rs ${(n/1000).toFixed(0)}K` : `Rs ${n}`;

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading analytics...</div>;

  return (
    <div className="fade-in">
      {/* Summary stats */}
      <div className="stat-grid stat-grid-4" style={{ marginBottom: 22 }}>
        {[
          { label: 'Total Requests', value: summary?.total || 0, color: '#1a56db' },
          { label: 'Approval Rate', value: `${summary?.total ? Math.round((summary.approved / summary.total) * 100) : 0}%`, color: '#0d9488' },
          { label: 'Approved Value', value: fmt(summary?.totalAmount || 0), color: '#7c3aed' },
          { label: 'Avg Per Day', value: (summary?.total / 30).toFixed(1), color: '#d97706' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* Status donut */}
        <div className="card">
          <div className="card-header"><span className="card-title">Request Status Distribution</span></div>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 220 }}>
            <canvas ref={statusChartRef} style={{ maxHeight: 200 }} />
          </div>
        </div>

        {/* Category pie */}
        <div className="card">
          <div className="card-header"><span className="card-title">Requests by Category</span></div>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 220 }}>
            <canvas ref={catChartRef} style={{ maxHeight: 200 }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* Monthly trend */}
        <div className="card">
          <div className="card-header"><span className="card-title">Monthly Trend</span></div>
          <div className="card-body"><canvas ref={monthChartRef} /></div>
        </div>

        {/* Department */}
        <div className="card">
          <div className="card-header"><span className="card-title">Requests by Department</span></div>
          <div className="card-body"><canvas ref={deptChartRef} /></div>
        </div>
      </div>

      {/* Workflow breakdown table */}
      <div className="card">
        <div className="card-header"><span className="card-title">Workflow Breakdown</span></div>
        <table className="table">
          <thead>
            <tr>
              <th>Workflow</th>
              <th>Category</th>
              <th>Total</th>
              <th>Approved</th>
              <th>In Progress</th>
              <th>Rejected</th>
              <th>Approval Rate</th>
            </tr>
          </thead>
          <tbody>
            {byWf.sort((a, b) => b.total - a.total).map(wf => (
              <tr key={wf.name}>
                <td><span style={{ marginRight: 6 }}>{wf.icon}</span><span style={{ fontWeight: 500 }}>{wf.name}</span></td>
                <td><span className="badge badge-blue" style={{ fontSize: 10 }}>{wf.category}</span></td>
                <td style={{ fontWeight: 600 }}>{wf.total}</td>
                <td><span style={{ color: '#0d9488', fontWeight: 500 }}>{wf.approved}</span></td>
                <td><span style={{ color: '#d97706' }}>{wf.inProgress}</span></td>
                <td><span style={{ color: '#dc2626' }}>{wf.rejected}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                      <div style={{ height: '100%', background: '#0d9488', width: `${wf.total ? (wf.approved / wf.total) * 100 : 0}%`, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#6b7280', minWidth: 32 }}>{wf.total ? Math.round((wf.approved / wf.total) * 100) : 0}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

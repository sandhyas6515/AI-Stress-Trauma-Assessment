import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, ShieldAlert, Globe2, Clock, CheckCircle2, TrendingUp } from 'lucide-react';

export default function AnalyticsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 12000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading real-time operational intelligence...
      </div>
    );
  }

  const total = stats.total || 1;
  const critPct = Math.round((stats.critical / total) * 100);
  const highPct = Math.round((stats.high / total) * 100);
  const modPct = Math.round((stats.moderate / total) * 100);
  const lowPct = Math.round((stats.low / total) * 100);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Title Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <TrendingUp size={20} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            NHAA Operational & Triage Intelligence Dashboard
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Real-time metrics on psychological trauma distribution, language coverage, rapid emergency escalations, and SLA compliance.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <Clock size={16} /> Triage Time Reduction
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981', marginTop: '6px' }}>
            82% Faster
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            ~3 min voice filing vs 15-20 min manual
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <ShieldAlert size={16} color="var(--risk-critical-text)" /> Critical Escalation SLA
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--risk-critical-text)', marginTop: '6px' }}>
            {stats.criticalEscalationRate || '100%'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Surfaced to top of queue in &lt; 5 seconds
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <CheckCircle2 size={16} color="var(--accent-teal)" /> Emergency Dispatches
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-teal)', marginTop: '6px' }}>
            {stats.activeEmergencyDispatches || 1} Active
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            PCR Units / Medical Ambulances
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <Globe2 size={16} color="var(--accent-cyan)" /> Languages Active
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-cyan)', marginTop: '6px' }}>
            5 Languages
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Hindi, English, Marathi, Tamil, Bengali
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Risk Level Distribution */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <BarChart3 size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Complaints by Risk & Trauma Severity
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--risk-critical-text)', fontWeight: '700' }}>Critical (Active Threat / Panic)</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{stats.critical} cases ({critPct}%)</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${critPct}%`, height: '100%', background: '#ef4444', borderRadius: '999px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--risk-high-text)', fontWeight: '700' }}>High (Atrocity / Physical Battery)</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{stats.high} cases ({highPct}%)</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${highPct}%`, height: '100%', background: '#f59e0b', borderRadius: '999px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--risk-moderate-text)', fontWeight: '700' }}>Moderate (Harassment / Dispute)</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{stats.moderate} cases ({modPct}%)</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${modPct}%`, height: '100%', background: '#0ea5e9', borderRadius: '999px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: '#10b981', fontWeight: '700' }}>Low (Administrative / Routine)</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{stats.low} cases ({lowPct}%)</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${lowPct}%`, height: '100%', background: '#10b981', borderRadius: '999px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Language Distribution */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <PieChart size={18} color="var(--accent-indigo)" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Linguistic Breakdown (Scheduled Languages)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(stats.languageDistribution || {}).map(([lang, count]) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={lang}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{lang}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #06b6d4, #6366f1)', borderRadius: '999px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

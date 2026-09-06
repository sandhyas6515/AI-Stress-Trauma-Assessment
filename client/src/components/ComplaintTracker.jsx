import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, Clock, AlertCircle, ShieldCheck, UserCheck, FileText, ArrowRight } from 'lucide-react';

const STAGES = [
  { id: 'Submitted', label: 'Submitted', desc: 'Voice testimony logged & analyzed by AI' },
  { id: 'Under Review', label: 'Under Review', desc: 'Triage verification by Nodal Officer' },
  { id: 'Action Assigned', label: 'Action Assigned', desc: 'Jurisdictional police/aid team allocated' },
  { id: 'In Progress', label: 'In Progress', desc: 'Ground verification & safety measures active' },
  { id: 'Resolved', label: 'Resolved / Closed', desc: 'Inquiry complete & legal action taken' }
];

export default function ComplaintTracker({ initialTicketId = '' }) {
  const [ticketQuery, setTicketQuery] = useState(initialTicketId);
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialTicketId) {
      setTicketQuery(initialTicketId);
      fetchComplaint(initialTicketId);
    }
  }, [initialTicketId]);

  const fetchComplaint = async (tId) => {
    if (!tId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/complaints/${encodeURIComponent(tId.trim())}`);
      const data = await res.json();
      if (data.success) {
        setComplaint(data.data);
      } else {
        setError(data.error || 'Ticket not found');
        setComplaint(null);
      }
    } catch (err) {
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaint(ticketQuery);
  };

  const getStageIndex = (status) => {
    const idx = STAGES.findIndex(s => s.id.toLowerCase() === (status || '').toLowerCase());
    return idx === -1 ? 0 : idx;
  };

  const currentStageIndex = complaint ? getStageIndex(complaint.status) : 0;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Search Header Card */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Track Complaint & Grievance Status
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Enter your unique NHAA Ticket ID to inspect live progress, assigned nodal officers, and official action logs.
        </p>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', maxWidth: '580px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
            <input
              type="text"
              placeholder="e.g. NHAA-2026-849201"
              value={ticketQuery}
              onChange={(e) => setTicketQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px 11px 40px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search Ticket'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '14px', color: 'var(--risk-critical-text)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </div>

      {/* Complaint Detail & Progress Stepper */}
      {complaint && (
        <div className="glass-card" style={{ padding: '32px' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '20px', marginBottom: '28px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                TICKET IDENTIFIER
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                {complaint.ticketId}
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Registered on {new Date(complaint.createdAt).toLocaleString()}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                CURRENT STATUS
              </div>
              <span className={`status-pill ${
                complaint.riskAssessment?.riskLevel === 'Critical' ? 'badge-critical' : 'badge-high'
              }`} style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                {complaint.status}
              </span>
            </div>
          </div>

          {/* 5-Stage Stepper */}
          <div style={{ marginBottom: '36px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '18px' }}>
              Progress Stages
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', position: 'relative' }}>
              {STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div
                    key={stage.id}
                    style={{
                      background: isCurrent ? 'rgba(6, 182, 212, 0.12)' : isCompleted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isCurrent ? 'var(--accent-cyan)' : isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      {isCompleted ? (
                        <CheckCircle2 size={16} color="#10b981" />
                      ) : isCurrent ? (
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
                      ) : (
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                      )}
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: isCurrent ? 'var(--accent-cyan)' : isCompleted ? '#10b981' : 'var(--text-muted)' }}>
                        {stage.label}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      {stage.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assigned Officer & Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: 'var(--radius-md)', padding: '18px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <UserCheck size={18} color="var(--accent-teal)" />
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Assigned Nodal Officer
                </span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {complaint.assignedOfficer || 'Auto-Allocated to District Atrocity Cell'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Jurisdiction: {complaint.entities?.location || 'District Mirzapur'}
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: 'var(--radius-md)', padding: '18px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldCheck size={18} color="var(--accent-indigo)" />
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Safety & Support Directives
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                {complaint.riskAssessment?.urgencyLabel || 'Priority Investigation Active'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Action Window: {complaint.riskAssessment?.actionWindow || 'Immediate'}
              </div>
            </div>
          </div>

          {/* Chronological Action Logs */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>
              Official Action Log & Timeline
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(complaint.actionLogs || []).map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '3px solid var(--accent-cyan)'
                  }}
                >
                  <Clock size={16} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {log.officer}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {log.action}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, Clock, AlertCircle, ShieldCheck, UserCheck, Phone, Shield } from 'lucide-react';

const STAGES = [
  { id: 'Submitted', label: 'Submitted', desc: 'Voice testimony logged & trauma-triaged' },
  { id: 'Under Review', label: 'Under Review', desc: 'Preliminary triage audit by Nodal Officer' },
  { id: 'Action Assigned', label: 'Action Assigned', desc: 'Atrocity Cell & support units allocated' },
  { id: 'In Progress', label: 'In Progress', desc: 'Ground verification & witness safety active' },
  { id: 'Resolved', label: 'Resolved', desc: 'Investigation complete & legal remedy enforced' }
];

export default function ComplaintTracker({ initialTicketId = '' }) {
  const [ticketQuery, setTicketQuery] = useState(initialTicketId);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialTicketId) {
      setTicketQuery(initialTicketId);
    }
  }, [initialTicketId]);

  /**
   * Secure victim tracking: POST /api/track-complaint with ticketId + phone.
   * Returns only safe fields — no risk scores, transcripts, or accused info.
   */
  const fetchComplaint = async (tId, phone) => {
    if (!tId.trim() || !phone.trim()) {
      setError('Please enter both your Ticket ID and registered phone number.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/track-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: tId.trim(), phone: phone.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setComplaint(data.data);
      } else {
        setError(data.error || 'No matching complaint found.');
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
    fetchComplaint(ticketQuery, phoneQuery);
  };

  const getStageIndex = (status) => {
    const idx = STAGES.findIndex(s => s.id.toLowerCase() === (status || '').toLowerCase());
    return idx === -1 ? 0 : idx;
  };

  const currentStageIndex = complaint ? getStageIndex(complaint.status) : 0;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Search Header Card */}
      <div className="glass-card" style={{ padding: '28px 32px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Track Grievance Docket & Inquiry Progress
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '22px' }}>
          Enter your official NHAA Ticket ID and registered phone number to check your complaint status and assigned officer updates.
        </p>

        {/* Security Info */}
        <div style={{
          background: 'var(--bg-surface-subtle)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-xs)',
          padding: '10px 14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Shield size={15} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Privacy Protected:</strong> Your phone number is verified against the complaint record. No data is shared without verification.
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
          
          {/* Ticket ID Input */}
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
            <input
              id="tracker-ticket-id"
              type="text"
              placeholder="Ticket ID (e.g. NHAA-2026-849201)"
              value={ticketQuery}
              onChange={(e) => setTicketQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px 11px 40px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none',
                fontWeight: '600'
              }}
            />
          </div>

          {/* Phone Number Input */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                id="tracker-phone"
                type="tel"
                placeholder="Registered Phone (e.g. +91 98765 43210)"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  fontWeight: '600'
                }}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
              {loading ? 'Verifying...' : 'Search Docket'}
            </button>
          </div>
        </form>

        {error && (
          <div style={{ marginTop: '14px', color: 'var(--risk-critical-text)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </div>

      {/* Complaint Status Display — ONLY safe fields */}
      {complaint && (
        <div className="glass-card" style={{ padding: '34px' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px', marginBottom: '28px' }}>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                TICKET IDENTIFIER
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-blue)' }}>
                {complaint.ticketId}
              </h3>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Registered on {new Date(complaint.createdAt).toLocaleString()}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                CURRENT STAGE
              </div>
              <span className="status-pill badge-high" style={{ fontSize: '0.86rem', marginTop: '6px' }}>
                {complaint.status}
              </span>
            </div>
          </div>

          {/* 5-Stage Stepper */}
          <div style={{ marginBottom: '36px' }}>
            <h4 style={{ fontSize: '0.96rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '18px' }}>
              Statutory Grievance Stages
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', position: 'relative' }}>
              {STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div
                    key={stage.id}
                    style={{
                      background: isCurrent ? 'var(--risk-moderate-bg)' : isCompleted ? 'var(--risk-low-bg)' : 'var(--bg-surface-subtle)',
                      border: `1px solid ${isCurrent ? 'var(--primary-blue)' : isCompleted ? 'var(--risk-low-border)' : 'var(--border-glass)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      {isCompleted ? (
                        <CheckCircle2 size={16} color="var(--risk-low-solid)" />
                      ) : isCurrent ? (
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary-blue)' }} />
                      ) : (
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--text-muted)', opacity: 0.4 }} />
                      )}
                      <span style={{ fontSize: '0.84rem', fontWeight: '700', color: isCurrent ? 'var(--primary-blue)' : isCompleted ? 'var(--risk-low-solid)' : 'var(--text-muted)' }}>
                        {stage.label}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {stage.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assigned Officer & Last Update — safe fields only */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: '18px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <UserCheck size={18} color="var(--accent-emerald)" />
                <span style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Designated Nodal Officer
                </span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {complaint.assignedOfficer || 'Auto-Allocated to District Atrocity Cell'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: '18px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Clock size={18} color="var(--primary-blue)" />
                <span style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Last Updated
                </span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {new Date(complaint.lastUpdated).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Officer Message — if any */}
          {complaint.officerMessage && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.96rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
                Latest Officer Update
              </h4>
              <div style={{
                padding: '14px 18px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-xs)',
                borderLeft: '3px solid var(--primary-blue)',
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.5'
              }}>
                {complaint.officerMessage}
              </div>
            </div>
          )}

          {/* Privacy footer */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldCheck size={14} color="var(--accent-emerald)" />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              For your privacy, only status and officer updates are shown. Full case details are accessible only to authorized investigating officials.
            </span>
          </div>
        </div>
      )}

    </div>
  );
}

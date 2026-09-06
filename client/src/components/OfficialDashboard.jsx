import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Filter, Search, Eye, EyeOff, CheckCircle, Clock, User, Phone, MapPin, Activity, ChevronRight, X, Send, Ambulance, PhoneCall, FileText } from 'lucide-react';

export default function OfficialDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [maskPii, setMaskPii] = useState(true);

  // Officer action form inside modal
  const [newStatus, setNewStatus] = useState('');
  const [officerNote, setOfficerNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints');
      const data = await res.json();
      if (data.success) {
        setComplaints(data.data);
      }
    } catch (err) {
      console.error('Error fetching complaints queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCase = (c) => {
    setSelectedCase(c);
    setNewStatus(c.status);
    setOfficerNote('');
  };

  const handleUpdateStatus = async (statusOverride = null, customNote = null) => {
    if (!selectedCase) return;
    setIsUpdating(true);
    const targetStatus = statusOverride || newStatus;
    const noteToSend = customNote || officerNote;

    try {
      const res = await fetch(`/api/complaints/${selectedCase.ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          officerName: 'Senior Nodal Officer (Atrocity Cell)',
          note: noteToSend,
          newLog: noteToSend ? `Officer Action: ${noteToSend}` : `Status transitioned to ${targetStatus}.`
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedCase(data.data);
        setOfficerNote('');
        fetchComplaints();
      }
    } catch (err) {
      console.error('Error updating case:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickEmergencyDispatch = () => {
    handleUpdateStatus('Action Assigned', 'EMERGENCY DISPATCH TRIGGERED: PCR Patrol Unit 14 and medical team dispatched to complainant location.');
  };

  // Filter complaints
  const filtered = complaints.filter(c => {
    if (filterRisk !== 'ALL' && c.riskAssessment?.riskLevel?.toUpperCase() !== filterRisk) return false;
    if (filterStatus !== 'ALL' && c.status?.toUpperCase() !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = c.ticketId?.toLowerCase().includes(q);
      const matchName = c.victim?.name?.toLowerCase().includes(q);
      const matchSummary = c.autoSummary?.toLowerCase().includes(q);
      const matchLoc = c.entities?.location?.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchSummary && !matchLoc) return false;
    }
    return true;
  });

  const criticalCount = complaints.filter(c => c.riskAssessment?.riskLevel === 'Critical').length;
  const highCount = complaints.filter(c => c.riskAssessment?.riskLevel === 'High').length;
  const activeCount = complaints.filter(c => c.status !== 'Resolved').length;

  const getRiskBadgeClass = (level) => {
    switch (level) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Moderate': return 'badge-moderate';
      default: return 'badge-low';
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Critical Alert Banner if any Critical complaints */}
      {criticalCount > 0 && (
        <div className="glass-card critical-pulse-box" style={{ padding: '16px 24px', marginBottom: '24px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--risk-critical-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <ShieldAlert size={28} color="var(--risk-critical-text)" />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--risk-critical-text)' }}>
                CRITICAL EMERGENCY ALERT ({criticalCount} Urgent Cases Queued)
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Active physical danger or acute trauma acoustic biomarkers detected. Immediate Nodal response required within 15 mins.
              </div>
            </div>
          </div>
          <button
            onClick={() => setFilterRisk('CRITICAL')}
            className="btn-danger"
            style={{ fontSize: '0.82rem', padding: '8px 16px' }}
          >
            Show Critical Cases Only
          </button>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Complaints Received
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
            {complaints.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
            Live Triage Stream Active
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--risk-critical-text)', textTransform: 'uppercase' }}>
            Critical Red Alerts
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--risk-critical-text)', marginTop: '4px' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Sub-15m Rapid Response SLA
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--risk-high-text)', textTransform: 'uppercase' }}>
            High Priority Inquiries
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--risk-high-text)', marginTop: '4px' }}>
            {highCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            2-Hour Atrocity Cell Priority
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981', textTransform: 'uppercase' }}>
            Avg AI Triage Time
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
            3.8s
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            vs 15-20 min manual entry
          </div>
        </div>
      </div>

      {/* Queue Filter and Controls Bar */}
      <div className="glass-card" style={{ padding: '18px 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
            <input
              type="text"
              placeholder="Search Ticket, Victim, Accused, Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Filters & PII Masking Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Risk Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>RISK:</span>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem'
                }}
              >
                <option value="ALL" style={{ background: '#1e293b' }}>All Risks</option>
                <option value="CRITICAL" style={{ background: '#1e293b' }}>Critical Only</option>
                <option value="HIGH" style={{ background: '#1e293b' }}>High Only</option>
                <option value="MODERATE" style={{ background: '#1e293b' }}>Moderate Only</option>
                <option value="LOW" style={{ background: '#1e293b' }}>Low Only</option>
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>STATUS:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem'
                }}
              >
                <option value="ALL" style={{ background: '#1e293b' }}>All Statuses</option>
                <option value="SUBMITTED" style={{ background: '#1e293b' }}>Submitted</option>
                <option value="UNDER REVIEW" style={{ background: '#1e293b' }}>Under Review</option>
                <option value="ACTION ASSIGNED" style={{ background: '#1e293b' }}>Action Assigned</option>
                <option value="IN PROGRESS" style={{ background: '#1e293b' }}>In Progress</option>
                <option value="RESOLVED" style={{ background: '#1e293b' }}>Resolved</option>
              </select>
            </div>

            {/* PII Masking Switch (§7.3 & §12) */}
            <button
              id="pii-toggle-btn"
              onClick={() => setMaskPii(!maskPii)}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              title="Toggle Victim PII Masking per Privacy Mandate"
            >
              {maskPii ? <EyeOff size={14} color="#f59e0b" /> : <Eye size={14} color="#10b981" />}
              <span>{maskPii ? 'PII Masked' : 'PII Visible'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Ticket ID</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Triage Priority</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Complainant</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Incident Summary</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Language</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const risk = c.riskAssessment || {};
                const isCrit = risk.riskLevel === 'Critical';

                return (
                  <tr
                    key={c.ticketId}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      background: isCrit ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = isCrit ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = isCrit ? 'rgba(239, 68, 68, 0.05)' : 'transparent'}
                  >
                    <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>
                      {c.ticketId}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span className={`status-pill ${getRiskBadgeClass(risk.riskLevel)}`}>
                        {risk.riskLevel?.toUpperCase()} ({risk.fusedScore || 20})
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <div>{maskPii ? (c.victim?.maskedName || 'S***** D***') : (c.victim?.name || 'Complainant')}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {maskPii ? (c.victim?.maskedPhone || '+91 *****') : (c.victim?.phone || '+91 98765')}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {c.entities?.incidentType || 'Incident'}
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.autoSummary || c.transcript}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {c.languageName || c.language}
                    </td>

                    <td style={{ padding: '14px 18px', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{c.status}</span>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenCase(c)}
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                      >
                        <span>Examine Case</span>
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No complaints matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expandable Case Detail Modal / Drawer */}
      {selectedCase && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', position: 'relative' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span className={`status-pill ${getRiskBadgeClass(selectedCase.riskAssessment?.riskLevel)}`}>
                    {selectedCase.riskAssessment?.riskLevel?.toUpperCase()} RISK (SCORE: {selectedCase.riskAssessment?.fusedScore}/100)
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {selectedCase.riskAssessment?.actionWindow}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                  Case Docket: {selectedCase.ticketId}
                </h2>
              </div>

              <button
                onClick={() => setSelectedCase(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Dual-Signal Trauma Explainability Section (§7.1 & §7.2) */}
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Activity size={18} color="var(--accent-cyan)" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Dual-Signal Trauma Explainability Matrix
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '14px' }}>
                {/* Acoustic Signal Meter */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>VOICE ACOUSTIC STRESS</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                      {selectedCase.acousticAnalysis?.acousticStressScore || 30}%
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Detected State: <strong>{selectedCase.acousticAnalysis?.emotion || 'Normal'}</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    • Pitch Volatility: {selectedCase.acousticAnalysis?.features?.pitchVolatility || 40}%<br />
                    • Hesitation / Pauses: {selectedCase.acousticAnalysis?.features?.pauseRatio || 30}%<br />
                    • Vocal Strain (ZCR): {selectedCase.acousticAnalysis?.features?.vocalStrainZcr || 35}%
                  </div>
                </div>

                {/* NLP Semantic Signal Meter */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--risk-high-text)' }}>TEXT TRAUMA INTENSITY</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--risk-high-text)' }}>
                      {selectedCase.nlpAnalysis?.textTraumaScore || 30}%
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Threat Keywords Detected:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(selectedCase.nlpAnalysis?.flags?.criticalKeywords || []).map((kw, idx) => (
                      <span key={idx} className="status-pill badge-critical" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                        {kw}
                      </span>
                    ))}
                    {(selectedCase.nlpAnalysis?.flags?.highKeywords || []).map((kw, idx) => (
                      <span key={idx} className="status-pill badge-high" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                        {kw}
                      </span>
                    ))}
                    {(!selectedCase.nlpAnalysis?.flags?.criticalKeywords?.length && !selectedCase.nlpAnalysis?.flags?.highKeywords?.length) && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>None flagged</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                {selectedCase.riskAssessment?.explainability?.fusionSummary}
              </div>
            </div>

            {/* Case Details Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Complainant Identity
                </h4>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                  {maskPii ? selectedCase.victim?.maskedName : selectedCase.victim?.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Phone: {maskPii ? selectedCase.victim?.maskedPhone : selectedCase.victim?.phone}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Address: {selectedCase.victim?.location}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Accused & Incident Details
                </h4>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                  Accused: {selectedCase.entities?.accusedName}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Nature: {selectedCase.entities?.incidentType}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Location: {selectedCase.entities?.location}
                </div>
              </div>
            </div>

            {/* Transcript and Auto-Summary */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Spoken Voice Testimony Transcript
              </h4>
              <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: 'var(--radius-sm)', padding: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                "{selectedCase.transcript}"
              </div>
            </div>

            {/* Recommended Support Dispatch Directives */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  AI-Recommended Ground Support
                </h4>
                {selectedCase.riskAssessment?.riskLevel === 'Critical' && (
                  <button
                    onClick={handleQuickEmergencyDispatch}
                    className="btn-danger"
                    style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                  >
                    <Ambulance size={14} /> Trigger Rapid PCR & Medical Dispatch
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {(selectedCase.riskAssessment?.recommendedSupport || []).map((sup, idx) => (
                  <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {sup.type}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {sup.description}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                      {sup.contact}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Officer Workflow Actions Form */}
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>
                Official Action & Case State Management
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>
                    UPDATE STATUS
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="Submitted" style={{ background: '#1e293b' }}>Submitted</option>
                    <option value="Under Review" style={{ background: '#1e293b' }}>Under Review</option>
                    <option value="Action Assigned" style={{ background: '#1e293b' }}>Action Assigned</option>
                    <option value="In Progress" style={{ background: '#1e293b' }}>In Progress</option>
                    <option value="Resolved" style={{ background: '#1e293b' }}>Resolved</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>
                    ADD OFFICER ACTION NOTE / DIRECTIVE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Assigned to DSP Rajeshwar Rao; Witness shelter arranged."
                    value={officerNote}
                    onChange={(e) => setOfficerNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Close Drawer
                </button>
                <button
                  id="save-case-btn"
                  onClick={() => handleUpdateStatus()}
                  className="btn-primary"
                  disabled={isUpdating}
                  style={{ fontSize: '0.85rem' }}
                >
                  <Send size={15} />
                  {isUpdating ? 'Saving...' : 'Commit Officer Update'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

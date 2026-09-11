import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Filter, Search, Eye, EyeOff, CheckCircle, Clock, User, Phone, MapPin, Activity, ChevronRight, X, Send, Ambulance, PhoneCall, FileText, ShieldCheck, Lock, ArrowRight, RefreshCw, UserCheck } from 'lucide-react';

export default function OfficialDashboard({ token, officialUser, onAuthError }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [maskPii, setMaskPii] = useState(true);

  // Modal active tab: 'overview' | 'audit'
  const [modalTab, setModalTab] = useState('overview');

  // Officer action form inside modal
  const [newStatus, setNewStatus] = useState('');
  const [assignedOfficer, setAssignedOfficer] = useState('');
  const [officerNote, setOfficerNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');

  // Firestore Audit Log subcollection state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditAccessDenied, setAuditAccessDenied] = useState(false);
  const [auditErrorMsg, setAuditErrorMsg] = useState('');

  useEffect(() => {
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        onAuthError?.();
        return;
      }
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

  /**
   * Fetch immutable audit logs from Firestore subcollection:
   * complaints/{ticketId}/auditLog/
   */
  const fetchAuditLogs = async (ticketId) => {
    if (!ticketId) return;
    setAuditLoading(true);
    setAuditAccessDenied(false);
    setAuditErrorMsg('');

    try {
      const res = await fetch(`/api/complaints/${ticketId}/audit-log`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        onAuthError?.();
        return;
      }

      const data = await res.json();

      if (res.status === 403) {
        setAuditAccessDenied(true);
        setAuditErrorMsg(data.error || 'Access restricted: Regular officers may only inspect audit logs for cases assigned to them.');
        setAuditLogs([]);
      } else if (data.success) {
        setAuditLogs(data.data || []);
      } else {
        setAuditErrorMsg(data.error || 'Failed to retrieve audit log from Firestore.');
      }
    } catch (err) {
      console.error('Error fetching audit log:', err);
      setAuditErrorMsg('Network error: Unable to retrieve audit log subcollection.');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleOpenCase = (c) => {
    setSelectedCase(c);
    setNewStatus(c.status);
    setAssignedOfficer(c.assignedOfficer || 'Auto-Queued for Nodal Allocation');
    setOfficerNote('');
    setActionSuccessMsg('');
    setActionErrorMsg('');
    setModalTab('overview');
    fetchAuditLogs(c.ticketId);
  };

  const handleUpdateStatus = async (statusOverride = null, customNote = null, officerOverride = null) => {
    if (!selectedCase) return;
    setIsUpdating(true);
    setActionSuccessMsg('');
    setActionErrorMsg('');
    const targetStatus = statusOverride || newStatus;
    const noteToSend = customNote !== null ? customNote : officerNote;
    const targetOfficer = officerOverride !== null ? officerOverride : assignedOfficer;

    try {
      const res = await fetch(`/api/complaints/${selectedCase.ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: targetStatus,
          assignedOfficer: targetOfficer,
          officerName: officialUser?.name || 'Duty Nodal Officer (Atrocity Cell)',
          officerId: officialUser?.id,
          note: noteToSend,
          newLog: noteToSend ? `Official Directive: ${noteToSend}` : `Status transitioned to ${targetStatus}.`
        })
      });

      if (res.status === 401 || res.status === 403) {
        onAuthError?.();
        return;
      }

      const data = await res.json();
      if (data.success) {
        setSelectedCase(data.data);
        setOfficerNote('');
        setActionSuccessMsg(`Official Directive committed. Case docket and audit subcollection updated.`);
        fetchComplaints();
        fetchAuditLogs(selectedCase.ticketId);
        setTimeout(() => setActionSuccessMsg(''), 5000);
      } else {
        setActionErrorMsg(data.error || 'Failed to record official directive.');
      }
    } catch (err) {
      console.error('Error updating case:', err);
      setActionErrorMsg('Network error: Unable to reach complaint management service.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickEmergencyDispatch = () => {
    handleUpdateStatus('Action Assigned', 'EMERGENCY DISPATCH TRIGGERED: PCR Patrol Unit 14 and medical emergency team dispatched.');
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

  const getActionBadge = (action) => {
    switch (action) {
      case 'STATUS_CHANGE':
        return { label: 'Status Transition', bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
      case 'ASSIGNMENT':
        return { label: 'Officer Assignment', bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
      case 'NOTE_ADDED':
        return { label: 'Directive Logged', bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'ESCALATION':
        return { label: 'Emergency Escalation', bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'COMPLAINT_CREATED':
        return { label: 'Docket Registered', bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      default:
        return { label: action || 'Update', bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  const getRiskBadgeClass = (level) => {
    switch (level) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Moderate': return 'badge-moderate';
      default: return 'badge-low';
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* Critical Alert Banner if any Critical complaints */}
      {criticalCount > 0 && (
        <div className="glass-card critical-pulse-box" style={{ padding: '16px 24px', marginBottom: '24px', background: 'var(--risk-critical-bg)', border: '1px solid var(--risk-critical-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <ShieldAlert size={26} color="var(--risk-critical-solid)" />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--risk-critical-text)' }}>
                CRITICAL EMERGENCY RED ALERT ({criticalCount} Urgent Cases Queued)
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Active physical violence or acute trauma acoustic biomarkers identified. Immediate Nodal response required within 15 mins.
              </div>
            </div>
          </div>
          <button
            onClick={() => setFilterRisk('CRITICAL')}
            className="btn-danger"
            style={{ fontSize: '0.82rem', padding: '8px 16px' }}
          >
            Filter Critical Cases
          </button>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Complaints Received
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
            {complaints.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--primary-blue)', marginTop: '4px', fontWeight: '600' }}>
            Live Triage Stream Active
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px 24px', borderLeft: '4px solid var(--risk-critical-solid)' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--risk-critical-text)', textTransform: 'uppercase' }}>
            Critical Red Alerts
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: 'var(--risk-critical-text)', marginTop: '4px' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Sub-15m Rapid Response SLA
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px 24px', borderLeft: '4px solid var(--accent-saffron)' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--risk-high-text)', textTransform: 'uppercase' }}>
            High Priority Inquiries
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: 'var(--risk-high-text)', marginTop: '4px' }}>
            {highCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            2-Hour Atrocity Cell Priority
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px 24px', borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
            Avg AI Triage Time
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: 'var(--accent-emerald)', marginTop: '4px' }}>
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
              placeholder="Search Ticket, Complainant, Accused..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                fontSize: '0.86rem'
              }}
            />
          </div>

          {/* Filters & PII Masking Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            
            {/* Risk Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>RISK:</span>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '6px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: '600'
                }}
              >
                <option value="ALL">All Risks</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="HIGH">High Only</option>
                <option value="MODERATE">Moderate Only</option>
                <option value="LOW">Low Only</option>
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>STATUS:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '6px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: '600'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER REVIEW">Under Review</option>
                <option value="ACTION ASSIGNED">Action Assigned</option>
                <option value="IN PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            {/* PII Masking Switch */}
            <button
              id="pii-toggle-btn"
              onClick={() => setMaskPii(!maskPii)}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              title="Toggle Complainant Confidentiality"
            >
              {maskPii ? <EyeOff size={14} color="var(--accent-saffron)" /> : <Eye size={14} color="var(--accent-emerald)" />}
              <span>{maskPii ? 'PII Confidential' : 'PII Visible'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Ticket ID</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Triage Priority</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Complainant</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Incident Summary</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Language</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
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
                      borderBottom: '1px solid var(--border-glass)',
                      background: isCrit ? 'var(--risk-critical-bg)' : 'transparent',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <td style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--primary-blue)', fontSize: '0.86rem' }}>
                      {c.ticketId}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span className={`status-pill ${getRiskBadgeClass(risk.riskLevel)}`}>
                        {risk.riskLevel?.toUpperCase()} ({risk.fusedScore || 20})
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <div style={{ fontWeight: '700' }}>{maskPii ? (c.victim?.maskedName || 'S***** D***') : (c.victim?.name || 'Complainant')}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {maskPii ? (c.victim?.maskedPhone || '+91 *****') : (c.victim?.phone || '+91 98765')}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '320px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {c.entities?.incidentType || 'Incident'}
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.autoSummary || c.transcript}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      {c.languageName || c.language}
                    </td>

                    <td style={{ padding: '14px 18px', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{c.status}</span>
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
                    No grievance records matching the selected parameters.
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
          background: 'rgba(5, 10, 20, 0.88)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '920px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            position: 'relative',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            borderRadius: '16px'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span className={`status-pill ${getRiskBadgeClass(selectedCase.riskAssessment?.riskLevel)}`}>
                    {selectedCase.riskAssessment?.riskLevel?.toUpperCase()} RISK (SCORE: {selectedCase.riskAssessment?.fusedScore}/100)
                  </span>
                  <span className="status-pill" style={{ background: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)', border: '1px solid var(--border-hover)', fontWeight: '700', fontSize: '0.78rem' }}>
                    STAGE: {selectedCase.status?.toUpperCase() || 'SUBMITTED'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {selectedCase.riskAssessment?.actionWindow}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-blue)' }}>
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

            {/* Modal Navigation Tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              borderBottom: '1px solid var(--border-glass)',
              paddingBottom: '14px',
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  id="tab-case-overview-btn"
                  onClick={() => setModalTab('overview')}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.86rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: modalTab === 'overview' ? 'var(--primary-blue)' : 'var(--bg-surface)',
                    color: modalTab === 'overview' ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: modalTab === 'overview' ? '0 4px 12px rgba(76, 123, 244, 0.3)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FileText size={16} />
                  <span>Case Dossier & Directives</span>
                </button>

                <button
                  id="tab-audit-trail-btn"
                  onClick={() => {
                    setModalTab('audit');
                    fetchAuditLogs(selectedCase.ticketId);
                  }}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.86rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: modalTab === 'audit' ? 'var(--primary-blue)' : 'var(--bg-surface)',
                    color: modalTab === 'audit' ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: modalTab === 'audit' ? '0 4px 12px rgba(76, 123, 244, 0.3)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ShieldCheck size={16} />
                  <span>Audit Trail</span>
                  {auditLogs.length > 0 && !auditAccessDenied && (
                    <span style={{
                      background: modalTab === 'audit' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-card)',
                      color: modalTab === 'audit' ? '#ffffff' : 'var(--primary-blue)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: '800'
                    }}>
                      {auditLogs.length}
                    </span>
                  )}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-surface)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-glass)'
                }}>
                  <Lock size={12} color="var(--accent-emerald)" />
                  Firestore: <code style={{ color: 'var(--primary-blue)', fontSize: '0.72rem' }}>complaints/{selectedCase.ticketId}/auditLog</code>
                </span>
              </div>
            </div>

            {/* TAB 1: Case Overview & Actions */}
            {modalTab === 'overview' && (
              <div className="animate-fade-in">
                {/* Dual-Signal Trauma Explainability Section */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--border-glass)', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Activity size={18} color="var(--primary-blue)" />
                    <h4 style={{ fontSize: '0.96rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                      Dual-Signal Trauma Forensic Explainability Matrix
                    </h4>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '14px' }}>
                    {/* Acoustic Signal Meter */}
                    <div style={{ background: 'var(--bg-surface-subtle)', padding: '14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-glass)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: '700', color: 'var(--primary-blue)' }}>VOICE ACOUSTIC DISTRESS</span>
                        <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary-blue)' }}>
                          {selectedCase.acousticAnalysis?.acousticStressScore || 30}%
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Detected State: <strong>{selectedCase.acousticAnalysis?.emotion || 'Normal'}</strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        • Pitch Instability: {selectedCase.acousticAnalysis?.features?.pitchVolatility || 40}%<br />
                        • Hesitation / Pauses: {selectedCase.acousticAnalysis?.features?.pauseRatio || 30}%<br />
                        • Vocal Strain (ZCR): {selectedCase.acousticAnalysis?.features?.vocalStrainZcr || 35}%
                      </div>
                    </div>

                    {/* NLP Semantic Signal Meter */}
                    <div style={{ background: 'var(--bg-surface-subtle)', padding: '14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-glass)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: '700', color: 'var(--risk-high-text)' }}>TEXT TRAUMA INTENSITY</span>
                        <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--risk-high-text)' }}>
                          {selectedCase.nlpAnalysis?.textTraumaScore || 30}%
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Threat Keywords Flagged:
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
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>None flagged</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    {selectedCase.riskAssessment?.explainability?.fusionSummary}
                  </div>
                </div>

                {/* Case Details Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Complainant Identity
                    </h4>
                    <div style={{ fontSize: '0.94rem', color: 'var(--text-primary)', fontWeight: '700' }}>
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
                    <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Accused & Incident Details
                    </h4>
                    <div style={{ fontSize: '0.94rem', color: 'var(--text-primary)', fontWeight: '700' }}>
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
                  <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Spoken Voice Testimony Transcript
                  </h4>
                  <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)', padding: '14px', border: '1px solid var(--border-glass)', fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                    "{selectedCase.transcript}"
                  </div>
                </div>

                {/* Recommended Support Dispatch Directives */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Statutory Ground Support
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
                      <div key={idx} style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-glass)' }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {sup.type}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          {sup.description}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--primary-blue)', fontWeight: '700' }}>
                          {sup.contact}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Officer Workflow Actions Form */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
                  <div style={{ marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '0.94rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Official Action & Case State Management
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Transition grievance stage, assign investigating officers, and record legal directives. (Mutations automatically recorded to Firestore audit subcollection).
                    </p>
                  </div>

                  {actionSuccessMsg && (
                    <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--risk-low-bg)', border: '1px solid var(--risk-low-border)', color: 'var(--risk-low-text)', fontSize: '0.84rem', fontWeight: '600', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={16} />
                      <span>{actionSuccessMsg}</span>
                    </div>
                  )}

                  {actionErrorMsg && (
                    <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--risk-critical-bg)', border: '1px solid var(--risk-critical-border)', color: 'var(--risk-critical-text)', fontSize: '0.84rem', fontWeight: '600', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={16} />
                      <span>{actionErrorMsg}</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '700' }}>
                        UPDATE CASE STAGE
                      </label>
                      <select
                        id="select-case-stage"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-glass)',
                          color: 'var(--text-primary)',
                          fontSize: '0.88rem',
                          fontWeight: '600'
                        }}
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Action Assigned">Action Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '700' }}>
                        ASSIGN INVESTIGATING OFFICER
                      </label>
                      <select
                        id="select-assign-officer"
                        value={assignedOfficer}
                        onChange={(e) => setAssignedOfficer(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-glass)',
                          color: 'var(--text-primary)',
                          fontSize: '0.88rem',
                          fontWeight: '600'
                        }}
                      >
                        <option value="Inspector Rajeshwar Rao (Atrocity Cell, Zone 4)">Inspector Rajeshwar Rao (Atrocity Cell, Zone 4)</option>
                        <option value="Sub-Inspector Anjali Kadam (Atrocity Cell)">Sub-Inspector Anjali Kadam (Atrocity Cell)</option>
                        <option value="Nodal Officer Vikram Malhotra">Nodal Officer Vikram Malhotra</option>
                        <option value="Grievance Officer Meena Nair">Grievance Officer Meena Nair</option>
                        <option value="Auto-Queued for Nodal Allocation">Auto-Queued for Nodal Allocation</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '700' }}>
                        ADD INVESTIGATIVE DIRECTIVE / OFFICER LOG
                      </label>
                      <input
                        id="input-officer-directive"
                        type="text"
                        placeholder="e.g. Assigned to DSP Atrocity Cell; Complainant safe shelter verified."
                        value={officerNote}
                        onChange={(e) => setOfficerNote(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateStatus(); }}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-glass)',
                          color: 'var(--text-primary)',
                          fontSize: '0.88rem'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setModalTab('audit');
                        fetchAuditLogs(selectedCase.ticketId);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-blue)',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0'
                      }}
                    >
                      <ShieldCheck size={15} />
                      <span>Inspect Officer Audit Trail ({auditLogs.length} entries) ➜</span>
                    </button>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setSelectedCase(null)}
                        className="btn-secondary"
                        style={{ fontSize: '0.85rem' }}
                      >
                        Close Docket
                      </button>
                      <button
                        id="save-case-btn"
                        onClick={() => handleUpdateStatus()}
                        className="btn-primary"
                        disabled={isUpdating}
                        style={{ fontSize: '0.85rem' }}
                      >
                        <Send size={15} />
                        {isUpdating ? 'Recording Directive...' : 'Commit Official Directive'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Legacy Directives Summary */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '16px 20px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="var(--primary-blue)" />
                      <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        Recent Docket Directives ({selectedCase.actionLogs?.length || 0})
                      </h4>
                    </div>
                    <button
                      onClick={() => {
                        setModalTab('audit');
                        fetchAuditLogs(selectedCase.ticketId);
                      }}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-glass)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.74rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>View Full Audit Trail</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                    {(selectedCase.actionLogs && selectedCase.actionLogs.length > 0) ? (
                      [...selectedCase.actionLogs].reverse().slice(0, 3).map((log, idx) => (
                        <div key={idx} style={{
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--bg-card)',
                          borderLeft: '3px solid var(--accent-blue)',
                          fontSize: '0.8rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{log.officer || 'Official Authority'}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>{log.action}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No prior directives recorded.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Read-Only Officer Accountability Audit Trail */}
            {modalTab === 'audit' && (
              <div className="animate-fade-in">
                {/* Audit Ledger Header */}
                <div style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  border: '1px solid var(--border-glass)',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <ShieldCheck size={20} color="var(--primary-blue)" />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        Officer Accountability & Audit Trail
                      </h3>
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#34d399',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Lock size={11} /> Read-Only Immutable
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Chronological ledger of all officer actions, stage changes, assignments, and escalations recorded in Firestore:
                      <code style={{ marginLeft: '6px', color: 'var(--primary-blue)', fontSize: '0.74rem' }}>
                        complaints/{selectedCase.ticketId}/auditLog/
                      </code>
                    </p>
                  </div>

                  <button
                    onClick={() => fetchAuditLogs(selectedCase.ticketId)}
                    disabled={auditLoading}
                    style={{
                      background: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-secondary)',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RefreshCw size={13} className={auditLoading ? 'animate-spin' : ''} />
                    <span>Refresh Log</span>
                  </button>
                </div>

                {/* RBAC Oversight Clearance Notice */}
                {(!auditAccessDenied && officialUser) && (
                  <div style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: (officialUser.role === 'admin' || officialUser.role === 'supervisor') ? 'rgba(76, 123, 244, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    border: `1px solid ${(officialUser.role === 'admin' || officialUser.role === 'supervisor') ? 'rgba(76, 123, 244, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={16} color={(officialUser.role === 'admin' || officialUser.role === 'supervisor') ? 'var(--primary-blue)' : '#34d399'} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                        {(officialUser.role === 'admin' || officialUser.role === 'supervisor') ? (
                          <>
                            <strong>Supervisor/Admin Clearance:</strong> Full audit oversight active across all officers and dockets.
                          </>
                        ) : (
                          <>
                            <strong>Assigned Officer Clearance:</strong> Authorized access for your designated docket ({selectedCase.assignedOfficer}).
                          </>
                        )}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: (officialUser.role === 'admin' || officialUser.role === 'supervisor') ? 'var(--primary-blue)' : '#34d399'
                    }}>
                      Role: {officialUser.role?.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* 403 Forbidden Access Restricted View */}
                {auditAccessDenied && (
                  <div style={{
                    background: 'var(--risk-critical-bg)',
                    border: '1px solid var(--risk-critical-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '28px 24px',
                    textAlign: 'center',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      <ShieldAlert size={28} color="var(--risk-critical-solid)" />
                    </div>

                    <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--risk-critical-text)', marginBottom: '8px' }}>
                      Restricted Audit Log Access (403 Forbidden)
                    </h4>

                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 18px auto', lineHeight: '1.5' }}>
                      Under statutory officer accountability regulations, regular field officers are only authorized to inspect audit logs for cases they are <strong>currently assigned to</strong>.
                    </p>

                    <div style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      padding: '12px 18px',
                      maxWidth: '480px',
                      margin: '0 auto 18px auto',
                      textAlign: 'left',
                      fontSize: '0.8rem'
                    }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Docket Assigned Officer: <strong style={{ color: 'var(--text-primary)' }}>{selectedCase.assignedOfficer || 'Unassigned'}</strong>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        Your Session: <strong style={{ color: 'var(--text-primary)' }}>{officialUser?.name || officialUser?.email} (Role: {officialUser?.role?.toUpperCase()})</strong>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      💡 <em>Supervisor or Administrator clearance (admin@nhaa.gov.in / supervisor@nhaa.gov.in) is required to inspect cross-officer audit trails.</em>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {auditLoading && !auditAccessDenied && (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--primary-blue)' }} />
                    Querying Firestore subcollection <code>complaints/{selectedCase.ticketId}/auditLog/</code>...
                  </div>
                )}

                {/* Audit Trail List (Chronological: Most Recent First) */}
                {!auditLoading && !auditAccessDenied && auditLogs.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {auditLogs.map((entry, idx) => {
                      const badge = getActionBadge(entry.action);
                      const isFirst = idx === 0;

                      return (
                        <div
                          key={entry.id || idx}
                          style={{
                            background: 'var(--bg-surface)',
                            border: isFirst ? '1px solid var(--border-hover)' : '1px solid var(--border-glass)',
                            borderRadius: '10px',
                            padding: '16px 20px',
                            boxShadow: isFirst ? '0 4px 16px rgba(0, 0, 0, 0.25)' : 'none',
                            position: 'relative'
                          }}
                        >
                          {/* Top Row: Action Pill, Officer info, Timestamp */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span style={{
                                background: badge.bg,
                                color: badge.text,
                                border: `1px solid ${badge.border}`,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: '800',
                                letterSpacing: '0.03em',
                                textTransform: 'uppercase'
                              }}>
                                {badge.label}
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}>
                                <User size={14} color="var(--primary-blue)" />
                                <strong style={{ color: 'var(--text-primary)' }}>{entry.officerName || 'System'}</strong>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  ({entry.officerId || 'system'})
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              <Clock size={13} />
                              <span>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Just now'}</span>
                              {isFirst && (
                                <span style={{
                                  background: 'var(--accent-blue-subtle)',
                                  color: 'var(--accent-blue)',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.68rem',
                                  fontWeight: '800',
                                  marginLeft: '4px'
                                }}>
                                  LATEST
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Middle Row: Visual Diff / Transition */}
                          <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-glass)',
                            borderRadius: '8px',
                            padding: '12px 16px'
                          }}>
                            {(entry.action === 'STATUS_CHANGE' || entry.action === 'ASSIGNMENT') ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.84rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Previous Value
                                  </span>
                                  <span style={{
                                    background: 'var(--bg-surface)',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-glass)',
                                    fontWeight: '600'
                                  }}>
                                    {entry.previousValue || 'Unset / None'}
                                  </span>
                                </div>

                                <div style={{ color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', marginTop: '12px' }}>
                                  <ArrowRight size={18} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--primary-blue)', textTransform: 'uppercase' }}>
                                    New Value
                                  </span>
                                  <span style={{
                                    background: badge.bg,
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    color: badge.text,
                                    border: `1px solid ${badge.border}`,
                                    fontWeight: '700'
                                  }}>
                                    {entry.newValue}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                  {entry.action === 'NOTE_ADDED' ? 'Recorded Investigative Directive' : entry.action === 'ESCALATION' ? 'Escalation Event' : 'Docket Registration'}
                                </div>
                                <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                                  {entry.newValue}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Footer: Entry ID */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            <span>Entry ID: <code style={{ color: 'var(--text-secondary)' }}>{entry.id}</code></span>
                            <span>Tamper-evident record</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty State */}
                {!auditLoading && !auditAccessDenied && auditLogs.length === 0 && (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: 'var(--bg-surface)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-muted)',
                    fontSize: '0.86rem'
                  }}>
                    No audit records logged yet in <code>complaints/{selectedCase.ticketId}/auditLog/</code>.
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

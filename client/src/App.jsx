import React, { useState, useEffect } from 'react';
import { Mic, Search, ShieldAlert, BarChart3, PhoneCall, AlertTriangle, CheckCircle2, ChevronRight, Volume2 } from 'lucide-react';
import VoiceRecorder from './components/VoiceRecorder';
import ComplaintReview from './components/ComplaintReview';
import SubmissionSuccess from './components/SubmissionSuccess';
import ComplaintTracker from './components/ComplaintTracker';
import OfficialDashboard from './components/OfficialDashboard';
import AnalyticsPanel from './components/AnalyticsPanel';

export default function App() {
  const [activeTab, setActiveTab] = useState('record'); // 'record' | 'review' | 'submitted' | 'track' | 'official' | 'analytics'
  const [reviewData, setReviewData] = useState(null);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [trackerTicketId, setTrackerTicketId] = useState('');
  const [demoScenarios, setDemoScenarios] = useState([]);

  // Fetch preset demo scenarios from server
  useEffect(() => {
    fetch('/api/demo-samples')
      .then(res => res.json())
      .then(data => {
        if (data.success) setDemoScenarios(data.data);
      })
      .catch(err => console.warn('Could not fetch demo scenarios:', err));
  }, []);

  const handleProceedToReview = (data) => {
    setReviewData(data);
    setActiveTab('review');
  };

  const handleSubmitComplaint = (complaint) => {
    setSubmittedComplaint(complaint);
    setActiveTab('submitted');
  };

  const handleGoToTracker = (ticketId) => {
    setTrackerTicketId(ticketId);
    setActiveTab('track');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Emergency Hotlines Ticker */}
      <div style={{ background: 'rgba(11, 19, 43, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '6px 20px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: '700', color: 'var(--risk-critical-text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <PhoneCall size={12} /> 24x7 TOLL-FREE EMERGENCY:
          </span>
          <span>Police: <strong>112</strong></span>
          <span>•</span>
          <span>National SC/ST Helpline: <strong>14566</strong></span>
          <span>•</span>
          <span>Women in Distress: <strong>1091</strong></span>
          <span>•</span>
          <span>Tele-MANAS Mental Health: <strong>14416</strong></span>
        </div>
        <div style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>
          Smart India Hackathon 2026 | PS ID: 26093
        </div>
      </div>

      {/* Main Navigation Header */}
      <header style={{
        background: 'rgba(9, 13, 22, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Brand Logo & Title */}
          <div
            onClick={() => setActiveTab('record')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)'
            }}>
              <Mic size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  NHAA
                </span>
                <span className="status-pill badge-critical" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                  AI Trauma Triage
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                National Helpline & Application for Atrocities | Real-Time Voice Assessment
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '8px', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              id="nav-voice-portal"
              onClick={() => setActiveTab('record')}
              style={{
                background: (activeTab === 'record' || activeTab === 'review' || activeTab === 'submitted') ? 'var(--accent-cyan)' : 'transparent',
                color: (activeTab === 'record' || activeTab === 'review' || activeTab === 'submitted') ? '#090d16' : 'var(--text-secondary)',
                fontWeight: '700',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 14px',
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <Mic size={15} />
              <span>Victim Voice Gateway</span>
            </button>

            <button
              id="nav-tracker"
              onClick={() => setActiveTab('track')}
              style={{
                background: activeTab === 'track' ? 'var(--accent-cyan)' : 'transparent',
                color: activeTab === 'track' ? '#090d16' : 'var(--text-secondary)',
                fontWeight: '700',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 14px',
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <Search size={15} />
              <span>Track Complaint</span>
            </button>

            <button
              id="nav-official-dashboard"
              onClick={() => setActiveTab('official')}
              style={{
                background: activeTab === 'official' ? 'var(--accent-cyan)' : 'transparent',
                color: activeTab === 'official' ? '#090d16' : 'var(--text-secondary)',
                fontWeight: '700',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 14px',
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <ShieldAlert size={15} />
              <span>Official Triage Center</span>
            </button>

            <button
              id="nav-analytics"
              onClick={() => setActiveTab('analytics')}
              style={{
                background: activeTab === 'analytics' ? 'var(--accent-cyan)' : 'transparent',
                color: activeTab === 'analytics' ? '#090d16' : 'var(--text-secondary)',
                fontWeight: '700',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 14px',
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <BarChart3 size={15} />
              <span>Analytics</span>
            </button>
          </nav>

        </div>
      </header>

      {/* Main Content View Container */}
      <main style={{ flex: 1, padding: '30px 20px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        
        {activeTab === 'record' && (
          <VoiceRecorder
            onProceedToReview={handleProceedToReview}
            demoScenarios={demoScenarios}
          />
        )}

        {activeTab === 'review' && reviewData && (
          <ComplaintReview
            data={reviewData}
            onBack={() => setActiveTab('record')}
            onSubmitComplaint={handleSubmitComplaint}
          />
        )}

        {activeTab === 'submitted' && submittedComplaint && (
          <SubmissionSuccess
            complaint={submittedComplaint}
            onGoToTracker={handleGoToTracker}
          />
        )}

        {activeTab === 'track' && (
          <ComplaintTracker initialTicketId={trackerTicketId} />
        )}

        {activeTab === 'official' && (
          <OfficialDashboard />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPanel />
        )}

      </main>

      {/* Modern Empathetic Footer */}
      <footer style={{
        background: 'rgba(9, 13, 22, 0.95)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px 20px',
        color: 'var(--text-muted)',
        fontSize: '0.82rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <strong>National Helpline / Application for Atrocities (NHAA)</strong> — AI Stress & Trauma Assessment Architecture
          </div>
          <div>
            Built for Smart India Hackathon 2026 | PS ID: 26093 | Smart Automation
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Privacy Mandate Compliance (§12)</span>
            <span>•</span>
            <span>Multilingual ASR Engine</span>
            <span>•</span>
            <span>Dual Acoustic & Text Fusion</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

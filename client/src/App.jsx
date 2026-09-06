import React, { useState, useEffect } from 'react';
import { Mic, Search, ShieldAlert, BarChart3, PhoneCall, AlertTriangle, CheckCircle2, ChevronRight, Volume2, Sun, Moon, Shield, Lock } from 'lucide-react';
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
  const [theme, setTheme] = useState('dark');

  // Set theme attribute on html/body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

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
      
      {/* Indian National Tricolor Ribbon */}
      <div className="tricolor-ribbon" />

      {/* Top Emergency Hotlines Bar */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '7px 24px',
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '800', color: 'var(--risk-critical-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PhoneCall size={13} /> 24x7 NATIONAL EMERGENCY HELPLINES:
          </span>
          <span>Police / PCR: <strong style={{ color: 'var(--text-primary)' }}>112</strong></span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>National SC/ST Atrocity Helpline: <strong style={{ color: 'var(--text-primary)' }}>14566</strong></span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>Women Crisis Helpline: <strong style={{ color: 'var(--text-primary)' }}>1091</strong></span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>Tele-MANAS Psychological Support: <strong style={{ color: 'var(--text-primary)' }}>14416</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: '600' }}>
            <Lock size={12} /> Secure Official Gateway
          </div>
          
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '600'
            }}
            title="Toggle Light / Dark Theme"
          >
            {theme === 'dark' ? <Sun size={13} color="#f59e0b" /> : <Moon size={13} color="#2563eb" />}
            <span>{theme === 'dark' ? 'Day Mode' : 'Night Mode'}</span>
          </button>
        </div>
      </div>

      {/* Main Official Header */}
      <header style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '14px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Official Emblem & Identity */}
          <div
            onClick={() => setActiveTab('record')}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
          >
            {/* Gov Seal Emblem Style Icon */}
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}>
              <Shield size={24} color="#ffffff" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  NHAA
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                  राष्ट्रीय अत्याचार निवारण पोर्टल
                </span>
                <span className="status-pill" style={{ background: 'rgba(37, 99, 235, 0.15)', color: 'var(--primary-blue)', fontSize: '0.68rem', padding: '2px 8px' }}>
                  AI Trauma Triage Active
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                National Helpline & Application for Atrocities | Ministry of Social Justice & Empowerment, Govt. of India
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '6px', background: 'var(--bg-surface-subtle)', padding: '5px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <button
              id="nav-voice-portal"
              onClick={() => setActiveTab('record')}
              style={{
                background: (activeTab === 'record' || activeTab === 'review' || activeTab === 'submitted') ? 'var(--primary-blue)' : 'transparent',
                color: (activeTab === 'record' || activeTab === 'review' || activeTab === 'submitted') ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: '700',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '9px 16px',
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'all 0.2s ease',
                boxShadow: (activeTab === 'record' || activeTab === 'review' || activeTab === 'submitted') ? 'var(--shadow-primary)' : 'none'
              }}
            >
              <Mic size={16} />
              <span>Voice Grievance Gateway</span>
            </button>

            <button
              id="nav-tracker"
              onClick={() => setActiveTab('track')}
              style={{
                background: activeTab === 'track' ? 'var(--primary-blue)' : 'transparent',
                color: activeTab === 'track' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: '700',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '9px 16px',
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'track' ? 'var(--shadow-primary)' : 'none'
              }}
            >
              <Search size={16} />
              <span>Track Docket Status</span>
            </button>

            <button
              id="nav-official-dashboard"
              onClick={() => setActiveTab('official')}
              style={{
                background: activeTab === 'official' ? 'var(--primary-blue)' : 'transparent',
                color: activeTab === 'official' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: '700',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '9px 16px',
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'official' ? 'var(--shadow-primary)' : 'none'
              }}
            >
              <ShieldAlert size={16} />
              <span>Nodal Command Center</span>
            </button>

            <button
              id="nav-analytics"
              onClick={() => setActiveTab('analytics')}
              style={{
                background: activeTab === 'analytics' ? 'var(--primary-blue)' : 'transparent',
                color: activeTab === 'analytics' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: '700',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '9px 16px',
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'analytics' ? 'var(--shadow-primary)' : 'none'
              }}
            >
              <BarChart3 size={16} />
              <span>Executive Analytics</span>
            </button>
          </nav>

        </div>
      </header>

      {/* Main Content View Container */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1320px', margin: '0 auto', width: '100%' }}>
        
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

      {/* Official Government Portal Footer */}
      <footer style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-glass)',
        padding: '24px 24px',
        color: 'var(--text-muted)',
        fontSize: '0.82rem',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>National Helpline & Application for Atrocities (NHAA)</strong>
            <div style={{ marginTop: '2px' }}>Ministry of Social Justice and Empowerment, Government of India</div>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <span>Statutory Victim Protection Protocol</span>
            <span>•</span>
            <span>Automated Trauma Risk Classification</span>
            <span>•</span>
            <span>Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

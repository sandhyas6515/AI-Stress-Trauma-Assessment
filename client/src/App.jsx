import React, { useState, useEffect } from 'react';
import { User, Menu, X, Sun, Moon, Mic, Search, ShieldAlert, BarChart3, ShieldCheck } from 'lucide-react';
import AshokaEmblem from './components/AshokaEmblem';
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
  const [menuOpen, setMenuOpen] = useState(false);

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

  const navigateTab = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      
      {/* Header exactly matching Screenshot */}
      <header style={{
        padding: '18px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {/* Left: Ashoka Emblem + Government of India */}
        <div onClick={() => navigateTab('record')} style={{ cursor: 'pointer' }}>
          <AshokaEmblem size={36} theme={theme} />
        </div>

        {/* Right: Theme Toggle, User Icon, Hamburger Menu Icon matching Screenshot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Quick Theme Switcher */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: '50%'
            }}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* User Profile Icon matching Screenshot */}
          <div
            onClick={() => alert('Official Citizen / Complainant Session Active')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              background: 'var(--bg-card)'
            }}
            title="User Profile"
          >
            <User size={18} />
          </div>

          {/* Hamburger Menu Icon matching Screenshot */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
            title="Navigation Menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Slide-out / Dropdown Menu for Navigation */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: '73px',
          right: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-card)',
          zIndex: 100,
          width: '260px',
          padding: '12px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', padding: '6px 12px', textTransform: 'uppercase' }}>
            System Portals
          </div>

          <div
            onClick={() => navigateTab('record')}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.88rem',
              fontWeight: '600',
              color: activeTab === 'record' ? 'var(--accent-blue)' : 'var(--text-primary)',
              background: activeTab === 'record' ? 'var(--accent-blue-subtle)' : 'transparent'
            }}
          >
            <Mic size={16} />
            <span>Voice Grievance Gateway</span>
          </div>

          <div
            onClick={() => navigateTab('track')}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.88rem',
              fontWeight: '600',
              color: activeTab === 'track' ? 'var(--accent-blue)' : 'var(--text-primary)',
              background: activeTab === 'track' ? 'var(--accent-blue-subtle)' : 'transparent'
            }}
          >
            <Search size={16} />
            <span>Track Your Complaint</span>
          </div>

          <div
            onClick={() => navigateTab('official')}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.88rem',
              fontWeight: '600',
              color: activeTab === 'official' ? 'var(--accent-blue)' : 'var(--text-primary)',
              background: activeTab === 'official' ? 'var(--accent-blue-subtle)' : 'transparent'
            }}
          >
            <ShieldAlert size={16} />
            <span>Nodal Command Center</span>
          </div>

          <div
            onClick={() => navigateTab('analytics')}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.88rem',
              fontWeight: '600',
              color: activeTab === 'analytics' ? 'var(--accent-blue)' : 'var(--text-primary)',
              background: activeTab === 'analytics' ? 'var(--accent-blue-subtle)' : 'transparent'
            }}
          >
            <BarChart3 size={16} />
            <span>Resolution Analytics</span>
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />

          <div
            onClick={toggleTheme}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.86rem',
              color: 'var(--text-secondary)'
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '24px 20px', maxWidth: '1100px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {activeTab === 'record' && (
          <VoiceRecorder
            onProceedToReview={handleProceedToReview}
            onNavigateTab={navigateTab}
            demoScenarios={demoScenarios}
            theme={theme}
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

      {/* Footer matching Screenshot exactly */}
      <footer style={{
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        marginTop: 'auto',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-surface)'
      }}>
        Ministry of Social Justice & Empowerment | Government of India
      </footer>

    </div>
  );
}

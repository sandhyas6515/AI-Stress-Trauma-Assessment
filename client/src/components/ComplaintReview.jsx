import React, { useState } from 'react';
import { Shield, AlertTriangle, User, MapPin, Calendar, FileText, CheckCircle, ArrowLeft, Send, Sparkles, Volume2, ShieldAlert } from 'lucide-react';

export default function ComplaintReview({ data, onBack, onSubmitComplaint }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editable state initialized from AI extraction
  const [transcript, setTranscript] = useState(data.transcript || '');
  const [accusedName, setAccusedName] = useState(data.entities?.accusedName || '');
  const [incidentType, setIncidentType] = useState(data.entities?.incidentType || '');
  const [location, setLocation] = useState(data.entities?.location || '');
  const [dateOrTime, setDateOrTime] = useState(data.entities?.dateOrTime || 'Recent');
  const [autoSummary, setAutoSummary] = useState(data.autoSummary || '');

  // Victim profile details
  const [victimName, setVictimName] = useState(data.selectedPreset?.victim?.name || 'Smt. Anandi Devi');
  const [victimPhone, setVictimPhone] = useState(data.selectedPreset?.victim?.phone || '+91 98765 12345');
  const [victimAddress, setVictimAddress] = useState(data.selectedPreset?.victim?.location || location || 'Grievance Jurisdiction Cell');

  const risk = data.riskAssessment || {};
  const acoustic = data.acousticAnalysis || {};

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        transcript,
        autoSummary,
        language: data.selectedLanguage || 'hi',
        languageName: data.selectedPreset?.languageName || 'Hindi / Multilingual',
        entities: {
          accusedName,
          incidentType,
          location,
          dateOrTime,
          immediateDangerDetected: data.entities?.immediateDangerDetected || false
        },
        victim: {
          name: victimName,
          phone: victimPhone,
          location: victimAddress
        },
        acousticAnalysis: acoustic,
        nlpAnalysis: data.nlpAnalysis || {},
        riskAssessment: risk
      };

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();

      if (resData.success) {
        onSubmitComplaint(resData.data);
      } else {
        alert('Submission failed: ' + resData.error);
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('Error submitting report. Please check server connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Moderate': return 'badge-moderate';
      default: return 'badge-low';
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Top Banner with AI Real-Time Trauma Gauge */}
      <div className={`glass-card ${risk.riskLevel === 'Critical' ? 'critical-pulse-box' : ''}`} style={{ padding: '26px 30px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className={`status-pill ${getRiskBadge(risk.riskLevel)}`}>
                <ShieldAlert size={14} /> AI FUSED TRIAGE: {risk.riskLevel?.toUpperCase()} (SCORE: {risk.fusedScore}/100)
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {risk.urgencyLabel}
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              Pre-Submission Verification Docket (शिकायत सत्यापन)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
              Verify the automatically extracted entities below. You may edit any field to correct speech recognition before final submission.
            </p>
          </div>

          {/* Dual Distress Meters */}
          <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-surface)', padding: '14px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>VOICE STRESS</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--primary-blue)' }}>
                {acoustic.acousticStressScore || 50}%
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{acoustic.emotion?.split('/')[0]}</div>
            </div>
            <div style={{ width: '1px', background: 'var(--border-glass)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>TEXT TRAUMA</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--accent-saffron)' }}>
                {data.nlpAnalysis?.textTraumaScore || 50}%
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Threat Keywords</div>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Sections Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Section 1: Accused & Incident Details */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
            <AlertTriangle size={18} color="var(--risk-critical-solid)" />
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              1. Accused & Incident Specifics
            </h3>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '700' }}>
              ACCUSED PERSON(S) / संस्था अथवा व्यक्ति का नाम
            </label>
            <input
              type="text"
              value={accusedName}
              onChange={(e) => setAccusedName(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '700' }}>
              NATURE OF ATROCITY / INCIDENT
            </label>
            <input
              type="text"
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '700' }}>
                LOCATION / ग्राम / क्षेत्र
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '700' }}>
                OCCURRENCE DATE / TIME
              </label>
              <input
                type="text"
                value={dateOrTime}
                onChange={(e) => setDateOrTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Victim Demographics */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
            <User size={18} color="var(--primary-blue)" />
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              2. Complainant Identification
            </h3>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '700' }}>
              FULL NAME / शिकायतकर्ता का नाम
            </label>
            <input
              type="text"
              value={victimName}
              onChange={(e) => setVictimName(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '700' }}>
              PRIMARY CONTACT NUMBER
            </label>
            <input
              type="text"
              value={victimPhone}
              onChange={(e) => setVictimPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '700' }}>
              CURRENT RESIDENCE / SHELTER ADDRESS
            </label>
            <input
              type="text"
              value={victimAddress}
              onChange={(e) => setVictimAddress(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Speech Transcript & Auto-Summary */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
          <FileText size={18} color="var(--primary-blue)" />
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            3. Spoken Statement Transcript & Official Auto-Summary
          </h3>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '700' }}>
            RECORDED VOICE TRANSCRIPT (EDITABLE)
          </label>
          <textarea
            rows={3}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              lineHeight: '1.5'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '700' }}>
            EXECUTIVE LEGAL SUMMARY (FOR INVESTIGATING OFFICER)
          </label>
          <textarea
            rows={3}
            value={autoSummary}
            onChange={(e) => setAutoSummary(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              lineHeight: '1.5'
            }}
          />
        </div>
      </div>

      {/* Action Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
        <button
          onClick={onBack}
          className="btn-secondary"
          disabled={isSubmitting}
        >
          <ArrowLeft size={16} /> Re-record Audio
        </button>

        <button
          id="submit-complaint-btn"
          onClick={handleSubmit}
          className="btn-primary"
          disabled={isSubmitting}
          style={{ padding: '12px 32px', fontSize: '1.02rem' }}
        >
          {isSubmitting ? (
            <span>Registering Case Docket...</span>
          ) : (
            <>
              <span>Submit Report & Issue Ticket</span>
              <Send size={18} />
            </>
          )}
        </button>
      </div>

    </div>
  );
}

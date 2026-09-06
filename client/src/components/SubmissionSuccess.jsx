import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { CheckCircle2, Download, Copy, ExternalLink, PhoneCall, ShieldAlert, HeartHandshake, Scale, Ambulance, ArrowRight, ShieldCheck, Printer } from 'lucide-react';

export default function SubmissionSuccess({ complaint, onGoToTracker }) {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const receiptRef = useRef(null);

  const ticketId = complaint.ticketId || 'NHAA-2026-000000';
  const risk = complaint.riskAssessment || {};
  const acoustic = complaint.acousticAnalysis || {};
  const isCritical = risk.riskLevel === 'Critical';

  useEffect(() => {
    const qrData = `https://nhaa.gov.in/track?ticket=${ticketId}`;
    QRCode.toDataURL(qrData, { margin: 1, width: 140 })
      .then(setQrDataUrl)
      .catch((err) => console.error('QR generation error:', err));
  }, [ticketId]);

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingPdf(true);
    try {
      // Ensure fonts and images are ready
      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210; // A4 mm
      const pageHeight = 297; // A4 mm
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight, undefined, 'FAST');
      } else {
        let position = 0;
        let heightLeft = imgHeight;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pageHeight;
        }
      }

      pdf.save(`NHAA_Complaint_Receipt_${ticketId}.pdf`);
    } catch (e) {
      console.error('PDF error:', e);
      // Fallback to native window.print() if canvas generation has any issue
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Top Confirmation Card */}
      <div className="glass-card" style={{ padding: '40px 32px', textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'var(--risk-low-bg)', border: '1px solid var(--risk-low-border)', marginBottom: '16px' }}>
          <CheckCircle2 size={44} color="var(--risk-low-solid)" />
        </div>

        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Grievance Docket Successfully Registered
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', maxWidth: '600px', margin: '0 auto 24px auto' }}>
          Your spoken testimony has been officially registered, trauma-triaged, and routed to the Jurisdictional Atrocity Cell.
        </p>

        {/* Big Ticket ID Box */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', background: 'var(--bg-surface)', padding: '16px 28px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', marginBottom: '28px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
              Your Trackable Ticket ID
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary-blue)', letterSpacing: '0.04em' }}>
              {ticketId}
            </div>
          </div>
          <button
            onClick={handleCopyTicket}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          >
            <Copy size={15} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Download PDF & Track Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            id="download-pdf-btn"
            onClick={handleDownloadPdf}
            className="btn-primary"
            disabled={isGeneratingPdf}
            style={{ padding: '12px 24px', fontSize: '0.94rem' }}
          >
            <Download size={18} />
            {isGeneratingPdf ? 'Generating PDF...' : 'Download FIR Receipt (PDF)'}
          </button>

          <button
            onClick={handlePrint}
            className="btn-secondary"
            style={{ padding: '12px 22px', fontSize: '0.94rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            title="Print or Save as PDF with browser print dialog"
          >
            <Printer size={18} />
            <span>Print / Save as PDF</span>
          </button>

          <button
            onClick={() => onGoToTracker(ticketId)}
            className="btn-secondary"
            style={{ padding: '12px 24px', fontSize: '0.94rem' }}
          >
            <span>Track Status in Real-Time</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Critical Emergency Banner if High or Critical Risk */}
      {isCritical && (
        <div className="glass-card critical-pulse-box" style={{ padding: '22px 26px', marginBottom: '24px', background: 'var(--risk-critical-bg)', borderColor: 'var(--risk-critical-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <ShieldAlert size={28} color="var(--risk-critical-solid)" />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--risk-critical-text)' }}>
                Immediate Emergency Assistance Activated
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Our AI identified acute distress or life threat indicators. The nearest PCR patrol unit and District Atrocity Cell have been alerted.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '14px' }}>
            <a href="tel:112" style={{ textDecoration: 'none' }}>
              <button className="btn-danger" style={{ padding: '9px 18px', fontSize: '0.88rem' }}>
                <PhoneCall size={16} /> Dial 112 (Police Emergency)
              </button>
            </a>
            <a href="tel:14566" style={{ textDecoration: 'none' }}>
              <button className="btn-secondary" style={{ padding: '9px 18px', fontSize: '0.88rem' }}>
                <PhoneCall size={16} /> Dial 14566 (National SC/ST Helpline)
              </button>
            </a>
            <a href="tel:108" style={{ textDecoration: 'none' }}>
              <button className="btn-secondary" style={{ padding: '9px 18px', fontSize: '0.88rem' }}>
                <Ambulance size={16} /> Dial 108 (Medical Aid)
              </button>
            </a>
          </div>
        </div>
      )}

      {/* AI Recommended Support Cards */}
      <div className="glass-card" style={{ padding: '26px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <HeartHandshake size={20} color="var(--accent-emerald)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            Statutory Parallel Support Services
          </h3>
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          Based on the trauma triage evaluation of your statement, the following institutional services have been queued to assist you:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {(risk.recommendedSupport || []).map((support, idx) => (
            <div
              key={idx}
              className="glass-card"
              style={{ padding: '18px', background: 'var(--bg-surface)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {support.type.includes('Police') ? <ShieldAlert size={18} color="var(--risk-critical-solid)" /> :
                 support.type.includes('Medical') ? <Ambulance size={18} color="var(--accent-saffron)" /> :
                 <Scale size={18} color="var(--primary-blue)" />}
                <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {support.type}
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {support.description}
              </p>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--primary-blue)' }}>
                {support.contact}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visible Official Grievance Docket & Legal Receipt */}
      <div className="no-print" style={{ margin: '32px 0 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            Official Grievance Docket & Legal Receipt Preview
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Official FIR-ready legal acknowledgment docket. Verify details below or export as PDF.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleDownloadPdf} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} disabled={isGeneratingPdf}>
            <Download size={15} /> {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
          </button>
          <button onClick={handlePrint} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '40px', paddingBottom: '10px' }}>
        <div
          ref={receiptRef}
          className="printable-receipt"
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            padding: '36px 40px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            boxSizing: 'border-box'
          }}
        >
          {/* Header Band */}
          <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '18px 24px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#93c5fd' }}>
                Government of India • Ministry of Social Justice & Empowerment
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '4px', letterSpacing: '-0.01em' }}>
                NATIONAL HELPLINE / APPLICATION FOR ATROCITIES (NHAA)
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px' }}>
                Real-Time Voice Trauma Assessment & Statutory Grievance Redressal Gateway
              </div>
            </div>
            {qrDataUrl && (
              <div style={{ backgroundColor: '#ffffff', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={qrDataUrl} alt="Track QR" style={{ width: '64px', height: '64px', display: 'block' }} />
              </div>
            )}
          </div>

          {/* Docket Identifier & Triage Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '2px solid #0f172a', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Official Complaint Acknowledgment Docket
              </div>
              <div style={{ fontSize: '13px', color: '#334155', marginTop: '4px' }}>
                <strong>TICKET IDENTIFIER:</strong> <span style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: '800', color: '#1d4ed8' }}>{ticketId}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                <strong>Lodged At:</strong> {new Date(complaint.createdAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                <strong>Status:</strong> {complaint.status || 'Submitted (Queued for Priority Triage)'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-block',
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: isCritical ? '#fee2e2' : '#eff6ff',
                border: `1px solid ${isCritical ? '#f87171' : '#93c5fd'}`,
                color: isCritical ? '#dc2626' : '#1d4ed8',
                fontWeight: '800',
                fontSize: '12px'
              }}>
                TRIAGE: {(risk.riskLevel || 'MODERATE').toUpperCase()} RISK ({risk.fusedScore || 30}/100)
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                {risk.actionWindow || 'Standard SLA Window'}
              </div>
            </div>
          </div>

          {/* Section 1: Complainant Demographics */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>
              1. Complainant Demographics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr', gap: '8px', fontSize: '12px', color: '#334155' }}>
              <div><strong>Full Name:</strong> {complaint.victim?.name || 'N/A'}</div>
              <div><strong>Contact:</strong> {complaint.victim?.phone || 'N/A'}</div>
              <div><strong>Location:</strong> {complaint.victim?.location || 'Location not specified'}</div>
            </div>
          </div>

          {/* Section 2: Incident & Accused Details */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>
              2. Incident & Accused Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '8px', fontSize: '12px', color: '#334155', marginBottom: '4px' }}>
              <div><strong>Accused Name(s):</strong> {complaint.entities?.accusedName || 'Unspecified / Multiple Individuals'}</div>
              <div><strong>Incident Nature:</strong> {complaint.entities?.incidentType || 'Atrocity Grievance / Deprivation'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '8px', fontSize: '12px', color: '#334155' }}>
              <div><strong>Location of Occurrence:</strong> {complaint.entities?.location || 'Not explicitly mentioned'}</div>
              <div><strong>Date / Time:</strong> {complaint.entities?.dateOrTime || 'Recent / Ongoing incident'}</div>
            </div>
          </div>

          {/* Section 3: AI Acoustic Stress & Trauma Assessment Metrics */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>
              3. AI Acoustic Stress & Trauma Assessment Metrics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '11px', color: '#334155' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700' }}>VOICE STRESS LEVEL</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginTop: '2px' }}>
                  {acoustic.acousticStressScore || 30}%
                </div>
                <div style={{ color: '#475569', fontSize: '10px' }}>Emotion: {acoustic.emotion || 'Calm'}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700' }}>PITCH VOLATILITY / PAUSES</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginTop: '2px' }}>
                  {acoustic.features?.pitchVolatility || 40}%
                </div>
                <div style={{ color: '#475569', fontSize: '10px' }}>Hesitation: {acoustic.features?.pauseRatio || 30}%</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700' }}>TEXT SEMANTIC TRAUMA</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: isCritical ? '#dc2626' : '#1e293b', marginTop: '2px' }}>
                  {complaint.nlpAnalysis?.textTraumaScore || 30}%
                </div>
                <div style={{ color: '#475569', fontSize: '10px' }}>Urgency: {risk.urgencyLabel || 'Standard Review'}</div>
              </div>
            </div>
          </div>

          {/* Section 4: Official Executive Summary & Spoken Voice Testimony Transcript */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>
              4. Official Executive Summary & Spoken Testimony Transcript
            </div>
            
            {complaint.autoSummary && (
              <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#1e293b', marginBottom: '8px' }}>
                <strong>Executive Summary:</strong> {complaint.autoSummary}
              </div>
            )}

            <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
              Spoken Testimony Transcript (Raw Audio Capture):
            </div>
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '10px 14px',
              fontSize: '12px',
              lineHeight: '1.5',
              color: '#0f172a',
              fontStyle: 'italic'
            }}>
              "{complaint.transcript || 'No spoken audio transcript recorded.'}"
            </div>
          </div>

          {/* Section 5: AI Recommended Support & Directives */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>
              5. AI Recommended Support & Directives
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(risk.recommendedSupport && risk.recommendedSupport.length > 0) ? (
                risk.recommendedSupport.map((sup, idx) => (
                  <div key={idx} style={{ fontSize: '11px', color: '#334155', lineHeight: '1.4' }}>
                    • <strong>{sup.type}:</strong> {sup.description} <span style={{ color: '#1d4ed8', fontWeight: '700' }}>(Contact: {sup.contact})</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Standard grievance redressal protocol assigned.
                </div>
              )}
            </div>
          </div>

          {/* Official Verification Footer */}
          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#64748b' }}>
            <div>
              This is an official computer-generated legal docket receipt under the NHAA Automated Grievance Architecture.<br />
              Ministry of Social Justice & Empowerment, Government of India.
            </div>
            <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
              Verification URL: https://nhaa.gov.in/track?ticket={ticketId}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { CheckCircle2, Download, Copy, ExternalLink, PhoneCall, ShieldAlert, HeartHandshake, Scale, Ambulance, ArrowRight } from 'lucide-react';

export default function SubmissionSuccess({ complaint, onGoToTracker }) {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const ticketId = complaint.ticketId || 'NHAA-2026-000000';
  const risk = complaint.riskAssessment || {};
  const isCritical = risk.riskLevel === 'Critical';

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const qrData = `https://nhaa.gov.in/track?ticket=${ticketId}`;
      const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1, width: 120 });

      // Official Header Band
      doc.setFillColor(11, 19, 43);
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('NATIONAL HELPLINE / APPLICATION FOR ATROCITIES (NHAA)', 14, 15);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Government of India — Ministry of Social Justice & Empowerment', 14, 23);
      doc.text('AI-Based Trauma & Distress Triage Module | SIH 2026 (PS: 26093)', 14, 30);

      // QR Code in Header
      doc.addImage(qrDataUrl, 'PNG', 165, 3, 30, 30);

      // Ticket ID & Stamp
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`OFFICIAL COMPLAINT ACKNOWLEDGMENT RECEIPT`, 14, 48);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`TICKET IDENTIFIER: `, 14, 56);
      doc.setFont('helvetica', 'bold');
      doc.text(`${ticketId}`, 62, 56);

      doc.setFont('helvetica', 'normal');
      doc.text(`LODGED AT: ${new Date(complaint.createdAt || Date.now()).toLocaleString()}`, 14, 63);
      doc.text(`STATUS: ${complaint.status || 'Submitted (Queued for Priority Triage)'}`, 14, 70);

      // Risk Triage Badge
      doc.setFillColor(isCritical ? 239 : 14, isCritical ? 68 : 165, isCritical ? 68 : 233);
      doc.roundedRect(135, 50, 60, 18, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`TRIAGE LEVEL: ${(risk.riskLevel || 'LOW').toUpperCase()}`, 140, 58);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Distress Score: ${risk.fusedScore || 20}/100`, 140, 64);

      // Section 1: Complainant Details
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 76, 196, 76);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Complainant Demographics', 14, 83);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Full Name: ${complaint.victim?.name || 'N/A'}`, 14, 90);
      doc.text(`Contact: ${complaint.victim?.phone || 'N/A'}`, 100, 90);
      doc.text(`Location: ${complaint.victim?.location || 'N/A'}`, 14, 96);

      // Section 2: Accused & Incident
      doc.line(14, 102, 196, 102);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Incident & Accused Details', 14, 109);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Accused Name(s): ${complaint.entities?.accusedName || 'Unspecified'}`, 14, 116);
      doc.text(`Incident Nature: ${complaint.entities?.incidentType || 'Grievance'}`, 14, 122);
      doc.text(`Location of Occurrence: ${complaint.entities?.location || 'N/A'}`, 14, 128);
      doc.text(`Date / Time: ${complaint.entities?.dateOrTime || 'Recent'}`, 100, 128);

      // Section 3: AI Trauma & Acoustic Signals
      doc.line(14, 134, 196, 134);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('3. AI Acoustic Stress & Trauma Assessment Metrics', 14, 141);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const acoustic = complaint.acousticAnalysis || {};
      doc.text(`Voice Stress Level: ${acoustic.acousticStressScore || 30}% (Acoustic Emotion: ${acoustic.emotion || 'Calm'})`, 14, 148);
      doc.text(`Pitch Volatility Index: ${acoustic.features?.pitchVolatility || 40}% | Hesitation/Pause: ${acoustic.features?.pauseRatio || 30}%`, 14, 154);
      doc.text(`Text Semantic Trauma: ${complaint.nlpAnalysis?.textTraumaScore || 30}%`, 14, 160);

      // Section 4: Summary & Transcript
      doc.line(14, 166, 196, 166);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Auto-Generated Executive Summary', 14, 173);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const splitSummary = doc.splitTextToSize(complaint.autoSummary || 'Summary pending officer review.', 180);
      doc.text(splitSummary, 14, 180);

      const yTranscript = 182 + (splitSummary.length * 5);
      doc.setFont('helvetica', 'bold');
      doc.text('Spoken Testimony Transcript:', 14, yTranscript);
      doc.setFont('helvetica', 'normal');
      const splitTranscript = doc.splitTextToSize(`"${complaint.transcript || 'No transcript text.'}"`, 180);
      doc.text(splitTranscript, 14, yTranscript + 6);

      // Section 5: Recommended Supports
      const ySupport = yTranscript + 8 + (splitTranscript.length * 5);
      doc.line(14, ySupport, 196, ySupport);
      doc.setFont('helvetica', 'bold');
      doc.text('5. AI Recommended Support & Emergency Directives', 14, ySupport + 7);
      doc.setFont('helvetica', 'normal');

      let currentY = ySupport + 13;
      (risk.recommendedSupport || []).forEach((sup) => {
        doc.text(`• ${sup.type}: ${sup.description} (Helpline: ${sup.contact})`, 16, currentY);
        currentY += 6;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('This is a computer-generated digital legal receipt under the NHAA Automated Grievance Redressal Architecture.', 14, 285);
      doc.text(`Official Verification URL: ${qrData}`, 14, 290);

      doc.save(`NHAA_Complaint_Receipt_${ticketId}.pdf`);
    } catch (e) {
      console.error('PDF error:', e);
      alert('Failed generating PDF: ' + e.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Top Confirmation Card */}
      <div className="glass-card" style={{ padding: '36px', textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
        <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.4)', marginBottom: '16px' }}>
          <CheckCircle2 size={46} color="#10b981" />
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Complaint Successfully Registered
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '560px', margin: '0 auto 20px auto' }}>
          Your spoken testimony has been transcribed, analyzed, and queued in the NHAA Nodal Command Center.
        </p>

        {/* Big Ticket ID Box */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', background: 'rgba(0, 0, 0, 0.45)', padding: '14px 24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glow)', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Trackable Ticket ID
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-cyan)', letterSpacing: '0.05em' }}>
              {ticketId}
            </div>
          </div>
          <button
            onClick={handleCopyTicket}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
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
            style={{ padding: '12px 24px' }}
          >
            <Download size={18} />
            {isGeneratingPdf ? 'Generating PDF...' : 'Download FIR-Ready Report (PDF)'}
          </button>

          <button
            onClick={() => onGoToTracker(ticketId)}
            className="btn-secondary"
            style={{ padding: '12px 24px' }}
          >
            <span>Track Status in Real-Time</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Critical Emergency Banner if High or Critical Risk */}
      {isCritical && (
        <div className="glass-card critical-pulse-box" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--risk-critical-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <ShieldAlert size={26} color="var(--risk-critical-text)" />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--risk-critical-text)' }}>
                Immediate Emergency Assistance Activated
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Our AI identified acute distress or life threat indicators. The nearest PCR unit and Nodal Atrocity Cell have been notified.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
            <a href="tel:112" style={{ textDecoration: 'none' }}>
              <button className="btn-danger" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <PhoneCall size={15} /> Dial 112 (Police Emergency)
              </button>
            </a>
            <a href="tel:14566" style={{ textDecoration: 'none' }}>
              <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <PhoneCall size={15} /> Dial 14566 (National Atrocity Helpline)
              </button>
            </a>
            <a href="tel:108" style={{ textDecoration: 'none' }}>
              <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <Ambulance size={15} /> Dial 108 (Medical Emergency)
              </button>
            </a>
          </div>
        </div>
      )}

      {/* AI Recommended Support Cards */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <HeartHandshake size={20} color="var(--accent-teal)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            AI-Recommended Parallel Support Services
          </h3>
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Based on our real-time assessment of your spoken testimony, the following support services have been matched to assist you immediately:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {(risk.recommendedSupport || []).map((support, idx) => (
            <div
              key={idx}
              className="glass-card"
              style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.03)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {support.type.includes('Police') ? <ShieldAlert size={18} color="#ef4444" /> :
                 support.type.includes('Medical') ? <Ambulance size={18} color="#f59e0b" /> :
                 <Scale size={18} color="#06b6d4" />}
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {support.type}
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {support.description}
              </p>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>
                {support.contact}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

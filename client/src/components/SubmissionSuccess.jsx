import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { CheckCircle2, Download, Copy, ExternalLink, PhoneCall, ShieldAlert, HeartHandshake, Scale, Ambulance, ArrowRight, ShieldCheck } from 'lucide-react';

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

      // Official Header Band (Gov Navy)
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('NATIONAL HELPLINE / APPLICATION FOR ATROCITIES (NHAA)', 14, 14);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Ministry of Social Justice & Empowerment, Government of India', 14, 22);
      doc.text('Real-Time Voice Trauma Assessment & Statutory Grievance Redressal', 14, 29);

      // QR Code in Header
      doc.addImage(qrDataUrl, 'PNG', 165, 3, 30, 30);

      // Ticket ID & Stamp
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`OFFICIAL COMPLAINT ACKNOWLEDGMENT DOCKET`, 14, 48);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`TICKET IDENTIFIER: `, 14, 56);
      doc.setFont('helvetica', 'bold');
      doc.text(`${ticketId}`, 62, 56);

      doc.setFont('helvetica', 'normal');
      doc.text(`LODGED AT: ${new Date(complaint.createdAt || Date.now()).toLocaleString()}`, 14, 63);
      doc.text(`STATUS: ${complaint.status || 'Submitted (Queued for Priority Triage)'}`, 14, 70);

      // Risk Triage Badge
      doc.setFillColor(isCritical ? 225 : 37, isCritical ? 29 : 99, isCritical ? 72 : 235);
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
      doc.text('4. Official Executive Summary', 14, 173);

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
      doc.text('5. AI Recommended Support & Directives', 14, ySupport + 7);
      doc.setFont('helvetica', 'normal');

      let currentY = ySupport + 13;
      (risk.recommendedSupport || []).forEach((sup) => {
        doc.text(`• ${sup.type}: ${sup.description} (Contact: ${sup.contact})`, 16, currentY);
        currentY += 6;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('This is a computer-generated digital legal receipt under the NHAA Automated Grievance Architecture.', 14, 285);
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
            style={{ padding: '12px 26px', fontSize: '0.96rem' }}
          >
            <Download size={18} />
            {isGeneratingPdf ? 'Generating PDF...' : 'Download Official FIR-Ready Report (PDF)'}
          </button>

          <button
            onClick={() => onGoToTracker(ticketId)}
            className="btn-secondary"
            style={{ padding: '12px 26px', fontSize: '0.96rem' }}
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

    </div>
  );
}

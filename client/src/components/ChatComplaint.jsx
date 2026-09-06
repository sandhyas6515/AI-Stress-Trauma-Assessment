import React, { useState, useEffect, useRef } from 'react';
import { Send, Shield, ShieldAlert, AlertTriangle, ArrowRight, RotateCcw, User, Bot, PhoneCall, Sparkles, MessageSquare, Volume2, Mic, ArrowLeft } from 'lucide-react';

const QUICK_PROMPTS = [
  "Accused is armed and threatening violence",
  "I am barricaded inside, need urgent police",
  "Physical assault and caste-based slurs",
  "Denial of drinking water and public well access",
  "Illegal land encroachment and eviction threats"
];

export default function ChatComplaint({ onProceedToReview, onBack, theme = 'dark' }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Namaste. I am your NHAA Grievance Assistant. You are in a safe, encrypted, and discrete space. If you are in danger or unable to speak out loud, you can type freely here.\n\nPlease tell me: What happened, and who was involved?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');
  const [liveTraumaScore, setLiveTraumaScore] = useState(25);
  const [liveRiskLevel, setLiveRiskLevel] = useState('Low');
  const [extractedAccused, setExtractedAccused] = useState('');
  const [extractedLocation, setExtractedLocation] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Real-time keyword scanning for live trauma gauge
  const updateTraumaSignals = (allText) => {
    const lower = allText.toLowerCase();
    let score = 20;
    let risk = 'Low';

    const criticalKw = ['kill', 'weapon', 'knife', 'gun', 'attack', 'bleeding', 'hospital', 'fire', 'burn', 'हथियार', 'चाकू', 'खून', 'गोली', 'आग', 'हत्या', 'जान से', 'lock'];
    const highKw = ['beat', 'assault', 'hit', 'caste', 'slur', 'break', 'threat', 'पीटा', 'मार', 'गाली', 'जाति'];

    let hasCrit = criticalKw.some(k => lower.includes(k));
    let hasHigh = highKw.some(k => lower.includes(k));

    if (hasCrit) {
      score = 92;
      risk = 'Critical';
    } else if (hasHigh) {
      score = 70;
      risk = 'High';
    } else if (allText.length > 50) {
      score = 45;
      risk = 'Moderate';
    }

    setLiveTraumaScore(score);
    setLiveRiskLevel(risk);
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');

    const newTranscript = (accumulatedTranscript + ' ' + text).trim();
    setAccumulatedTranscript(newTranscript);
    updateTraumaSignals(newTranscript);

    // AI Follow-up Response Logic
    setIsTyping(true);
    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();

      if (lower.includes('weapon') || lower.includes('kill') || lower.includes('knife') || lower.includes('चाकू') || lower.includes('खून') || lower.includes('lock') || lower.includes('police')) {
        reply = 'I have flagged this as an URGENT emergency. If you are barricaded or in immediate peril, stay silent and keep your screen dimmed. Nearest PCR patrol has been notified.\n\nCould you specify your exact location (village, street, or landmark)?';
      } else if (!extractedAccused && (lower.includes('name') || lower.includes('by') || lower.includes('sarpanch') || lower.includes('ने') || text.split(' ').length > 4)) {
        reply = 'Understood. We have noted this down. Could you also share your location or village/district name so the Jurisdictional Atrocity Cell can dispatch inquiry officers?';
      } else if (!extractedLocation && (lower.includes('village') || lower.includes('near') || lower.includes('district') || lower.includes('गाँव') || lower.includes('थाना'))) {
        reply = 'Location recorded. Do you require immediate medical aid or security escort right now? You can also click "Review & Proceed to Docket" at any time to submit.';
      } else {
        reply = 'Thank you for sharing. Your statement is being structured into an official grievance docket under the SC/ST (PoA) Act. Would you like to add any more details before official submission?';
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 900);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleProceedToReviewScreen = async () => {
    if (!accumulatedTranscript.trim()) {
      alert('Please share your complaint in the chat before reviewing.');
      return;
    }

    try {
      const res = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: accumulatedTranscript,
          language: 'hi',
          presetStressLevel: liveRiskLevel.toUpperCase()
        })
      });
      const data = await res.json();

      if (data.success) {
        onProceedToReview({
          ...data.data,
          rawAudioUrl: null,
          selectedLanguage: 'hi',
          selectedPreset: null
        });
      } else {
        alert('Error preparing docket: ' + data.error);
      }
    } catch (e) {
      alert('Error communicating with AI service: ' + e.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: '560px' }}>
      
      {/* Top Header Card with Live Triage Status */}
      <div className="exact-card" style={{ padding: '16px 20px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
            title="Back to Voice Mode"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Bot size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.96rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                NHAA Grievance Mitra (Silent Chat Assistant)
              </span>
              <span className="status-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.68rem', padding: '2px 8px' }}>
                Encrypted & Discrete
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Discrete text mode for complainants in danger or unable to speak out loud
            </div>
          </div>
        </div>

        {/* Live Trauma Meter Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
              Live Trauma Triage
            </div>
            <span className={`status-pill ${
              liveRiskLevel === 'Critical' ? 'badge-critical' :
              liveRiskLevel === 'High' ? 'badge-high' : 'badge-moderate'
            }`} style={{ fontSize: '0.74rem' }}>
              {liveRiskLevel.toUpperCase()} ({liveTraumaScore}/100)
            </span>
          </div>

          {liveRiskLevel === 'Critical' && (
            <a href="tel:112" style={{ textDecoration: 'none' }}>
              <button className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.76rem' }}>
                <PhoneCall size={12} /> Dial 112
              </button>
            </a>
          )}
        </div>
      </div>

      {/* Main Message Stream Box */}
      <div
        className="exact-card"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          marginBottom: '14px'
        }}
      >
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: '10px'
              }}
            >
              {!isUser && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-blue-subtle)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '4px' }}>
                  <Shield size={16} color="var(--accent-blue)" />
                </div>
              )}

              <div style={{ maxWidth: '78%' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isUser ? 'var(--accent-blue)' : 'var(--bg-card-subtle)',
                    color: isUser ? '#ffffff' : 'var(--text-primary)',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    border: isUser ? 'none' : '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-card)',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {m.text}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: isUser ? 'right' : 'left', padding: '0 4px' }}>
                  {m.timestamp}
                </div>
              </div>

              {isUser && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, marginTop: '4px' }}>
                  <User size={16} />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.82rem', padding: '4px 8px' }}>
            <Bot size={16} color="var(--accent-blue)" />
            <span>Assistant is structuring your statement...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '4px' }}>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '0.76rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.color = 'var(--accent-blue)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            + {prompt}
          </button>
        ))}
      </div>

      {/* Input Box & Submit Button */}
      <div className="exact-card" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="text"
          placeholder="Type your message silently here (or share incident details)..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontSize: '0.92rem',
            outline: 'none'
          }}
        />

        <button
          id="chat-send-btn"
          onClick={() => handleSendMessage()}
          disabled={!inputVal.trim()}
          style={{
            background: inputVal.trim() ? 'var(--accent-blue)' : 'var(--bg-card-subtle)',
            color: inputVal.trim() ? '#ffffff' : 'var(--text-muted)',
            border: 'none',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputVal.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          <Send size={16} />
        </button>

        {/* Proceed to Review Button */}
        <button
          id="chat-proceed-docket-btn"
          onClick={handleProceedToReviewScreen}
          disabled={!accumulatedTranscript.trim()}
          className="btn-primary"
          style={{
            padding: '9px 18px',
            fontSize: '0.84rem',
            opacity: accumulatedTranscript.trim() ? 1 : 0.5,
            cursor: accumulatedTranscript.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          <span>Review Docket</span>
          <ArrowRight size={14} />
        </button>
      </div>

    </div>
  );
}

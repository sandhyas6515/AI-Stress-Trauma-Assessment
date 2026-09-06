import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, ArrowRight, Activity, FileText, Shield, Clock, Users, ChevronDown, Sparkles } from 'lucide-react';
import LandmarkSilhouette from './LandmarkSilhouette';

const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'हिंदी (Hindi)', speechCode: 'hi-IN' },
  { code: 'en', name: 'English', speechCode: 'en-IN' },
  { code: 'mr', name: 'मराठी (Marathi)', speechCode: 'mr-IN' },
  { code: 'ta', name: 'தமிழ் (Tamil)', speechCode: 'ta-IN' },
  { code: 'bn', name: 'বাংলা (Bengali)', speechCode: 'bn-IN' }
];

export default function VoiceRecorder({ onProceedToReview, onNavigateTab, demoScenarios = [], theme = 'dark' }) {
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clientAudioMetrics, setClientAudioMetrics] = useState(null);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDemos, setShowDemos] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const audioElementRef = useRef(null);
  const durationTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const metricsCollectorRef = useRef({ energies: [], pauseCount: 0, totalFrames: 0 });

  useEffect(() => {
    return () => {
      stopRecording();
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      metricsCollectorRef.current = { energies: [], pauseCount: 0, totalFrames: 0 };
      setTranscript('');
      setInterimTranscript('');
      setAudioUrl(null);
      setAudioBlob(null);
      setSelectedPresetId('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        const metrics = metricsCollectorRef.current;
        if (metrics.totalFrames > 10) {
          const avgEnergy = metrics.energies.reduce((a, b) => a + b, 0) / metrics.energies.length;
          const pauseRatio = metrics.pauseCount / metrics.totalFrames;
          setClientAudioMetrics({
            rmsEnergy: Math.min(1.0, avgEnergy * 2.5),
            pauseRatio: Math.min(0.85, pauseRatio),
            pitchVolatility: 0.65
          });
        }
      };

      mediaRecorder.start(100);

      // Live STT
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);
        recognition.lang = currentLangObj ? currentLangObj.speechCode : 'hi-IN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let currentFinal = '';
          let currentInterim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const segment = event.results[i][0].transcript;
            if (event.results[i].isFinal) currentFinal += segment + ' ';
            else currentInterim += segment;
          }
          if (currentFinal) setTranscript(prev => (prev + ' ' + currentFinal).trim());
          setInterimTranscript(currentInterim);
        };

        try { recognition.start(); } catch (err) {}
      }

      setIsRecording(true);
      setRecordingDuration(0);
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Microphone access blocked. You can also select a sample case below to test immediately.');
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  };

  const handleTogglePlay = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePresetSelect = (preset) => {
    stopRecording();
    setSelectedPresetId(preset.id);
    setSelectedLanguage(preset.language);
    setTranscript(preset.transcript);
    setInterimTranscript('');
    setClientAudioMetrics({
      rmsEnergy: (preset.simulatedAudio.rmsEnergy || 50) / 100,
      pauseRatio: (preset.simulatedAudio.pauseRatio || 50) / 100,
      pitchVolatility: (preset.simulatedAudio.pitchVolatility || 50) / 100
    });
    setAudioUrl(null);
    setAudioBlob(null);
  };

  const handleProceed = async () => {
    const fullText = (transcript + ' ' + interimTranscript).trim();
    if (!fullText && !audioBlob && !selectedPresetId) {
      alert('Please speak your complaint or choose a test scenario.');
      return;
    }

    setIsProcessing(true);
    try {
      const selectedPreset = demoScenarios.find(s => s.id === selectedPresetId);
      const formData = new FormData();
      if (audioBlob) formData.append('audio', audioBlob, 'complaint.webm');
      formData.append('transcript', fullText || (selectedPreset ? selectedPreset.transcript : ''));
      formData.append('language', selectedLanguage);
      if (clientAudioMetrics) formData.append('clientAudioMetrics', JSON.stringify(clientAudioMetrics));
      if (selectedPreset) {
        formData.append('presetStressLevel', selectedPreset.presetStressLevel);
        if (selectedPreset.victim) formData.append('victim', JSON.stringify(selectedPreset.victim));
      }

      const res = await fetch('/api/voice/process', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        onProceedToReview({
          ...data.data,
          rawAudioUrl: audioUrl,
          selectedLanguage,
          selectedPreset
        });
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Network error connecting to analysis engine.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="animate-fade-in" style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto', minHeight: '620px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      
      {/* Top Language Pill & Demo Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', padding: '5px 14px', borderRadius: '9999px', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>Language / भाषा:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={isRecording}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontWeight: '700',
              cursor: 'pointer',
              outline: 'none',
              fontSize: '0.82rem'
            }}
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowDemos(!showDemos)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '9999px',
            padding: '5px 14px',
            fontSize: '0.8rem',
            color: 'var(--accent-blue)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600'
          }}
        >
          <Sparkles size={13} />
          <span>{showDemos ? 'Hide Samples' : 'Test Samples'}</span>
        </button>
      </div>

      {/* Main Hero Center Area matching Screenshot */}
      <div style={{ textAlign: 'center', margin: '30px 0 40px 0', position: 'relative', zIndex: 1 }}>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.02em' }}>
          Namaste!
        </h1>
        
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 36px auto', lineHeight: '1.5' }}>
          Your voice matters. Share your complaint<br />
          and help us build a better tomorrow.
        </p>

        {/* Central Circular Mic with Exact Concentric Halos */}
        <div className={`mic-halo-container ${isRecording ? 'recording-active' : ''}`}>
          <div className="mic-outer-ring" />
          <div className="mic-middle-ring" />
          <button
            id="mic-main-trigger-btn"
            onClick={isRecording ? stopRecording : startRecording}
            className="mic-core-btn"
            title={isRecording ? 'Click to stop' : 'Click to speak'}
          >
            {isRecording ? <Square size={34} /> : <Mic size={40} />}
          </button>
        </div>

        {/* Sub-label matching screenshot */}
        <div style={{ marginTop: '18px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
          {isRecording ? (
            <span style={{ color: '#e11d48', fontWeight: '700' }}>
              ● Recording... ({formatSeconds(recordingDuration)}) — Tap to finish
            </span>
          ) : (
            'Tap to raise a complaint'
          )}
        </div>

        {/* Live Audio Playback Bar if recorded */}
        {audioUrl && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', padding: '8px 18px', borderRadius: '9999px', border: '1px solid var(--border-color)', marginTop: '20px' }}>
            <button
              onClick={handleTogglePlay}
              style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Recorded statement</span>
            <audio ref={audioElementRef} src={audioUrl} onEnded={() => setIsPlaying(false)} style={{ display: 'none' }} />
            <button
              onClick={startRecording}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem' }}
            >
              <RotateCcw size={13} /> Re-record
            </button>
          </div>
        )}

        {/* Live Speech-to-Text Transcript Box (if user has spoken or selected) */}
        {(transcript || interimTranscript) && (
          <div style={{ maxWidth: '620px', margin: '24px auto 0 auto', textAlign: 'left', background: 'var(--bg-card)', borderRadius: '14px', padding: '16px 20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                Captured Voice Transcript
              </span>
              <span className="status-pill badge-moderate" style={{ fontSize: '0.68rem' }}>
                AI Speech Recognized
              </span>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
              {transcript}
              {interimTranscript && <span style={{ color: 'var(--accent-blue)', opacity: 0.8 }}> {interimTranscript}</span>}
            </p>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                id="review-voice-btn"
                onClick={handleProceed}
                className="btn-primary"
                disabled={isProcessing}
                style={{ padding: '8px 20px', fontSize: '0.86rem' }}
              >
                {isProcessing ? 'Analyzing Trauma...' : 'Proceed to Docket Review →'}
              </button>
            </div>
          </div>
        )}

        {/* Sample Case Drawer if toggled */}
        {showDemos && (
          <div style={{ maxWidth: '780px', margin: '24px auto 0 auto', textAlign: 'left', background: 'var(--bg-card)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Standard Grievance Simulation Testbeds (Click to Test):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {demoScenarios.map(sc => (
                <div
                  key={sc.id}
                  onClick={() => handlePresetSelect(sc)}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: selectedPresetId === sc.id ? 'var(--accent-blue-subtle)' : 'var(--bg-surface)',
                    border: `1px solid ${selectedPresetId === sc.id ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', fontWeight: '700' }}>
                    {sc.tag} • {sc.languageName}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {sc.title.replace(/Scenario \d[A-Z]?: /, '')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Subtle Landmark Silhouette in the background */}
      <LandmarkSilhouette theme={theme} />

      {/* Bottom 4-Card Container (Matching screenshot exactly) */}
      <div
        className="exact-card"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          padding: '24px 16px',
          marginTop: 'auto',
          textAlign: 'center'
        }}
      >
        {/* Card 1: Track Your Complaint */}
        <div
          onClick={() => onNavigateTab('track')}
          style={{
            cursor: 'pointer',
            padding: '8px 12px',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <FileText size={22} color="var(--accent-blue)" />
          <div style={{ fontSize: '0.86rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.3' }}>
            Track<br />Your Complaint
          </div>
        </div>

        {/* Card 2: Transparent Process */}
        <div
          onClick={() => onNavigateTab('official')}
          style={{
            cursor: 'pointer',
            padding: '8px 12px',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Shield size={22} color="var(--accent-blue)" />
          <div style={{ fontSize: '0.86rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.3' }}>
            Transparent<br />Process
          </div>
        </div>

        {/* Card 3: Quick Resolution */}
        <div
          onClick={() => onNavigateTab('analytics')}
          style={{
            cursor: 'pointer',
            padding: '8px 12px',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Clock size={22} color="var(--accent-blue)" />
          <div style={{ fontSize: '0.86rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.3' }}>
            Quick<br />Resolution
          </div>
        </div>

        {/* Card 4: For a Better Tomorrow */}
        <div
          onClick={() => {
            if (transcript) handleProceed();
            else alert('Speak your statement or load a sample scenario above to submit.');
          }}
          style={{
            cursor: 'pointer',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Users size={22} color="var(--accent-blue)" />
          <div style={{ fontSize: '0.86rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.3' }}>
            For a Better<br />Tomorrow
          </div>
        </div>
      </div>

    </div>
  );
}

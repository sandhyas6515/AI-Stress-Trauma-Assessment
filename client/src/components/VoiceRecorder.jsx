import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, ArrowRight, Activity, ShieldCheck, Volume2, ShieldAlert, Sparkles, Lock, Headphones } from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'हिंदी (Hindi)', speechCode: 'hi-IN' },
  { code: 'en', name: 'English (Indian)', speechCode: 'en-IN' },
  { code: 'mr', name: 'मराठी (Marathi)', speechCode: 'mr-IN' },
  { code: 'ta', name: 'தமிழ் (Tamil)', speechCode: 'ta-IN' },
  { code: 'bn', name: 'বাংলা (Bengali)', speechCode: 'bn-IN' }
];

export default function VoiceRecorder({ onProceedToReview, demoScenarios = [] }) {
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

  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const audioElementRef = useRef(null);
  const durationTimerRef = useRef(null);
  const metricsCollectorRef = useRef({ energies: [], pauseCount: 0, totalFrames: 0 });

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, []);

  // Draw idle canvas waveform
  useEffect(() => {
    if (!isRecording && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      for (let x = 0; x < width; x += 4) {
        const y = height / 2 + Math.sin(x * 0.05) * 3;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      metricsCollectorRef.current = { energies: [], pauseCount: 0, totalFrames: 0 };
      setTranscript('');
      setInterimTranscript('');
      setAudioUrl(null);
      setAudioBlob(null);
      setSelectedPresetId('');

      // 1. Microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Web Audio Analyser
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // 3. MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
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
          let energyDeltas = 0;
          for (let i = 1; i < metrics.energies.length; i++) {
            energyDeltas += Math.abs(metrics.energies[i] - metrics.energies[i - 1]);
          }
          const pitchVolatility = Math.min(0.95, (energyDeltas / metrics.energies.length) * 4);

          setClientAudioMetrics({
            rmsEnergy: Math.min(1.0, avgEnergy * 2.5),
            pauseRatio: Math.min(0.85, pauseRatio),
            pitchVolatility: Math.max(0.15, pitchVolatility)
          });
        }
      };

      mediaRecorder.start(100);

      // 4. Live Speech Recognition
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
            const transcriptSegment = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              currentFinal += transcriptSegment + ' ';
            } else {
              currentInterim += transcriptSegment;
            }
          }

          if (currentFinal) {
            setTranscript(prev => (prev + ' ' + currentFinal).trim());
          }
          setInterimTranscript(currentInterim);
        };

        try {
          recognition.start();
        } catch (err) {
          console.warn('Recognition start error:', err);
        }
      }

      setIsRecording(true);
      setRecordingDuration(0);
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);

      drawWaveform();
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Microphone access unavailable or blocked. You can also select one of the "Demonstration Case Audits" below for evaluation.');
    }
  };

  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteTimeDomainData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / bufferLength);
      metricsCollectorRef.current.energies.push(rms);
      metricsCollectorRef.current.totalFrames++;
      if (rms < 0.04) {
        metricsCollectorRef.current.pauseCount++;
      }

      // Draw subtle elegant blue/cyan wave
      ctx.lineWidth = 2.5;
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#2563eb');
      gradient.addColorStop(0.5, '#60a5fa');
      gradient.addColorStop(1, '#34d399');
      ctx.strokeStyle = gradient;

      ctx.beginPath();
      const sliceWidth = (width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    render();
  };

  const stopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
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

  const handleProceed = async () => {
    const fullText = (transcript + ' ' + interimTranscript).trim();
    if (!fullText && !audioBlob) {
      alert('Please speak your grievance or select a sample scenario below.');
      return;
    }

    setIsProcessing(true);
    try {
      const selectedPreset = demoScenarios.find(s => s.id === selectedPresetId);
      const formData = new FormData();
      if (audioBlob) {
        formData.append('audio', audioBlob, 'complaint-voice.webm');
      }
      formData.append('transcript', fullText || (selectedPreset ? selectedPreset.transcript : ''));
      formData.append('language', selectedLanguage);
      if (clientAudioMetrics) {
        formData.append('clientAudioMetrics', JSON.stringify(clientAudioMetrics));
      }
      if (selectedPreset) {
        formData.append('presetStressLevel', selectedPreset.presetStressLevel);
        if (selectedPreset.victim) {
          formData.append('victim', JSON.stringify(selectedPreset.victim));
        }
      }

      const res = await fetch('/api/voice/process', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        onProceedToReview({
          ...data.data,
          rawAudioUrl: audioUrl,
          selectedLanguage,
          selectedPreset
        });
      } else {
        alert('Analysis error: ' + data.error);
      }
    } catch (err) {
      console.error('Error processing statement:', err);
      alert('Network error connecting to AI analysis engine. Ensure server is running.');
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
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Empathetic Institutional Header Card */}
      <div className="glass-card" style={{ padding: '24px 28px', marginBottom: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="status-pill" style={{ background: 'rgba(37, 99, 235, 0.12)', color: 'var(--primary-blue)', fontSize: '0.72rem' }}>
                <ShieldCheck size={13} /> Official Statutory Grievance Gateway
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SC/ST (PoA) Act Protection</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              अपनी भाषा में बोलें — हम सुन रहे हैं
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '4px' }}>
              No forms or typing required. Speak naturally in your own regional language. The system assesses distress signals and extracts legal facts in real time.
            </p>
          </div>

          {/* Language Selection */}
          <div style={{ background: 'var(--bg-surface-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '700', textTransform: 'uppercase' }}>
              Select Spoken Language / भाषा
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={isRecording}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-xs)',
                padding: '7px 12px',
                color: 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '0.88rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Voice Recording Console */}
      <div className="glass-card" style={{ padding: '36px 32px', textAlign: 'center', marginBottom: '24px' }}>
        
        {/* Live Acoustic Waveform Visualizer */}
        <div style={{ marginBottom: '26px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '14px 18px', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
              <Activity size={14} color="var(--primary-blue)" /> Real-Time Acoustic Harmonics & Pitch Monitor
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: isRecording ? 'var(--risk-critical-text)' : 'var(--text-muted)' }}>
              {isRecording ? `● RECORDING (${formatSeconds(recordingDuration)})` : 'AUDIO CHANNEL STANDBY'}
            </span>
          </div>
          <canvas
            ref={canvasRef}
            width={760}
            height={85}
            style={{ width: '100%', height: '85px', display: 'block' }}
          />
        </div>

        {/* Central Tactile Record Button */}
        <div style={{ margin: '28px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {!isRecording ? (
            <button
              id="start-recording-btn"
              onClick={startRecording}
              className="mic-btn-idle"
            >
              <Mic size={38} />
              <span style={{ fontSize: '0.72rem', fontWeight: '800', marginTop: '6px', letterSpacing: '0.04em' }}>
                TAP TO SPEAK
              </span>
            </button>
          ) : (
            <button
              id="stop-recording-btn"
              onClick={stopRecording}
              className="mic-btn-recording"
            >
              <Square size={32} />
              <span style={{ fontSize: '0.72rem', fontWeight: '800', marginTop: '6px' }}>
                TAP TO STOP
              </span>
            </button>
          )}
        </div>

        {/* User Guidance */}
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
          {isRecording ? (
            <span style={{ color: 'var(--primary-blue)', fontWeight: '700' }}>
              Listening... Tell us what happened, who committed the atrocity, and where you are located.
            </span>
          ) : (
            <span>Tap the microphone to speak your statement, or select one of the audit test scenarios below.</span>
          )}
        </p>

        {/* Audio Replay bar if recorded */}
        {audioUrl && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'var(--bg-surface)', padding: '10px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
            <button
              onClick={handleTogglePlay}
              style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Listen to Recorded Audio Testimony</span>
            <audio
              ref={audioElementRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              style={{ display: 'none' }}
            />
            <button
              onClick={startRecording}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', marginLeft: '12px' }}
            >
              <RotateCcw size={14} /> Re-record
            </button>
          </div>
        )}

        {/* Live Speech-to-Text Transcript Box */}
        <div style={{ textAlign: 'left', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '18px 20px', border: '1px solid var(--border-glass)', minHeight: '95px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Speech-to-Text Live Transcript (वाक् से पाठ)
            </span>
            {isRecording && (
              <span className="status-pill" style={{ background: 'rgba(37, 99, 235, 0.15)', color: 'var(--primary-blue)', fontSize: '0.68rem' }}>
                <Volume2 size={12} /> Live Streaming
              </span>
            )}
          </div>
          <p style={{ color: transcript ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', fontStyle: transcript ? 'normal' : 'italic' }}>
            {transcript || interimTranscript || 'Your spoken words will appear here in real time...'}
            {interimTranscript && (
              <span style={{ color: 'var(--primary-blue)', opacity: 0.8 }}> {interimTranscript}</span>
            )}
          </p>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            id="proceed-review-btn"
            className="btn-primary"
            onClick={handleProceed}
            disabled={isProcessing || isRecording || (!transcript && !audioBlob && !selectedPresetId)}
            style={{
              opacity: (transcript || audioBlob || selectedPresetId) && !isRecording ? 1 : 0.5,
              cursor: (transcript || audioBlob || selectedPresetId) && !isRecording ? 'pointer' : 'not-allowed',
              padding: '12px 28px',
              fontSize: '0.98rem'
            }}
          >
            {isProcessing ? (
              <span>Analyzing Trauma Signals & Legal Entities...</span>
            ) : (
              <>
                <span>Review & Proceed to Verification</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Case Scenarios (Renamed & Refined: Standard Grievance Simulation Testbeds) */}
      <div className="glass-card" style={{ padding: '26px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Headphones size={18} color="var(--primary-blue)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            Standard Grievance Simulation Testbeds (System Audit Scenarios)
          </h3>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Audit the real-time difference between panicked vocal distress vs calm reporting tone, or test regional linguistic coverage:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {demoScenarios.map((scenario) => {
            const isSelected = selectedPresetId === scenario.id;
            return (
              <div
                key={scenario.id}
                onClick={() => handlePresetSelect(scenario)}
                className="glass-card glass-card-interactive"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--primary-blue)' : 'var(--border-glass)',
                  background: isSelected ? 'var(--risk-moderate-bg)' : 'var(--bg-surface-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className={`status-pill ${
                    scenario.presetStressLevel === 'CRITICAL' ? 'badge-critical' :
                    scenario.presetStressLevel === 'HIGH' ? 'badge-high' : 'badge-moderate'
                  }`} style={{ fontSize: '0.68rem' }}>
                    {scenario.tag}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '600' }}>{scenario.languageName}</span>
                </div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {scenario.title.replace('Scenario 1A: ', '').replace('Scenario 1B: ', '').replace('Scenario 2: ', '').replace('Scenario 3: ', '')}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  "{scenario.transcript}"
                </p>
                <div style={{ marginTop: '10px', fontSize: '0.74rem', color: 'var(--primary-blue)', fontWeight: '700' }}>
                  {isSelected ? '✓ Loaded for Official Triage' : 'Select Case Testbed →'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

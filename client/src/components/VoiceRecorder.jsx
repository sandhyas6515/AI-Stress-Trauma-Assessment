import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, ArrowRight, Activity, Sparkles, Volume2, ShieldAlert } from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'Hindi (हिंदी)', speechCode: 'hi-IN' },
  { code: 'en', name: 'English', speechCode: 'en-IN' },
  { code: 'mr', name: 'Marathi (मराठी)', speechCode: 'mr-IN' },
  { code: 'ta', name: 'Tamil (தமிழ்)', speechCode: 'ta-IN' },
  { code: 'bn', name: 'Bengali (বাংলা)', speechCode: 'bn-IN' }
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
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(true);

  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const audioElementRef = useRef(null);
  const durationTimerRef = useRef(null);
  const metricsCollectorRef = useRef({ energies: [], zeroCrossings: [], pauseCount: 0, totalFrames: 0 });

  // Check speech recognition capability
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechRecognitionSupported(false);
    }
  }, []);

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
        const y = height / 2 + Math.sin(x * 0.04) * 2;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      metricsCollectorRef.current = { energies: [], zeroCrossings: [], pauseCount: 0, totalFrames: 0 };
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

        // Compute client-side audio analysis metrics
        const metrics = metricsCollectorRef.current;
        if (metrics.totalFrames > 10) {
          const avgEnergy = metrics.energies.reduce((a, b) => a + b, 0) / metrics.energies.length;
          const pauseRatio = metrics.pauseCount / metrics.totalFrames;
          // compute pitch volatility from energy deltas
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

        recognition.onerror = (e) => {
          console.warn('Speech recognition warning:', e.error);
        };

        try {
          recognition.start();
        } catch (err) {
          console.warn('Recognition start caught:', err);
        }
      }

      // 5. Visualizer Canvas loop
      setIsRecording(true);
      setRecordingDuration(0);
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);

      drawWaveform();
    } catch (err) {
      console.error('Error opening microphone:', err);
      alert('Microphone access unavailable or denied. You can also select one of the "Preset Demo Scenarios" below to evaluate immediately!');
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

      // Acoustic metric tracking
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

      // Draw dynamic visual wave
      ctx.lineWidth = 3;
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#06b6d4');
      gradient.addColorStop(0.5, '#6366f1');
      gradient.addColorStop(1, '#14b8a6');
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
      alert('Please speak your complaint or choose one of the preset scenarios below.');
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
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Intro Banner */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="status-pill badge-critical" style={{ fontSize: '0.72rem' }}>
                <ShieldAlert size={13} /> 24x7 NHAA Emergency Voice Gateway
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PS ID: 26093</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Speak Freely in Your Language
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '4px' }}>
              No typing needed. Speak in your natural voice. Our dual AI assesses distress signals and legal details in real time.
            </p>
          </div>

          {/* Language Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
              CHOOSE LANGUAGE / भाषा चुनें
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={isRecording}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} style={{ background: '#1e293b' }}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Recording Console */}
      <div className="glass-card" style={{ padding: '36px', textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
        {/* Waveform Visualizer Canvas */}
        <div style={{ marginBottom: '24px', background: 'rgba(0, 0, 0, 0.35)', borderRadius: 'var(--radius-md)', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} color="var(--accent-cyan)" /> Live Acoustic Waveform & Pitch Monitor
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: isRecording ? 'var(--risk-critical-text)' : 'var(--text-muted)' }}>
              {isRecording ? `● REC ${formatSeconds(recordingDuration)}` : 'READY TO RECORD'}
            </span>
          </div>
          <canvas
            ref={canvasRef}
            width={720}
            height={90}
            style={{ width: '100%', height: '90px', display: 'block' }}
          />
        </div>

        {/* Big Pulse Mic Button */}
        <div style={{ margin: '30px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {!isRecording ? (
            <button
              id="start-recording-btn"
              onClick={startRecording}
              className="glass-card-interactive"
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(6, 182, 212, 0.45)',
                color: '#fff',
                transition: 'all 0.25s ease'
              }}
            >
              <Mic size={38} />
              <span style={{ fontSize: '0.72rem', fontWeight: '700', marginTop: '4px', letterSpacing: '0.04em' }}>TAP TO SPEAK</span>
            </button>
          ) : (
            <button
              id="stop-recording-btn"
              onClick={stopRecording}
              className="mic-recording-pulse"
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                border: '3px solid rgba(255, 255, 255, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                boxShadow: '0 8px 30px rgba(239, 68, 68, 0.5)'
              }}
            >
              <Square size={34} />
              <span style={{ fontSize: '0.72rem', fontWeight: '700', marginTop: '4px' }}>TAP TO STOP</span>
            </button>
          )}
        </div>

        {/* Instructions */}
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
          {isRecording ? (
            <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>
              Listening... Tell us what happened, who was involved, and your current location.
            </span>
          ) : (
            <span>Tap the microphone to speak, or select one of the test scenarios below.</span>
          )}
        </p>

        {/* Audio Replay bar if recorded */}
        {audioUrl && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.06)', padding: '10px 18px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
            <button
              onClick={handleTogglePlay}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {isPlaying ? <Pause size={20} color="var(--accent-cyan)" /> : <Play size={20} color="var(--accent-cyan)" />}
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Recorded Voice Testimony</span>
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

        {/* Live Transcript Display Box */}
        <div style={{ textAlign: 'left', background: 'rgba(0, 0, 0, 0.4)', borderRadius: 'var(--radius-md)', padding: '18px', border: '1px solid rgba(255, 255, 255, 0.08)', minHeight: '90px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Real-Time Speech-to-Text Transcript
            </span>
            {isRecording && (
              <span className="status-pill" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', fontSize: '0.7rem' }}>
                <Volume2 size={12} /> Streaming
              </span>
            )}
          </div>
          <p style={{ color: transcript ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', fontStyle: transcript ? 'normal' : 'italic' }}>
            {transcript || interimTranscript || 'Your spoken words will appear here in real time...'}
            {interimTranscript && (
              <span style={{ color: 'var(--accent-cyan)', opacity: 0.8 }}> {interimTranscript}</span>
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
              fontSize: '1rem'
            }}
          >
            {isProcessing ? (
              <span>Analyzing Trauma & Distress...</span>
            ) : (
              <>
                <span>Review Assessment & Submit</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Evaluation Scenarios Box (Essential for SIH Judges and Paired Demonstration) */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Sparkles size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Or Try Live Evaluation Scenarios (SIH Demo Presets)
          </h3>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Test the difference between panicked vocal distress vs calm delivery, or evaluate regional language complaints:
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
                  borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-glass)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className={`status-pill ${
                    scenario.presetStressLevel === 'CRITICAL' ? 'badge-critical' :
                    scenario.presetStressLevel === 'HIGH' ? 'badge-high' : 'badge-moderate'
                  }`} style={{ fontSize: '0.68rem' }}>
                    {scenario.tag}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{scenario.languageName}</span>
                </div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {scenario.title}
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  "{scenario.transcript}"
                </p>
                <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                  {isSelected ? '✓ Selected for Assessment' : 'Click to Load Sample →'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

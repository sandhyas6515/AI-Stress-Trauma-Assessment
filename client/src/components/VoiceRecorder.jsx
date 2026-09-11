import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Square, Play, Pause, RotateCcw, ArrowRight, Activity, 
  FileText, Shield, Clock, Users, ChevronDown, Sparkles, 
  MessageSquare, Edit3, Check, Trash2, Volume2, AlertCircle, RefreshCw 
} from 'lucide-react';
import LandmarkSilhouette from './LandmarkSilhouette';

const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'हिंदी (Hindi)', speechCode: 'hi-IN', hint: 'Best for pure Hindi / Devanagari' },
  { code: 'en', name: 'English (Indian / Hinglish)', speechCode: 'en-IN', hint: 'Fastest pickup for English & mixed words' },
  { code: 'mr', name: 'मराठी (Marathi)', speechCode: 'mr-IN', hint: 'Marathi dialect' },
  { code: 'ta', name: 'தமிழ் (Tamil)', speechCode: 'ta-IN', hint: 'Tamil speech' },
  { code: 'bn', name: 'বাংলা (Bengali)', speechCode: 'bn-IN', hint: 'Bengali speech' }
];

const QUICK_VOICE_TEMPLATES = [
  { label: 'Caste Abuse / जातिसूचक गाली', text: 'गाँव के कुछ लोगों ने मुझे और मेरे परिवार को सार्वजनिक स्थान पर जातिसूचक गालियाँ दीं और जान से मारने की धमकी दी। हमें तुरंत सुरक्षा और एफआईआर की आवश्यकता है।' },
  { label: 'Land Dispute / ज़मीन विवाद', text: 'हमारी पुश्तैनी ज़मीन पर दबंगों द्वारा अवैध कब्जा किया जा रहा है और हमें गाँव से बेदखल करने की धमकी दी जा रही है। इस पर तुरंत कानूनी कार्रवाई की जाए।' },
  { label: 'Water Denial / पानी रोकने की शिकायत', text: 'सार्वजनिक सरकारी हैंडपंप और कुएं से हमें पानी भरने से रोका जा रहा है और मारपीट की जा रही है। हम बुनियादी सुविधाओं से वंचित हैं।' },
  { label: 'Physical Assault / मारपीट व हमला', text: 'कल रात पंचायत के पास हमारे घर पर हमला हुआ और लाठी-डंडों से मारपीट की गई जिसमें दो लोग घायल हैं। कृपया तुरंत सहायता भेजें।' }
];

export default function VoiceRecorder({ onProceedToReview, onNavigateTab, demoScenarios = [], theme = 'dark' }) {
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isVoiceDetected, setIsVoiceDetected] = useState(false);
  const [voiceRmsLevel, setVoiceRmsLevel] = useState(0);
  const [speechEngineStatus, setSpeechEngineStatus] = useState('ready');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
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
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const isRecordingRef = useRef(false);
  const isRecognitionStartingRef = useRef(false);
  const isRecognitionRunningRef = useRef(false);
  const finalTranscriptRef = useRef('');
  const metricsCollectorRef = useRef({ energies: [], pauseCount: 0, totalFrames: 0 });

  useEffect(() => {
    return () => {
      stopRecording();
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // 60FPS Dynamic Real-time Equalizer Waveform on Canvas (0ms Latency)
  const startVisualizer = () => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecordingRef.current) return;
      animFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(timeArray);

      // Compute instant RMS sound energy
      let sumSquares = 0;
      for (let i = 0; i < timeArray.length; i++) {
        const norm = (timeArray[i] - 128) / 128;
        sumSquares += norm * norm;
      }
      const rms = Math.sqrt(sumSquares / timeArray.length);
      const speaking = rms > 0.025;
      setIsVoiceDetected(speaking);
      setVoiceRmsLevel(Math.min(100, Math.round(rms * 280)));

      // Collect metrics for backend acoustic analysis
      const metrics = metricsCollectorRef.current;
      metrics.totalFrames++;
      metrics.energies.push(rms);
      if (!speaking) metrics.pauseCount++;

      // Canvas Rendering
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const barCount = 28;
        const barWidth = 4;
        const barGap = 4;
        const totalW = barCount * (barWidth + barGap) - barGap;
        const startX = (width - totalW) / 2;

        for (let i = 0; i < barCount; i++) {
          const binIndex = Math.floor((i / barCount) * (bufferLength / 3));
          const freqVal = dataArray[binIndex] || 0;
          const normalized = freqVal / 255;
          const barHeight = Math.max(4, normalized * height * 0.9);

          const x = startX + i * (barWidth + barGap);
          const y = (height - barHeight) / 2;

          ctx.fillStyle = speaking
            ? (normalized > 0.45 ? '#2563eb' : '#38bdf8')
            : 'rgba(148, 163, 184, 0.35)';

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, barHeight, 2);
          } else {
            ctx.rect(x, y, barWidth, barHeight);
          }
          ctx.fill();
        }
      }
    };

    draw();
  };

  // Robust, Non-Colliding Web Speech API Initializer
  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechEngineStatus('not-supported');
      return null;
    }

    if (recognitionRef.current) {
      return recognitionRef.current;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isRecognitionRunningRef.current = true;
      isRecognitionStartingRef.current = false;
      setSpeechEngineStatus('listening');
    };

    recognition.onspeechstart = () => {
      setSpeechEngineStatus('speaking');
    };

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const piece = event.results[i][0].transcript.trim();
          if (piece) {
            finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + piece).trim();
          }
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscriptRef.current);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.warn('SpeechRecognition error:', event.error);
      if (event.error === 'no-speech') {
        setSpeechEngineStatus('listening');
      } else if (event.error === 'aborted') {
        isRecognitionRunningRef.current = false;
        isRecognitionStartingRef.current = false;
      } else if (event.error === 'network') {
        setSpeechEngineStatus('network-error');
        isRecognitionRunningRef.current = false;
        isRecognitionStartingRef.current = false;
      } else if (event.error === 'not-allowed') {
        setSpeechEngineStatus('not-allowed');
        isRecognitionRunningRef.current = false;
        isRecognitionStartingRef.current = false;
      } else {
        isRecognitionRunningRef.current = false;
        isRecognitionStartingRef.current = false;
      }
    };

    recognition.onend = () => {
      isRecognitionRunningRef.current = false;
      isRecognitionStartingRef.current = false;

      // Clean delayed auto-restart without rapid collision loops
      if (isRecordingRef.current) {
        setTimeout(() => {
          if (isRecordingRef.current && !isRecognitionRunningRef.current && !isRecognitionStartingRef.current) {
            try {
              isRecognitionStartingRef.current = true;
              recognition.start();
            } catch (e) {
              isRecognitionStartingRef.current = false;
            }
          }
        }, 180);
      } else {
        setSpeechEngineStatus('ready');
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  };

  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    const rec = initSpeechRecognition();
    if (rec) {
      const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === newLang);
      rec.lang = currentLangObj ? currentLangObj.speechCode : 'hi-IN';
      if (isRecordingRef.current && isRecognitionRunningRef.current) {
        try {
          rec.stop(); // onend will auto-restart with the new language
        } catch (e) {}
      }
    }
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      metricsCollectorRef.current = { energies: [], pauseCount: 0, totalFrames: 0 };
      finalTranscriptRef.current = '';
      setTranscript('');
      setInterimTranscript('');
      setAudioUrl(null);
      setAudioBlob(null);
      setSelectedPresetId('');
      setIsEditingTranscript(false);
      setSpeechEngineStatus('listening');

      // 1. Safe mic access with resilient fallback
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (constraintErr) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      // 2. Audio Context & Analyser
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // 3. MediaRecorder
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

      mediaRecorder.start(500);

      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start zero-latency visualizer immediately
      startVisualizer();

      // 4. Start Speech Recognition cleanly
      const rec = initSpeechRecognition();
      if (rec) {
        const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);
        rec.lang = currentLangObj ? currentLangObj.speechCode : 'hi-IN';
        if (!isRecognitionRunningRef.current && !isRecognitionStartingRef.current) {
          try {
            isRecognitionStartingRef.current = true;
            rec.start();
          } catch (e) {
            isRecognitionStartingRef.current = false;
          }
        }
      }

      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Microphone error: ' + (err.message || 'Microphone access blocked. Please allow mic permissions in your browser.'));
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setIsVoiceDetected(false);
    setSpeechEngineStatus('ready');

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }

    if (recognitionRef.current && isRecognitionRunningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
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
    finalTranscriptRef.current = preset.transcript;
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

  const handleApplyQuickTemplate = (tplText) => {
    finalTranscriptRef.current = tplText;
    setTranscript(tplText);
    setInterimTranscript('');
  };

  const handleProceed = async () => {
    const fullText = (transcript + ' ' + interimTranscript).trim();
    if (!fullText && !audioBlob && !selectedPresetId) {
      alert('Please speak your complaint, type details, or choose a test scenario.');
      return;
    }

    setIsProcessing(true);
    try {
      const selectedPreset = demoScenarios.find(s => s.id === selectedPresetId);
      const formData = new FormData();
      if (audioBlob) formData.append('audio', audioBlob, 'complaint.webm');
      formData.append('transcript', fullText || (selectedPreset ? selectedPreset.transcript : 'Voice Statement Recorded'));
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
      
      {/* Top Controls: Mode Switcher (Voice / Chat) + Language Pill + Samples */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        
        {/* Mode Toggle: Voice vs Chat */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '3px', borderRadius: '9999px', border: '1px solid var(--border-color)' }}>
          <button
            style={{
              background: 'var(--accent-blue)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              padding: '5px 14px',
              fontSize: '0.78rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'default'
            }}
          >
            <Mic size={13} />
            <span>Voice Mode</span>
          </button>
          
          <button
            id="switch-to-chat-mode-btn"
            onClick={() => onNavigateTab('chat')}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: 'none',
              borderRadius: '9999px',
              padding: '5px 14px',
              fontSize: '0.78rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
            title="Switch to Silent / Discrete Chat Mode"
          >
            <MessageSquare size={13} />
            <span>Silent Chat Mode</span>
          </button>
        </div>

        {/* Demo Toggle */}
        <button
          onClick={() => setShowDemos(!showDemos)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '9999px',
            padding: '5px 14px',
            fontSize: '0.78rem',
            color: 'var(--accent-blue)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600'
          }}
        >
          <Sparkles size={12} />
          <span>{showDemos ? 'Hide Samples' : 'Test Samples'}</span>
        </button>
      </div>

      {/* Main Hero Center Area */}
      <div style={{ textAlign: 'center', margin: '16px 0 28px 0', position: 'relative', zIndex: 1 }}>
        
        <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Namaste!
        </h1>
        
        <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 16px auto', lineHeight: '1.5' }}>
          Your voice matters. Share your complaint in your spoken language<br />
          and help us build a better tomorrow.
        </p>

        {/* 1-Click Fast Language Selector Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginRight: '4px' }}>
            Spoken Language:
          </span>
          {SUPPORTED_LANGUAGES.map(l => {
            const active = selectedLanguage === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => handleLanguageChange(l.code)}
                style={{
                  background: active ? 'var(--accent-blue)' : 'var(--bg-card)',
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                  borderRadius: '9999px',
                  padding: '5px 13px',
                  fontSize: '0.76rem',
                  fontWeight: active ? '700' : '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: active ? '0 2px 8px rgba(76, 123, 244, 0.3)' : 'none'
                }}
                title={l.hint}
              >
                <span>{l.name}</span>
                {active && <Check size={12} />}
              </button>
            );
          })}
        </div>

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
        <div style={{ marginTop: '14px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
          {isRecording ? (
            <span style={{ color: '#e11d48', fontWeight: '700' }}>
              ● Recording... ({formatSeconds(recordingDuration)}) — Tap to finish
            </span>
          ) : (
            'Tap to raise a complaint'
          )}
        </div>

        {/* Real-time 60FPS Audio Waveform Equalizer Canvas (0ms Latency) */}
        {isRecording && (
          <div style={{ margin: '14px auto 0 auto', textAlign: 'center' }}>
            <canvas
              ref={canvasRef}
              width={260}
              height={36}
              className="live-waveform-canvas"
            />
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '0.76rem', 
              marginTop: '4px',
              color: isVoiceDetected ? 'var(--accent-blue)' : 'var(--text-muted)', 
              fontWeight: '600' 
            }}>
              <Volume2 size={14} />
              <span>
                {isVoiceDetected 
                  ? `Mic Active (${voiceRmsLevel}% Volume) • Voice detected live` 
                  : 'Mic is hearing audio • Speak clearly into your microphone'}
              </span>
            </div>
          </div>
        )}

        {/* Live Audio Playback Bar if recorded */}
        {audioUrl && !isRecording && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', padding: '8px 18px', borderRadius: '9999px', border: '1px solid var(--border-color)', marginTop: '16px' }}>
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

        {/* Instant Live Speech-to-Text Transcript Box (Immediately visible when recording starts) */}
        {(isRecording || transcript || interimTranscript || audioUrl) && (
          <div style={{ 
            maxWidth: '680px', 
            margin: '20px auto 0 auto', 
            textAlign: 'left', 
            background: 'var(--bg-card)', 
            borderRadius: '16px', 
            padding: '18px 22px', 
            border: '1px solid var(--border-color)', 
            boxShadow: 'var(--shadow-card)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                  Captured Voice Statement
                </span>
                {isRecording ? (
                  <span className={`status-pill ${isVoiceDetected ? 'voice-status-live' : ''}`} style={{ 
                    fontSize: '0.68rem', 
                    background: isVoiceDetected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: isVoiceDetected ? '#10b981' : '#f59e0b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isVoiceDetected ? '#10b981' : '#f59e0b' }} />
                    {isVoiceDetected ? 'Transcribing Live Voice' : 'Listening for Voice...'}
                  </span>
                ) : (
                  <span className="status-pill badge-moderate" style={{ fontSize: '0.68rem' }}>
                    {transcript ? 'AI Speech Recognized' : 'Voice Audio Captured'}
                  </span>
                )}
              </div>

              {/* Right Controls: Edit Text & Clear */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isEditingTranscript ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontSize: '0.74rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Edit3 size={12} />
                  <span>{isEditingTranscript ? 'Done Editing' : 'Edit Text'}</span>
                </button>
                {(transcript || interimTranscript) && !isRecording && (
                  <button
                    type="button"
                    onClick={() => {
                      setTranscript('');
                      setInterimTranscript('');
                      finalTranscriptRef.current = '';
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Clear transcript"
                  >
                    <Trash2 size={12} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Network / Speech Engine Warning Notification if browser or cloud blocks speech */}
            {speechEngineStatus === 'network-error' && (
              <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.76rem', color: '#f87171', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} />
                <span>
                  Google Speech Cloud service is currently unreachable on your network. Your audio is still being recorded! You can also click a quick template below or type your statement.
                </span>
              </div>
            )}

            {/* Editable or Real-time Streaming Content */}
            {isEditingTranscript ? (
              <textarea
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  finalTranscriptRef.current = e.target.value;
                }}
                placeholder="Type or edit your grievance statement here..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.92rem',
                  lineHeight: '1.5',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            ) : (
              <p style={{ fontSize: '0.94rem', color: 'var(--text-primary)', lineHeight: '1.6', margin: '6px 0 10px 0', minHeight: '26px' }}>
                {!transcript && !interimTranscript && isRecording ? (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    🎙️ Listening in {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}... Bolte hi aapke shabad yahan real-time me type honge.
                  </span>
                ) : (
                  <>
                    <span>{transcript}</span>
                    {interimTranscript && (
                      <span style={{ color: 'var(--accent-blue)', fontWeight: '600' }}>
                        {' ' + interimTranscript}
                      </span>
                    )}
                    {isRecording && <span className="blinking-cursor" />}
                    {!transcript && !interimTranscript && !isRecording && (
                      <span style={{ color: 'var(--text-muted)' }}>
                        Voice statement recorded. Click "Proceed to Docket Review" or select a common template below.
                      </span>
                    )}
                  </>
                )}
              </p>
            )}

            {/* Quick 1-Click Complaint Statement Templates */}
            <div style={{ marginTop: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '6px' }}>
                Quick Complaint Fill (1-Click):
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {QUICK_VOICE_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyQuickTemplate(tpl.text)}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '9999px',
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.color = 'var(--accent-blue)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    + {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Helper Guidance Tip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              <AlertCircle size={12} />
              <span>
                Language: <strong>{SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}</strong>. English ya mixed Hinglish bolne ke liye upar "English" pill dabayein.
              </span>
            </div>

            {/* Proceed to Docket Review Button */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                id="review-voice-btn"
                onClick={handleProceed}
                className="btn-primary"
                disabled={isProcessing || (!transcript.trim() && !interimTranscript.trim() && !audioBlob && !selectedPresetId)}
                style={{ padding: '8px 22px', fontSize: '0.86rem' }}
              >
                {isProcessing ? 'Analyzing Trauma Signals...' : 'Proceed to Docket Review →'}
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

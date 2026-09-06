import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { analyzeAudioBuffer } from './services/acousticService.js';
import { extractEntitiesAndAnalyzeText } from './services/nlpService.js';
import { computeFusedRisk } from './services/fusedRiskService.js';
import { complaintsStore } from './data/complaintsStore.js';
import { demoScenarios } from './data/demoScenarios.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Setup CORS and JSON parsers
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Setup Multer memory storage for audio upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024 } // 40MB
});

// Root endpoint serving clean API Dashboard
app.get('/', (req, res) => {
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({
      status: 'online',
      service: 'NHAA AI Real-Time Stress & Trauma Assessment Gateway',
      authority: 'Ministry of Social Justice and Empowerment, Government of India',
      frontendUrl: 'http://localhost:5173',
      endpoints: {
        health: '/api/health',
        complaints: '/api/complaints',
        analytics: '/api/analytics',
        voiceProcess: '/api/voice/process',
        demoSamples: '/api/demo-samples'
      },
      timestamp: new Date().toISOString()
    });
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NHAA Backend API Gateway | Government of India</title>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #0c1322;
          color: #f8fafc;
          margin: 0;
          padding: 40px 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          box-sizing: border-box;
        }
        .card {
          background: #131c2e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 36px;
          max-width: 620px;
          width: 100%;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }
        .badge {
          display: inline-block;
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.4);
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          margin-bottom: 12px;
        }
        h1 { margin: 0 0 8px 0; font-size: 1.5rem; font-weight: 800; color: #ffffff; }
        p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin: 0 0 24px 0; }
        .btn-frontend {
          display: inline-block;
          background: #4c7bf4;
          color: #ffffff;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: 28px;
          transition: background 0.2s;
        }
        .btn-frontend:hover { background: #3b68e5; }
        .endpoints-box {
          background: #0c1322;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 16px;
          margin-top: 10px;
        }
        .endpoints-title {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 10px;
        }
        .endpoint-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 0.84rem;
        }
        .endpoint-row:last-child { border-bottom: none; }
        .endpoint-row a { color: #60a5fa; text-decoration: none; font-weight: 600; }
        .endpoint-row a:hover { text-decoration: underline; }
        .method { color: #34d399; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">● BACKEND API SERVICE ONLINE (PORT 5000)</span>
        <h1>NHAA Trauma AI Gateway</h1>
        <p>Ministry of Social Justice and Empowerment, Government of India<br>
        Public Grievance Redressal & Trauma Assessment Engine.</p>

        <a href="http://localhost:5173" class="btn-frontend">Open Web Application (Port 5173) →</a>

        <div class="endpoints-box">
          <div class="endpoints-title">Active REST API Endpoints:</div>
          <div class="endpoint-row">
            <span class="method">GET</span>
            <a href="/api/health">/api/health (System Health Check)</a>
          </div>
          <div class="endpoint-row">
            <span class="method">GET</span>
            <a href="/api/complaints">/api/complaints (Complaints Queue)</a>
          </div>
          <div class="endpoint-row">
            <span class="method">GET</span>
            <a href="/api/analytics">/api/analytics (Triage Intelligence)</a>
          </div>
          <div class="endpoint-row">
            <span class="method">GET</span>
            <a href="/api/demo-samples">/api/demo-samples (Standard Scenarios)</a>
          </div>
          <div class="endpoint-row">
            <span class="method">POST</span>
            <span style="color: #94a3b8;">/api/voice/process (AI Acoustic & NLP Engine)</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'NHAA AI Real-Time Stress & Trauma Assessment Gateway',
    authority: 'Ministry of Social Justice and Empowerment, Government of India',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/voice/process
 * Core AI Analysis Engine: Extracts acoustic biomarkers and NLP trauma signals,
 * then computes the Fused Risk & Support Recommendations.
 */
app.post('/api/voice/process', upload.single('audio'), (req, res) => {
  try {
    const audioBuffer = req.file ? req.file.buffer : null;
    const {
      transcript = '',
      language = 'en',
      clientAudioMetrics,
      presetStressLevel,
      victim
    } = req.body;

    let parsedMetrics = null;
    if (typeof clientAudioMetrics === 'string') {
      try {
        parsedMetrics = JSON.parse(clientAudioMetrics);
      } catch (e) {
        parsedMetrics = null;
      }
    } else {
      parsedMetrics = clientAudioMetrics;
    }

    // 1. Acoustic Signal Analysis (tone, pitch variance, pace, pause ratios)
    const acousticAnalysis = analyzeAudioBuffer(audioBuffer, {
      clientAudioMetrics: parsedMetrics,
      presetStressLevel
    });

    // 2. Multilingual NLP Entity Extraction & Text Trauma Scoring
    const nlpAnalysis = extractEntitiesAndAnalyzeText(transcript, language);

    // 3. Fused Risk Assessment & Support Classification
    const riskAssessment = computeFusedRisk(acousticAnalysis, nlpAnalysis);

    res.json({
      success: true,
      data: {
        transcript,
        language,
        acousticAnalysis,
        nlpAnalysis,
        riskAssessment,
        entities: nlpAnalysis.entities,
        autoSummary: nlpAnalysis.autoSummary
      }
    });
  } catch (error) {
    console.error('Error processing voice and trauma data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/complaints
 * Fetch complaints queue, default sorted by Risk Severity (Critical on top)
 */
app.get('/api/complaints', (req, res) => {
  try {
    const { riskLevel, status, search } = req.query;
    const complaints = complaintsStore.getAll({ riskLevel, status, search });
    res.json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/complaints
 * Submit a finalized complaint from the victim app
 */
app.post('/api/complaints', (req, res) => {
  try {
    const complaintData = req.body;
    if (!complaintData.transcript && !complaintData.autoSummary) {
      return res.status(400).json({ success: false, error: 'Complaint text or audio required' });
    }

    const created = complaintsStore.create(complaintData);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/complaints/:id
 * Retrieve complaint details by Ticket ID
 */
app.get('/api/complaints/:id', (req, res) => {
  try {
    const ticketId = req.params.id;
    const complaint = complaintsStore.getById(ticketId);
    if (!complaint) {
      return res.status(404).json({ success: false, error: `Ticket ${ticketId} not found` });
    }
    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/complaints/:id
 * Update status, assign officer, or log officer notes
 */
app.patch('/api/complaints/:id', (req, res) => {
  try {
    const ticketId = req.params.id;
    const updates = req.body;
    const updated = complaintsStore.update(ticketId, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: `Ticket ${ticketId} not found` });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analytics
 * Real-time operational intelligence for Official Dashboard
 */
app.get('/api/analytics', (req, res) => {
  try {
    const stats = complaintsStore.getAnalytics();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/demo-samples
 * Get evaluation test scenarios
 */
app.get('/api/demo-samples', (req, res) => {
  res.json({ success: true, data: demoScenarios });
});

app.listen(PORT, () => {
  console.log(`[NHAA Trauma AI Backend] Running on http://localhost:${PORT}`);
  console.log(`[NHAA Trauma AI Backend] Ministry of Social Justice and Empowerment`);
});

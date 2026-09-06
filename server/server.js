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

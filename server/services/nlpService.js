/**
 * Multilingual NLP, NER (Named Entity Recognition), and Text Trauma Scoring Service
 * Supports English, Hindi (Devanagari & Romanized/Hinglish), Marathi, Tamil, and Bengali keywords.
 */

// High-distress trauma keywords across Indian languages
const CRITICAL_THREAT_KEYWORDS = [
  'kill', 'murder', 'knife', 'gun', 'attacked', 'bleeding', 'hospital', 'rape', 'burning', 'fire', 'suicide', 'die', 'threatened to kill', 'locked inside', 'hostage',
  'जान से मारने', 'मारपीट', 'चाकू', 'खून', 'गोली', 'आग', 'हत्या', 'धमकी', 'बलात्कार', 'अस्पताल', 'मर जाऊंगी', 'मर जाऊंगा',
  'जीवे मारण्याची', 'रक्त', 'हल्ला', 'चाकूने वार', 'दरोडा',
  'கொலை', 'தாக்குதல்', 'துப்பாக்கி', 'இரத்தம்',
  'খুন', 'ছুরিকাঘাত', 'আগুন', 'রক্ত'
];

const HIGH_HARM_KEYWORDS = [
  'beaten', 'assaulted', 'broken', 'fracture', 'chased', 'weapon', 'caste slur', 'atrocity', 'caste discrimination', 'abused', 'stripped', 'surrounded',
  'पीटा', 'हमला', 'जातिसूचक गाली', 'तोड़फोड़', 'मार डाला', 'गुंडे', 'धमका रहे', 'दहशत', 'जबरन',
  'मारहाण', 'जातीवाचक', 'गुंड', 'भीती',
  'அடி', 'சாதி வெறி', 'பயம்',
  'মারধর', 'ভাঙচুর', 'হুমকি'
];

const MODERATE_HARM_KEYWORDS = [
  'harassment', 'threat', 'verbal abuse', 'property', 'land dispute', 'denied water', 'denied access', 'insulted', 'intimidation', 'bribe',
  'गाली', 'विवाद', 'जमीन', 'रास्ता रोका', 'पानी नहीं भरने', 'अपमान', 'झगड़ा',
  'शिवीगाळ', 'जमीन वाद', 'अडवणूक', 'तक्रार',
  'நில தகராறு', 'வசைபாடல்',
  'গালিগালাজ', 'জমির ঝামেলা'
];

// Entity extractors
const LOCATION_PATTERNS = [
  /(?:at|in|near|village|district|taluk|nagar|colony|basti|chowk|ward)\s+([A-Z][a-zA-Z\s]{2,25})/i,
  /(?:गाँव|ग्राम|बस्ती|मोहल्ला|चौक|कस्बा|थाना|जिला|कॉलोनी)\s+([^\s,।]+)/,
  /(?:गावात|वस्तीत|चौकात|जिल्हा)\s+([^\s,।]+)/
];

const ACCUSED_PATTERNS = [
  /(?:by|accused|named|person named|culprit|sarpanch|contractor)\s+([A-Z][a-zA-Z\s]{2,30})/i,
  /(?:ने|द्वारा|नामक व्यक्ति|सरपंच|मुखिया|गुंडे)\s+([^\s,।]+(?:\s+[^\s,।]+)?)/,
  /(?:नाव|आरोपी|गुंड)\s+([^\s,।]+)/
];

export function extractEntitiesAndAnalyzeText(transcript = '', language = 'en') {
  const text = transcript.trim();
  const lower = text.toLowerCase();

  // 1. Scan for trauma & danger markers
  let criticalMatches = [];
  let highMatches = [];
  let moderateMatches = [];

  CRITICAL_THREAT_KEYWORDS.forEach(kw => {
    if (lower.includes(kw.toLowerCase())) criticalMatches.push(kw);
  });

  HIGH_HARM_KEYWORDS.forEach(kw => {
    if (lower.includes(kw.toLowerCase())) highMatches.push(kw);
  });

  MODERATE_HARM_KEYWORDS.forEach(kw => {
    if (lower.includes(kw.toLowerCase())) moderateMatches.push(kw);
  });

  // Calculate Text Trauma / Risk Score (0 - 100)
  let textTraumaScore = 15; // baseline

  if (criticalMatches.length > 0) {
    textTraumaScore = 82 + Math.min(16, (criticalMatches.length - 1) * 6 + highMatches.length * 2);
  } else if (highMatches.length > 0) {
    textTraumaScore = 62 + Math.min(16, (highMatches.length - 1) * 5 + moderateMatches.length * 3);
  } else if (moderateMatches.length > 0) {
    textTraumaScore = 38 + Math.min(20, moderateMatches.length * 6);
  } else {
    // Length / sentiment based baseline
    if (lower.includes('fear') || lower.includes('scared') || lower.includes('डर') || lower.includes('मदद')) {
      textTraumaScore += 20;
    }
  }
  textTraumaScore = Math.min(99, Math.max(10, textTraumaScore));

  // 2. Extract Entities
  let accusedName = 'Unspecified / Multiple Individuals';
  let location = 'Location not explicitly mentioned';
  let incidentType = 'Harassment / Grievance';
  let dateOrTime = 'Recent / Ongoing incident';

  // Accused extraction
  for (const regex of ACCUSED_PATTERNS) {
    const match = text.match(regex);
    if (match && match[1] && match[1].trim().length > 2) {
      accusedName = match[1].trim();
      break;
    }
  }

  // Location extraction
  for (const regex of LOCATION_PATTERNS) {
    const match = text.match(regex);
    if (match && match[1] && match[1].trim().length > 2) {
      location = match[1].trim();
      break;
    }
  }

  // Incident nature classification
  if (criticalMatches.length > 0) {
    incidentType = 'Physical Assault, Grievous Threat & Violent Atrocity';
  } else if (highMatches.length > 0) {
    incidentType = 'Caste Discrimination, Physical Battery & Intimidation';
  } else if (moderateMatches.length > 0) {
    incidentType = 'Verbal Abuse, Harassment & Denial of Access';
  } else {
    incidentType = 'Civil Atrocity Grievance / Administrative Deprivation';
  }

  // Date/Time extraction hints
  if (/yesterday|कल|काल/i.test(text)) dateOrTime = 'Yesterday / Previous 24 Hours';
  else if (/today|आज|आजच/i.test(text)) dateOrTime = 'Today / Immediate';
  else if (/last night|रात|रात्री/i.test(text)) dateOrTime = 'Last Night';
  else if (/morning|सुबह|सकाळी/i.test(text)) dateOrTime = 'This Morning';

  // 3. Structured Summary Generation
  let autoSummary = '';
  if (text.length > 20) {
    const shortText = text.length > 220 ? text.substring(0, 220) + '...' : text;
    autoSummary = `The complainant reports an incident involving ${accusedName} regarding ${incidentType.toLowerCase()} at ${location}. The statement indicates ${
      textTraumaScore > 75 ? 'immediate physical peril, acute trauma markers, and necessity of emergency intervention' :
      textTraumaScore > 50 ? 'serious intimidation, violation of civil rights, and urgent need for protection' :
      'grievance requiring formal enquiry and legal review'
    }. Raw statement excerpt: "${shortText}"`;
  } else {
    autoSummary = 'Brief audio testimony received. Official review and verification in progress.';
  }

  return {
    textTraumaScore,
    entities: {
      accusedName,
      location,
      incidentType,
      dateOrTime,
      immediateDangerDetected: criticalMatches.length > 0
    },
    flags: {
      criticalKeywords: criticalMatches,
      highKeywords: highMatches,
      moderateKeywords: moderateMatches
    },
    autoSummary
  };
}

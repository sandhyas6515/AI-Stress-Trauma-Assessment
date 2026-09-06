/**
 * Demo Presets for Live Pitch & SIH Evaluation
 * Includes paired test cases:
 *  - Scenario A: Same words, Distressed Panicked Tone -> CRITICAL RISK
 *  - Scenario B: Same words, Calm Reporting Tone -> MODERATE/LOW RISK
 * Demonstrates the power of the dual acoustic + text fusion engine!
 */

export const demoScenarios = [
  {
    id: "demo-pair-distressed",
    title: "Scenario 1A: Imminent Peril (Hindi) - High Acoustic Panic",
    tag: "Distressed Tone",
    language: "hi",
    languageName: "Hindi (हिंदी)",
    presetStressLevel: "CRITICAL",
    transcript: "साहब बचा लो, वे लोग दरवाजे पर आ गए हैं, उनके पास हथियार हैं और वे घर में आग लगाने की धमकी दे रहे हैं! मेरे बच्चे डर से काँप रहे हैं, प्लीज तुरंत पुलिस भेजो!",
    simulatedAudio: {
      pitchVolatility: 92,
      pauseRatio: 86,
      vocalStrainZcr: 88,
      speechTempo: 85,
      rmsEnergy: 84
    },
    victim: {
      name: "Rekha Kumari",
      phone: "+91 98111 22334",
      location: "Ganga Nagar, District Varanasi, UP"
    },
    notes: "Demonstrates acute vocal tremor, hyperventilation, and extreme urgency triggering Critical Red Alert."
  },
  {
    id: "demo-pair-calm",
    title: "Scenario 1B: Controlled Tone (Hindi) - Low Acoustic Stress",
    tag: "Calm Tone (Same Topic)",
    language: "hi",
    languageName: "Hindi (हिंदी)",
    presetStressLevel: "MODERATE",
    transcript: "नमस्ते साहब, मैं कल शाम की घटना के बारे में रिपोर्ट करना चाहती हूँ। कुछ लोग दरवाजे पर आकर धमकी दे रहे थे और गाली-गलौज कर रहे थे। स्थिति अभी शांत है पर मैं आधिकारिक शिकायत दर्ज कराना चाहती हूँ।",
    simulatedAudio: {
      pitchVolatility: 32,
      pauseRatio: 28,
      vocalStrainZcr: 25,
      speechTempo: 45,
      rmsEnergy: 40
    },
    victim: {
      name: "Rekha Kumari",
      phone: "+91 98111 22334",
      location: "Ganga Nagar, District Varanasi, UP"
    },
    notes: "Shows how controlled vocal acoustic baseline produces a Moderate triage instead of panic escalation."
  },
  {
    id: "demo-marathi-high",
    title: "Scenario 2: Caste Atrocity & Water Well Deprivation (Marathi)",
    tag: "High Distress",
    language: "mr",
    languageName: "Marathi (मराठी)",
    presetStressLevel: "HIGH",
    transcript: "आज दुपारी गावातील सरपंचाने आम्हाला पिण्याच्या पाण्याच्या विहिरीवर जाण्यास बंदी घातली आणि जातीवाचक शिवीगाळ करून जीवे मारण्याची धमकी दिली. गावात खूप तणाव आहे, तातडीने पोलीस संरक्षण द्या.",
    simulatedAudio: {
      pitchVolatility: 74,
      pauseRatio: 70,
      vocalStrainZcr: 68,
      speechTempo: 65,
      rmsEnergy: 66
    },
    victim: {
      name: "Suresh Kamble",
      phone: "+91 99223 44556",
      location: "Khadki, Taluka Haveli, Pune, Maharashtra"
    },
    notes: "Demonstrates regional language support and immediate NALSA legal counsel + police escort recommendation."
  },
  {
    id: "demo-english-critical",
    title: "Scenario 3: Armed Assault & Stalking (English)",
    tag: "Critical Threat",
    language: "en",
    languageName: "English",
    presetStressLevel: "CRITICAL",
    transcript: "Help me please, I am being chased by two men with knives near the railway station. They have attacked me earlier and they are trying to break into my car right now! Please send help immediately!",
    simulatedAudio: {
      pitchVolatility: 95,
      pauseRatio: 88,
      vocalStrainZcr: 90,
      speechTempo: 92,
      rmsEnergy: 89
    },
    victim: {
      name: "Ananya Roy",
      phone: "+91 97110 55443",
      location: "Station Road, Bhopal, MP"
    },
    notes: "Active chase and weapon threat triggering rapid PCR dispatch and emergency trauma aid."
  }
];

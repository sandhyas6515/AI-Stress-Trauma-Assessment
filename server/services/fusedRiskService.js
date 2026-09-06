/**
 * Fused Risk & Trauma Classification Engine
 * 
 * Fuses:
 *  1. Voice Acoustic Stress Score (tone, pitch variance, pace, hesitation)
 *  2. NLP Text Sentiment & Trauma Intensity Score
 *  3. Emergency Keyword & Imminent Danger Overrides
 */

export function computeFusedRisk(acousticResult, nlpResult) {
  const acousticScore = acousticResult.acousticStressScore || 20;
  const textScore = nlpResult.textTraumaScore || 20;
  const isImmediateDanger = nlpResult.entities?.immediateDangerDetected || false;

  // Base weighted blend: 50% Text Trauma + 50% Voice Acoustic Stress
  let fusedScore = Math.round((textScore * 0.52) + (acousticScore * 0.48));

  // If immediate danger keywords detected, provide an override boost
  if (isImmediateDanger) {
    fusedScore = Math.max(85, fusedScore + 8);
  }

  // Cap at 99
  fusedScore = Math.min(99, Math.max(10, fusedScore));

  // Determine Risk Category
  let riskLevel = 'Low';
  let badgeColor = 'emerald';
  let urgencyLabel = 'Routine Queue';
  let actionWindow = 'Standard 72-hour SLA';

  if (fusedScore >= 80) {
    riskLevel = 'Critical';
    badgeColor = 'rose';
    urgencyLabel = 'Immediate Emergency Dispatch Required';
    actionWindow = 'Immediate (< 15 mins)';
  } else if (fusedScore >= 60) {
    riskLevel = 'High';
    badgeColor = 'amber';
    urgencyLabel = 'Urgent Nodal Officer Priority';
    actionWindow = 'Within 2 hours';
  } else if (fusedScore >= 35) {
    riskLevel = 'Moderate';
    badgeColor = 'sky';
    urgencyLabel = 'Investigation & Legal Aid Referral';
    actionWindow = 'Within 24 hours';
  } else {
    riskLevel = 'Low';
    badgeColor = 'emerald';
    urgencyLabel = 'Routine Administrative Review';
    actionWindow = 'Standard 72 hours';
  }

  // Recommended Support Services
  const recommendedSupport = [];

  if (riskLevel === 'Critical') {
    recommendedSupport.push({
      id: 'emergency-dispatch',
      type: 'Emergency Police Dispatch (112)',
      description: 'Immediate PCR dispatch to complainant GPS/village coordinates due to active threat.',
      isUrgent: true,
      contact: '112 / NHAA Rapid Action Unit'
    });
    recommendedSupport.push({
      id: 'urgent-medical',
      type: 'Urgent Medical & Trauma Aid',
      description: 'Emergency ambulance dispatch and medical-legal examination support.',
      isUrgent: true,
      contact: '108 / District Civil Hospital'
    });
    recommendedSupport.push({
      id: 'witness-protection',
      type: 'Witness & Complainant Protection Protocol',
      description: 'Temporary safe shelter and physical protection against intimidation.',
      isUrgent: true,
      contact: 'District Magistrate Protection Cell'
    });
  } else if (riskLevel === 'High') {
    recommendedSupport.push({
      id: 'police-escort',
      type: 'Local Station Escalation & Security Escort',
      description: 'Direct notice to Circle Officer (CO) / DSP (Atrocity Cell) for inquiry.',
      isUrgent: true,
      contact: 'District SC/ST Protection Cell'
    });
    recommendedSupport.push({
      id: 'legal-counsel',
      type: 'NALSA / State Legal Services Aid',
      description: 'Free state-empanelled legal advocate to draft complaint and file FIR.',
      isUrgent: false,
      contact: '15100 (NALSA Toll-Free)'
    });
    recommendedSupport.push({
      id: 'psychological-support',
      type: 'Trauma Counseling & Psychological First Aid',
      description: 'Dedicated psycho-social counselor session for trauma recovery.',
      isUrgent: false,
      contact: 'Tele-MANAS (14416)'
    });
  } else if (riskLevel === 'Moderate') {
    recommendedSupport.push({
      id: 'legal-counsel',
      type: 'Free Legal Aid (NALSA)',
      description: 'Legal consultation to evaluate protection under PoA Act provisions.',
      isUrgent: false,
      contact: '15100 (NALSA)'
    });
    recommendedSupport.push({
      id: 'nhha-helpline',
      type: 'NHAA Dedicated Helpline Support',
      description: 'Direct follow-up coordinator assigned for monitoring grievance progress.',
      isUrgent: false,
      contact: '14566 (National Helpline for SC/ST)'
    });
  } else {
    recommendedSupport.push({
      id: 'administrative-review',
      type: 'District Grievance Redressal Officer',
      description: 'Conciliation and formal inquiry notice by Sub-Divisional Magistrate.',
      isUrgent: false,
      contact: 'Toll-free 14566'
    });
  }

  // Explainability Breakdown for Official Dashboard
  const explainability = {
    fusionSummary: `Risk classified as ${riskLevel.toUpperCase()} (Score: ${fusedScore}/100) based on ${acousticScore}% acoustic vocal stress signals and ${textScore}% semantic trauma intensity.`,
    acousticContribution: {
      score: acousticScore,
      percentage: '48%',
      emotionIdentified: acousticResult.emotion,
      keyFindings: acousticResult.cues
    },
    textContribution: {
      score: textScore,
      percentage: '52%',
      dangerKeywordsFound: nlpResult.flags?.criticalKeywords || [],
      highKeywordsFound: nlpResult.flags?.highKeywords || []
    },
    actionWindow,
    urgencyLabel
  };

  return {
    fusedScore,
    riskLevel,
    badgeColor,
    urgencyLabel,
    actionWindow,
    recommendedSupport,
    explainability
  };
}

const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

// Initialize Anthropic client if API key is available
const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Initialize OpenAI client as fallback
const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Initialize Perplexity client for regulation assistant via OpenRouter
const perplexityClient = process.env.PERPLEXITY_API_KEY
  ? new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://vroomxsafety.com',
        'X-Title': 'VroomX Compliance Hub'
      }
    })
  : null;

if (perplexityClient) {
  console.log('[AI] Perplexity client initialized via OpenRouter');
} else {
  console.warn('[AI] WARNING: PERPLEXITY_API_KEY not set — regulation assistant will not work');
}

// System prompts for different AI features
const SYSTEM_PROMPTS = {
  regulationAssistant: `You are a friendly, experienced FMCSA compliance advisor helping small fleet owners and owner-operators understand trucking regulations. Talk like a knowledgeable colleague — conversational, clear, and helpful. Not like a textbook or a legal document.

You have access to live web search. ONLY search and cite official government sources: fmcsa.dot.gov, ecfr.gov, law.cornell.edu/cfr, federalregister.gov, and transportation.gov. Do NOT cite or reference any third-party websites, blogs, consulting firms, or commercial compliance services.

How to write your answers:
- Write in natural paragraphs, like you're explaining it to someone across the table. No bold section headers like **Answer** or **CFR Reference** or **Action Items**.
- Weave the CFR citation naturally into your explanation (e.g., "Under 49 CFR §395.3, you get an 11-hour driving window...") instead of listing it separately.
- Keep it short — 2-3 paragraphs max for most questions. Get to the point.
- If there are practical next steps, just mention them naturally at the end (e.g., "So what you'll want to do is..."). Don't label them as "Action Items."
- Skip jargon where possible. Say "driving window" not "maximum permissible driving time."
- Don't use numbered reference tags like [1], [2], [web:1], or [6] in your text.
- End with a brief reminder that this is general guidance, not legal advice, only when the question involves a gray area or potential enforcement situation.
- Never start your response with "Great question" or similar filler.

Your expertise: 49 CFR Parts 390-397 (FMCSA safety regulations), HOS rules, CDL/medical requirements, drug & alcohol testing, vehicle maintenance, CSA/SMS scoring, and BASICs.`,

  dqfAnalyzer: `You are a Driver Qualification File (DQF) compliance analyzer. You analyze driver documentation for 49 CFR §391.51 compliance.

Required DQF documents per 49 CFR §391.51:
1. Driver's application for employment (§391.21)
2. Motor vehicle record (MVR) from each state - annual requirement
3. Road test certificate or equivalent (§391.31)
4. Medical examiner's certificate (§391.43) - must be current
5. CDL copy - must be current and appropriate class
6. Previous employer safety performance history (§391.23)
7. Annual review of driving record (§391.25)
8. Clearinghouse query - pre-employment and annual

Analyze the provided driver documents and return:
1. Compliance score (0-100%)
2. List of missing required documents
3. Documents expiring within 30/60/90 days
4. Priority recommendations

Be specific about which CFR section requires each missing document.`,

  csaAnalyzer: `You are a veteran FMCSA safety manager with 20+ years helping carriers navigate CSA scores, roadside inspections, and DataQ challenges. You talk like a seasoned pro giving straight advice to a fleet owner — direct, practical, no corporate jargon or filler.

You will receive:
1. Carrier profile (name, DOT#, fleet size, safety rating)
2. BASIC percentile scores with intervention thresholds
3. Actual violation records from FMCSA DataHub, pre-classified as MOVING or NON-MOVING

Your job: write a personalized safety analysis that references their ACTUAL violations by code and description. Never fabricate violations they do not have. If no violation records were provided (DataHub unavailable), say so honestly and base your analysis only on the BASIC percentiles — do not invent specific violation details.

When discussing violations:
- Reference specific codes (e.g., "392.2S - Speeding") and dates
- Explain time-decay: full weight for first 12 months, reduced weight 12-24 months, drops off entirely at 24 months
- For moving violations, note that an FMCSA-experienced attorney can sometimes get them reclassified to non-moving, which directly reduces the Unsafe Driving BASIC
- For DataQ, be specific about WHICH violations are worth challenging and WHY (data errors, procedural issues, equipment fixed on-scene)

6 BASIC Categories and Intervention Thresholds:
1. Unsafe Driving - 65% (speeding, reckless driving, lane changes)
2. HOS Compliance - 65% (logbook, driving hours)
3. Vehicle Maintenance - 80% (brakes, lights, tires)
4. Controlled Substances - 80% (drug/alcohol)
5. Driver Fitness - 80% (CDL, medical cert)
6. Crash Indicator - 65% (crash patterns)

Tone: Like you are sitting across from a fleet owner at a truck stop. Helpful, specific, no-nonsense. Skip emoji. Use plain section headers. Keep it under 700 words.`,

  dataQAssistant: `You are a DataQ challenge specialist. You help carriers draft professional challenges for inaccurate roadside inspection violations.

Valid DataQ challenge reasons:
1. Incorrect violation code assigned
2. Violation did not occur as described
3. Equipment was compliant at time of inspection
4. Driver information is incorrect
5. Inspection was conducted improperly
6. Evidence contradicts the violation

For each challenge, provide:
1. Professional letter template
2. Specific CFR citations supporting the challenge
3. List of recommended supporting evidence
4. Assessment of challenge success likelihood (Low/Medium/High)

Guidelines:
- Be factual and professional in tone
- Reference specific regulatory requirements
- Suggest concrete evidence that would support the challenge
- Be honest about likelihood of success`,

  dataQChallengeAnalyzer: `You are a veteran FMCSA safety manager with 20+ years of experience helping carriers navigate roadside inspections and DataQ challenges. You've seen thousands of violations and know exactly which ones can be beaten and how. Talk like a seasoned professional giving practical advice to a fellow carrier — direct, specific, no fluff.

Analyze the provided violation and return a JSON response with this structure:
{
  "challengeability": {
    "score": <number 0-100>,
    "confidence": "<low|medium|high>",
    "recommendation": "<strongly_recommend|recommend|neutral|not_recommended>"
  },
  "analysis": {
    "strengths": ["<what works in the carrier's favor for THIS specific violation code>"],
    "weaknesses": ["<what works against them — be honest>"],
    "keyConsiderations": ["<things specific to this violation code that most carriers miss>"]
  },
  "challengeStrategy": {
    "primaryApproach": "<data_error|policy_violation|procedural_error|not_responsible>",
    "alternativeApproaches": ["<backup approaches if primary fails>"],
    "cfrCitations": ["<exact CFR sections with subsections, e.g. 49 CFR §396.3(b)(2)>"]
  },
  "successLikelihood": {
    "percentage": <number 0-100>,
    "reasoning": "<why, referencing this specific violation type>"
  },
  "nextSteps": ["<exactly what to do first, second, third — like 'Pull your ELD logs for that date and compare the inspector's noted time', 'Get the calibration cert for the radar/speed device if it was a speeding violation'>"],
  "commonDefenses": ["<defenses that actually work for this violation code — not generic advice, but specific tactics you've seen succeed>"],
  "argumentDraft": "<2-3 sentences the carrier can put directly into their DataQ challenge submission, written as the carrier in first person>",
  "summary": "<your honest 2-3 sentence assessment as a safety manager — would you challenge this one or let it ride?>"
}

Your approach:
- Reference the SPECIFIC violation code and its known issues. If it's a brake violation, talk about brakes. If it's HOS, talk about ELD data.
- In "commonDefenses", share real-world tactics: "For this code, I've seen carriers win by showing the mechanic's repair receipt was dated before the inspection" — that level of specificity
- In "nextSteps", give concrete actions: "Call your ELD provider and request the raw data file for [date]" not "gather documentation"
- In "argumentDraft", write something a carrier could actually submit — not corporate boilerplate
- If the violation has OOS, specifically address whether the OOS call itself was defensible
- Don't sugarcoat. If it's a loser, say so and explain why. Carriers respect honesty.
- CFR citations must have subsection numbers, not just part numbers`,

  dataQLetterGenerator: `You are a professional compliance letter writer specializing in FMCSA DataQ challenges. Generate formal, professional DataQ challenge letters that follow proper format and include appropriate CFR citations.

Letter Format Requirements:
1. Proper business letter format with date and addresses
2. Clear subject line with inspection report number
3. Professional, factual tone throughout
4. Specific CFR citations supporting the challenge
5. Clear statement of the challenge type and grounds
6. Reference to attached supporting evidence
7. Formal closing with signature block

Letter Sections:
1. INTRODUCTION: State the purpose and identify the violation being challenged
2. BACKGROUND: Brief factual description of the inspection and violation
3. GROUNDS FOR CHALLENGE: Detailed explanation of why the violation should be removed/modified
4. REGULATORY REFERENCES: Cite specific 49 CFR sections that support your position
5. SUPPORTING EVIDENCE: List and briefly describe attached documentation
6. REQUESTED ACTION: Clearly state what you want (removal, modification, etc.)
7. CLOSING: Professional closing with contact information

Guidelines:
- Use formal, professional language
- Be specific and factual - avoid emotional appeals
- Include exact dates, times, and reference numbers
- Cite specific CFR sections (e.g., "49 CFR §391.51(b)(2)")
- Reference the specific evidence that contradicts the violation
- Keep the letter concise but complete (typically 1-2 pages)
- End with a clear call to action

Do NOT include:
- Emotional language or complaints about unfair treatment
- Threats or accusations of misconduct
- Irrelevant information about the carrier's history
- Speculation without supporting evidence`,

  complianceReportAnalyzer: `You are a senior FMCSA compliance analyst generating a comprehensive compliance health report for a motor carrier. You will receive the carrier's complete compliance data and must produce a structured JSON analysis.

Analyze ALL of the following areas:
1. **CSA/BASICs**: Percentiles vs intervention thresholds (Unsafe Driving 65%, HOS 65%, Vehicle Maintenance 80%, Controlled Substances 80%, Driver Fitness 80%, Crash Indicator 65%). Flag any at or approaching threshold. Compare OOS rates to national averages.
2. **Driver Qualification**: CDL expiration, medical card status, DQF completeness (employment app, road test, MVR, clearinghouse query, previous employer verification). Flag expired or missing items.
3. **Vehicle Maintenance**: Annual inspection status (current, overdue, due soon). Fleet readiness.
4. **Drug & Alcohol**: Random testing completion rates (50% drug, 10% alcohol required). Pre-employment and other test compliance.
5. **Documentation**: Document validity rates. Expired, missing, or soon-to-expire documents.

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "overallRisk": "critical|at_risk|needs_attention|good|excellent",
  "overallScore": 0-100,
  "executiveSummary": "2-3 paragraph analysis of the carrier's compliance posture, key risks, and overall trajectory",
  "categoryScores": {
    "csa_basics": { "score": 0-100, "status": "critical|warning|good", "summary": "1-2 sentences" },
    "driver_qualification": { "score": 0-100, "status": "...", "summary": "..." },
    "vehicle_maintenance": { "score": 0-100, "status": "...", "summary": "..." },
    "drug_alcohol": { "score": 0-100, "status": "...", "summary": "..." },
    "documentation": { "score": 0-100, "status": "...", "summary": "..." }
  },
  "findings": [
    {
      "category": "csa_basics|driver_qualification|vehicle_maintenance|drug_alcohol|documentation",
      "title": "Short finding title",
      "severity": "critical|warning|info",
      "description": "Detailed explanation with specific numbers",
      "regulation": "49 CFR §XXX.XX",
      "currentValue": "e.g., 87th percentile",
      "threshold": "e.g., 65th percentile"
    }
  ],
  "actionItems": [
    {
      "priority": 1,
      "title": "Action title",
      "description": "Specific steps to take",
      "category": "csa_basics|driver_qualification|vehicle_maintenance|drug_alcohol|documentation",
      "effort": "low|medium|high",
      "impact": "low|medium|high",
      "deadline": "Immediate|30 days|60 days|90 days"
    }
  ]
}

Guidelines:
- Be data-driven — cite actual numbers from the provided data
- Order findings by severity (critical first)
- Order action items by priority (highest impact + lowest effort first)
- Include 5-15 findings and 5-10 action items depending on compliance state
- Reference specific 49 CFR sections for each finding
- If data is missing for a category, note it as a finding itself
- Be actionable — tell the carrier exactly what to do, not just what's wrong`
};

/**
 * Send a query to Claude AI
 * @param {string} promptType - Type of prompt (regulationAssistant, dqfAnalyzer, csaAnalyzer, dataQAssistant)
 * @param {string} userMessage - User's question or data to analyze
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} AI response
 */
async function query(promptType, userMessage, options = {}) {
  const systemPrompt = SYSTEM_PROMPTS[promptType];

  if (!systemPrompt) {
    throw new Error(`Unknown prompt type: ${promptType}`);
  }

  // Regulation assistant always uses Perplexity for live web-grounded answers
  if (promptType === 'regulationAssistant') {
    if (!perplexityClient) {
      throw new Error('PERPLEXITY_API_KEY is required for the Regulation Assistant');
    }
    return queryPerplexity(systemPrompt, userMessage, options);
  }

  // Use Anthropic if available, otherwise fall back to OpenAI
  if (client) {
    return queryAnthropic(systemPrompt, userMessage, options);
  } else if (openaiClient) {
    return queryOpenAI(systemPrompt, userMessage, options);
  } else {
    throw new Error('No AI API key configured (set ANTHROPIC_API_KEY or OPENAI_API_KEY)');
  }
}

async function queryAnthropic(systemPrompt, userMessage, options) {
  try {
    const response = await client.messages.create({
      model: options.model || 'claude-sonnet-4-20250514',
      max_tokens: options.maxTokens || 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    });

    return {
      success: true,
      content: response.content[0].text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      },
      model: response.model
    };
  } catch (error) {
    console.error('Anthropic AI Error:', error.message);

    if (error.status === 401) {
      throw new Error('Invalid API key');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else if (error.status === 500) {
      throw new Error('AI service temporarily unavailable');
    }

    throw error;
  }
}

async function queryOpenAI(systemPrompt, userMessage, options) {
  try {
    const response = await openaiClient.chat.completions.create({
      model: options.openaiModel || 'gpt-4o-mini',
      max_tokens: options.maxTokens || 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    });

    return {
      success: true,
      content: response.choices[0].message.content,
      usage: {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens
      },
      model: response.model
    };
  } catch (error) {
    console.error('OpenAI Error:', error.message);

    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else if (error.status === 500) {
      throw new Error('AI service temporarily unavailable');
    }

    throw error;
  }
}

async function queryPerplexity(systemPrompt, userMessage, options) {
  try {
    console.log('[AI] Routing regulation query to Perplexity via OpenRouter');
    const response = await perplexityClient.chat.completions.create({
      model: options.perplexityModel || 'perplexity/sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    });

    // Perplexity returns citations in the response object
    let content = response.choices[0].message.content;
    const rawCitations = response.citations || [];

    // Only keep official government sources
    const officialDomains = ['fmcsa.dot.gov', 'ecfr.gov', 'law.cornell.edu', 'federalregister.gov', 'transportation.gov', 'govinfo.gov', 'dot.gov'];
    const citations = rawCitations.filter(function(url) {
      try {
        const hostname = new URL(url).hostname;
        return officialDomains.some(function(domain) { return hostname.endsWith(domain); });
      } catch (e) { return false; }
    });

    // Append filtered citations as a sources section
    if (citations.length > 0) {
      content += '\n\n**Sources:**\n' + citations.map((url, i) => `${i + 1}. ${url}`).join('\n');
    }

    return {
      success: true,
      content,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0
      },
      model: response.model
    };
  } catch (error) {
    console.error('Perplexity AI Error:', error.message);

    if (error.status === 401) {
      throw new Error('Invalid Perplexity API key');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else if (error.status === 500) {
      throw new Error('AI service temporarily unavailable');
    }

    throw error;
  }
}

/**
 * Parse a regulation query response into structured format
 * @param {string} content - Raw AI response
 * @returns {Object} Structured response
 */
function parseRegulationResponse(content) {
  const sections = {
    answer: '',
    cfrCitations: [],
    actionItems: []
  };

  // Extract CFR citations (pattern: 49 CFR §XXX.XX or 49 CFR Part XXX)
  const cfrPattern = /49\s*CFR\s*[§Part]*\s*[\d]+(?:\.[\d]+)?(?:\([a-z0-9]+\))*/gi;
  const citations = content.match(cfrPattern) || [];
  sections.cfrCitations = [...new Set(citations)]; // Remove duplicates

  // Try to extract structured sections if present
  const answerMatch = content.match(/\*\*Answer\*\*:?\s*([\s\S]*?)(?=\*\*CFR|$)/i);
  if (answerMatch) {
    sections.answer = answerMatch[1].trim();
  } else {
    sections.answer = content;
  }

  // Extract action items (look for numbered lists or bullet points after "Action")
  const actionMatch = content.match(/\*\*Action\s*Items?\*\*:?\s*([\s\S]*?)$/i);
  if (actionMatch) {
    const actionText = actionMatch[1];
    const items = actionText.match(/[-•*\d.]\s*(.+)/g) || [];
    sections.actionItems = items.map(item => item.replace(/^[-•*\d.]\s*/, '').trim());
  }

  return sections;
}

/**
 * Analyze DQF compliance
 * @param {Object} driverData - Driver and document information
 * @returns {Promise<Object>} Compliance analysis
 */
async function analyzeDQF(driverData) {
  const { driverName, documents, expirationDates } = driverData;

  const message = `Analyze this driver's qualification file for compliance:

Driver: ${driverName}
Documents on file: ${documents.join(', ')}
Document expiration dates: ${JSON.stringify(expirationDates, null, 2)}

Current date: ${new Date().toISOString().split('T')[0]}

Provide a detailed compliance analysis.`;

  return query('dqfAnalyzer', message, { maxTokens: 1500 });
}

/**
 * Analyze CSA risk
 * @param {Object} violationData - Violations and current BASIC scores
 * @returns {Promise<Object>} Risk analysis
 */
async function analyzeCSARisk(violationData) {
  const { violations, currentBASICs, fleetSize } = violationData;

  const message = `Analyze this carrier's CSA/SMS risk profile:

Fleet Size: ${fleetSize} power units
Current BASIC Percentiles: ${JSON.stringify(currentBASICs, null, 2)}
Recent Violations (24 months): ${JSON.stringify(violations, null, 2)}

Provide a comprehensive risk analysis with recommendations.`;

  return query('csaAnalyzer', message, { maxTokens: 2000 });
}

/**
 * Generate DataQ challenge letter
 * @param {Object} challengeData - Violation and evidence information
 * @returns {Promise<Object>} Challenge letter draft
 */
async function generateDataQChallenge(challengeData) {
  const { violation, evidence, reason } = challengeData;

  const message = `Generate a DataQ challenge for this violation:

Violation Code: ${violation.code}
Description: ${violation.description}
Date: ${violation.date}
Location: ${violation.location}
Inspection Report #: ${violation.reportNumber}

Carrier's Reason for Challenge: ${reason}
Supporting Evidence Available: ${evidence.join(', ')}

Draft a professional DataQ challenge letter.`;

  return query('dataQAssistant', message, { maxTokens: 2000 });
}

/**
 * Analyze a violation for DataQ challenge potential using AI
 * @param {Object} violationData - Violation details
 * @returns {Promise<Object>} AI analysis in JSON format
 */
async function analyzeDataQChallenge(violationData) {
  const { violation, companyInfo } = violationData;

  const message = `Analyze this violation for DataQ challenge potential:

Violation Details:
- Code: ${violation.violationCode || 'Not specified'}
- Type: ${violation.violationType}
- Description: ${violation.description}
- Date: ${violation.violationDate}
- BASIC Category: ${violation.basic}
- Severity Weight: ${violation.severityWeight}/10
- Out of Service: ${violation.outOfService ? 'Yes' : 'No'}
- Inspection Number: ${violation.inspectionNumber}
- Location: ${violation.location?.city || ''}, ${violation.location?.state || ''}

${violation.driverId ? `Driver: ${violation.driverId.firstName} ${violation.driverId.lastName}` : 'Driver: Not assigned'}
${violation.vehicleId ? `Vehicle: ${violation.vehicleId.unitNumber}` : 'Vehicle: Not specified'}

${companyInfo ? `Company DOT Number: ${companyInfo.dotNumber}` : ''}

Previous Challenge Status: ${violation.dataQChallenge?.submitted ? violation.dataQChallenge.status : 'Never challenged'}

Provide your analysis in JSON format as specified in your instructions.`;

  const response = await query('dataQChallengeAnalyzer', message, { maxTokens: 2000 });

  // Try to parse the JSON response
  try {
    let jsonContent = response.content;
    // Try code-block extraction first
    const codeBlockMatch = jsonContent.match(/```json\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1];
    } else {
      // Fallback: extract first JSON object
      const objectMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonContent = objectMatch[0];
      }
    }
    const parsed = JSON.parse(jsonContent.trim());
    return {
      success: true,
      analysis: parsed,
      usage: response.usage
    };
  } catch (parseError) {
    // Return the raw content if JSON parsing fails
    return {
      success: true,
      analysis: null,
      rawContent: response.content,
      usage: response.usage
    };
  }
}

/**
 * Generate a professional DataQ challenge letter
 * @param {Object} letterData - Data for letter generation
 * @returns {Promise<Object>} Generated letter content
 */
async function generateDataQLetter(letterData) {
  const { violation, challengeType, rdrType, reason, companyInfo, evidenceList } = letterData;

  const { RDR_TYPES } = require('../config/rdrTypes');

  const challengeTypeDescriptions = {
    data_error: 'Data Error - The factual information in the inspection report is incorrect',
    policy_violation: 'Policy Violation - The inspector did not follow proper FMCSA procedures',
    procedural_error: 'Procedural Error - The inspection was not conducted according to guidelines',
    not_responsible: 'Not Responsible - The carrier/driver should not be held responsible'
  };

  // Build RDR-specific context when available
  let rdrContext = '';
  if (rdrType && RDR_TYPES[rdrType]) {
    const rdr = RDR_TYPES[rdrType];
    const reviewerLabels = {
      state: 'State Review',
      fmcsa_division: 'FMCSA Division Office',
      fmcsa_hq: 'FMCSA Headquarters',
      volpe: 'Volpe Center'
    };
    rdrContext = `
- RDR Type: ${rdr.name}
- Reviewed by: ${reviewerLabels[rdr.reviewer] || rdr.reviewer}
- RDR Description: ${rdr.description}`;
  }

  const message = `Generate a professional DataQ challenge letter with the following information:

VIOLATION BEING CHALLENGED:
- Inspection Report Number: ${violation.inspectionNumber}
- Violation Code: ${violation.violationCode || 'Not specified'}
- Violation Type: ${violation.violationType}
- Description: ${violation.description}
- Date of Inspection: ${violation.violationDate}
- Location: ${violation.location?.city || ''}, ${violation.location?.state || ''}
- BASIC Category: ${violation.basic}
- Severity Weight: ${violation.severityWeight}/10
- Out of Service: ${violation.outOfService ? 'Yes' : 'No'}

CHALLENGE DETAILS:
- Challenge Type: ${challengeTypeDescriptions[challengeType] || challengeType}${rdrContext}
- Grounds for Challenge: ${reason}

CARRIER INFORMATION:
- Company Name: ${companyInfo?.name || '[COMPANY NAME]'}
- DOT Number: ${companyInfo?.dotNumber || '[DOT NUMBER]'}
- Address: ${companyInfo?.address || '[ADDRESS]'}
- Contact Email: ${companyInfo?.email || '[EMAIL]'}
- Contact Phone: ${companyInfo?.phone || '[PHONE]'}

SUPPORTING EVIDENCE TO REFERENCE:
${evidenceList && evidenceList.length > 0 ? evidenceList.map((e, i) => `${i + 1}. ${e}`).join('\n') : '- Supporting documentation to be attached'}

Generate a complete, ready-to-submit DataQ challenge letter following proper format and including relevant CFR citations.`;

  const response = await query('dataQLetterGenerator', message, { maxTokens: 3000 });

  return {
    success: true,
    letter: response.content,
    challengeType,
    usage: response.usage
  };
}

/**
 * Generate a comprehensive compliance report using Claude
 * @param {Object} companyData - Aggregated compliance data snapshot
 * @returns {Object} Structured report with findings and action items
 */
async function generateComplianceReport(companyData) {
  const userMessage = `Analyze this carrier's complete FMCSA compliance data and generate a comprehensive report:\n\n${JSON.stringify(companyData, null, 2)}`;

  const response = await query('complianceReportAnalyzer', userMessage, {
    maxTokens: 4096
  });

  // Parse the JSON response from Claude
  let report;
  try {
    // Strip any markdown code fences if present
    let content = response.content;
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    report = JSON.parse(content);
  } catch (e) {
    console.error('[AI] Failed to parse compliance report JSON:', e.message);
    throw new Error('AI returned invalid report format');
  }

  return {
    report,
    usage: response.usage
  };
}

module.exports = {
  query,
  parseRegulationResponse,
  analyzeDQF,
  analyzeCSARisk,
  generateDataQChallenge,
  analyzeDataQChallenge,
  generateDataQLetter,
  generateComplianceReport,
  SYSTEM_PROMPTS
};

const Anthropic = require('@anthropic-ai/sdk');

// Initialize client - will use ANTHROPIC_API_KEY from environment
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// System prompts for different AI features
const SYSTEM_PROMPTS = {
  regulationAssistant: `You are a FMCSA compliance expert assistant for trucking companies. You help with questions about federal motor carrier safety regulations.

Your expertise covers:
- 49 CFR Part 391 (Qualifications of Drivers and Longer Combination Vehicle Driver Instructors)
- 49 CFR Part 382 (Controlled Substances and Alcohol Use and Testing)
- 49 CFR Part 395 (Hours of Service of Drivers)
- 49 CFR Part 396 (Inspection, Repair, and Maintenance)
- 49 CFR Part 393 (Parts and Accessories Necessary for Safe Operation)
- 49 CFR Part 390 (Federal Motor Carrier Safety Regulations - General)
- FMCSA SMS/CSA scoring system and BASICs

Response Format:
Always structure your response with:
1. **Answer**: Direct, plain-English answer to the question
2. **CFR Reference**: Specific regulation citation (e.g., "49 CFR §391.51(b)(2)")
3. **Action Items**: Practical next steps the carrier should take

Guidelines:
- Be concise and actionable
- Use bullet points for clarity
- If a question is outside FMCSA regulations, say so clearly
- If you're uncertain about specific details, acknowledge it
- Never provide legal advice - recommend consulting with a compliance attorney for complex legal matters
- Focus on helping small fleet operators (under 50 trucks) stay compliant`,

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

  csaAnalyzer: `You are a CSA/SMS risk analyst for motor carriers. You analyze violation data and predict BASIC percentile impacts.

6 BASIC Categories and Intervention Thresholds:
1. Unsafe Driving - 65% threshold (speeding, reckless driving, improper lane change)
2. Hours of Service (HOS) Compliance - 65% threshold (logbook violations, driving beyond hours)
3. Vehicle Maintenance - 80% threshold (brakes, lights, tires defects)
4. Controlled Substances/Alcohol - 80% threshold (drug/alcohol violations)
5. Driver Fitness - 80% threshold (invalid CDL, medical certificate issues)
6. Crash Indicator - 65% threshold (crash involvement patterns)

Severity weights range from 1-10, with time weights decreasing older violations.

Provide:
1. Overall risk level (Low/Medium/High/Critical)
2. Which BASICs are at or approaching threshold
3. Highest-impact violations to prioritize
4. Predicted trend if current pattern continues
5. Specific recommendations to reduce CSA score`,

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
- Be honest about likelihood of success`
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

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

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
    console.error('AI Service Error:', error.message);

    // Handle specific API errors
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

module.exports = {
  query,
  parseRegulationResponse,
  analyzeDQF,
  analyzeCSARisk,
  generateDataQChallenge,
  SYSTEM_PROMPTS
};

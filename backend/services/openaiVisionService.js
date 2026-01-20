const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

// Initialize OpenAI client
const OPENAI_ENABLED = !!process.env.OPENAI_API_KEY;
const openai = OPENAI_ENABLED ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

if (!OPENAI_ENABLED) {
  console.warn('WARNING: OpenAI is not configured. Set OPENAI_API_KEY to enable document intelligence features.');
}

/**
 * Document extraction prompts by type
 */
const EXTRACTION_PROMPTS = {
  medical_card: `You are analyzing a Medical Examiner's Certificate (DOT medical card).
Extract the following information in JSON format:
{
  "examinerName": "Full name of the medical examiner",
  "examinerNPI": "NPI number if visible",
  "examinationDate": "YYYY-MM-DD format",
  "expirationDate": "YYYY-MM-DD format",
  "certificationType": "interstate" or "intrastate" or "intrastate_non_excepted",
  "restrictions": ["array of any restrictions noted"],
  "driverName": "Driver's name if visible",
  "confidence": 0.0-1.0 confidence score
}
If a field is not visible or unclear, use null.`,

  cdl: `You are analyzing a Commercial Driver's License (CDL).
Extract the following information in JSON format:
{
  "licenseNumber": "The license number",
  "state": "2-letter state code",
  "class": "A", "B", or "C",
  "endorsements": ["array of endorsement codes like H, N, P, S, T, X"],
  "restrictions": ["array of restriction codes"],
  "issueDate": "YYYY-MM-DD format",
  "expirationDate": "YYYY-MM-DD format",
  "driverName": "Full name on license",
  "dateOfBirth": "YYYY-MM-DD format if visible",
  "confidence": 0.0-1.0 confidence score
}
If a field is not visible or unclear, use null.`,

  inspection_report: `You are analyzing a DOT Roadside Inspection Report.
Extract the following information in JSON format:
{
  "reportNumber": "The inspection report number",
  "inspectionDate": "YYYY-MM-DD format",
  "inspectionTime": "HH:MM format if visible",
  "location": {
    "city": "City name",
    "state": "2-letter state code"
  },
  "inspector": {
    "name": "Inspector name if visible",
    "badge": "Badge/ID number if visible"
  },
  "carrier": {
    "name": "Carrier/company name",
    "dotNumber": "DOT number"
  },
  "driver": {
    "name": "Driver name",
    "licenseState": "2-letter state code",
    "licenseNumber": "CDL number if visible"
  },
  "vehicle": {
    "unitNumber": "Unit/truck number",
    "vin": "VIN if visible",
    "licensePlate": "Plate number if visible",
    "plateState": "2-letter state code"
  },
  "inspectionLevel": "1", "2", "3", "4", or "5",
  "hazmatPlacard": true or false,
  "oosStatus": {
    "driver": true or false,
    "vehicle": true or false
  },
  "violations": [
    {
      "code": "The violation code (e.g., 396.3(a)(1))",
      "description": "Description of the violation",
      "isOutOfService": true or false,
      "unit": "driver" or "vehicle" or "carrier"
    }
  ],
  "confidence": 0.0-1.0 confidence score
}
Extract ALL violations listed on the report. If a field is not visible or unclear, use null.`,

  drug_test: `You are analyzing a Drug and Alcohol Test Result form.
Extract the following information in JSON format:
{
  "testType": "pre_employment", "random", "post_accident", "reasonable_suspicion", "return_to_duty", or "follow_up",
  "testDate": "YYYY-MM-DD format",
  "collectionTime": "HH:MM format if visible",
  "donorName": "Employee/driver name",
  "donorSSN": "Last 4 digits only if visible, format: XXXX",
  "specimenType": "urine", "breath", "hair", "saliva", or "blood",
  "drugTestResult": "negative", "positive", "dilute_negative", or "invalid",
  "alcoholTestResult": "negative", "positive", or null if not tested,
  "alcoholConcentration": number or null,
  "substancesTested": ["array of substances tested"],
  "substancesDetected": ["array of substances detected, if positive"],
  "mroName": "Medical Review Officer name",
  "mroVerificationDate": "YYYY-MM-DD format",
  "labName": "Testing laboratory name if visible",
  "confidence": 0.0-1.0 confidence score
}
If a field is not visible or unclear, use null.`,

  generic: `Analyze this document and extract all relevant information.
Identify the document type and extract key fields in JSON format:
{
  "documentType": "best guess at document type",
  "extractedFields": {
    // Include all identified fields with their values
  },
  "dates": {
    // Any dates found with their context
  },
  "names": {
    // Any names found with their context
  },
  "confidence": 0.0-1.0 confidence score
}`
};

/**
 * Classification prompt to identify document type
 */
const CLASSIFICATION_PROMPT = `Analyze this document image and identify what type of document it is.
Choose from these types:
- medical_card: DOT Medical Examiner's Certificate
- cdl: Commercial Driver's License
- inspection_report: DOT Roadside Inspection Report
- drug_test: Drug and/or Alcohol Test Result
- annual_inspection: Annual Vehicle Inspection Report (396.17)
- employment_application: Driver Employment Application
- mvr: Motor Vehicle Record
- insurance_certificate: Certificate of Insurance
- registration: Vehicle Registration
- title: Vehicle Title
- other: Other/unknown document type

Return ONLY a JSON object:
{
  "type": "the document type code",
  "confidence": 0.0-1.0 confidence score,
  "description": "brief description of why you classified it this way"
}`;

const openaiVisionService = {
  /**
   * Check if OpenAI is enabled
   */
  isEnabled() {
    return OPENAI_ENABLED;
  },

  /**
   * Classify a document image
   * @param {Buffer|string} imageInput - Image buffer or file path
   * @returns {Object} Classification result
   */
  async classifyDocument(imageInput) {
    if (!OPENAI_ENABLED) {
      throw new Error('OpenAI is not configured. Set OPENAI_API_KEY to enable this feature.');
    }

    const base64Image = await this._getBase64Image(imageInput);
    const mimeType = this._getMimeType(imageInput);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: CLASSIFICATION_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high'
              }
            }
          ]
        }],
        max_tokens: 500
      });

      const content = response.choices[0].message.content;

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse classification response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error classifying document:', error);
      throw error;
    }
  },

  /**
   * Extract data from a document image
   * @param {Buffer|string} imageInput - Image buffer or file path
   * @param {string} documentType - Type of document (medical_card, cdl, etc.)
   * @returns {Object} Extracted data
   */
  async extractDocumentData(imageInput, documentType) {
    if (!OPENAI_ENABLED) {
      throw new Error('OpenAI is not configured. Set OPENAI_API_KEY to enable this feature.');
    }

    const prompt = EXTRACTION_PROMPTS[documentType] || EXTRACTION_PROMPTS.generic;
    const base64Image = await this._getBase64Image(imageInput);
    const mimeType = this._getMimeType(imageInput);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high'
              }
            }
          ]
        }],
        max_tokens: 2000
      });

      const content = response.choices[0].message.content;

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse extraction response');
      }

      const extracted = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        documentType,
        data: extracted,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        }
      };
    } catch (error) {
      console.error('Error extracting document data:', error);
      throw error;
    }
  },

  /**
   * Classify and extract in one call (more efficient)
   * @param {Buffer|string} imageInput - Image buffer or file path
   * @returns {Object} Classification and extracted data
   */
  async analyzeDocument(imageInput) {
    if (!OPENAI_ENABLED) {
      throw new Error('OpenAI is not configured. Set OPENAI_API_KEY to enable this feature.');
    }

    const base64Image = await this._getBase64Image(imageInput);
    const mimeType = this._getMimeType(imageInput);

    const combinedPrompt = `First, identify what type of document this is. Then extract all relevant information.

Document types:
- medical_card: DOT Medical Examiner's Certificate
- cdl: Commercial Driver's License
- inspection_report: DOT Roadside Inspection Report
- drug_test: Drug and/or Alcohol Test Result
- annual_inspection: Annual Vehicle Inspection Report
- other: Other document type

Return a JSON object with this structure:
{
  "classification": {
    "type": "document type code",
    "confidence": 0.0-1.0
  },
  "extracted": {
    // Include all relevant fields based on document type
    // For medical_card: examinerName, expirationDate, certificationType, restrictions, etc.
    // For cdl: licenseNumber, state, class, endorsements, expirationDate, etc.
    // For inspection_report: reportNumber, date, violations[], oosStatus, etc.
    // For drug_test: testType, testDate, result, substances, mroName, etc.
  }
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: combinedPrompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high'
              }
            }
          ]
        }],
        max_tokens: 3000
      });

      const content = response.choices[0].message.content;

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse analysis response');
      }

      const result = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        ...result,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        }
      };
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw error;
    }
  },

  /**
   * Analyze multiple pages of a document
   * @param {Array<Buffer|string>} imageInputs - Array of image buffers or file paths
   * @param {string} documentType - Expected document type
   * @returns {Object} Combined extracted data
   */
  async analyzeMultiPageDocument(imageInputs, documentType) {
    if (!OPENAI_ENABLED) {
      throw new Error('OpenAI is not configured. Set OPENAI_API_KEY to enable this feature.');
    }

    const prompt = EXTRACTION_PROMPTS[documentType] || EXTRACTION_PROMPTS.generic;

    // Build content array with all images
    const content = [{ type: 'text', text: `${prompt}\n\nThis document has multiple pages. Analyze all pages together and combine the information.` }];

    for (const imageInput of imageInputs) {
      const base64Image = await this._getBase64Image(imageInput);
      const mimeType = this._getMimeType(imageInput);

      content.push({
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64Image}`,
          detail: 'high'
        }
      });
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content
        }],
        max_tokens: 4000
      });

      const responseContent = response.choices[0].message.content;
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Failed to parse multi-page extraction response');
      }

      return {
        success: true,
        documentType,
        data: JSON.parse(jsonMatch[0]),
        pageCount: imageInputs.length,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        }
      };
    } catch (error) {
      console.error('Error analyzing multi-page document:', error);
      throw error;
    }
  },

  // Private helper methods

  /**
   * Convert image input to base64
   */
  async _getBase64Image(input) {
    if (Buffer.isBuffer(input)) {
      return input.toString('base64');
    }

    // Assume it's a file path
    const fileBuffer = await fs.readFile(input);
    return fileBuffer.toString('base64');
  },

  /**
   * Determine MIME type from input
   */
  _getMimeType(input) {
    let filePath = '';

    if (Buffer.isBuffer(input)) {
      // For buffers, default to JPEG
      return 'image/jpeg';
    }

    filePath = input.toLowerCase();

    if (filePath.endsWith('.png')) return 'image/png';
    if (filePath.endsWith('.gif')) return 'image/gif';
    if (filePath.endsWith('.webp')) return 'image/webp';
    if (filePath.endsWith('.pdf')) return 'application/pdf';

    // Default to JPEG for other image types
    return 'image/jpeg';
  }
};

module.exports = openaiVisionService;

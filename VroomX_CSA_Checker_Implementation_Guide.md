# FREE CSA Score Checker - Complete Implementation Guide

This is your **#1 lead magnet** and the most powerful free tool you can build to attract owner-operators and small fleet owners.

---

## What It Does

A free public tool where anyone can:
1. **Enter their MC# or DOT#**
2. **Instantly see their CSA health snapshot**
3. **Get a teaser of what's wrong** (enough to create urgency)
4. **Enter email to unlock the full AI-powered analysis**

---

## Why This Works

| Factor | Impact |
|--------|--------|
| **Immediate Value** | Carriers see their actual data - not generic info |
| **Creates Urgency** | "Your Unsafe Driving score is in the WARNING zone" |
| **Demonstrates AI** | Shows your AI can analyze their specific situation |
| **Low Friction** | No signup needed to start - just enter MC# |
| **Viral Potential** | Carriers share with other owner-operators |
| **Expected Conversion** | 15-20% email capture → 5-10% to paid trial |

---

## Data Source: FMCSA SAFER System

**Good news:** CSA data is **PUBLIC and FREE** from FMCSA!

### API Endpoint
```
https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=MC_MX&query_string={MC_NUMBER}
```

### What You Can Fetch (Free):
- **Company Name & Address**
- **DOT Number & MC Number**
- **Operating Status** (Active/Inactive)
- **Entity Type** (Carrier, Broker, etc.)
- **Operation Classification** (Interstate/Intrastate)
- **Cargo Types Carried**
- **Fleet Size** (Power units, drivers)
- **Safety Rating** (Satisfactory/Conditional/Unsatisfactory)
- **Out of Service Rate** (%)
- **BASIC Scores** (7 categories, 0-100 percentile)
- **Recent Inspections Count**
- **Recent Violations Count**
- **Crash Data** (last 24 months)

---

## The 7 BASIC Categories to Display

| BASIC | What It Measures | Alert Threshold |
|-------|------------------|-----------------|
| **Unsafe Driving** | Speeding, reckless driving, improper lane changes | >65% |
| **Crash Indicator** | Crash involvement patterns | >65% |
| **HOS Compliance** | Hours of Service violations | >65% |
| **Vehicle Maintenance** | Brake, light, and other vehicle issues | >80% |
| **Controlled Substances** | Drug/alcohol violations | >80% |
| **Hazmat Compliance** | Hazmat-specific violations | >80% |
| **Driver Fitness** | License, medical cert, CDL issues | >80% |

### Color Coding:
- **Green (0-50%)** - Good standing
- **Yellow (51-65%)** - Watch zone
- **Red (>65/80%)** - Intervention threshold (FMCSA may audit)

---

## User Flow Design

### Step 1: Landing Page (Public)

```
┌─────────────────────────────────────────────┐
│                                             │
│   FREE CSA Score Health Check               │
│                                             │
│   See where your carrier stands with FMCSA  │
│   in 30 seconds. No signup required.        │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  Enter MC# or DOT#: [___________]   │   │
│   │                                     │   │
│   │        [ CHECK MY SCORE ]           │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   100% Free | No credit card | Instant      │
│                                             │
└─────────────────────────────────────────────┘
```

### Step 2: Results Preview (Still Public - No Email Yet)

```
┌─────────────────────────────────────────────┐
│                                             │
│   ABC TRUCKING LLC                          │
│   MC# 123456 | DOT# 7891011                 │
│   Status: ACTIVE                            │
│                                             │
│   ─────────────────────────────────────     │
│                                             │
│   CSA SCORE SNAPSHOT                        │
│                                             │
│   Unsafe Driving     ████████░░  78% [RED]  │
│   HOS Compliance     ██████░░░░  62% [YLW]  │
│   Vehicle Maint.     ████░░░░░░  43% [GRN]  │
│   Crash Indicator    ███░░░░░░░  31% [GRN]  │
│   Driver Fitness     ██░░░░░░░░  18% [GRN]  │
│                                             │
│   WARNING: 1 BASIC ABOVE INTERVENTION       │
│                                             │
│   ─────────────────────────────────────     │
│                                             │
│   UNLOCK FULL AI ANALYSIS:                  │
│   • Which violations are hurting you most   │
│   • How to reduce your scores               │
│   • DataQ challenge opportunities           │
│   • Comparison to similar carriers          │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  Email: [_________________________] │   │
│   │                                     │   │
│   │   [ GET MY FREE AI REPORT ]         │   │
│   └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### Step 3: Full Report (After Email Capture)

```
┌─────────────────────────────────────────────┐
│                                             │
│   AI-POWERED CSA ANALYSIS                   │
│   for ABC TRUCKING LLC                      │
│                                             │
│   ═══════════════════════════════════════   │
│                                             │
│   CRITICAL: UNSAFE DRIVING (78%)            │
│                                             │
│   Your top violations dragging this up:     │
│   • Speeding 15+ over (3 violations)        │
│   • Following too closely (2 violations)    │
│   • Improper lane change (1 violation)      │
│                                             │
│   AI RECOMMENDATION:                        │
│   "Focus on the 3 speeding violations.      │
│   These carry the highest severity weight.  │
│   Consider challenging the 04/15/2025       │
│   violation - location data may be          │
│   inaccurate based on GPS records."         │
│                                             │
│   DataQ Challenge Opportunity: YES          │
│   Estimated score reduction: -12 points     │
│                                             │
│   ─────────────────────────────────────     │
│                                             │
│   WATCH: HOS COMPLIANCE (62%)               │
│   [Similar detailed breakdown...]           │
│                                             │
│   ═══════════════════════════════════════   │
│                                             │
│   Want VroomX to track your CSA score       │
│   monthly and alert you to changes?         │
│                                             │
│   [ START FREE 14-DAY TRIAL ]               │
│                                             │
│   Starting at $19/month for owner-operators │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Technical Implementation

### Backend API Route - Basic Preview

```javascript
// /api/csa-checker/route.ts

export async function POST(request: Request) {
  const { mcNumber } = await request.json();

  // 1. Fetch from FMCSA SAFER API
  const fmcsaData = await fetchFMCSAData(mcNumber);

  // 2. Return basic preview (no email required)
  return {
    company: fmcsaData.legalName,
    mcNumber: fmcsaData.mcNumber,
    dotNumber: fmcsaData.dotNumber,
    status: fmcsaData.operatingStatus,
    basics: {
      unsafeDriving: fmcsaData.basicScores.unsafeDriving,
      hosCompliance: fmcsaData.basicScores.hos,
      vehicleMaintenance: fmcsaData.basicScores.vehicle,
      crashIndicator: fmcsaData.basicScores.crash,
      controlledSubstances: fmcsaData.basicScores.drugs,
      hazmatCompliance: fmcsaData.basicScores.hazmat,
      driverFitness: fmcsaData.basicScores.fitness,
    },
    alertCount: calculateAlerts(fmcsaData.basicScores),
    // DON'T include: detailed violations, AI analysis, recommendations
  };
}

function calculateAlerts(scores) {
  let alerts = 0;
  if (scores.unsafeDriving > 65) alerts++;
  if (scores.hos > 65) alerts++;
  if (scores.crash > 65) alerts++;
  if (scores.vehicle > 80) alerts++;
  if (scores.drugs > 80) alerts++;
  if (scores.hazmat > 80) alerts++;
  if (scores.fitness > 80) alerts++;
  return alerts;
}
```

### Full Report API (Requires Email)

```javascript
// /api/csa-checker/full-report/route.ts

export async function POST(request: Request) {
  const { mcNumber, email } = await request.json();

  // 1. Validate email
  if (!isValidEmail(email)) {
    return { error: 'Invalid email address' };
  }

  // 2. Save email to database (lead capture!)
  await saveLeadToDatabase({
    email,
    mcNumber,
    source: 'csa-checker',
    createdAt: new Date(),
  });

  // 3. Add to email sequence
  await addToEmailSequence(email, 'csa-checker-lead');

  // 4. Fetch detailed violation data
  const violations = await fetchDetailedViolations(mcNumber);

  // 5. Generate AI analysis (use GPT-4o-mini to save cost)
  const aiAnalysis = await generateAIAnalysis(violations);

  // 6. Return full report
  return {
    ...basicData,
    violations: violations,
    aiRecommendations: aiAnalysis.recommendations,
    dataQOpportunities: aiAnalysis.challengeable,
    scoreProjection: aiAnalysis.projectedImprovement,
  };
}
```

### FMCSA Data Fetcher

```javascript
// /lib/fmcsa.ts

const FMCSA_BASE_URL = 'https://safer.fmcsa.dot.gov';

export async function fetchFMCSAData(mcNumber: string) {
  // Option 1: Web scraping (SAFER doesn't have official API)
  const url = `${FMCSA_BASE_URL}/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=MC_MX&query_string=${mcNumber}`;

  const response = await fetch(url);
  const html = await response.text();

  // Parse HTML to extract data
  return parseSAFERPage(html);
}

// Alternative: Use FMCSA's QCMobile API (more structured)
export async function fetchFromQCMobile(dotNumber: string) {
  const url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/${dotNumber}?webKey=YOUR_API_KEY`;

  const response = await fetch(url);
  return response.json();
}

function parseSAFERPage(html: string) {
  // Use cheerio or similar to parse
  // Extract: company name, DOT#, MC#, BASIC scores, etc.
  // Return structured object
}
```

### AI Analysis Function

```javascript
// /lib/ai-analysis.ts

import OpenAI from 'openai';

const openai = new OpenAI();

export async function generateAIAnalysis(carrierData: CarrierData) {
  const prompt = `You are a FMCSA compliance expert. Analyze this carrier's CSA data:

Company: ${carrierData.companyName}
DOT#: ${carrierData.dotNumber}

BASIC Scores:
- Unsafe Driving: ${carrierData.basics.unsafeDriving}%
- HOS Compliance: ${carrierData.basics.hosCompliance}%
- Vehicle Maintenance: ${carrierData.basics.vehicleMaintenance}%
- Crash Indicator: ${carrierData.basics.crashIndicator}%
- Controlled Substances: ${carrierData.basics.controlledSubstances}%
- Hazmat Compliance: ${carrierData.basics.hazmatCompliance}%
- Driver Fitness: ${carrierData.basics.driverFitness}%

Recent Violations:
${formatViolations(carrierData.violations)}

Provide a JSON response with:
{
  "summary": "One paragraph overview of their compliance status",
  "criticalIssues": ["List of BASICs needing immediate attention"],
  "topViolations": [
    {
      "violation": "Description",
      "impact": "How much it affects score",
      "recommendation": "What to do"
    }
  ],
  "dataQOpportunities": [
    {
      "violation": "Which violation",
      "reason": "Why it may be challengeable",
      "estimatedImpact": "Points that could be removed"
    }
  ],
  "actionPlan": ["Step 1", "Step 2", "Step 3"],
  "projectedImprovement": "Estimated score reduction if recommendations followed"
}

Keep language simple - written for truckers, not lawyers.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Use mini to save costs!
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  });

  return JSON.parse(response.choices[0].message.content);
}
```

---

## Database Schema

```sql
-- Leads table
CREATE TABLE csa_checker_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  mc_number VARCHAR(20),
  dot_number VARCHAR(20),
  company_name VARCHAR(255),
  source VARCHAR(50) DEFAULT 'csa-checker',
  created_at TIMESTAMP DEFAULT NOW(),
  converted_to_trial BOOLEAN DEFAULT FALSE,
  converted_to_paid BOOLEAN DEFAULT FALSE
);

-- Index for quick lookups
CREATE INDEX idx_leads_email ON csa_checker_leads(email);
CREATE INDEX idx_leads_created ON csa_checker_leads(created_at);
```

---

## Email Capture Follow-Up Sequence

### Email 1: Immediate (After Report)

**Subject:** Your CSA Analysis for {Company Name}

```
Hi {First Name},

Thanks for using VroomX's free CSA Score Checker!

Here's a quick summary of what we found for {Company Name}:

OVERALL STATUS: {Good/Needs Attention/Critical}

{If critical issues exist:}
Your biggest risk right now is your {BASIC Name} score at {X}%.
This puts you above FMCSA's intervention threshold, which means
you could be subject to an audit or investigation.

{If DataQ opportunities exist:}
Good news: We identified {X} violations that may be challengeable
through the DataQ process. Successfully challenging these could
reduce your score by an estimated {Y} points.

Want us to help you:
✓ Track your CSA score automatically each month
✓ Get alerts when scores change
✓ Generate DataQ challenge letters with AI
✓ Stay compliant with document expiry reminders

→ Start your free 14-day trial: {link}

No credit card required. Cancel anytime.

Drive safe,
The VroomX Team
```

### Email 2: Day 2

**Subject:** Did you know this violation can be challenged?

```
Hi {First Name},

Quick question: Did you know that many violations on your
CSA record can be challenged and removed?

The DataQ process allows you to dispute violations that:
• Have incorrect information
• Were entered in error
• Don't meet FMCSA criteria

For {Company Name}, we identified potential DataQ opportunities
that could reduce your score by {X} points.

Most carriers don't challenge violations because:
1. They don't know they can
2. The paperwork is confusing
3. They don't have time

VroomX's AI can draft DataQ challenge letters for you in seconds.

→ See how it works: {link}

Talk soon,
The VroomX Team

P.S. The average DQF violation costs carriers $11,956.
Prevention is always cheaper than penalties.
```

### Email 3: Day 5

**Subject:** How ABC Trucking reduced their CSA score by 23 points

```
Hi {First Name},

I wanted to share a quick success story...

ABC Trucking (a 4-truck fleet out of Texas) was struggling
with an Unsafe Driving score of 82% - well above the
intervention threshold.

They were worried about:
• Losing contracts with shippers
• Higher insurance premiums
• Potential FMCSA audit

After using VroomX for 3 months:
✓ Challenged 4 violations through DataQ (3 removed!)
✓ Set up driver coaching based on AI recommendations
✓ Reduced Unsafe Driving score from 82% to 59%

"I had no idea some of those violations could be challenged.
VroomX paid for itself in the first month." - Mike, Owner

Want similar results for {Company Name}?

→ Start your free trial: {link}

Best,
The VroomX Team
```

### Email 4: Day 7

**Subject:** Last chance: 20% off your first month

```
Hi {First Name},

This is my last email about your CSA score (I promise!).

I wanted to offer you an exclusive deal:

USE CODE: CSACHECKER20
GET: 20% off your first month of VroomX

That's just $15.20/month for our Solo plan (normally $19).

You'll get:
✓ AI-powered compliance assistant
✓ Automatic CSA score monitoring
✓ DataQ challenge letter generator
✓ Document expiry alerts
✓ Full DQF management

→ Claim your discount: {link}

Code expires in 48 hours.

If VroomX isn't right for you, no worries! Your free CSA
report is yours to keep.

Safe travels,
The VroomX Team
```

---

## Cost Analysis

| Item | Cost Per Report |
|------|-----------------|
| FMCSA API | **FREE** (public data) |
| AI Analysis (GPT-4o-mini) | ~$0.002 |
| Email Sending (Resend) | FREE (under 3K/month) |
| Database Storage | ~$0.0001 |
| Hosting (Vercel) | FREE |
| **Total per lead** | **< $0.01** |

### ROI Projection

| Metric | Value |
|--------|-------|
| Monthly visitors to CSA Checker | 1,000 |
| Email capture rate | 20% |
| Emails captured | 200 |
| Trial conversion rate | 10% |
| Trials started | 20 |
| Trial to paid rate | 50% |
| **New paying customers** | **10** |
| Average revenue per customer | $25/month |
| **Monthly revenue from tool** | **$250** |
| **Annual revenue from tool** | **$3,000** |

And this compounds as your email list grows!

---

## Frontend Component (React/Next.js)

```tsx
// components/CSAChecker.tsx

'use client';

import { useState } from 'react';

export default function CSAChecker() {
  const [mcNumber, setMcNumber] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'input' | 'preview' | 'full'>('input');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkScore = async () => {
    setLoading(true);
    const res = await fetch('/api/csa-checker', {
      method: 'POST',
      body: JSON.stringify({ mcNumber }),
    });
    const result = await res.json();
    setData(result);
    setStep('preview');
    setLoading(false);
  };

  const getFullReport = async () => {
    setLoading(true);
    const res = await fetch('/api/csa-checker/full-report', {
      method: 'POST',
      body: JSON.stringify({ mcNumber, email }),
    });
    const result = await res.json();
    setData(result);
    setStep('full');
    setLoading(false);
  };

  const getScoreColor = (score: number, threshold: number) => {
    if (score >= threshold) return 'bg-red-500';
    if (score >= threshold - 15) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {step === 'input' && (
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            Free CSA Score Health Check
          </h1>
          <p className="text-gray-600 mb-8">
            See where your carrier stands with FMCSA in 30 seconds.
            No signup required.
          </p>
          <input
            type="text"
            placeholder="Enter MC# or DOT#"
            value={mcNumber}
            onChange={(e) => setMcNumber(e.target.value)}
            className="w-full p-4 border rounded-lg mb-4"
          />
          <button
            onClick={checkScore}
            disabled={loading || !mcNumber}
            className="w-full bg-blue-600 text-white p-4 rounded-lg font-semibold"
          >
            {loading ? 'Checking...' : 'Check My Score'}
          </button>
        </div>
      )}

      {step === 'preview' && data && (
        <div>
          <h2 className="text-2xl font-bold">{data.company}</h2>
          <p className="text-gray-600">
            MC# {data.mcNumber} | DOT# {data.dotNumber}
          </p>

          <div className="mt-6 space-y-3">
            {Object.entries(data.basics).map(([key, score]) => (
              <div key={key} className="flex items-center gap-4">
                <span className="w-40">{formatBasicName(key)}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${getScoreColor(score, 65)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="w-12 text-right">{score}%</span>
              </div>
            ))}
          </div>

          {data.alertCount > 0 && (
            <div className="mt-4 p-4 bg-red-100 rounded-lg">
              ⚠️ {data.alertCount} BASIC(s) above intervention threshold
            </div>
          )}

          <div className="mt-8 p-6 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-4">
              Unlock Full AI Analysis:
            </h3>
            <ul className="text-sm text-gray-600 mb-4 space-y-2">
              <li>• Which violations are hurting you most</li>
              <li>• How to reduce your scores</li>
              <li>• DataQ challenge opportunities</li>
              <li>• Comparison to similar carriers</li>
            </ul>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg mb-3"
            />
            <button
              onClick={getFullReport}
              disabled={loading || !email}
              className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold"
            >
              {loading ? 'Generating...' : 'Get My Free AI Report'}
            </button>
          </div>
        </div>
      )}

      {step === 'full' && data && (
        <div>
          {/* Full report with AI analysis */}
          <h2 className="text-2xl font-bold mb-6">
            AI-Powered CSA Analysis
          </h2>

          <div className="prose">
            <p>{data.aiRecommendations.summary}</p>

            {data.aiRecommendations.criticalIssues.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg my-4">
                <h3 className="text-red-700">Critical Issues</h3>
                <ul>
                  {data.aiRecommendations.criticalIssues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.dataQOpportunities.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg my-4">
                <h3 className="text-green-700">DataQ Challenge Opportunities</h3>
                {data.dataQOpportunities.map((opp, i) => (
                  <div key={i} className="mb-2">
                    <strong>{opp.violation}</strong>
                    <p className="text-sm">{opp.reason}</p>
                    <p className="text-sm text-green-600">
                      Potential impact: {opp.estimatedImpact}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 p-6 bg-blue-50 rounded-lg text-center">
              <h3>Want VroomX to track your CSA score monthly?</h3>
              <p className="text-gray-600 mb-4">
                Get alerts when scores change, generate DataQ letters with AI,
                and stay compliant automatically.
              </p>
              <a
                href="/signup?source=csa-checker"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Start Free 14-Day Trial
              </a>
              <p className="text-sm text-gray-500 mt-2">
                Starting at $19/month for owner-operators
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## SEO Optimization

### Target Keywords
- "free csa score check"
- "check my csa score"
- "fmcsa csa score lookup"
- "carrier safety score check"
- "dot number lookup csa"
- "trucking company safety score"

### Page Title
```
Free CSA Score Checker | Check Your FMCSA Safety Score Instantly | VroomX
```

### Meta Description
```
Check your CSA score for free in 30 seconds. Enter your MC# or DOT#
to see your BASIC scores, identify violations, and get AI-powered
recommendations to improve your FMCSA safety rating.
```

### Schema Markup
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Free CSA Score Checker",
  "description": "Check your FMCSA CSA safety score instantly",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

---

## Launch Checklist

### Development
- [ ] Build landing page with MC# input
- [ ] Connect to FMCSA SAFER API (or scraper)
- [ ] Create results preview component
- [ ] Build email gate for full report
- [ ] Set up AI analysis with GPT-4o-mini
- [ ] Create database table for leads
- [ ] Add email validation
- [ ] Build full report page

### Email Setup
- [ ] Set up Resend (or similar) account
- [ ] Create 4-email nurture sequence
- [ ] Set up automation triggers
- [ ] Test email deliverability

### Launch
- [ ] Add to homepage navigation
- [ ] Create dedicated /csa-checker URL
- [ ] Add social proof counter ("X carriers checked")
- [ ] Share in 5 trucking Facebook groups
- [ ] Post on relevant subreddits
- [ ] Add Facebook Pixel for retargeting

### Tracking
- [ ] Set up conversion tracking
- [ ] Track: visits → email capture → trial → paid
- [ ] A/B test email gate placement
- [ ] Monitor AI costs per report

---

## Pro Tips for Maximum Conversion

1. **Add Social Proof**
   - "3,247 carriers have checked their score this month"
   - Real-time counter increases trust

2. **Create Urgency**
   - "⚠️ FMCSA reviews carriers above intervention threshold monthly"
   - "Your score updates every 30 days"

3. **Make It Shareable**
   - "Send this report to your safety manager" button
   - PDF download option for full report

4. **Retarget Non-Converters**
   - Add Facebook/Google Pixel
   - Show ads to visitors who didn't enter email
   - "Come back and finish your CSA analysis"

5. **Iterate Based on Data**
   - A/B test the email gate placement
   - Test: before scores vs after scores vs both
   - Optimize based on conversion rate

---

## Alternative: Partner with Existing Data Providers

If scraping FMCSA is challenging, consider:

| Provider | What They Offer | Cost |
|----------|-----------------|------|
| **Carrier411** | API for carrier data | ~$0.10/lookup |
| **SaferWatch** | Pre-built CSA data | ~$0.15/lookup |
| **DAT** | Comprehensive carrier data | Enterprise pricing |

These can simplify development but add per-lookup costs.

---

## Summary

The FREE CSA Score Checker is your **most important marketing asset**:

- **$0 cost** to build (uses free public data)
- **< $0.01** per lead (AI is cheap)
- **15-20%** email capture rate
- **5-10%** trial conversion
- **Compounds over time** as your email list grows

**Build this BEFORE any paid marketing!**

It demonstrates your AI value, captures leads, and converts them to paying customers automatically.

---

*This is your top-of-funnel growth engine. Every carrier who checks their score is a potential customer.*

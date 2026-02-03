# 🔍 MVR/PSP Integration Research for VroomX

## Quick Answer: Which is Cheaper & Faster?

| Service | Cost Per Check | Setup Cost | Speed | Difficulty |
|---------|---------------|------------|-------|------------|
| **PSP (FMCSA)** | $10/report | $25-100/year | Instant | Medium |
| **MVR (via provider)** | $6-15 + state fee | $0-500 | Instant-24hrs | Easy |
| **MVR (direct to DMV)** | State fee only ($3-12) | Huge effort | Days-Weeks | Very Hard |

### 🏆 RECOMMENDATION FOR MVP:
**Start with PSP only** - It's FMCSA official data, cheap ($10/report), and relevant to trucking. Add MVR in Phase 2.

---

## 📋 PSP (Pre-Employment Screening Program)

### What It Is
- **Official FMCSA program** for driver safety history
- Shows: 5 years crash data + 3 years inspection/violation data
- Used for: Pre-hire screening, monitoring existing drivers

### Pricing
| Item | Cost |
|------|------|
| Per report | **$10** |
| Annual fee (under 100 trucks) | **$25/year** |
| Annual fee (100+ trucks) | $100/year |

### How to Integrate

**Option 1: Direct through NIC (FMCSA's contractor)**
- Sign up at [psp.fmcsa.dot.gov](https://www.psp.fmcsa.dot.gov/)
- Get API access for your software
- Requires: Driver's written consent for each check

**Option 2: Through a reseller (easier)**
- Companies like [Accio Data](https://www.acciodata.com/news/psp/) offer PSP integration
- Still need NIC account first
- They handle the API complexity

### PSP Pros & Cons

| Pros | Cons |
|------|------|
| ✅ Official FMCSA data | ❌ Only shows FMCSA data (not state MVR) |
| ✅ Cheap - $10/report | ❌ Requires driver consent |
| ✅ Instant results | ❌ Updated monthly (not real-time) |
| ✅ Industry standard | ❌ API integration takes effort |
| ✅ Low annual fee for small fleets | |

---

## 📋 MVR (Motor Vehicle Records)

### What It Is
- **State DMV driving records**
- Shows: Violations, accidents, license status, points
- Used for: Hiring, insurance, ongoing monitoring

### Pricing (State Fees + Provider Fee)

| State | State Fee | Years |
|-------|-----------|-------|
| Alabama | $10.00 | 3 year |
| Alaska | $10.00 | 3 year |
| Arizona | $6.00-$8.00 | 3-5 year |
| California | $5.00 | 3 year |
| Colorado | $8.00 | 7 year |
| Florida | $8.05 | 7 year |
| New York | $7.00 | varies |
| Texas | $6.00 | 3 year |

*Plus provider fee: $1.95 - $10.95 per check*

### MVR Provider Comparison

| Provider | Per Check Cost | Setup Fee | API | Best For |
|----------|---------------|-----------|-----|----------|
| **Checkr** | $9.50 + state | $0 | ✅ Yes | Small business, easy API |
| **SambaSafety** | ~$5-8 + state | Custom | ✅ Yes | Fleets, continuous monitoring |
| **MVRcheck.com** | $1.95 + state | $0 | ✅ Yes | Low volume, simple needs |
| **MVRNOW** | $1.95 + state | $0 | ✅ Yes | Pay as you go |
| **StarPoint** | $10.95 all-in | $0 | Limited | Simple, no tech |
| **GoodHire** | ~$15 + state | Setup fee | ✅ Yes | HR-focused |

### MVR Providers Detail

#### 1. Checkr (Best for Small Business + API)
- **Cost**: $9.50/MVR + state fee, Commercial MVR $14.50
- **API**: Excellent, well-documented
- **Pros**: Modern API, easy integration, no setup fee
- **Cons**: Not trucking-specific
- **Website**: [checkr.com](https://checkr.com/pricing)

#### 2. SambaSafety (Best for Trucking Fleets)
- **Cost**: Custom pricing, ~$5-8 + state fee
- **API**: Full API with continuous monitoring
- **Pros**: Trucking-focused, CSA + MVR combined, real-time alerts
- **Cons**: Enterprise pricing, may be expensive for small fleet
- **Website**: [sambasafety.com](https://sambasafety.com/)

#### 3. MVRcheck.com (Cheapest Simple Option)
- **Cost**: $1.95 + state fee
- **API**: XML gateway available
- **Pros**: Cheapest per-check, simple
- **Cons**: Basic features, older tech
- **Website**: [mvrcheck.com](https://mvrcheck.com/mvrs/api/)

#### 4. MVRNOW (Good Balance)
- **Cost**: $1.95 + state fee
- **API**: Available
- **Pros**: Simple pricing, fast turnaround
- **Cons**: Less features than SambaSafety
- **Website**: [mvrnow.com](https://www.mvrnow.com/)

---

## 💡 RECOMMENDATION FOR VROOMX

### Phase 1 (MVP Launch) - NO MVR/PSP
Don't integrate MVR/PSP for initial launch. Reasons:
- Adds complexity
- Requires compliance (driver consent forms)
- Costs money per check
- Focus on core features first

### Phase 2 (Month 2-3) - Add PSP First
**Why PSP first:**
1. Official FMCSA data (your users trust it)
2. Cheap: $10/report + $25/year
3. Directly relevant to trucking compliance
4. Competitive advantage (not all small tools have it)

**Implementation:**
1. Sign up at psp.fmcsa.dot.gov
2. Get API credentials from NIC
3. Add "Run PSP Check" button on driver profile
4. Charge users $15/check (you make $5 profit)

### Phase 3 (Month 4-6) - Add MVR
**Why MVR later:**
1. More complex (50 states = 50 different systems)
2. Higher cost to implement
3. Users will ask for it after using PSP

**Best provider for VroomX:**
- **Checkr** - if you want easy API, modern docs
- **MVRcheck** - if you want cheapest per-check
- **SambaSafety** - if you want to compete with enterprise

---

## 💰 Cost Comparison for VroomX Users

### Scenario: Fleet with 10 drivers, annual checks

| Service | Per Check | Annual Cost | Your Price | Your Profit |
|---------|-----------|-------------|------------|-------------|
| PSP | $10 | $100/year + $25 fee = $125 | $150 ($15 each) | $25 |
| MVR (via Checkr) | ~$15 | $150/year | $200 ($20 each) | $50 |
| Both | $25 | $275/year | $300 ($30 each) | $25 |

### Pricing Strategy
- **Don't include MVR/PSP in base subscription**
- Charge per-check: PSP $15, MVR $20, Both $30
- Or offer "Unlimited Checks" add-on: $49/month

---

## 🔧 Technical Integration Notes

### PSP API
```
Endpoint: https://www.psp.fmcsa.dot.gov/PspApi/
Auth: API Key from NIC
Format: XML/JSON
Docs: PSP Account Holder User Manual (PDF)
```

### Checkr API (for MVR)
```
Endpoint: https://api.checkr.com/v1/
Auth: API Key (OAuth)
Format: JSON REST
Docs: https://docs.checkr.com/
```

### MVRcheck API
```
Endpoint: XML Gateway
Auth: Username/Password
Format: XML
Docs: Contact for access
```

---

## ⏰ Implementation Timeline

| Phase | Task | Time | Cost |
|-------|------|------|------|
| **Phase 2** | PSP Integration | 1-2 weeks | $25 setup |
| **Phase 3** | MVR via Checkr | 2-3 weeks | $0 setup |
| **Phase 4** | Continuous Monitoring | 2-4 weeks | Provider dependent |

---

## 📚 Sources

- [FMCSA PSP Official Site](https://www.psp.fmcsa.dot.gov/)
- [Checkr Pricing](https://checkr.com/pricing)
- [SambaSafety MVR Services](https://sambasafety.com/capabilities/mvr-services)
- [SambaSafety State Fees](https://support.sambasafety.com/en_US/fees/us-mvr-state-fees)
- [MVRcheck API](https://mvrcheck.com/mvrs/api/)
- [MVRNOW State Fees](https://www.mvrnow.com/StateForms/MvrnowStateFees.pdf)
- [Checkr vs SambaSafety Comparison](https://sambasafety.com/checkr-vs-sambasafety)
- [FMCSA Developer Portal](https://mobile.fmcsa.dot.gov/)

---

## ✅ ACTION ITEMS

### For MVP (Now)
- [ ] Skip MVR/PSP integration - not needed for launch

### For Phase 2 (Month 2-3)
- [ ] Sign up for PSP account at psp.fmcsa.dot.gov
- [ ] Get API credentials from NIC
- [ ] Build "Run PSP Check" feature
- [ ] Add consent form for drivers
- [ ] Price at $15/check

### For Phase 3 (Month 4-6)
- [ ] Evaluate Checkr vs MVRcheck based on user feedback
- [ ] Integrate chosen MVR provider
- [ ] Add MVR to driver profiles
- [ ] Price at $20/check


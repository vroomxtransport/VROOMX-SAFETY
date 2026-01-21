import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  FiUsers, FiTruck, FiBarChart2, FiAlertTriangle, FiDroplet,
  FiFileText, FiCheckCircle, FiShield, FiClipboard, FiArrowRight,
  FiPaperclip, FiSend, FiPlay, FiSearch, FiCheck, FiX, FiLock,
  FiChevronDown, FiDatabase, FiAward, FiZap, FiHeadphones
} from 'react-icons/fi';
import CSAChecker from '../components/CSAChecker';
import PublicHeader from '../components/PublicHeader';
import VroomXLogo from '../components/VroomXLogo';

const Landing = () => {
  // Hero typewriter cycling state
  const [heroTextIndex, setHeroTextIndex] = useState(0);
  const heroTexts = ['ZERO STRESS.', 'NO MESS.'];

  // Pricing toggle state
  const [isAnnual, setIsAnnual] = useState(false);

  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);

  // Chat Q&A cycling state
  const [currentQAIndex, setCurrentQAIndex] = useState(0);
  const [chatPhase, setChatPhase] = useState('question'); // 'question', 'typing', 'answer', 'pause'

  // Q&A data for the live chat demo
  const chatQA = [
    {
      question: "Do I need an ELD under 100 miles?",
      answer: {
        intro: "If you meet the <span class='text-white font-semibold'>short-haul exemption</span> under <span class='text-primary-400 font-mono text-xs bg-primary-500/10 px-1 py-0.5 rounded border border-primary-500/20'>49 CFR §395.1(e)</span>, you are exempt from ELD use as long as:",
        bullets: [
          "You operate within a 150 air-mile radius",
          "You return to the work reporting location each day",
          "You drive no more than 11 hours"
        ],
        source: "FMCSA Rules & Regulations"
      }
    },
    {
      question: "When does my medical card expire?",
      answer: {
        intro: "Medical certificates are valid for <span class='text-white font-semibold'>up to 24 months</span>. However, certain conditions may require more frequent certification:",
        bullets: [
          "High blood pressure may require annual recertification",
          "Diabetes requiring insulin requires annual exams",
          "Vision waivers must be renewed annually"
        ],
        source: "49 CFR §391.45"
      }
    },
    {
      question: "How long are violations on my CSA score?",
      answer: {
        intro: "Roadside inspection results and violations remain in your <span class='text-white font-semibold'>SMS BASICs</span> for:",
        bullets: [
          "24 months from the inspection date",
          "Older violations carry less weight (time-weighting)",
          "Crash results stay for 24 months as well"
        ],
        source: "FMCSA SMS Methodology"
      }
    },
    {
      question: "What triggers a DOT audit?",
      answer: {
        intro: "FMCSA may schedule an <span class='text-white font-semibold'>intervention</span> based on:",
        bullets: [
          "High BASIC percentiles (above thresholds)",
          "Complaints filed against your carrier",
          "Serious crashes or fatalities",
          "Random New Entrant Safety Audits"
        ],
        source: "FMCSA Compliance & Enforcement"
      }
    }
  ];

  // Cycle through chat phases
  useEffect(() => {
    const phases = {
      question: 1000,    // Show question for 1s
      typing: 1800,      // Show typing indicator for 1.8s
      answer: 5500,      // Show answer for 5.5s
      pause: 600         // Brief pause before next Q&A
    };

    const timer = setTimeout(() => {
      if (chatPhase === 'question') {
        setChatPhase('typing');
      } else if (chatPhase === 'typing') {
        setChatPhase('answer');
      } else if (chatPhase === 'answer') {
        setChatPhase('pause');
      } else if (chatPhase === 'pause') {
        setCurrentQAIndex((prev) => (prev + 1) % chatQA.length);
        setChatPhase('question');
      }
    }, phases[chatPhase]);

    return () => clearTimeout(timer);
  }, [chatPhase, chatQA.length]);

  // Cycle hero typewriter text every 5s (matching CSS animation duration)
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroTextIndex((prev) => (prev + 1) % heroTexts.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroTexts.length]);

  const testimonials = [
    {
      quote: 'We went from missing expirations every month to <span class="text-primary-500 font-bold">zero compliance violations</span> in the past year. The SMS BASICs tracking alone has saved us from an intervention.',
      name: 'Sarah Jenkins',
      role: 'Safety Director',
      fleet: '45 Trucks',
      featured: true,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face'
    },
    {
      quote: 'The DQF management is a lifesaver. I used to spend hours auditing files manually. Now I just check the dashboard once a week.',
      name: 'Mike Ross',
      role: 'Owner Operator',
      fleet: '3 Trucks',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      quote: "Finally, software that feels modern. It's fast, looks great, and actually makes sense. My drivers even use the portal without complaining.",
      name: 'David Chen',
      role: 'Fleet Mgr',
      fleet: '120 Trucks',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    {
      quote: 'Audit readiness reports are worth the subscription alone. We passed our New Entrant Audit with zero issues thanks to the checklists.',
      name: 'Elena Rodriguez',
      role: 'Compliance Officer',
      fleet: '',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    {
      quote: 'I was skeptical about the AI alerts, but they actually predicted a maintenance issue before it became a violation. Impressive tech.',
      name: 'Marcus Johnson',
      role: 'Ops Director',
      fleet: '85 Trucks',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
    }
  ];

  const blogPosts = [
    {
      category: 'Regulation',
      date: 'Oct 12, 2025',
      title: '2026 FMCSA Proposed Rule Changes',
      excerpt: "New proposals for electronic IDs on CMVs and what it means for your fleet's privacy.",
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop'
    },
    {
      category: 'Tech',
      date: 'Sep 28, 2025',
      title: 'Digitizing Driver Qualification Files',
      excerpt: 'Why sticking to paper filings is costing you more than just storage space.',
      image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&h=400&fit=crop'
    },
    {
      category: 'Safety',
      date: 'Sep 15, 2025',
      title: 'Preparing for a Remote Audit',
      excerpt: 'Step-by-step checklist to ensure your digital records pass inspection.',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&h=400&fit=crop'
    }
  ];

  // FAQ Data
  const faqData = [
    {
      question: "How does the free trial work?",
      answer: "Start your 3-day free trial with no credit card required. You get full access to all features in your chosen plan. If you love it, simply add your payment method to continue. If not, your account automatically pauses—no charges, no hassle."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-level 256-bit SSL encryption for all data transfers. Your information is stored on SOC2-compliant servers with daily backups. We never sell or share your data with third parties."
    },
    {
      question: "Can I switch plans later?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, the change takes effect at your next billing cycle."
    },
    {
      question: "What happens if I add more drivers?",
      answer: "Our pricing scales with your fleet. Solo plan includes 1 driver, Fleet includes 3 drivers (+$6/driver after), and Pro includes 10 drivers (+$5/driver after). You can add or remove drivers anytime from your dashboard."
    },
    {
      question: "Do you integrate with ELD providers?",
      answer: "Yes, we integrate with most major ELD providers including KeepTruckin, Samsara, and Omnitracs. This allows automatic Hours of Service data sync and violation monitoring."
    },
    {
      question: "How accurate is the CSA score checker?",
      answer: "Our CSA checker pulls data directly from the FMCSA SMS database, the same source enforcement officers use. We update scores weekly and provide 24-month historical tracking for all 7 BASICs."
    }
  ];

  // Pricing data
  const pricingPlans = [
    {
      name: 'Solo',
      subtitle: 'For Owner-Operators',
      monthlyPrice: 19,
      annualPrice: 15,
      drivers: '1 driver included',
      features: [
        'Full DQF Management',
        'AI Regulation Assistant',
        'CSA Score Tracking',
        'Document Expiry Alerts',
        '100 AI queries/month'
      ],
      popular: false,
      color: 'primary'
    },
    {
      name: 'Fleet',
      subtitle: 'For Small Fleets (2-10 drivers)',
      monthlyPrice: 39,
      annualPrice: 31,
      drivers: '3 drivers included',
      extraDriver: '+$6/driver after 3',
      features: [
        'Everything in Solo',
        '3 drivers included',
        'AI Violation Reader',
        'DataQ Draft Generator',
        'Multi-user Access',
        'Priority Support'
      ],
      popular: true,
      color: 'cta'
    },
    {
      name: 'Pro',
      subtitle: 'For Growing Fleets (10-50 drivers)',
      monthlyPrice: 79,
      annualPrice: 63,
      drivers: '10 drivers included',
      extraDriver: '+$5/driver after 10',
      features: [
        'Everything in Fleet',
        '10 drivers included',
        'Advanced CSA Analytics',
        'Custom Reports',
        'API Access',
        'Dedicated Support'
      ],
      popular: false,
      color: 'primary'
    }
  ];

  // Comparison data
  const comparisonFeatures = [
    { feature: 'CSA Score Tracking', vroomx: true, spreadsheets: false, other: 'limited' },
    { feature: 'AI Regulation Assistant', vroomx: true, spreadsheets: false, other: false },
    { feature: 'Automatic Expiry Alerts', vroomx: true, spreadsheets: false, other: true },
    { feature: 'DataQ Challenge Support', vroomx: true, spreadsheets: false, other: false },
    { feature: 'Mobile Access', vroomx: true, spreadsheets: 'limited', other: true },
    { feature: 'FMCSA Data Integration', vroomx: true, spreadsheets: false, other: 'limited' },
    { feature: 'Setup Time', vroomx: '10 min', spreadsheets: 'Hours', other: '1-2 days' },
    { feature: 'Starting Price', vroomx: '$19/mo', spreadsheets: 'Free*', other: '$50+/mo' },
  ];

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      {/* Fixed Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.04]" />
        {/* Animated Blobs - Softer for light theme */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-500/10 blur-[120px] rounded-full animate-blob" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-cta-500/8 blur-[120px] rounded-full animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-primary-300/15 blur-[120px] rounded-full animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navigation */}
      <PublicHeader activePage="landing" />

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center pt-32 pb-24 px-6 md:px-16 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260"
            className="w-full h-full object-cover"
            alt="American Truck Background"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent" />
        </div>

        <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Hero Text */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Social Proof Badge */}
            <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[#E2E8F0] shadow-sm animate-fade-in-up">
              <div className="flex -space-x-2">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" className="w-8 h-8 rounded-full border-2 border-white" alt="" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face" className="w-8 h-8 rounded-full border-2 border-white" alt="" />
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" className="w-8 h-8 rounded-full border-2 border-white" alt="" />
              </div>
              <span className="text-sm text-[#475569]">
                <strong className="text-primary-500">500+</strong> carriers trust VroomX
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-8 font-heading animate-fade-in-up text-primary-500">
              TOTAL<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-500 to-cta-600">COMPLIANCE.</span><br />
              <span className="inline-grid text-left">
                <span className="invisible col-start-1 row-start-1">ZERO STRESS.</span>
                <span
                  key={heroTextIndex}
                  className="typewriter-text col-start-1 row-start-1 text-transparent bg-clip-text bg-gradient-to-b from-[#475569] to-[#94A3B8]"
                >
                  {heroTexts[heroTextIndex]}
                </span>
              </span>
            </h1>

            <p className="text-[#475569] text-lg md:text-xl max-w-xl mb-8 leading-relaxed animate-fade-in-up mx-auto lg:mx-0" style={{ animationDelay: '0.1s' }}>
              The all-in-one platform for 49 CFR requirements. Track DQF files, maintenance, and SMS BASICs with
              predictive alerts that keep you off the radar.
            </p>

            {/* Stats inline */}
            <div className="flex flex-wrap gap-6 mb-10 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="text-center">
                <div className="text-2xl font-black text-cta-500">3,247+</div>
                <div className="text-xs text-[#475569]">CSA Checks</div>
              </div>
              <div className="w-px bg-[#E2E8F0]" />
              <div className="text-center">
                <div className="text-2xl font-black text-primary-500">99.2%</div>
                <div className="text-xs text-[#475569]">Uptime</div>
              </div>
              <div className="w-px bg-[#E2E8F0]" />
              <div className="text-center">
                <div className="text-2xl font-black text-success-500">4.9★</div>
                <div className="text-xs text-[#475569]">Rating</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Link
                to="/register"
                className="btn-glow px-8 py-4 rounded-xl font-bold text-white text-base tracking-wide flex items-center justify-center gap-3"
              >
                Start Free Trial
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="px-8 py-4 rounded-xl font-bold text-primary-500 text-base tracking-wide border border-primary-500/30 bg-white hover:bg-primary-50 transition-all flex items-center justify-center gap-3 group"
              >
                View Demo
                <FiPlay className="w-5 h-5 group-hover:translate-x-1 transition-transform text-primary-500" />
              </a>
            </div>
          </div>

          {/* CSA Score Checker - Hero Lead Magnet */}
          <div className="order-1 lg:order-2 relative animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            {/* Glowing backdrop */}
            <div className="absolute inset-0 bg-cta-500/15 blur-[80px] -z-10 rounded-full" />
            <CSAChecker />
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="relative z-10 py-8 border-y border-[#E2E8F0] bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-3 text-[#475569]">
              <div className="w-10 h-10 rounded-full bg-success-50 flex items-center justify-center">
                <FiLock className="w-5 h-5 text-success-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1E293B]">SSL Secure</div>
                <div className="text-xs text-[#94A3B8]">256-bit encryption</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[#475569]">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                <FiDatabase className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1E293B]">FMCSA Data</div>
                <div className="text-xs text-[#94A3B8]">Official SMS source</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[#475569]">
              <div className="w-10 h-10 rounded-full bg-cta-50 flex items-center justify-center">
                <FiAward className="w-5 h-5 text-cta-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1E293B]">SOC2 Compliant</div>
                <div className="text-xs text-[#94A3B8]">Enterprise security</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[#475569]">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <FiHeadphones className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1E293B]">US Support</div>
                <div className="text-xs text-[#94A3B8]">Real humans, fast</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 py-12 border-b border-[#E2E8F0] bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 px-6">
          {[
            { value: '6+', label: 'SMS BASICs Tracked' },
            { value: '49 CFR', label: 'Compliance Built-In' },
            { value: '30/14/7', label: 'Day Expiration Alerts' },
            { value: 'DataQ', label: 'Challenge Support' }
          ].map((stat, i) => (
            <div key={i} className="text-center group">
              <div className="text-3xl md:text-4xl font-black tracking-tight text-primary-500 group-hover:text-cta-500 transition-colors duration-300 font-heading">
                {stat.value === '49 CFR' ? (
                  <><span className="text-cta-500 group-hover:text-primary-500 transition-colors">49</span> CFR</>
                ) : stat.value === 'DataQ' ? (
                  <>Data<span className="text-cta-500 group-hover:text-primary-500 transition-colors">Q</span></>
                ) : stat.value === '6+' ? (
                  <>6<span className="text-cta-500 group-hover:text-primary-500 transition-colors">+</span></>
                ) : (
                  stat.value.split('/').map((v, idx) => (
                    <span key={idx}>{idx > 0 && <span className="text-[#94A3B8]">/</span>}{v}</span>
                  ))
                )}
              </div>
              <div className="text-xs text-[#475569] mt-2 uppercase tracking-widest font-mono">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-32 px-6 md:px-16 relative z-10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-block px-3 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-500 font-mono text-xs mb-6">
              // THE PROBLEM
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-8 leading-tight text-primary-500">
              Compliance is a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-500 to-cta-600">Mess.</span><br />
              <span className="text-[#475569]">VroomX helps to clean it up.</span>
            </h2>
            <p className="text-lg text-[#475569] leading-relaxed mb-10">
              You're running a trucking business, not a filing cabinet. FMCSA requirements are complex, but your software
              shouldn't be. Stop juggling spreadsheets and start automating your safety.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: FiAlertTriangle, title: 'Missed Expirations', desc: 'Medical cards and CDLs expiring without notice cost thousands in fines.', color: 'red' },
                { icon: FiBarChart2, title: 'Rising BASICs', desc: 'One bad inspection can ruin your safety score for 24 months.', color: 'amber' },
                { icon: FiFileText, title: 'Scattered Docs', desc: 'Driver files in one place, maintenance in another. Audit chaos.', color: 'primary' },
                { icon: FiClipboard, title: 'Unfiled DataQs', desc: 'Wrong violations staying on your record because challenges are hard.', color: 'purple' }
              ].map((item, i) => (
                <div key={i} className="bg-white border border-[#E2E8F0] p-4 rounded-xl flex items-start gap-4 hover:border-primary-500/30 hover:shadow-md transition-all">
                  <div className={`p-2 rounded-lg mt-1 ${
                    item.color === 'red' ? 'bg-red-50 text-red-500' :
                    item.color === 'amber' ? 'bg-amber-50 text-amber-500' :
                    item.color === 'primary' ? 'bg-primary-50 text-primary-500' :
                    'bg-purple-50 text-purple-500'
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-primary-500 font-bold text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-[#475569] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-cta-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />

            {/* Excel-Style Spreadsheet Mockup - CHAOTIC MESS */}
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl">
              {/* Excel Title Bar */}
              <div className="bg-[#217346] px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28ca42]" />
                  </div>
                  <span className="text-white/90 text-[10px] font-medium ml-2 truncate">driver_docs_COPY_FINAL(2)_backup.xlsx</span>
                </div>
                <div className="text-red-400 text-[9px] font-medium animate-pulse">⚠️ Last saved: 6 months ago</div>
              </div>

              {/* Excel Ribbon (simplified) */}
              <div className="bg-[#1e1e1e] border-b border-white/10 px-2 py-1.5 flex items-center gap-4">
                <span className="text-[10px] text-white/40 px-2 py-0.5 bg-white/5 rounded">File</span>
                <span className="text-[10px] text-white/40 px-2 py-0.5">Home</span>
                <span className="text-[10px] text-white/40 px-2 py-0.5">Insert</span>
                <span className="text-[10px] text-white/40 px-2 py-0.5">Data</span>
              </div>

              {/* Formula Bar - Broken Formula */}
              <div className="bg-[#252526] border-b border-white/10 px-2 py-1.5 flex items-center gap-2">
                <span className="text-[10px] text-white/60 bg-white/5 px-2 py-0.5 rounded font-mono">fx</span>
                <span className="text-[10px] text-red-400 font-mono">=VLOOKUP(A2,Sheet3!A:B,2,FALSE) → #N/A ❌</span>
              </div>

              {/* Sheet Tabs - Confusing Names */}
              <div className="bg-[#1e1e1e] px-2 py-1 flex items-center gap-1 border-b border-white/10 overflow-x-auto">
                <div className="px-2 py-1 bg-[#252526] text-white/90 text-[9px] font-medium rounded-t border-t border-x border-white/10 whitespace-nowrap">
                  Sheet1
                </div>
                <div className="px-2 py-1 text-white/40 text-[9px] whitespace-nowrap">Copy of Drivers (2)</div>
                <div className="px-2 py-1 text-red-400/60 text-[9px] whitespace-nowrap line-through">OLD DONT USE</div>
              </div>

              {/* Spreadsheet Content - CHAOS */}
              <div className="bg-[#1e1e1e] p-0 overflow-hidden">
                {/* Column Headers */}
                <div className="grid grid-cols-[32px_90px_100px_85px_55px] text-[9px] font-bold bg-[#252526] border-b border-white/10">
                  <div className="p-1.5 text-white/40 border-r border-white/10"></div>
                  <div className="p-1.5 text-white/60 border-r border-white/10 text-center">A</div>
                  <div className="p-1.5 text-white/60 border-r border-white/10 text-center">B</div>
                  <div className="p-1.5 text-white/60 border-r border-white/10 text-center">C</div>
                  <div className="p-1.5 text-white/60 text-center">D</div>
                </div>
                <div className="grid grid-cols-[32px_90px_100px_85px_55px] text-[9px] font-semibold bg-[#2d2d2d] border-b border-white/10">
                  <div className="p-1.5 text-white/40 border-r border-white/10 text-center">1</div>
                  <div className="p-1.5 text-white/80 border-r border-white/10">driver name</div>
                  <div className="p-1.5 text-white/80 border-r border-white/10">doc type</div>
                  <div className="p-1.5 text-white/80 border-r border-white/10">status??</div>
                  <div className="p-1.5 text-white/80">expiry</div>
                </div>

                {/* Chaotic Data Rows */}
                {/* Row 2 - Yellow highlight panic */}
                <div className="grid grid-cols-[32px_90px_100px_85px_55px] text-[9px] border-b border-white/5 bg-yellow-500/20">
                  <div className="p-1.5 text-white/40 border-r border-white/10 text-center bg-[#252526]">2</div>
                  <div className="p-1.5 text-white/70 border-r border-white/10 font-mono truncate">J. Smith</div>
                  <div className="p-1.5 text-white/70 border-r border-white/10 font-mono truncate">Medical Card</div>
                  <div className="p-1.5 border-r border-white/10 font-mono font-bold text-red-400 bg-red-500/20">EXPIRED??</div>
                  <div className="p-1.5 font-mono text-center text-white/40">???</div>
                </div>

                {/* Row 3 - Missing data */}
                <div className="grid grid-cols-[32px_90px_100px_85px_55px] text-[9px] border-b border-white/5 bg-[#252526]">
                  <div className="p-1.5 text-white/40 border-r border-white/10 text-center bg-[#252526]">3</div>
                  <div className="p-1.5 text-white/40 border-r border-white/10 font-mono italic"></div>
                  <div className="p-1.5 text-white/70 border-r border-white/10 font-mono truncate">CDL</div>
                  <div className="p-1.5 border-r border-white/10 font-mono text-white/40 italic">check cabinet</div>
                  <div className="p-1.5 font-mono text-center text-white/40"></div>
                </div>

                {/* Row 4 - Error cell */}
                <div className="grid grid-cols-[32px_90px_100px_85px_55px] text-[9px] border-b border-white/5 bg-[#1e1e1e]">
                  <div className="p-1.5 text-white/40 border-r border-white/10 text-center bg-[#252526]">4</div>
                  <div className="p-1.5 text-red-400 border-r border-white/10 font-mono bg-red-500/30">#REF!</div>
                  <div className="p-1.5 text-white/70 border-r border-white/10 font-mono truncate">MVR</div>
                  <div className="p-1.5 border-r border-white/10 font-mono text-amber-400">ASK MIKE</div>
                  <div className="p-1.5 font-mono text-center text-red-400">#N/A</div>
                </div>

                {/* Row 5 - Yellow highlight */}
                <div className="grid grid-cols-[32px_90px_100px_85px_55px] text-[9px] border-b border-white/5 bg-yellow-500/20">
                  <div className="p-1.5 text-white/40 border-r border-white/10 text-center bg-[#252526]">5</div>
                  <div className="p-1.5 text-white/70 border-r border-white/10 font-mono truncate">garcia M</div>
                  <div className="p-1.5 text-white/70 border-r border-white/10 font-mono truncate">drug test?</div>
                  <div className="p-1.5 border-r border-white/10 font-mono text-white/40 italic">idk</div>
                  <div className="p-1.5 font-mono text-center text-white/40">??</div>
                </div>

                {/* Row 6 - Inconsistent */}
                <div className="grid grid-cols-[32px_90px_100px_85px_55px] text-[9px] border-b border-white/5 bg-[#252526]">
                  <div className="p-1.5 text-white/40 border-r border-white/10 text-center bg-[#252526]">6</div>
                  <div className="p-1.5 text-white/70 border-r border-white/10 font-mono truncate">truck 101</div>
                  <div className="p-1.5 text-white/70 border-r border-white/10 font-mono truncate">Annual insp</div>
                  <div className="p-1.5 border-r border-white/10 font-mono font-bold text-red-400 bg-red-500/20">OVERDUE!!</div>
                  <div className="p-1.5 font-mono text-center text-red-400">-89</div>
                </div>

                {/* Row 7 - More chaos */}
                <div className="grid grid-cols-[32px_90px_100px_85px_55px] text-[9px] border-b border-white/5 bg-[#1e1e1e]">
                  <div className="p-1.5 text-white/40 border-r border-white/10 text-center bg-[#252526]">7</div>
                  <div className="p-1.5 text-white/40 border-r border-white/10 font-mono italic">???</div>
                  <div className="p-1.5 text-white/70 border-r border-white/10 font-mono truncate">Clearinghous</div>
                  <div className="p-1.5 border-r border-white/10 font-mono text-amber-400 text-[8px]">WHERE IS THIS</div>
                  <div className="p-1.5 font-mono text-center text-white/40"></div>
                </div>

                {/* Row 8 - Partial/faded */}
                <div className="grid grid-cols-[32px_90px_100px_85px_55px] text-[9px] bg-[#1e1e1e] opacity-50">
                  <div className="p-1.5 text-white/40 border-r border-white/10 text-center bg-[#252526]">8</div>
                  <div className="p-1.5 text-white/70 border-r border-white/10 font-mono">R.J.</div>
                  <div className="p-1.5 text-red-400 border-r border-white/10 font-mono">#REF!</div>
                  <div className="p-1.5 border-r border-white/10 font-mono text-white/40">...</div>
                  <div className="p-1.5 font-mono text-center">...</div>
                </div>

                {/* Status Bar - PANIC MODE */}
                <div className="bg-[#c42b1c] px-3 py-1.5 flex items-center justify-between mt-1">
                  <span className="text-[8px] text-white font-medium">⚠️ 12 ERRORS • AUDIT IN 3 DAYS!! • WHERE IS J.SMITH MVR???</span>
                  <span className="text-[8px] text-white/60 animate-pulse">Not responding...</span>
                </div>
              </div>
            </div>

            {/* Sticker */}
            <div className="absolute -bottom-6 -right-6 bg-cta-500 text-white p-4 lg:p-6 rotate-[-15deg] font-black uppercase text-lg lg:text-xl shadow-2xl z-20 border-4 border-white transform transition-transform hover:scale-110 hover:rotate-[-10deg]">
              PROBLEM SOLVED
            </div>
          </div>
        </div>
      </section>

      {/* ===== AI ASSISTANT SECTION ===== */}
      <section className="py-24 px-6 md:px-16 relative z-10 overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-ai-500/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Marketing Copy */}
            <div className="order-2 lg:order-1">
              <div className="inline-block px-3 py-1 rounded-full border border-ai-500/30 bg-ai-500/10 text-ai-500 font-mono text-xs mb-6">
                // AI-POWERED COMPLIANCE
              </div>
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary-500 mb-6 leading-tight">
                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-ai-500 to-ai-600">24/7</span><br />
                Compliance Expert
              </h2>
              <p className="text-lg text-[#475569] leading-relaxed mb-8">
                Ask anything about FMCSA regulations and get instant answers with CFR citations. Our AI assistant knows
                the Federal Motor Carrier Safety Regulations inside and out.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  { q: 'What triggers a post-accident drug test?', icon: FiDroplet },
                  { q: 'How long do violations stay on my CSA score?', icon: FiBarChart2 },
                  { q: 'When is a medical card required?', icon: FiFileText }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-lg bg-ai-500/10 border border-ai-500/20 flex items-center justify-center text-ai-500 group-hover:bg-ai-500/20 transition-colors">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[#475569] text-sm italic">"{item.q}"</span>
                  </div>
                ))}
              </div>

              <Link
                to="/register"
                className="btn-glow inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-white text-base"
              >
                Start Free Trial
                <FiArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Right Column - Compact Chat Demo */}
            <div className="order-1 lg:order-2 relative">
              <div className="absolute inset-0 bg-ai-500/10 blur-[60px] -z-10 rounded-full" />

              <div className="bg-primary-500 backdrop-blur-xl border border-primary-400/30 rounded-2xl overflow-hidden ring-1 ring-primary-400/20 shadow-2xl shadow-primary-500/20">
                {/* Window Header */}
                <div className="px-4 py-3 bg-primary-600/50 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-ai-500 to-ai-600 flex items-center justify-center text-white font-bold text-[10px] shadow-lg shadow-ai-500/30">
                      AI
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">VroomX Assistant</div>
                      <div className="text-[9px] text-green-300 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                        Online
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#28ca42]" />
                  </div>
                </div>

                {/* Compact Chat Body */}
                <div className="p-4 bg-primary-600/30 backdrop-blur-md h-[280px] flex flex-col justify-end space-y-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-5" />

                  {/* User Message */}
                  <div key={`q-compact-${currentQAIndex}`} className="flex justify-end relative z-10 animate-fade-in">
                    <div className="bg-white/20 text-white px-3 py-2 rounded-xl rounded-tr-sm border border-white/10 backdrop-blur-sm shadow-lg max-w-[85%]">
                      <p className="text-xs font-medium">{chatQA[currentQAIndex].question}</p>
                    </div>
                  </div>

                  {/* AI Typing Indicator */}
                  {chatPhase === 'typing' && (
                    <div className="flex justify-start relative z-10 animate-fade-in">
                      <div className="flex gap-2 items-center">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-ai-500 to-ai-600 flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold shadow-lg shadow-ai-500/30">
                          VX
                        </div>
                        <div className="bg-white/10 px-3 py-2 rounded-xl rounded-tl-sm border border-white/10 backdrop-blur-sm">
                          <div className="flex gap-1">
                            <div className="w-1 h-1 bg-ai-400 rounded-full animate-typing-dot" />
                            <div className="w-1 h-1 bg-ai-400 rounded-full animate-typing-dot" style={{ animationDelay: '0.1s' }} />
                            <div className="w-1 h-1 bg-ai-400 rounded-full animate-typing-dot" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Response */}
                  {chatPhase === 'answer' && (
                    <div key={`a-compact-${currentQAIndex}`} className="flex justify-start relative z-10 animate-message-pop">
                      <div className="flex gap-2 max-w-[90%]">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-ai-500 to-ai-600 flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold mt-0.5 shadow-lg shadow-ai-500/30">
                          VX
                        </div>
                        <div className="bg-white/15 text-white/90 px-3 py-3 rounded-xl rounded-tl-sm border border-white/10 backdrop-blur-sm shadow-lg">
                          <p className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: chatQA[currentQAIndex].answer.intro }} />
                          <ul className="mt-2 space-y-1 text-[10px] text-white/80 list-disc pl-3">
                            {chatQA[currentQAIndex].answer.bullets.slice(0, 2).map((bullet, i) => (
                              <li key={i}>{bullet}</li>
                            ))}
                          </ul>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[9px] text-white/60">Source: {chatQA[currentQAIndex].answer.source}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compact Input Area */}
                  <div className="mt-1 relative z-10">
                    <div className="bg-white/10 rounded-lg p-1.5 flex items-center gap-2 border border-white/10">
                      <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-white/60">
                        <FiPaperclip className="w-3 h-3" />
                      </div>
                      <div className="flex-1 h-6 flex items-center">
                        <div className="w-1 h-1 bg-ai-400 rounded-full animate-pulse" />
                      </div>
                      <div className="w-6 h-6 rounded bg-ai-500/40 text-ai-300 flex items-center justify-center">
                        <FiSend className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 md:px-16 relative z-10 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary-500/5 rounded-full blur-[120px] -z-10" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="font-mono text-xs text-cta-500 uppercase tracking-widest">// Platform Modules</span>
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary-500 mt-4 mb-6">
              Everything You Need.<br />
              <span className="text-[#475569] line-through decoration-2 decoration-red-500">Nothing You Don't.</span>
            </h2>
            <p className="text-lg text-[#475569] max-w-2xl mx-auto">
              A complete suite of tools engineered for 49 CFR compliance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FiUsers,
                title: 'Driver Qualification',
                description: 'Automated DQF management with smart alerts for CDL, Medical Cards, and MVRs. Never miss a deadline again.',
                tags: ['Expirations', 'MVRs', 'Clearinghouse']
              },
              {
                icon: FiTruck,
                title: 'Vehicle Compliance',
                description: '49 CFR 396 vehicle tracking with annual inspection scheduling and maintenance logs.',
                tags: ['Inspections', 'Maintenance']
              },
              {
                icon: FiBarChart2,
                title: 'SMS BASICs Monitoring',
                description: 'Track all 6 BASIC categories with percentile visualization and threshold alerts.',
                tags: ['Percentiles', 'Thresholds']
              },
              {
                icon: FiAlertTriangle,
                title: 'Violation & DataQ',
                description: 'Track roadside inspections and violations with DataQ challenge submission support.',
                tags: ['Violations', 'Challenges']
              },
              {
                icon: FiDroplet,
                title: 'Drug & Alcohol Program',
                description: '49 CFR 382 compliance with random pool management and Clearinghouse integration.',
                tags: ['Testing', 'Pool Mgmt']
              },
              {
                icon: FiClipboard,
                title: 'Audit Readiness',
                description: 'Mock audit checklist and one-click PDF reports for instant compliance verification.',
                tags: ['Reports', 'Checklists']
              }
            ].map((feature, i) => (
              <div key={i} className="group relative bg-white border border-[#E2E8F0] p-8 rounded-3xl overflow-hidden hover:-translate-y-2 hover:border-primary-500/30 hover:shadow-lg transition-all duration-300">
                <div className="relative z-10">
                  <div className={`w-14 h-14 ${feature.gradient ? 'bg-gradient-to-br from-cta-500 to-cta-600 shadow-lg shadow-cta-500/20' : 'bg-cta-50 border border-cta-200 group-hover:border-cta-500/50'} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-7 h-7 ${feature.gradient ? 'text-white' : 'text-cta-500'}`} />
                  </div>
                  <h3 className="text-xl font-bold text-primary-500 mb-3">{feature.title}</h3>
                  <p className="text-sm text-[#475569] mb-6 leading-relaxed">{feature.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.tags.map((tag, j) => (
                      <span key={j} className="px-2 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[10px] text-[#475569] uppercase tracking-wide">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Slider Section */}
      <section className="py-24 relative z-10 overflow-hidden bg-primary-500">
        <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white">
            Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-400 to-cta-500">Fleets Everywhere.</span>
          </h2>
        </div>

        <div className="relative w-full overflow-hidden">
          {/* Mask for fading edges */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-primary-500 to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-primary-500 to-transparent z-20 pointer-events-none" />

          <div className="flex w-max animate-scroll hover:[animation-play-state:paused] gap-8">
            {/* First set of testimonials */}
            {testimonials.map((t, i) => (
              <div key={i} className="w-[400px] bg-white/10 backdrop-blur-sm border border-white/10 p-8 rounded-2xl flex-shrink-0 relative group hover:border-white/30 transition-colors">
                <div className={`absolute -top-4 left-8 w-8 h-8 ${t.featured ? 'bg-cta-500 shadow-lg shadow-cta-500/30' : 'bg-white/20'} rounded-full flex items-center justify-center text-xl font-black text-white`}>
                  "
                </div>
                <p className="text-white/90 text-lg mb-6 leading-relaxed relative z-10 pt-2" dangerouslySetInnerHTML={{ __html: t.quote }} />
                <div className="flex items-center gap-4">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                  />
                  <div>
                    <div className="text-white font-bold text-sm">{t.name}</div>
                    <div className="text-cta-400 text-xs uppercase tracking-wider font-bold">
                      {t.role}{t.fleet && ` • ${t.fleet}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Duplicate set for infinite scroll */}
            {testimonials.map((t, i) => (
              <div key={`dup-${i}`} className="w-[400px] bg-white/10 backdrop-blur-sm border border-white/10 p-8 rounded-2xl flex-shrink-0 relative group hover:border-white/30 transition-colors">
                <div className={`absolute -top-4 left-8 w-8 h-8 ${t.featured ? 'bg-cta-500 shadow-lg shadow-cta-500/30' : 'bg-white/20'} rounded-full flex items-center justify-center text-xl font-black text-white`}>
                  "
                </div>
                <p className="text-white/90 text-lg mb-6 leading-relaxed relative z-10 pt-2" dangerouslySetInnerHTML={{ __html: t.quote }} />
                <div className="flex items-center gap-4">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                  />
                  <div>
                    <div className="text-white font-bold text-sm">{t.name}</div>
                    <div className="text-cta-400 text-xs uppercase tracking-wider font-bold">
                      {t.role}{t.fleet && ` • ${t.fleet}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - New Design */}
      <section id="pricing" className="py-24 px-6 md:px-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary-500 mb-4">
              Simple, Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-500 to-cta-600">Pricing</span>
            </h2>
            <p className="text-lg text-[#475569] mb-8">
              No hidden fees. No long contracts. Cancel anytime.
            </p>

            {/* Pricing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-primary-500' : 'text-[#94A3B8]'}`}>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? 'bg-cta-500' : 'bg-[#E2E8F0]'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${isAnnual ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-medium ${isAnnual ? 'text-primary-500' : 'text-[#94A3B8]'}`}>
                Annual <span className="text-cta-500 font-bold">(Save 20%)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`relative p-8 rounded-3xl overflow-hidden transition-all ${
                  plan.popular
                    ? 'bg-primary-500 text-white shadow-xl shadow-primary-500/20 scale-105 z-10'
                    : 'bg-white border border-[#E2E8F0] hover:border-primary-500/30 hover:shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-cta-500 px-4 py-1 rounded-bl-xl text-xs font-bold text-white uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-bold mb-1 ${plan.popular ? 'text-white' : 'text-primary-500'}`}>{plan.name}</h3>
                  <p className={`text-sm ${plan.popular ? 'text-white/70' : 'text-[#475569]'}`}>{plan.subtitle}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-black tracking-tight ${plan.popular ? 'text-white' : 'text-primary-500'}`}>
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className={plan.popular ? 'text-white/70' : 'text-[#475569]'}>/mo</span>
                  </div>
                  <p className={`text-sm mt-1 ${plan.popular ? 'text-white/60' : 'text-[#94A3B8]'}`}>
                    {plan.drivers}
                    {plan.extraDriver && <span className="block">{plan.extraDriver}</span>}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className={`flex items-center gap-3 text-sm ${plan.popular ? 'text-white/90' : 'text-[#475569]'}`}>
                      <FiCheck className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-cta-400' : 'text-success-500'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`w-full py-4 rounded-xl font-bold text-center block transition-all hover:scale-[1.02] ${
                    plan.popular
                      ? 'bg-cta-500 hover:bg-cta-600 text-white shadow-lg shadow-cta-500/30'
                      : 'btn-glow text-white'
                  }`}
                >
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="mt-24 max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-primary-500 text-center mb-4">
              VroomX vs The Competition
            </h3>
            <p className="text-[#475569] text-center mb-10">See why fleets are switching to VroomX</p>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-lg">
              {/* Table Header */}
              <div className="grid grid-cols-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <div className="p-4 font-bold text-primary-500">Feature</div>
                <div className="p-4 font-bold text-center text-cta-500 bg-cta-50">VroomX</div>
                <div className="p-4 font-bold text-center text-[#475569]">Spreadsheets</div>
                <div className="p-4 font-bold text-center text-[#475569]">Other Software</div>
              </div>

              {/* Table Body */}
              {comparisonFeatures.map((row, i) => (
                <div key={i} className={`grid grid-cols-4 ${i !== comparisonFeatures.length - 1 ? 'border-b border-[#E2E8F0]' : ''}`}>
                  <div className="p-4 text-sm text-[#1E293B] font-medium">{row.feature}</div>
                  <div className="p-4 flex justify-center items-center bg-cta-50/50">
                    {typeof row.vroomx === 'boolean' ? (
                      row.vroomx ? (
                        <FiCheck className="w-5 h-5 text-success-500" />
                      ) : (
                        <FiX className="w-5 h-5 text-red-400" />
                      )
                    ) : (
                      <span className="text-sm font-bold text-cta-500">{row.vroomx}</span>
                    )}
                  </div>
                  <div className="p-4 flex justify-center items-center">
                    {typeof row.spreadsheets === 'boolean' ? (
                      row.spreadsheets ? (
                        <FiCheck className="w-5 h-5 text-success-500" />
                      ) : (
                        <FiX className="w-5 h-5 text-red-400" />
                      )
                    ) : row.spreadsheets === 'limited' ? (
                      <span className="text-xs text-amber-500 font-medium">Limited</span>
                    ) : (
                      <span className="text-sm text-[#475569]">{row.spreadsheets}</span>
                    )}
                  </div>
                  <div className="p-4 flex justify-center items-center">
                    {typeof row.other === 'boolean' ? (
                      row.other ? (
                        <FiCheck className="w-5 h-5 text-success-500" />
                      ) : (
                        <FiX className="w-5 h-5 text-red-400" />
                      )
                    ) : row.other === 'limited' ? (
                      <span className="text-xs text-amber-500 font-medium">Limited</span>
                    ) : (
                      <span className="text-sm text-[#475569]">{row.other}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-[#94A3B8] mt-4">*Spreadsheets require significant time investment and manual maintenance</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 md:px-16 relative z-10 bg-[#F8FAFC]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="font-mono text-xs text-cta-500 uppercase tracking-widest">// FAQ</span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-500 mt-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, i) => (
              <div
                key={i}
                className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden hover:border-primary-500/30 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 flex items-center justify-between text-left"
                >
                  <span className="font-bold text-primary-500 pr-4">{faq.question}</span>
                  <FiChevronDown className={`w-5 h-5 text-[#475569] transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 pt-0">
                    <p className="text-[#475569] leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="py-24 px-6 md:px-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="font-mono text-xs text-cta-500 uppercase tracking-widest">// Stay Informed</span>
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary-500 mt-4">
                Latest <span className="text-[#475569]">Updates</span>
              </h2>
            </div>
            <Link to="/blog" className="hidden md:flex items-center gap-2 text-sm font-bold text-cta-500 hover:text-cta-600 transition-colors">
              View All Articles
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {blogPosts.map((post, i) => (
              <Link key={i} to="/blog" className="group block">
                <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden h-full flex flex-col hover:-translate-y-2 hover:border-primary-500/30 hover:shadow-lg transition-all duration-300">
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#E2E8F0] text-[10px] text-primary-500 font-mono uppercase tracking-wide">
                      {post.category}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-xs text-[#94A3B8] mb-3 font-mono">{post.date}</div>
                    <h3 className="text-xl font-bold text-primary-500 mb-3 group-hover:text-cta-500 transition-colors">{post.title}</h3>
                    <p className="text-sm text-[#475569] mb-4 flex-1">{post.excerpt}</p>
                    <div className="flex items-center gap-2 text-sm text-cta-500 font-medium">
                      Read Article
                      <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link to="/blog" className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white text-sm">
              View All Articles
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 px-6 md:px-16 text-center relative overflow-hidden z-10 bg-primary-500">
        <div className="absolute inset-0 bg-gradient-to-t from-primary-600/50 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight font-heading">
            Ready to Simplify <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-400 to-cta-500">Compliance?</span>
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto">
            Join hundreds of owner-operators and small fleets who trust VroomX to keep them FMCSA compliant.
          </p>
          <Link
            to="/register"
            className="bg-cta-500 hover:bg-cta-600 px-12 py-5 rounded-full font-bold text-white text-lg inline-flex items-center gap-2 shadow-lg shadow-cta-500/30 transition-all hover:scale-105 mb-6"
          >
            Start Free Trial
            <FiArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/70">
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-cta-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-cta-400" />
              Setup in 10 minutes
            </span>
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-cta-400" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 md:px-16 bg-primary-500 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Top Section - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <VroomXLogo size="md" showText={true} textColor="light" animate={true} linkToHome={true} />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                AI-powered FMCSA compliance made simple for owner-operators and small fleets.
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 text-sm hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 text-sm hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#csa-checker" className="text-gray-400 text-sm hover:text-white transition-colors">Free CSA Checker</a></li>
                <li><Link to="/api" className="text-gray-400 text-sm hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><Link to="/blog" className="text-gray-400 text-sm hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/fmcsa-guide" className="text-gray-400 text-sm hover:text-white transition-colors">FMCSA Guide</Link></li>
                <li><Link to="/dataq-help" className="text-gray-400 text-sm hover:text-white transition-colors">DataQ Help</Link></li>
                <li><Link to="/support" className="text-gray-400 text-sm hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-gray-400 text-sm hover:text-white transition-colors">About</Link></li>
                <li><a href="mailto:support@vroomxsafety.com" className="text-gray-400 text-sm hover:text-white transition-colors">Contact</a></li>
                <li><Link to="/privacy" className="text-gray-400 text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-400 text-sm hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; 2026 VroomX Safety. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm">
              Made with <span className="text-cta-500">❤️</span> for truckers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

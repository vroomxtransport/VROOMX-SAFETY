import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiZap, FiShield, FiBarChart2, FiFileText, FiCheckCircle,
  FiAlertTriangle, FiClock, FiArrowRight, FiChevronDown, FiActivity,
  FiTrendingUp, FiAward, FiUsers
} from 'react-icons/fi';
import PublicHeader from '../components/PublicHeader';
import { FooterSection } from '../components/landing';
import CSAChecker from '../components/CSAChecker';
import SEO from '../components/SEO';
import useForceLightMode from '../hooks/useForceLightMode';

// FAQ Data
const faqData = [
  {
    question: 'What is a CSA score and why does it matter?',
    answer: 'CSA (Compliance, Safety, Accountability) scores are FMCSA\'s way of measuring your carrier\'s safety performance across 7 BASIC categories. High scores can trigger audits, affect insurance rates, and cause you to lose contracts with shippers who check carrier ratings.'
  },
  {
    question: 'Is this CSA check really free?',
    answer: 'Yes, 100% free. You get an instant preview of your BASIC scores with no signup required. Enter your email only if you want the full AI-powered analysis with personalized recommendations and DataQ challenge opportunities.'
  },
  {
    question: 'How often does FMCSA update CSA scores?',
    answer: 'FMCSA updates SMS data monthly, typically around the 15th. Violations stay on your record for 24 months, with severity weights that decrease over time. That\'s why proactive monitoring matters—one bad inspection can haunt you for two years.'
  },
  {
    question: 'What happens if my scores are above the threshold?',
    answer: 'When BASICs exceed intervention thresholds (65% for most, 80% for some), FMCSA may prioritize you for investigation, warning letters, or compliance reviews. Shippers and brokers also check these scores—high numbers can cost you loads and contracts.'
  },
  {
    question: 'Can I challenge violations on my record?',
    answer: 'Yes! Through the DataQs (Data Quality) process, you can challenge violations with errors, incorrect information, or procedural issues. Our AI analysis identifies which violations may be eligible for challenge and estimates the potential score impact.'
  }
];

// What You Get cards data
const benefitsData = [
  {
    icon: FiBarChart2,
    title: 'Instant BASIC Scores',
    description: 'See all 7 BASIC categories with visual indicators showing which are above intervention thresholds.',
    items: ['Unsafe Driving percentile', 'HOS Compliance rating', 'Vehicle Maintenance score', 'All 7 BASICs displayed'],
    color: 'primary'
  },
  {
    icon: FiZap,
    title: 'AI-Powered Analysis',
    description: 'Get personalized recommendations from our AI trained on FMCSA regulations and DataQ success patterns.',
    items: ['Critical issue identification', 'DataQ challenge opportunities', 'Score improvement strategy', 'Prioritized action steps'],
    color: 'cta'
  },
  {
    icon: FiShield,
    title: 'VroomX Platform',
    description: 'Upgrade to continuous monitoring, automated alerts, and full compliance management.',
    items: ['Monthly score tracking', 'Expiration alerts', 'DQF management', 'AI compliance assistant'],
    color: 'ai'
  }
];

// How It Works steps
const stepsData = [
  {
    number: '01',
    title: 'Enter Your MC# or DOT#',
    description: 'Just type your carrier number. We fetch your data directly from FMCSA\'s SAFER system.',
    icon: FiSearch
  },
  {
    number: '02',
    title: 'See Your BASIC Scores',
    description: 'Instantly view all 7 BASIC percentiles with color-coded risk indicators.',
    icon: FiActivity
  },
  {
    number: '03',
    title: 'Get AI Recommendations',
    description: 'Enter your email to unlock personalized analysis and DataQ opportunities.',
    icon: FiTrendingUp
  }
];

// FAQ Item component
const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div
    className={`border-b border-[#E2E8F0] last:border-b-0 transition-all duration-300 ${
      isOpen ? 'bg-primary-50/30' : ''
    }`}
  >
    <button
      onClick={onClick}
      className="w-full px-6 py-5 flex items-center justify-between text-left group"
    >
      <span className={`font-semibold transition-colors ${
        isOpen ? 'text-primary-600' : 'text-[#1E293B] group-hover:text-primary-600'
      }`}>
        {question}
      </span>
      <FiChevronDown
        className={`w-5 h-5 text-[#64748B] transition-transform duration-300 flex-shrink-0 ml-4 ${
          isOpen ? 'rotate-180 text-primary-600' : ''
        }`}
      />
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ${
        isOpen ? 'max-h-48 pb-5' : 'max-h-0'
      }`}
    >
      <p className="px-6 text-[#64748B] leading-relaxed">
        {answer}
      </p>
    </div>
  </div>
);

// Animated stat counter
const AnimatedStat = ({ end, suffix = '', label }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const duration = 2000;
          const increment = end / (duration / 16);

          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-black text-primary-500 font-heading">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-[#64748B] mt-2 font-medium uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
};

const CSACheckerPage = () => {
  useForceLightMode();
  const [openFaq, setOpenFaq] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      {/* Fixed Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/8 blur-[150px] rounded-full animate-blob" />
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-cta-500/6 blur-[120px] rounded-full animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary-300/10 blur-[100px] rounded-full animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      <SEO
        title="Free CSA Score Checker | Check Your FMCSA Safety Rating"
        description="Check your CSA score in 30 seconds — completely free, no signup required. See all 7 BASIC scores, get AI-powered analysis, and identify challengeable violations."
        path="/csa-checker"
        image="/images/og-image.png"
        faqItems={faqData}
      />

      {/* Navigation */}
      <PublicHeader activePage="csa-checker" />

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cta-500/10 border border-cta-500/20 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cta-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cta-500"></span>
            </span>
            <span className="text-sm font-semibold text-cta-600">Free Tool • No Credit Card Required</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-heading font-black tracking-tight mb-6 leading-[1.1]">
            <span className="text-primary-500">Free CSA Score</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-500 to-cta-600">
              Health Check
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto mb-8 leading-relaxed">
            Are you on FMCSA's radar? High BASIC scores lead to{' '}
            <span className="text-red-500 font-semibold">audits</span>,{' '}
            <span className="text-amber-500 font-semibold">fines</span>, and{' '}
            <span className="text-primary-500 font-semibold">lost contracts</span>.
            <br className="hidden md:block" />
            Check your scores in 30 seconds—completely free.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm">
            {[
              { icon: FiCheckCircle, text: '100% Free', color: 'text-emerald-500' },
              { icon: FiClock, text: '30 Seconds', color: 'text-primary-500' },
              { icon: FiShield, text: 'No Signup Required', color: 'text-cta-500' }
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2">
                <badge.icon className={`w-5 h-5 ${badge.color}`} />
                <span className="font-semibold text-[#1E293B]">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CSA Checker Widget Section */}
      <section className="relative z-10 py-12 px-6">
        <div className={`mx-auto transition-all duration-500 ease-in-out ${isExpanded ? 'max-w-5xl' : 'max-w-xl'}`}>
          {/* Decorative elements around widget */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/10 via-cta-500/10 to-primary-500/10 rounded-3xl blur-2xl opacity-60" />

            {/* Highway stripe decorations */}
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-8 bg-cta-500/30 rounded-full"
                  style={{ opacity: 1 - i * 0.15 }}
                />
              ))}
            </div>
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-8 bg-cta-500/30 rounded-full"
                  style={{ opacity: 1 - i * 0.15 }}
                />
              ))}
            </div>

            {/* The actual CSA Checker widget */}
            <div className="relative">
              <CSAChecker onExpandChange={setIsExpanded} />
            </div>
          </div>

          {/* Social proof below widget */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-white/80 backdrop-blur-sm border border-[#E2E8F0] shadow-sm">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 border-2 border-white flex items-center justify-center"
                  >
                    <FiUsers className="w-3.5 h-3.5 text-white" />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="font-bold text-primary-600">Free</span>
                <span className="text-[#64748B]"> instant CSA score check</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 py-16 px-6 border-y border-[#E2E8F0] bg-white/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedStat end={7} label="BASICs Tracked" />
          <AnimatedStat end={24} suffix="mo" label="Violation History" />
          <AnimatedStat end={30} suffix="s" label="Instant Results" />
          <AnimatedStat end={100} suffix="%" label="Free, No Signup" />
        </div>
      </section>

      {/* What You Get Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-600 font-mono text-xs mb-4 uppercase tracking-wider">
              What You Get
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-500">
              Free Score Check to <span className="text-cta-500">Full Platform</span>
            </h2>
          </div>

          {/* Benefits grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {benefitsData.map((benefit, i) => {
              const colorClasses = {
                primary: 'bg-primary-50 text-primary-500 border-primary-200',
                cta: 'bg-cta-50 text-cta-500 border-cta-200',
                ai: 'bg-indigo-50 text-indigo-500 border-indigo-200'
              };
              const Icon = benefit.icon;

              return (
                <div
                  key={i}
                  className="group bg-white rounded-2xl border border-[#E2E8F0] p-8 hover:border-primary-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`w-14 h-14 rounded-xl ${colorClasses[benefit.color]} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1E293B] mb-3">{benefit.title}</h3>
                  <p className="text-[#64748B] mb-6 leading-relaxed">{benefit.description}</p>
                  <ul className="space-y-3">
                    {benefit.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm">
                        <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-[#1E293B]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-24 px-6 bg-white/60 backdrop-blur-sm border-y border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full border border-cta-500/30 bg-cta-500/10 text-cta-600 font-mono text-xs mb-4 uppercase tracking-wider">
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-500">
              Three Steps to <span className="text-cta-500">Clarity</span>
            </h2>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-200 to-transparent hidden md:block" />

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {stepsData.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="relative text-center">
                    {/* Step number */}
                    <div className="relative inline-block mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-cta-500 text-white text-sm font-bold flex items-center justify-center shadow-lg">
                        {step.number}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-[#1E293B] mb-3">{step.title}</h3>
                    <p className="text-[#64748B] leading-relaxed">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Warning Banner */}
      <section className="relative z-10 py-12 px-6 bg-gradient-to-r from-red-500 to-red-600">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-white">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <FiAlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Don't Wait for the Audit Letter</h3>
              <p className="text-red-100">FMCSA prioritizes carriers with high BASICs. Check yours today.</p>
            </div>
          </div>
          <a
            href="#top"
            className="px-8 py-4 bg-white text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center gap-2 shadow-lg"
          >
            Check My Score Now
            <FiArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-600 font-mono text-xs mb-4 uppercase tracking-wider">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-500">
              Common <span className="text-[#64748B]">Questions</span>
            </h2>
          </div>

          {/* FAQ Accordion */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            {faqData.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Related Resources - Internal Cross-Links */}
      <section className="relative z-10 py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-bold text-primary-500 mb-4 font-heading">Learn More About CSA Scores</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/blog/understanding-csa-scores-basics" className="group flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-cta-500/30 hover:shadow-md transition-all">
              <FiBarChart2 className="w-5 h-5 text-cta-500 flex-shrink-0" />
              <div>
                <span className="text-sm font-semibold text-primary-500 group-hover:text-cta-500 transition-colors">Understanding CSA Scores & BASICs</span>
                <p className="text-xs text-[#64748B] mt-0.5">Complete guide to how FMCSA measures your safety</p>
              </div>
            </Link>
            <Link to="/blog/dataq-challenges-removing-violations" className="group flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-cta-500/30 hover:shadow-md transition-all">
              <FiFileText className="w-5 h-5 text-cta-500 flex-shrink-0" />
              <div>
                <span className="text-sm font-semibold text-primary-500 group-hover:text-cta-500 transition-colors">DataQ Challenges: Removing Violations</span>
                <p className="text-xs text-[#64748B] mt-0.5">How to challenge unfair violations on your record</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-cta-500/10 to-primary-500/10 rounded-3xl blur-3xl" />

            <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-12 md:p-16 overflow-hidden">
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-grid-pattern" />
              </div>

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-8">
                  <FiAward className="w-4 h-4 text-cta-300" />
                  <span className="text-sm font-semibold text-white/90">7-Day Free Trial • No Card Required</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-6">
                  Ready for Continuous Compliance?
                </h2>
                <p className="text-lg text-primary-100 mb-10 max-w-2xl mx-auto">
                  Go beyond a one-time check. VroomX tracks your CSA scores monthly,
                  alerts you to changes, and helps you stay audit-ready year-round.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/register"
                    className="px-8 py-4 bg-cta-500 hover:bg-cta-600 text-white rounded-xl font-bold transition-all duration-200 shadow-lg shadow-cta-500/30 hover:shadow-xl hover:shadow-cta-500/40 flex items-center gap-2"
                  >
                    Start Your Free Trial
                    <FiArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/"
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
                  >
                    Learn More About VroomX
                  </Link>
                </div>

                <p className="text-sm text-primary-200 mt-8">
                  No credit card required. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default CSACheckerPage;

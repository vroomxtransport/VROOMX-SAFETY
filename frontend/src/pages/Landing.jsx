import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  FiAlertTriangle, FiBarChart2, FiFileText, FiClipboard, FiArrowRight,
  FiLock, FiDatabase, FiAward, FiHeadphones
} from 'react-icons/fi';
import PublicHeader from '../components/PublicHeader';
// Only import components actually used (reduces bundle size)
import {
  HeroDesign5,
  PricingSection,
  TestimonialsSection,
  FAQSection,
  FeaturesSection,
  FooterSection,
  CTASection
} from '../components/landing';
import {
  heroTexts,
  testimonials,
  blogPosts,
  faqData,
  features
} from '../data/landingData';
import useForceLightMode from '../hooks/useForceLightMode';

const Landing = () => {
  useForceLightMode();

  // Preload hero image only on the landing page to avoid browser warnings on other pages
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = '/images/hero-truck.webp';
    link.type = 'image/webp';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  // Hero typewriter cycling state
  const [heroTextIndex, setHeroTextIndex] = useState(0);

  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);

  // Cycle hero typewriter text
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroTextIndex((prev) => (prev + 1) % heroTexts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-white text-[#1E293B]">
      {/* Fixed Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-white" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.04]" />
      </div>

      {/* Promo Banner */}
      <div className="relative z-[60] bg-gradient-to-r from-cta-600 via-cta-500 to-cta-600 text-white text-center py-2.5 px-4">
        <p className="text-sm font-semibold tracking-wide flex items-center justify-center gap-2 flex-wrap">
          <span>🔥</span>
          <span>Launch Special — First 50 companies get full access forever for $249</span>
          <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-md font-mono font-black tracking-widest border border-white/30">7-DAY FREE TRIAL</span>
        </p>
      </div>

      {/* Navigation */}
      <PublicHeader activePage="landing" topOffset="top-[60px]" />

      {/* Hero Section */}
      <HeroDesign5 heroTextIndex={heroTextIndex} heroTexts={heroTexts} />

      {/* Trust Badges Section */}
      <section className="relative z-10 py-8 border-y border-[#E2E8F0] bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 md:gap-16">
            {[
              { Icon: FiLock, title: 'SSL Secure', subtitle: '256-bit encryption', bgClass: 'bg-green-50', textClass: 'text-green-500' },
              { Icon: FiDatabase, title: 'FMCSA Data', subtitle: 'Official SMS source', bgClass: 'bg-blue-50', textClass: 'text-blue-500' },
              { Icon: FiAward, title: 'SOC2 Compliant', subtitle: 'Enterprise security', bgClass: 'bg-orange-50', textClass: 'text-orange-500' },
              { Icon: FiHeadphones, title: 'US Support', subtitle: 'Real humans, fast', bgClass: 'bg-purple-50', textClass: 'text-purple-500' }
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-600">
                <div className={`w-10 h-10 rounded-full ${badge.bgClass} flex items-center justify-center`}>
                  <badge.Icon className={`w-5 h-5 ${badge.textClass}`} />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-800">{badge.title}</div>
                  <div className="text-xs text-zinc-500">{badge.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection features={features} />

      {/* Differentiation Section */}
      <section className="py-20 px-6 md:px-16 relative z-10 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-3 py-1 rounded-full border border-cta-500/30 bg-cta-500/10 text-cta-600 font-mono text-xs mb-6">
            WHAT MAKES US DIFFERENT
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold tracking-tight mb-6 text-primary-500">
            We're Not Trying to Replace Your ELD.
          </h2>
          <p className="text-lg text-zinc-600 leading-relaxed mb-12 max-w-3xl mx-auto">
            The big telematics platforms are great at fleet tracking and GPS. But when the DOT auditor shows up asking for your driver's medical card from 18 months ago? When your CDL expires and nobody noticed? <span className="font-semibold text-primary-500">That's where they fall short. And that's ALL we do.</span>
          </p>

          {/* Comparison Grid */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* What We Don't Do */}
            <div className="bg-zinc-100 border border-zinc-200 rounded-2xl p-6 text-left">
              <h3 className="text-lg font-bold text-zinc-500 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-zinc-300 flex items-center justify-center text-zinc-600 text-sm">✗</span>
                What We Don't Do
              </h3>
              <ul className="space-y-3">
                {['GPS Tracking', 'ELD / HOS Logging', 'Fuel Card Integration', 'Dashcams', 'Dispatch Software'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-500">
                    <span className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-xs">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What We Do */}
            <div className="bg-primary-500 border border-primary-600 rounded-2xl p-6 text-left">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cta-500 flex items-center justify-center text-white text-sm">✓</span>
                What We Do
              </h3>
              <ul className="space-y-3">
                {['DQF File Management', 'Document Expiration Alerts', 'CSA Score Monitoring', 'DataQ Challenge Letters', 'Audit Prep & Compliance'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white">
                    <span className="w-5 h-5 rounded-full bg-cta-500 flex items-center justify-center text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-10 text-xl font-semibold text-zinc-700">
            We do one thing. We do it well. We charge fairly for it.
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-32 px-6 md:px-16 relative z-10 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-block px-3 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-500 font-mono text-xs mb-6">
              THE PROBLEM
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold tracking-tight mb-6 lg:mb-8 leading-tight text-primary-500">
              The DOT Doesn't Care<br />
              <span className="text-zinc-600">That You're Busy.</span>
            </h2>
            <p className="text-lg text-zinc-600 leading-relaxed mb-10">
              You've got loads to haul, drivers to manage, and a business to run. But FMCSA doesn't care.
              Miss one expiration? Fine. Can't find a document during audit? Fine. The big carriers have entire compliance departments.
              You have... a filing cabinet?
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: FiAlertTriangle, title: '"I thought it was valid until June"', desc: 'One expired document = $16,000 fine. One driver out-of-service = $1,000/day.', color: 'red' },
                { icon: FiBarChart2, title: '"My CSA went up and I don\'t know why"', desc: 'Violations stay on record 24 months. Every point costs you freight.', color: 'amber' },
                { icon: FiFileText, title: '"The auditor asked for 2024 records"', desc: 'Paper gets lost. Email gets buried. Auditors don\'t care.', color: 'primary' },
                { icon: FiClipboard, title: '"I could challenge it but no time"', desc: 'DataQ process is confusing on purpose. Most carriers just accept bad violations.', color: 'purple' }
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
                    <p className="text-xs text-zinc-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spreadsheet Chaos Mockup */}
          <div className="relative group">
            <div className="absolute inset-0 bg-primary-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="bg-white rounded-2xl overflow-hidden relative border border-[#E2E8F0] shadow-2xl">
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

              {/* Excel Ribbon */}
              <div className="bg-[#f3f3f3] px-2 py-1 border-b border-[#d4d4d4] flex items-center gap-4">
                <span className="text-[9px] text-[#217346] font-semibold">File</span>
                <span className="text-[9px] text-gray-600">Home</span>
                <span className="text-[9px] text-gray-600">Insert</span>
                <span className="text-[9px] text-gray-600">Data</span>
              </div>

              {/* Spreadsheet Grid */}
              <div className="bg-white text-[9px] font-mono">
                {/* Header Row */}
                <div className="grid grid-cols-5 border-b border-[#d4d4d4] bg-[#f8f8f8]">
                  <div className="p-1.5 border-r border-[#d4d4d4] font-semibold text-gray-700">Driver</div>
                  <div className="p-1.5 border-r border-[#d4d4d4] font-semibold text-gray-700">CDL Exp</div>
                  <div className="p-1.5 border-r border-[#d4d4d4] font-semibold text-gray-700">Med Card</div>
                  <div className="p-1.5 border-r border-[#d4d4d4] font-semibold text-gray-700">MVR</div>
                  <div className="p-1.5 font-semibold text-gray-700">Status</div>
                </div>
                {/* Data Rows */}
                <div className="grid grid-cols-5 border-b border-[#e5e5e5]">
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-800">J. Smith</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-red-600 bg-red-50 font-semibold">EXPIRED</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-amber-600 bg-amber-50">12/15/24</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-red-600 bg-red-50">MISSING!</div>
                  <div className="p-1.5 text-red-600 font-semibold">⚠️ OOS</div>
                </div>
                <div className="grid grid-cols-5 border-b border-[#e5e5e5]">
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-800">M. Johnson</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-600">03/22/26</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-red-600 bg-red-50 font-semibold">EXPIRED</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-600">08/10/24</div>
                  <div className="p-1.5 text-amber-600">⚠️ Check</div>
                </div>
                <div className="grid grid-cols-5 border-b border-[#e5e5e5]">
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-800">R. Davis</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-amber-600 bg-amber-50">01/30/25</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-600">06/18/25</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-red-600 bg-red-50">MISSING!</div>
                  <div className="p-1.5 text-gray-600">Active</div>
                </div>
                <div className="grid grid-cols-5 border-b border-[#e5e5e5]">
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-800">T. Wilson</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-400 italic">???</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-400 italic">???</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-400 italic">???</div>
                  <div className="p-1.5 text-gray-400 italic">Unknown</div>
                </div>
                <div className="grid grid-cols-5 border-b border-[#e5e5e5]">
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-800">A. Martinez</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-600">09/14/26</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-red-600 bg-red-50 font-semibold">EXPIRED</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-600">02/28/25</div>
                  <div className="p-1.5 text-amber-600">⚠️ Check</div>
                </div>
                <div className="grid grid-cols-5 border-b border-[#e5e5e5]">
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-800">K. Brown</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-red-600 bg-red-50 font-semibold">EXPIRED</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-red-600 bg-red-50 font-semibold">EXPIRED</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-red-600 bg-red-50">MISSING!</div>
                  <div className="p-1.5 text-red-600 font-semibold">⚠️ OOS</div>
                </div>
                <div className="grid grid-cols-5 border-b border-[#e5e5e5]">
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-800">P. Garcia</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-amber-600 bg-amber-50">02/10/25</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-600">11/30/25</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-400 italic">???</div>
                  <div className="p-1.5 text-gray-600">Active</div>
                </div>
                <div className="grid grid-cols-5 border-b border-[#e5e5e5]">
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-800">L. Thompson</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-600">07/22/26</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-amber-600 bg-amber-50">01/05/25</div>
                  <div className="p-1.5 border-r border-[#e5e5e5] text-gray-600">05/15/25</div>
                  <div className="p-1.5 text-gray-600">Active</div>
                </div>
              </div>

              {/* Error Bar */}
              <div className="bg-[#c42b1c] px-3 py-1.5 flex items-center justify-between">
                <span className="text-[8px] text-white font-medium">⚠️ 12 ERRORS • AUDIT IN 3 DAYS!! • WHERE IS J.SMITH MVR???</span>
                <span className="text-[8px] text-white/60 animate-pulse">Not responding...</span>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-cta-500 text-white p-4 lg:p-6 rotate-[-15deg] font-black uppercase text-lg lg:text-xl shadow-2xl z-20 border-4 border-white transform transition-transform hover:scale-110 hover:rotate-[-10deg]">
              PROBLEM SOLVED
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Testimonials Section */}
      <TestimonialsSection testimonials={testimonials} />

      {/* FAQ Section */}
      <FAQSection faqData={faqData} openFaq={openFaq} setOpenFaq={setOpenFaq} />

      {/* Latest News Section */}
      <section className="py-24 px-6 md:px-16 relative z-10 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="font-mono text-xs text-cta-500 uppercase tracking-widest">Stay Informed</span>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-bold text-primary-500 mt-4">
                Latest <span className="text-zinc-600">Updates</span>
              </h2>
            </div>
            <Link to="/blog" className="hidden md:flex items-center gap-2 text-sm font-bold text-cta-500 hover:text-cta-600 transition-colors">
              View All Articles
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {blogPosts.map((post, i) => (
              <Link key={i} to="/blog" className="group block">
                <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden h-full flex flex-col hover:-translate-y-2 hover:border-primary-500/30 hover:shadow-lg transition-all duration-300">
                  <div className="h-48 relative overflow-hidden">
                    <img src={post.image} alt={post.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="%23e4e4e7"%3E%3Crect width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-size="16"%3EImage unavailable%3C/text%3E%3C/svg%3E'; }} />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#E2E8F0] text-[10px] text-primary-500 font-mono uppercase tracking-wide">
                      {post.category}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-xs text-zinc-500 mb-3 font-mono">{post.date}</div>
                    <h3 className="text-xl font-bold text-primary-500 mb-3 group-hover:text-cta-500 transition-colors">{post.title}</h3>
                    <p className="text-sm text-zinc-600 mb-4 flex-1">{post.excerpt}</p>
                    <div className="flex items-center gap-2 text-sm text-cta-500 font-medium">
                      Read Article
                      <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <CTASection />

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default Landing;

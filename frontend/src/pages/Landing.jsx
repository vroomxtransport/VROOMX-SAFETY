import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  FiAlertTriangle, FiBarChart2, FiFileText, FiClipboard, FiArrowRight,
  FiPaperclip, FiSend, FiLock, FiDatabase, FiAward, FiHeadphones, FiDroplet
} from 'react-icons/fi';
import PublicHeader from '../components/PublicHeader';
import {
  HeroSection,
  PricingSection,
  TestimonialsSection,
  FAQSection,
  FeaturesSection,
  FooterSection,
  CTASection
} from '../components/landing';
import {
  heroTexts,
  chatQA,
  testimonials,
  blogPosts,
  faqData,
  pricingPlans,
  comparisonFeatures,
  features
} from '../data/landingData';

const Landing = () => {
  // Hero typewriter cycling state
  const [heroTextIndex, setHeroTextIndex] = useState(0);

  // Pricing toggle state
  const [isAnnual, setIsAnnual] = useState(false);

  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);

  // Chat Q&A cycling state
  const [currentQAIndex, setCurrentQAIndex] = useState(0);
  const [chatPhase, setChatPhase] = useState('question');

  // Cycle through chat phases
  useEffect(() => {
    const phases = {
      question: 1000,
      typing: 1800,
      answer: 5500,
      pause: 600
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
  }, [chatPhase]);

  // Cycle hero typewriter text
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroTextIndex((prev) => (prev + 1) % heroTexts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      {/* Fixed Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.04]" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-500/10 blur-[120px] rounded-full animate-blob" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-cta-500/8 blur-[120px] rounded-full animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-primary-300/15 blur-[120px] rounded-full animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navigation */}
      <PublicHeader activePage="landing" />

      {/* Hero Section */}
      <HeroSection heroTextIndex={heroTextIndex} heroTexts={heroTexts} />

      {/* Trust Badges Section */}
      <section className="relative z-10 py-8 border-y border-[#E2E8F0] bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {[
              { Icon: FiLock, title: 'SSL Secure', subtitle: '256-bit encryption', bg: 'success' },
              { Icon: FiDatabase, title: 'FMCSA Data', subtitle: 'Official SMS source', bg: 'primary' },
              { Icon: FiAward, title: 'SOC2 Compliant', subtitle: 'Enterprise security', bg: 'cta' },
              { Icon: FiHeadphones, title: 'US Support', subtitle: 'Real humans, fast', bg: 'purple' }
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <div className={`w-10 h-10 rounded-full bg-${badge.bg}-50 flex items-center justify-center`}>
                  <badge.Icon className={`w-5 h-5 text-${badge.bg}-500`} />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{badge.title}</div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-400">{badge.subtitle}</div>
                </div>
              </div>
            ))}
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
                    <span key={idx}>{idx > 0 && <span className="text-zinc-400 dark:text-zinc-400">/</span>}{v}</span>
                  ))
                )}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 uppercase tracking-widest font-mono">{stat.label}</div>
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
              Compliance is <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-500 to-cta-600">Complex.</span><br />
              <span className="text-zinc-600 dark:text-zinc-300">VroomX Safety Isn't.</span>
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed mb-10">
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
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spreadsheet Chaos Mockup */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-cta-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
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

      {/* AI Assistant Section */}
      <section className="py-24 px-6 md:px-16 relative z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-ai-500/5 rounded-full blur-[120px] -z-10" />
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-block px-3 py-1 rounded-full border border-ai-500/30 bg-ai-500/10 text-ai-500 font-mono text-xs mb-6">
                // AI-POWERED COMPLIANCE
              </div>
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary-500 mb-6 leading-tight">
                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-ai-500 to-ai-600">24/7</span><br />
                Compliance Expert
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed mb-8">
                Ask anything about FMCSA regulations and get instant answers with CFR citations.
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
                    <span className="text-zinc-600 dark:text-zinc-300 text-sm italic">"{item.q}"</span>
                  </div>
                ))}
              </div>
              <a href="#pricing" className="btn-glow inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-white text-base">
                Get Started
                <FiArrowRight className="w-5 h-5" />
              </a>
            </div>

            {/* Chat Demo */}
            <div className="order-1 lg:order-2 relative">
              <div className="absolute inset-0 bg-ai-500/10 blur-[60px] -z-10 rounded-full" />
              <div className="bg-primary-500 backdrop-blur-xl border border-primary-400/30 rounded-2xl overflow-hidden ring-1 ring-primary-400/20 shadow-2xl shadow-primary-500/20">
                <div className="px-4 py-3 bg-primary-600/50 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-ai-500 to-ai-600 flex items-center justify-center text-white font-bold text-[10px] shadow-lg shadow-ai-500/30">AI</div>
                    <div>
                      <div className="text-xs font-bold text-white">VroomX Assistant</div>
                      <div className="text-[9px] text-green-300 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />Online
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-primary-600/30 backdrop-blur-md h-[280px] flex flex-col justify-end space-y-3 relative overflow-hidden">
                  <div key={`q-${currentQAIndex}`} className="flex justify-end relative z-10 animate-fade-in">
                    <div className="bg-white/20 text-white px-3 py-2 rounded-xl rounded-tr-sm border border-white/10 backdrop-blur-sm shadow-lg max-w-[85%]">
                      <p className="text-xs font-medium">{chatQA[currentQAIndex].question}</p>
                    </div>
                  </div>
                  {chatPhase === 'typing' && (
                    <div className="flex justify-start relative z-10 animate-fade-in">
                      <div className="flex gap-2 items-center">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-ai-500 to-ai-600 flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold">VX</div>
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
                  {chatPhase === 'answer' && (
                    <div key={`a-${currentQAIndex}`} className="flex justify-start relative z-10 animate-message-pop">
                      <div className="flex gap-2 max-w-[90%]">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-ai-500 to-ai-600 flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold mt-0.5">VX</div>
                        <div className="bg-white/15 text-white/90 px-3 py-3 rounded-xl rounded-tl-sm border border-white/10 backdrop-blur-sm shadow-lg">
                          <p className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: chatQA[currentQAIndex].answer.intro }} />
                          <ul className="mt-2 space-y-1 text-[10px] text-white/80 list-disc pl-3">
                            {chatQA[currentQAIndex].answer.bullets.slice(0, 2).map((bullet, i) => (
                              <li key={i}>{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-1 relative z-10">
                    <div className="bg-white/10 rounded-lg p-1.5 flex items-center gap-2 border border-white/10">
                      <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-white/60"><FiPaperclip className="w-3 h-3" /></div>
                      <div className="flex-1 h-6 flex items-center"><div className="w-1 h-1 bg-ai-400 rounded-full animate-pulse" /></div>
                      <div className="w-6 h-6 rounded bg-ai-500/40 text-ai-300 flex items-center justify-center"><FiSend className="w-3 h-3" /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection features={features} />

      {/* Testimonials Section */}
      <TestimonialsSection testimonials={testimonials} />

      {/* Pricing Section */}
      <PricingSection
        isAnnual={isAnnual}
        setIsAnnual={setIsAnnual}
        pricingPlans={pricingPlans}
        comparisonFeatures={comparisonFeatures}
      />

      {/* FAQ Section */}
      <FAQSection faqData={faqData} openFaq={openFaq} setOpenFaq={setOpenFaq} />

      {/* Latest News Section */}
      <section className="py-24 px-6 md:px-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="font-mono text-xs text-cta-500 uppercase tracking-widest">// Stay Informed</span>
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary-500 mt-4">
                Latest <span className="text-zinc-600 dark:text-zinc-300">Updates</span>
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
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#E2E8F0] text-[10px] text-primary-500 font-mono uppercase tracking-wide">
                      {post.category}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-xs text-zinc-400 dark:text-zinc-400 mb-3 font-mono">{post.date}</div>
                    <h3 className="text-xl font-bold text-primary-500 mb-3 group-hover:text-cta-500 transition-colors">{post.title}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4 flex-1">{post.excerpt}</p>
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

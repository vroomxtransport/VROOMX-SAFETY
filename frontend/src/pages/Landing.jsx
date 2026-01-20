import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  FiUsers, FiTruck, FiBarChart2, FiAlertTriangle, FiDroplet,
  FiFileText, FiCheckCircle, FiShield, FiClipboard, FiArrowRight,
  FiPaperclip, FiSend, FiPlay
} from 'react-icons/fi';

const Landing = () => {
  const [showAiResponse, setShowAiResponse] = useState(false);
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    // Show typing indicator after user message
    const typingTimer = setTimeout(() => setShowTyping(true), 600);
    // Show AI response and hide typing
    const responseTimer = setTimeout(() => {
      setShowTyping(false);
      setShowAiResponse(true);
    }, 2500);

    return () => {
      clearTimeout(typingTimer);
      clearTimeout(responseTimer);
    };
  }, []);

  const testimonials = [
    {
      quote: 'We went from missing expirations every month to <span class="text-primary-500 font-bold">zero compliance violations</span> in the past year. The SMS BASICs tracking alone has saved us from an intervention.',
      name: 'Sarah Jenkins',
      role: 'Safety Director',
      fleet: '45 Trucks',
      featured: true
    },
    {
      quote: 'The DQF management is a lifesaver. I used to spend hours auditing files manually. Now I just check the dashboard once a week.',
      name: 'Mike Ross',
      role: 'Owner Operator',
      fleet: '3 Trucks'
    },
    {
      quote: "Finally, software that feels modern. It's fast, looks great, and actually makes sense. My drivers even use the portal without complaining.",
      name: 'David Chen',
      role: 'Fleet Mgr',
      fleet: '120 Trucks'
    },
    {
      quote: 'Audit readiness reports are worth the subscription alone. We passed our New Entrant Audit with zero issues thanks to the checklists.',
      name: 'Elena Rodriguez',
      role: 'Compliance Officer',
      fleet: ''
    },
    {
      quote: 'I was skeptical about the AI alerts, but they actually predicted a maintenance issue before it became a violation. Impressive tech.',
      name: 'Marcus Johnson',
      role: 'Ops Director',
      fleet: '85 Trucks'
    }
  ];

  const blogPosts = [
    {
      category: 'Regulation',
      date: 'Oct 12, 2025',
      title: '2026 FMCSA Proposed Rule Changes',
      excerpt: "New proposals for electronic IDs on CMVs and what it means for your fleet's privacy.",
      gradient: 'from-primary-900/50'
    },
    {
      category: 'Tech',
      date: 'Sep 28, 2025',
      title: 'Digitizing Driver Qualification Files',
      excerpt: 'Why sticking to paper filings is costing you more than just storage space.',
      gradient: 'from-rose-900/50'
    },
    {
      category: 'Safety',
      date: 'Sep 15, 2025',
      title: 'Preparing for a Remote Audit',
      excerpt: 'Step-by-step checklist to ensure your digital records pass inspection.',
      gradient: 'from-green-900/50'
    }
  ];

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-black text-zinc-200">
      {/* Fixed Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        {/* Animated Blobs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-500/20 blur-[100px] rounded-full animate-blob" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-primary-600/10 blur-[100px] rounded-full animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-primary-900/20 blur-[100px] rounded-full animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
        <div className="glass rounded-2xl px-6 py-4 flex justify-between items-center shadow-2xl shadow-black/50">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-10 h-10 absolute text-primary-500 animate-spin-slow" viewBox="0 0 100 100" fill="none">
                <path d="M50 10 L50 20 M50 80 L50 90 M10 50 L20 50 M80 50 L90 50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" />
              </svg>
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center shadow-glow">
                <FiCheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-xl font-bold tracking-tight text-white font-heading">
              VroomX <span className="text-primary-500">Safety</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 bg-surface/50 px-8 py-2 rounded-full border border-white/5 backdrop-blur-sm">
            <a href="#features" className="text-gray-300 text-sm font-medium hover:text-primary-400 transition-colors">Features</a>
            <a href="#pricing" className="text-gray-300 text-sm font-medium hover:text-primary-400 transition-colors">Pricing</a>
            <Link to="/login" className="text-gray-300 text-sm font-medium hover:text-primary-400 transition-colors">Login</Link>
          </div>

          <Link to="/register" className="btn-glow px-6 py-2.5 rounded-lg font-bold text-white text-sm tracking-wide shadow-lg">
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center pt-32 pb-24 px-6 md:px-16 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260"
            className="w-full h-full object-cover opacity-40"
            alt="American Truck Background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black" />
        </div>

        <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Hero Text */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-8 font-heading animate-fade-in-up">
              TOTAL<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-400">COMPLIANCE.</span><br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-gray-200 to-gray-500">ZERO STRESS.</span>
            </h1>

            <p className="text-gray-300 text-lg md:text-xl max-w-xl mb-12 leading-relaxed animate-fade-in-up mx-auto lg:mx-0" style={{ animationDelay: '0.1s' }}>
              The all-in-one platform for 49 CFR requirements. Track DQF files, maintenance, and SMS BASICs with
              predictive alerts that keep you off the radar.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Link
                to="/register"
                className="btn-glow px-8 py-4 rounded-xl font-bold text-white text-base tracking-wide flex items-center justify-center gap-3"
              >
                Get Started Now
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="px-8 py-4 rounded-xl font-bold text-gray-300 text-base tracking-wide border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-3 group"
              >
                View Demo
                <FiPlay className="w-5 h-5 group-hover:translate-x-1 transition-transform text-gray-500" />
              </a>
            </div>
          </div>

          {/* VroomX AI Chat Interface */}
          <div className="order-1 lg:order-2 relative animate-fade-in-up" style={{ perspective: '2000px', animationDelay: '0.15s' }}>
            {/* Glowing backdrop */}
            <div className="absolute inset-0 bg-primary-500/20 blur-[80px] -z-10 rounded-full" />

            <div className="relative transform transition-all duration-700 hover:rotate-0" style={{ transform: 'rotateY(-6deg) rotateX(5deg)', transformStyle: 'preserve-3d' }}>
              <div className="glass-card rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
                {/* Window Header */}
                <div className="px-5 py-4 bg-black/40 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-primary-500/20">
                      AI
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">VroomX Assistant</div>
                      <div className="text-[10px] text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Online
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#28ca42]" />
                  </div>
                </div>

                {/* Chat Body */}
                <div className="p-6 bg-black/40 backdrop-blur-md h-[400px] flex flex-col justify-end space-y-4 relative overflow-hidden">
                  {/* Grid background pattern */}
                  <div className="absolute inset-0 bg-grid-pattern opacity-5" />

                  {/* User Message */}
                  <div className="flex justify-end relative z-10">
                    <div className="animate-message-pop bg-white/10 text-white px-4 py-3 rounded-2xl rounded-tr-sm border border-white/5 backdrop-blur-sm shadow-lg max-w-[85%]">
                      <p className="text-sm font-medium">Do I need an ELD under 100 miles?</p>
                    </div>
                  </div>

                  {/* AI Typing Indicator */}
                  {showTyping && (
                    <div className="flex justify-start relative z-10 animate-fade-in">
                      <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-primary-500/20">
                          VX
                        </div>
                        <div className="bg-primary-900/40 px-4 py-3 rounded-2xl rounded-tl-sm border border-primary-500/20 backdrop-blur-sm">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-typing-dot" />
                            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-typing-dot" style={{ animationDelay: '0.1s' }} />
                            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-typing-dot" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Response */}
                  {showAiResponse && (
                    <div className="flex justify-start relative z-10 animate-message-pop">
                      <div className="flex gap-3 max-w-[90%]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-1 shadow-lg shadow-primary-500/20">
                          VX
                        </div>
                        <div className="bg-primary-900/40 text-gray-200 px-5 py-4 rounded-2xl rounded-tl-sm border border-primary-500/20 backdrop-blur-sm shadow-lg">
                          <p className="text-sm leading-relaxed">
                            If you meet the <span className="text-white font-semibold">short-haul exemption</span> under <span className="text-primary-400 font-mono text-xs bg-primary-500/10 px-1 py-0.5 rounded border border-primary-500/20">49 CFR &sect;395.1(e)</span>, you are exempt from ELD use as long as:
                          </p>
                          <ul className="mt-3 space-y-2 text-xs text-gray-400 list-disc pl-4">
                            <li>You operate within a 150 air-mile radius</li>
                            <li>You return to the work reporting location each day</li>
                            <li>You drive no more than 11 hours</li>
                          </ul>
                          <div className="mt-4 flex items-center gap-2">
                            <span className="text-[10px] text-gray-500">Source: FMCSA Rules & Regulations</span>
                            <div className="h-px flex-1 bg-white/5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Input Area Mockup */}
                  <div className="mt-2 relative z-10">
                    <div className="bg-white/5 rounded-xl p-2 flex items-center gap-2 border border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                        <FiPaperclip className="w-4 h-4" />
                      </div>
                      <div className="flex-1 h-8 flex items-center">
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-500 flex items-center justify-center">
                        <FiSend className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Sticker */}
              <div className="absolute -right-8 top-1/2 glass-card p-4 rounded-xl flex items-center gap-3 animate-float shadow-xl border border-white/10 hidden lg:flex">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500">
                  <FiShield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Compliance Expert</div>
                  <div className="text-sm font-bold text-white">24/7 AI Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 py-12 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 px-6">
          {[
            { value: '6+', label: 'SMS BASICs Tracked' },
            { value: '49 CFR', label: 'Compliance Built-In' },
            { value: '30/14/7', label: 'Day Expiration Alerts' },
            { value: 'DataQ', label: 'Challenge Support' }
          ].map((stat, i) => (
            <div key={i} className="text-center group">
              <div className="text-3xl md:text-4xl font-black tracking-tight text-white group-hover:text-primary-500 transition-colors duration-300 font-heading">
                {stat.value === '49 CFR' ? (
                  <><span className="text-primary-500 group-hover:text-white transition-colors">49</span> CFR</>
                ) : stat.value === 'DataQ' ? (
                  <>Data<span className="text-primary-500 group-hover:text-white transition-colors">Q</span></>
                ) : stat.value === '6+' ? (
                  <>6<span className="text-primary-500 group-hover:text-white transition-colors">+</span></>
                ) : (
                  stat.value.split('/').map((v, idx) => (
                    <span key={idx}>{idx > 0 && <span className="text-gray-600">/</span>}{v}</span>
                  ))
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2 uppercase tracking-widest font-mono">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-32 px-6 md:px-16 relative z-10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-block px-3 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-400 font-mono text-xs mb-6">
              // THE PROBLEM
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-8 leading-tight">
              Compliance is a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-400">Mess.</span><br />
              <span className="text-gray-500">VroomX helps to clean it up.</span>
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-10">
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
                <div key={i} className="glass p-4 rounded-xl flex items-start gap-4 hover:bg-white/5 transition-colors">
                  <div className={`p-2 rounded-lg mt-1 ${
                    item.color === 'red' ? 'bg-red-500/10 text-red-500' :
                    item.color === 'amber' ? 'bg-amber-500/10 text-amber-500' :
                    item.color === 'primary' ? 'bg-primary-500/10 text-primary-500' :
                    'bg-purple-500/10 text-purple-500'
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-primary-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="glass-card rounded-2xl p-8 relative overflow-hidden border-t border-white/10">
              {/* Code/File mockup */}
              <div className="flex items-center gap-3 mb-6 opacity-60">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="h-2 w-32 bg-white/10 rounded-full" />
              </div>

              <div className="space-y-3 font-mono text-sm">
                {['driver_files_v3.xlsx', 'maintenance_logs_old.pdf', 'inspection_reports_24.docx', 'fuel_receipts_scan.jpg'].map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5" style={{ opacity: 1 - i * 0.15 }}>
                    <div className="flex items-center gap-3 text-gray-400">
                      <FiFileText className="w-4 h-4" />
                      <span>{file}</span>
                    </div>
                    <span className="text-red-400 text-xs">Deleted</span>
                  </div>
                ))}

                <div className="my-6 border-b border-white/10" />

                <div className="flex items-center gap-3 text-green-400 animate-pulse">
                  <FiCheckCircle className="w-5 h-5" />
                  <span>Migrating to VroomX Safety...</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-primary-500 w-3/4 shadow-glow-sm" />
                </div>
              </div>
            </div>

            {/* Sticker */}
            <div className="absolute -bottom-6 -right-6 bg-primary-500 text-white p-4 lg:p-6 rotate-[-15deg] font-black uppercase text-lg lg:text-xl shadow-2xl z-20 border-4 border-black transform transition-transform hover:scale-110 hover:rotate-[-10deg]">
              PROBLEM SOLVED
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 md:px-16 relative z-10 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary-900/10 rounded-full blur-[120px] -z-10" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="font-mono text-xs text-primary-500 uppercase tracking-widest">// Platform Modules</span>
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mt-4 mb-6">
              Everything You Need.<br />
              <span className="text-gray-500">Nothing You Don't.</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              A complete suite of tools engineered for 49 CFR compliance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FiUsers,
                title: 'Driver Qualification',
                description: 'Automated DQF management with smart alerts for CDL, Medical Cards, and MVRs. Never miss a deadline again.',
                tags: ['Expirations', 'MVRs', 'Clearinghouse'],
                gradient: true
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
              <div key={i} className="group relative glass-card p-8 rounded-3xl overflow-hidden hover:-translate-y-2 hover:border-primary-500/30 hover:shadow-glow transition-all duration-300">
                <div className="relative z-10">
                  <div className={`w-14 h-14 ${feature.gradient ? 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/20' : 'bg-surface border border-white/10 group-hover:border-primary-500/50'} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-sm text-gray-300 mb-6 leading-relaxed">{feature.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.tags.map((tag, j) => (
                      <span key={j} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-gray-300 uppercase tracking-wide">
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
      <section className="py-24 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white">
            Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-400">Fleets Everywhere.</span>
          </h2>
        </div>

        <div className="relative w-full overflow-hidden">
          {/* Mask for fading edges */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-20 pointer-events-none" />

          <div className="flex w-max animate-scroll hover:[animation-play-state:paused] gap-8">
            {/* First set of testimonials */}
            {testimonials.map((t, i) => (
              <div key={i} className="w-[400px] glass p-8 rounded-2xl flex-shrink-0 relative group hover:border-primary-500/30 transition-colors">
                <div className={`absolute -top-4 left-8 w-8 h-8 ${t.featured ? 'bg-primary-500 shadow-lg shadow-primary-500/30' : 'bg-primary-500/50'} rounded-full flex items-center justify-center text-xl font-black text-white`}>
                  "
                </div>
                <p className="text-gray-300 text-lg mb-6 leading-relaxed relative z-10 pt-2" dangerouslySetInnerHTML={{ __html: t.quote }} />
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 shrink-0" />
                  <div>
                    <div className="text-white font-bold text-sm">{t.name}</div>
                    <div className="text-primary-500 text-xs uppercase tracking-wider font-bold">
                      {t.role}{t.fleet && ` • ${t.fleet}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Duplicate set for infinite scroll */}
            {testimonials.map((t, i) => (
              <div key={`dup-${i}`} className="w-[400px] glass p-8 rounded-2xl flex-shrink-0 relative group hover:border-primary-500/30 transition-colors">
                <div className={`absolute -top-4 left-8 w-8 h-8 ${t.featured ? 'bg-primary-500 shadow-lg shadow-primary-500/30' : 'bg-primary-500/50'} rounded-full flex items-center justify-center text-xl font-black text-white`}>
                  "
                </div>
                <p className="text-gray-300 text-lg mb-6 leading-relaxed relative z-10 pt-2" dangerouslySetInnerHTML={{ __html: t.quote }} />
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 shrink-0" />
                  <div>
                    <div className="text-white font-bold text-sm">{t.name}</div>
                    <div className="text-primary-500 text-xs uppercase tracking-wider font-bold">
                      {t.role}{t.fleet && ` • ${t.fleet}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - 3 Tiers */}
      <section id="pricing" className="py-24 px-6 md:px-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6">
              Simple, Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-400">Pricing.</span>
            </h2>
            <p className="text-lg text-gray-300">
              Start your compliance journey today. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Starter Tier */}
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden group hover:border-primary-500/30 transition-all">
              <div className="absolute top-0 right-0 bg-white/10 px-4 py-1 rounded-bl-xl text-xs font-bold text-white uppercase tracking-wider backdrop-blur-md">
                Starter
              </div>

              <div className="mb-8">
                <div className="text-sm text-gray-300 font-mono mb-2 uppercase tracking-wider">Small Fleets</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white tracking-tight">$29</span>
                  <span className="text-gray-500 font-medium">/month</span>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-500 text-xs font-bold uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  3-Day Free Trial
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  { text: 'Up to', highlight: '3 Trucks' },
                  { text: 'Up to', highlight: '3 Drivers' },
                  { text: 'Full DQ File Management' },
                  { text: 'Maintenance Scheduling' }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <FiCheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    {item.highlight ? <>{item.text} <strong className="text-white">{item.highlight}</strong></> : item.text}
                  </li>
                ))}
              </ul>

              <Link to="/register" className="w-full btn-glow py-4 rounded-xl font-bold text-white text-center block transition-transform group-hover:scale-[1.02]">
                Start 3-Day Trial
              </Link>
            </div>

            {/* Growth Tier - Most Popular */}
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden group hover:border-primary-500/30 transition-all border-primary-500/30">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-1 rounded-bl-xl text-xs font-bold text-white uppercase tracking-wider shadow-lg shadow-primary-500/20">
                Most Popular
              </div>

              <div className="mb-8 relative z-10">
                <div className="text-sm text-primary-400 font-mono mb-2 uppercase tracking-wider">Unlimited</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white tracking-tight">$49</span>
                  <span className="text-gray-500 font-medium">/month</span>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-500 text-xs font-bold uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  3-Day Free Trial
                </div>
              </div>

              <ul className="space-y-4 mb-8 relative z-10">
                {[
                  { highlight: 'Unlimited', text: 'Trucks & Drivers' },
                  { text: 'Advanced SMS Alerts' },
                  { text: 'Audit Readiness Reports' },
                  { text: 'Priority Support' }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <FiCheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    {item.highlight ? <><strong className="text-white">{item.highlight}</strong> {item.text}</> : item.text}
                  </li>
                ))}
              </ul>

              <Link to="/register" className="relative z-10 w-full btn-glow py-4 rounded-xl font-bold text-white text-center block transition-transform group-hover:scale-[1.02] shadow-lg shadow-primary-500/20">
                Start 3-Day Trial
              </Link>
            </div>

            {/* Annual Tier */}
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden group hover:border-yellow-500/30 transition-all border-white/10 ring-1 ring-yellow-500/20">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-600 to-yellow-500 px-4 py-1 rounded-bl-xl text-xs font-bold text-black uppercase tracking-wider shadow-lg shadow-yellow-500/20">
                Save $109
              </div>

              <div className="mb-8 relative z-10">
                <div className="text-sm text-yellow-500 font-mono mb-2 uppercase tracking-wider">Unlimited Annual</div>
                <div className="flex items-baseline gap-2">
                  <span className="line-through text-gray-500 text-xl decoration-red-500/50 decoration-2">$588</span>
                  <span className="text-5xl font-black text-white tracking-tight">$479</span>
                  <span className="text-gray-500 font-medium">/year</span>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  Best Value
                </div>
              </div>

              <ul className="space-y-4 mb-8 relative z-10">
                {[
                  { highlight: 'Everything', text: 'in Monthly' },
                  { highlight: '2 Months Free', text: '(approx)' },
                  { text: 'Locked-in Rate' },
                  { text: 'Priority Onboarding' }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <FiCheckCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    {item.highlight ? <><strong className="text-white">{item.highlight}</strong> {item.text}</> : item.text}
                  </li>
                ))}
              </ul>

              <Link to="/register" className="relative z-10 w-full bg-gradient-to-r from-yellow-600 to-yellow-500 py-4 rounded-xl font-bold text-black text-center block transition-transform group-hover:scale-[1.02] shadow-lg shadow-yellow-500/20">
                Go Annual
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="py-24 px-6 md:px-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="font-mono text-xs text-primary-500 uppercase tracking-widest">// Stay Informed</span>
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mt-4">
                Latest <span className="text-gray-500">Updates</span>
              </h2>
            </div>
            <a href="#" className="hidden md:flex items-center gap-2 text-sm font-bold text-primary-500 hover:text-primary-400 transition-colors">
              View All Articles
              <FiArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {blogPosts.map((post, i) => (
              <a key={i} href="#" className="group block">
                <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col hover:-translate-y-2 hover:border-primary-500/30 hover:shadow-glow transition-all duration-300">
                  <div className="h-48 bg-gray-800 relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-tr ${post.gradient} to-gray-900/50 group-hover:scale-105 transition-transform duration-500`} />
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] text-white font-mono uppercase tracking-wide">
                      {post.category}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-xs text-gray-500 mb-3 font-mono">{post.date}</div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-500 transition-colors">{post.title}</h3>
                    <p className="text-sm text-gray-300 mb-4 flex-1">{post.excerpt}</p>
                    <div className="flex items-center gap-2 text-sm text-primary-500 font-medium">
                      Read Article
                      <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <a href="#" className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white text-sm">
              View All Articles
              <FiArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 px-6 md:px-16 text-center relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/20 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight font-heading">
            Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-400">Simplify?</span>
          </h2>
          <p className="text-xl text-gray-200 mb-10 max-w-xl mx-auto">
            Join trucking companies who stopped worrying about audits and started focusing on the road.
          </p>
          <Link
            to="/register"
            className="btn-glow px-12 py-5 rounded-full font-bold text-white text-lg inline-flex items-center gap-2"
          >
            Get Started Now
            <FiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-16 border-t border-white/5 bg-[#030303] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-primary-600 grid place-items-center text-white font-bold text-xs shadow-glow-sm">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div className="text-lg font-heading font-bold text-white tracking-tight">
              VroomX <span className="text-primary-500">Safety</span>
            </div>
          </Link>

          <div className="flex flex-wrap justify-center gap-8">
            <a href="#features" className="text-sm text-gray-500 hover:text-white transition-colors">Platform</a>
            <a href="#pricing" className="text-sm text-gray-500 hover:text-white transition-colors">Pricing</a>
            <Link to="/login" className="text-sm text-gray-500 hover:text-white transition-colors">Login</Link>
            <a href="mailto:support@vroomxsafety.com" className="text-sm text-gray-500 hover:text-white transition-colors">Contact</a>
          </div>

          <div className="text-gray-600 text-xs text-center md:text-right">
            &copy; 2025 VroomX Safety.<br />All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

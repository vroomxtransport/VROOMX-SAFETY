import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiArrowRight,
  FiPlay,
  FiLoader,
  FiCheck,
  FiStar,
  FiLock,
  FiDatabase,
  FiAward,
  FiAlertTriangle,
  FiBarChart2,
  FiClock,
  FiTruck,
  FiAlertCircle,
  FiDroplet,
  FiShield,
  FiUser,
  FiRefreshCw,
  FiActivity,
  FiCheckCircle,
  FiMail,
  FiSend,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

/**
 * Design 1: Split Screen with Floating Dashboard
 * Bold diagonal split - left side dark navy with text, right side shows a floating 3D dashboard mockup
 */
export const HeroDesign1 = ({ heroTextIndex, heroTexts }) => {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (error) {
      console.error('Demo login failed:', error);
      alert('Demo is temporarily unavailable. Please try again later.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Diagonal Split Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-primary-500" />
        <div
          className="absolute inset-0 bg-[#F8FAFC]"
          style={{ clipPath: 'polygon(55% 0, 100% 0, 100% 100%, 35% 100%)' }}
        />
        {/* Subtle grid on light side */}
        <div
          className="absolute inset-0 bg-grid-pattern opacity-[0.03]"
          style={{ clipPath: 'polygon(55% 0, 100% 0, 100% 100%, 35% 100%)' }}
        />
      </div>

      {/* Animated Blobs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-cta-500/20 blur-[100px] rounded-full animate-blob" />
      <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-primary-300/30 blur-[80px] rounded-full animate-blob" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-16 items-center w-full">

          {/* Left: Text Content on Navy */}
          <div className="text-white">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8">
              <div className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
              <span className="text-sm font-medium">Trusted by 500+ carriers nationwide</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading leading-[1.1] mb-6">
              Compliance<br />
              <span className="text-cta-400">Made Simple.</span><br />
              <span className="text-white/80 text-3xl sm:text-4xl lg:text-5xl">
                {heroTexts[heroTextIndex]}
              </span>
            </h1>

            <p className="text-xl text-white/70 mb-10 max-w-lg leading-relaxed">
              Stop drowning in paperwork. VroomX automates DQF files, tracks expirations,
              and keeps you audit-ready — so you can focus on what matters.
            </p>

            {/* Stats Row */}
            <div className="flex gap-8 mb-10">
              {[
                { value: '3,247+', label: 'CSA Checks' },
                { value: '99.2%', label: 'Uptime' },
                { value: '$2.4M', label: 'Fines Prevented' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-black text-cta-400">{stat.value}</div>
                  <div className="text-xs text-white/60 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                to="/pricing"
                className="px-8 py-4 rounded-xl font-bold text-primary-500 bg-white hover:bg-white/90 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                Start Free Trial
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={handleTryDemo}
                disabled={demoLoading}
                className="px-8 py-4 rounded-xl font-bold text-white border-2 border-white/30 hover:bg-white/10 transition-all flex items-center gap-2"
              >
                {demoLoading ? (
                  <FiLoader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <FiPlay className="w-5 h-5" />
                    Watch Demo
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Floating Dashboard Mockup */}
          <div className="relative lg:pl-10">
            <div className="relative">
              {/* Glow behind card */}
              <div className="absolute -inset-8 bg-gradient-to-br from-cta-500/30 to-primary-500/20 blur-3xl rounded-3xl" />

              {/* Dashboard Card */}
              <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden transform hover:-translate-y-2 transition-transform duration-500">
                {/* Header */}
                <div className="bg-primary-500 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-white/80 text-sm font-mono">vroomx.app/dashboard</span>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 space-y-4">
                  {/* Compliance Score */}
                  <div className="flex items-center justify-between p-4 bg-success-50 rounded-xl border border-success-200">
                    <div>
                      <div className="text-sm text-success-600 font-medium">Compliance Score</div>
                      <div className="text-3xl font-black text-success-700">98%</div>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-success-500 flex items-center justify-center">
                      <FiCheck className="w-8 h-8 text-success-500" />
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Drivers', value: '24', bgClass: 'bg-primary-50', textClass: 'text-primary-600' },
                      { label: 'Expiring', value: '2', bgClass: 'bg-warning-50', textClass: 'text-warning-600' },
                      { label: 'Alerts', value: '0', bgClass: 'bg-success-50', textClass: 'text-success-600' },
                    ].map((item, i) => (
                      <div key={i} className={`p-3 rounded-lg ${item.bgClass} text-center`}>
                        <div className={`text-2xl font-bold ${item.textClass}`}>{item.value}</div>
                        <div className="text-xs text-zinc-500">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-zinc-400 uppercase">Recent Activity</div>
                    {[
                      { text: 'CDL renewed - J. Smith', time: '2m ago', icon: FiCheck },
                      { text: 'Medical card uploaded', time: '15m ago', icon: FiDatabase },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100">
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4 text-success-500" />
                          <span className="text-sm text-zinc-600">{item.text}</span>
                        </div>
                        <span className="text-xs text-zinc-400">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating notification */}
              <div className="absolute -right-4 top-1/4 bg-white rounded-lg shadow-lg border border-[#E2E8F0] p-3 animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
                    <FiCheck className="w-4 h-4 text-success-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-800">All Clear!</div>
                    <div className="text-[10px] text-zinc-500">No violations found</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Design 2: Centered Minimal with Animated Stats Counter
 * Clean, centered layout with large typography and animated counting stats. Video background with dark overlay.
 */
export const HeroDesign2 = ({ heroTextIndex, heroTexts }) => {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const [counts, setCounts] = useState({ checks: 0, uptime: 0, carriers: 0 });

  // Animated counter effect
  useEffect(() => {
    const targets = { checks: 3247, uptime: 99.2, carriers: 500 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCounts({
        checks: Math.floor(targets.checks * progress),
        uptime: Math.round(targets.uptime * progress * 10) / 10,
        carriers: Math.floor(targets.carriers * progress),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (error) {
      console.error('Demo login failed:', error);
      alert('Demo is temporarily unavailable. Please try again later.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video/Image Background with Overlay */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-truck.jpg"
          className="w-full h-full object-cover"
          alt="Trucking fleet"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/95 via-primary-800/90 to-primary-900/95" />
      </div>

      {/* Floating Particles Effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-cta-500 animate-pulse" />
          <span className="text-white/90 text-sm font-medium">FMCSA Compliance Platform</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-heading text-white leading-[0.95] mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          PROTECT YOUR<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-400 to-cta-600">
            FLEET
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Automated compliance management that keeps your trucks on the road
          and auditors happy.
        </p>

        {/* Animated Stats */}
        <div className="flex flex-wrap justify-center gap-12 mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {[
            { value: counts.checks.toLocaleString() + '+', label: 'CSA Checks Performed' },
            { value: counts.uptime + '%', label: 'Platform Uptime' },
            { value: counts.carriers + '+', label: 'Happy Carriers' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl md:text-5xl font-black text-white font-mono tabular-nums">
                {stat.value}
              </div>
              <div className="text-sm text-white/50 uppercase tracking-widest mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Link
            to="/pricing"
            className="group px-10 py-5 rounded-2xl font-bold text-lg bg-gradient-to-r from-cta-500 to-cta-600 text-white hover:shadow-glow transition-all flex items-center justify-center gap-3"
          >
            Get Started Free
            <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button
            onClick={handleTryDemo}
            disabled={demoLoading}
            className="px-10 py-5 rounded-2xl font-bold text-lg text-white border-2 border-white/30 hover:bg-white/10 backdrop-blur-sm transition-all flex items-center justify-center gap-3"
          >
            {demoLoading ? (
              <FiLoader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <FiPlay className="w-5 h-5" />
                See It In Action
              </>
            )}
          </button>
        </div>

      </div>

      {/* Scroll Indicator - positioned relative to section */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-white/50 rounded-full animate-scroll-down" />
        </div>
      </div>
    </section>
  );
};

/**
 * Design 3: Cards Grid with Problem/Solution Layout
 * Hero with side-by-side problem (red/dark) and solution (green/light) cards showing the transformation
 */
export const HeroDesign3 = ({ heroTextIndex, heroTexts }) => {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (error) {
      console.error('Demo login failed:', error);
      alert('Demo is temporarily unavailable. Please try again later.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen bg-[#F8FAFC] overflow-hidden pt-28 pb-16">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-50 to-transparent" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
      </div>

      {/* Blobs */}
      <div className="absolute top-40 left-10 w-72 h-72 bg-danger-500/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-40 right-10 w-72 h-72 bg-success-500/10 blur-[100px] rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-200 bg-primary-50 text-primary-600 text-sm font-medium mb-6">
            <FiAlertTriangle className="w-4 h-4" />
            The #1 Compliance Platform for Owner-Operators
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-heading text-primary-500 leading-tight mb-6">
            From Compliance Chaos<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-success-500 to-success-600">
              To Audit-Ready Peace
            </span>
          </h1>

          <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
            See the difference VroomX makes for carriers just like you.
          </p>
        </div>

        {/* Problem/Solution Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 relative">
          {/* Problem Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-danger-500 to-danger-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
            <div className="relative bg-white rounded-2xl border border-danger-200 overflow-hidden">
              <div className="bg-danger-500 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <FiAlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold">WITHOUT VroomX</div>
                    <div className="text-danger-100 text-sm">The daily struggle</div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {[
                  { icon: '📋', text: 'Spreadsheets everywhere, nothing synced' },
                  { icon: '⏰', text: 'Expiration dates slipping through the cracks' },
                  { icon: '😰', text: 'Audit panic — scrambling for documents' },
                  { icon: '💸', text: 'Unexpected fines eating into profits' },
                  { icon: '❌', text: 'Drivers going out-of-service mid-route' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-danger-50 border border-danger-100">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-danger-700 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Solution Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-success-500 to-success-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
            <div className="relative bg-white rounded-2xl border border-success-200 overflow-hidden">
              <div className="bg-success-500 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <FiCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold">WITH VroomX</div>
                    <div className="text-success-100 text-sm">Compliance on autopilot</div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {[
                  { icon: '✅', text: 'Everything in one dashboard, always current' },
                  { icon: '🔔', text: 'Smart alerts 30, 60, 90 days before expiry' },
                  { icon: '📁', text: 'Audit-ready files at your fingertips' },
                  { icon: '💰', text: '$16K average fines prevented per year' },
                  { icon: '🚛', text: '99.8% driver availability rate' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-success-50 border border-success-100">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-success-700 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Arrow Connecting */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-16 h-16 rounded-full bg-white shadow-xl border-4 border-cta-500 flex items-center justify-center">
              <FiArrowRight className="w-6 h-6 text-cta-500" />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/pricing"
              className="btn-glow px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3"
            >
              Start Your Transformation
              <FiArrowRight className="w-5 h-5" />
            </Link>
            <button
              onClick={handleTryDemo}
              disabled={demoLoading}
              className="px-10 py-5 rounded-2xl font-bold text-lg text-primary-500 border-2 border-primary-200 hover:bg-primary-50 transition-all flex items-center justify-center gap-3"
            >
              {demoLoading ? (
                <FiLoader className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <FiPlay className="w-5 h-5" />
                  Try Demo
                </>
              )}
            </button>
          </div>

          <p className="text-zinc-500 mt-6 text-sm">
            14-day free trial • No credit card required • Setup in 5 minutes
          </p>
        </div>
      </div>
    </section>
  );
};

/**
 * Design 4: Asymmetric with Large Typography & Testimonial
 * Massive headline on left, stacked testimonial + CSA checker on right. Bold, editorial feel.
 */
export const HeroDesign4 = ({ heroTextIndex, heroTexts }) => {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (error) {
      console.error('Demo login failed:', error);
      alert('Demo is temporarily unavailable. Please try again later.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cta-500 via-primary-500 to-cta-500" />

      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cta-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 min-h-screen">
        <div className="grid lg:grid-cols-12 gap-12 items-start">

          {/* Left: Giant Typography */}
          <div className="lg:col-span-7">
            <div className="inline-block px-4 py-2 rounded-full bg-cta-500/10 border border-cta-500/20 text-cta-600 font-mono text-xs uppercase tracking-widest mb-8">
              // Compliance Automation
            </div>

            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[120px] font-black font-heading leading-[0.85] tracking-tight mb-8">
              <span className="text-primary-500">STOP</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-500 to-cta-600">
                GUESSING
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-600 max-w-xl mb-10 leading-relaxed">
              Real-time CSA monitoring. Automated document tracking.
              Zero surprises at your next audit.
            </p>

            {/* Inline feature list */}
            <div className="flex flex-wrap gap-4 mb-10">
              {['DQF Management', 'CSA Monitoring', 'Expiration Alerts', 'DataQ Challenges'].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-success-500" />
                  <span className="text-sm font-medium text-zinc-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link
                to="/pricing"
                className="btn-glow px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3"
              >
                Get Started
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={handleTryDemo}
                disabled={demoLoading}
                className="px-8 py-4 rounded-xl font-bold text-lg text-primary-500 bg-white border-2 border-primary-200 hover:border-primary-300 transition-all flex items-center gap-3"
              >
                {demoLoading ? (
                  <FiLoader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <FiPlay className="w-5 h-5" />
                    Live Demo
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Stacked Elements */}
          <div className="lg:col-span-5 space-y-6">
            {/* Featured Testimonial */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/10 to-cta-500/10 rounded-3xl blur-xl" />
              <div className="relative bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-lg">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 text-cta-500 fill-current" />
                  ))}
                </div>

                <blockquote className="text-lg text-zinc-700 mb-6 leading-relaxed">
                  "VroomX caught an expired medical card we'd missed for 3 weeks.
                  Could have been a $16,000 fine. Paid for itself the first month."
                </blockquote>

                <div className="flex items-center gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face"
                    alt="Customer"
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#E2E8F0]"
                  />
                  <div>
                    <div className="font-bold text-primary-500">Mike Rodriguez</div>
                    <div className="text-sm text-zinc-500">Owner, Rodriguez Transport LLC</div>
                    <div className="text-xs text-zinc-400">23 trucks • Phoenix, AZ</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-primary-500 rounded-2xl p-6 text-white">
              <div className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wider">
                Platform Stats
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: '500+', label: 'Carriers' },
                  { value: '3,247', label: 'Checks' },
                  { value: '99.2%', label: 'Uptime' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-black">{stat.value}</div>
                    <div className="text-xs text-white/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 py-4">
              <div className="flex items-center gap-2 text-zinc-500">
                <FiLock className="w-4 h-4" />
                <span className="text-xs font-medium">SSL Secure</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <FiDatabase className="w-4 h-4" />
                <span className="text-xs font-medium">FMCSA Data</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <FiAward className="w-4 h-4" />
                <span className="text-xs font-medium">SOC2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Design 5: Video Background with Floating Action Panel
 * Full-width video background, condensed action panel floating center-right with form/CTA
 */
// BASIC category configuration for inline display
const BASIC_CONFIG = [
  { key: 'unsafeDriving', name: 'Unsafe Driving', shortName: 'Unsafe Drv', threshold: 65, icon: FiAlertTriangle },
  { key: 'hosCompliance', name: 'HOS Compliance', shortName: 'HOS', threshold: 65, icon: FiClock },
  { key: 'vehicleMaintenance', name: 'Vehicle Maint', shortName: 'Vehicle', threshold: 80, icon: FiTruck },
  { key: 'crashIndicator', name: 'Crash Indicator', shortName: 'Crash', threshold: 65, icon: FiAlertCircle },
  { key: 'controlledSubstances', name: 'Ctrl Substances', shortName: 'Drug/Alc', threshold: 80, icon: FiDroplet },
  { key: 'hazmatCompliance', name: 'Hazmat', shortName: 'Hazmat', threshold: 80, icon: FiShield },
  { key: 'driverFitness', name: 'Driver Fitness', shortName: 'Fitness', threshold: 80, icon: FiUser }
];

const getScoreStatus = (score, threshold) => {
  if (score === null || score === undefined) return { color: 'gray', status: 'none' };
  if (score >= threshold) return { color: 'red', status: 'danger' };
  if (score >= threshold - 15) return { color: 'amber', status: 'warning' };
  return { color: 'green', status: 'good' };
};

export const HeroDesign5 = ({ heroTextIndex, heroTexts }) => {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();
  const [searchParams] = useSearchParams();
  const heroVariant = parseInt(searchParams.get('hero') || '1', 10);
  const [demoLoading, setDemoLoading] = useState(false);
  const [dotNumber, setDotNumber] = useState('');
  const [csaStep, setCsaStep] = useState('input'); // 'input' | 'loading' | 'preview'
  const [carrierData, setCarrierData] = useState(null);
  const [csaError, setCsaError] = useState(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [reportStep, setReportStep] = useState('idle'); // 'idle' | 'sending' | 'sent'

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (error) {
      console.error('Demo login failed:', error);
      alert('Demo is temporarily unavailable. Please try again later.');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleCheckScore = async () => {
    if (!dotNumber.trim()) return;

    setCsaError(null);
    setCsaStep('loading');

    try {
      const response = await fetch('/api/csa-checker/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrierNumber: dotNumber.trim() })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Carrier not found');
      }

      setCarrierData(data.data);
      setCsaStep('preview');
    } catch (err) {
      setCsaError(err.message);
      setCsaStep('input');
    }
  };

  const handleReset = () => {
    setCsaStep('input');
    setDotNumber('');
    setCarrierData(null);
    setCsaError(null);
    setEmail('');
    setEmailError(null);
    setReportStep('idle');
  };

  const handleGetReport = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email');
      return;
    }

    setEmailError(null);
    setReportStep('sending');

    try {
      const response = await fetch('/api/csa-checker/full-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrierNumber: dotNumber.trim(), email: trimmed })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate report');
      }

      setReportStep('sent');
    } catch (err) {
      setEmailError(err.message);
      setReportStep('idle');
    }
  };

  return (
    <section className="relative min-h-[85vh] overflow-hidden">
      {/* === HERO BACKGROUND — use ?hero=1 through ?hero=5 to preview === */}

      {/* Option 1: "Midnight Command" — Clean Solid Gradient */}
      {heroVariant === 1 && (
        <div className="absolute inset-0">
          {/* Multi-stop diagonal gradient */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, #050A12 0%, #0A1628 25%, #0D1F3C 50%, #0A1628 75%, #050A12 100%)',
          }} />
          {/* Faint orange radial glow behind CSA card area */}
          <div className="absolute top-1/2 right-[20%] -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.07]" style={{
            background: 'radial-gradient(circle, #F97316 0%, transparent 70%)',
          }} />
          {/* Bottom vignette */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(5,10,18,0.6) 0%, transparent 40%)',
          }} />
        </div>
      )}

      {/* Option 2: "Grid Protocol" — Geometric Grid Pattern */}
      {heroVariant === 2 && (
        <div className="absolute inset-0">
          {/* Dark navy gradient base */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(160deg, #060D1A 0%, #0B1A30 40%, #0A1628 100%)',
          }} />
          {/* 60px grid lines */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }} />
          {/* Diagonal orange accent lines — top-left */}
          <div className="absolute inset-0 opacity-[0.08] overflow-hidden">
            <div className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4" style={{
              background: 'repeating-linear-gradient(45deg, transparent, transparent 80px, rgba(249,115,22,0.3) 80px, rgba(249,115,22,0.3) 82px)',
            }} />
          </div>
          {/* Faint scan lines for texture */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)',
          }} />
        </div>
      )}

      {/* Option 3: "Northern Shield" — Mesh/Aurora Gradient */}
      {heroVariant === 3 && (
        <div className="absolute inset-0">
          {/* Deep black base */}
          <div className="absolute inset-0" style={{ background: '#050A12' }} />
          {/* Large blurred navy blob — left */}
          <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] rounded-full" style={{
            background: 'radial-gradient(circle, rgba(13,31,60,0.8) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }} />
          {/* Teal blob — top right */}
          <div className="absolute -top-[10%] right-[10%] w-[500px] h-[500px] rounded-full" style={{
            background: 'radial-gradient(circle, rgba(20,80,100,0.5) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }} />
          {/* Subtle orange ember glow near CSA card */}
          <div className="absolute top-[40%] right-[15%] w-[400px] h-[400px] rounded-full opacity-[0.08]" style={{
            background: 'radial-gradient(circle, #F97316 0%, transparent 70%)',
            filter: 'blur(60px)',
          }} />
          {/* SVG noise texture overlay for grain */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: '128px 128px',
          }} />
          {/* Top-to-bottom fade for text legibility */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(5,10,18,0.3) 0%, transparent 30%, transparent 70%, rgba(5,10,18,0.5) 100%)',
          }} />
        </div>
      )}

      {/* Option 4: "Topo Compliance" — Topographic Contour Pattern */}
      {heroVariant === 4 && (
        <div className="absolute inset-0">
          {/* Radial navy gradient base */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 40% 50%, #0D1F3C 0%, #080F1E 50%, #050A12 100%)',
          }} />
          {/* SVG topographic contour circles */}
          <div className="absolute inset-0 opacity-[0.05]">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="topo" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                  <circle cx="100" cy="100" r="20" fill="none" stroke="white" strokeWidth="0.5" />
                  <circle cx="100" cy="100" r="40" fill="none" stroke="white" strokeWidth="0.5" />
                  <circle cx="100" cy="100" r="60" fill="none" stroke="white" strokeWidth="0.5" />
                  <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="0.5" />
                  <circle cx="100" cy="100" r="95" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#topo)" />
            </svg>
          </div>
          {/* Dot grid overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
          {/* Center spotlight behind content area */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-[0.08]" style={{
            background: 'radial-gradient(ellipse, rgba(13,31,60,1) 0%, transparent 70%)',
          }} />
          {/* Thin orange accent line at bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-[0.35]" style={{
            background: 'linear-gradient(to right, transparent 10%, #F97316 50%, transparent 90%)',
          }} />
        </div>
      )}

      {/* Option 5: "Divide & Conquer" — Bold Diagonal Split */}
      {heroVariant === 5 && (
        <div className="absolute inset-0">
          {/* Left panel — lighter navy */}
          <div className="absolute inset-0" style={{
            background: '#0B1A30',
            clipPath: 'polygon(0 0, 65% 0, 45% 100%, 0 100%)',
          }} />
          {/* Right panel — darker navy */}
          <div className="absolute inset-0" style={{
            background: '#050A12',
            clipPath: 'polygon(65% 0, 100% 0, 100% 100%, 45% 100%)',
          }} />
          {/* Glowing orange accent stripe along the diagonal */}
          <div className="absolute inset-0 opacity-[0.15]" style={{
            background: 'linear-gradient(to right, transparent 43%, #F97316 45%, #F97316 46%, transparent 65%)',
            clipPath: 'polygon(62% 0, 68% 0, 48% 100%, 42% 100%)',
            filter: 'blur(20px)',
          }} />
          {/* Thin bright orange line along the diagonal edge */}
          <div className="absolute inset-0 opacity-[0.35]">
            <svg className="w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="65%" y1="0" x2="45%" y2="100%" stroke="#F97316" strokeWidth="1.5" />
            </svg>
          </div>
          {/* Navy radial glow for text area (left) */}
          <div className="absolute top-1/2 left-[25%] -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.15]" style={{
            background: 'radial-gradient(circle, rgba(13,31,60,1) 0%, transparent 70%)',
          }} />
          {/* Orange radial glow for CSA card area (right) */}
          <div className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-[0.08]" style={{
            background: 'radial-gradient(circle, #F97316 0%, transparent 70%)',
          }} />
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-12 min-h-[85vh] flex items-center">
        <div className="grid lg:grid-cols-2 gap-10 items-center w-full">

          {/* Left: Content */}
          <div className="text-white">

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-7xl font-black font-heading leading-[1.05] mb-6 text-white">
              Your Fleet.<br />
              <span className="text-cta-400">Protected.</span><br />
              <span className="text-white">24/7.</span>
            </h1>

            <p className="text-xl text-white/70 max-w-lg mb-8 leading-relaxed">
              Real-time FMCSA compliance monitoring, automated alerts, and audit-ready
              documentation — all in one powerful platform.
            </p>

            {/* Feature bullets */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              {[
                'CSA Score Monitoring',
                'Document Expiration Alerts',
                'DQF File Management',
                'DataQ Challenges',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <FiCheck className="w-5 h-5 text-success-400 flex-shrink-0" />
                  <span className="text-base text-white/80">{feature}</span>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/40?img=${i + 10}`}
                    alt={`User ${i}`}
                    className="w-10 h-10 rounded-full border-2 border-primary-800"
                  />
                ))}
              </div>
              <div>
                <div className="text-white font-bold">500+ carriers</div>
                <div className="text-white/50 text-sm">trust VroomX daily</div>
              </div>
            </div>
          </div>

          {/* Right: Floating Action Panel */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-6 bg-cta-500/20 blur-3xl rounded-3xl" />

            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 overflow-hidden">
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 bg-grid-lines opacity-[0.03] pointer-events-none" />

              <div className="relative">
                {/* ===== INPUT STATE ===== */}
                {csaStep === 'input' && (
                  <>
                    {/* Header */}
                    <div className="text-center mb-5">
                      <h2 className="text-2xl font-bold text-primary-500 mb-1">Check Your CSA Score</h2>
                      <p className="text-zinc-500 text-base">Free instant lookup — no signup required</p>
                    </div>

                    {/* Live activity indicator */}
                    <div className="flex items-center justify-center gap-2 mb-4 text-xs text-zinc-500">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      <span>247 checks in the last hour</span>
                    </div>

                    {/* Form */}
                    <div className="space-y-3 mb-5">
                      <div>
                        <label className="block text-sm font-semibold text-zinc-700 mb-1.5">DOT Number</label>
                        <input
                          type="text"
                          value={dotNumber}
                          onChange={(e) => setDotNumber(e.target.value)}
                          placeholder="Enter your DOT#"
                          className="w-full px-4 py-3 rounded-xl border-2 border-[#E2E8F0] bg-white/80
                                     focus:border-cta-500 focus:shadow-[0_0_0_4px_rgba(249,115,22,0.15)]
                                     transition-all duration-200 placeholder:text-zinc-400"
                          onKeyDown={(e) => e.key === 'Enter' && handleCheckScore()}
                        />
                        {csaError && (
                          <p className="mt-2 text-red-500 text-sm flex items-center gap-1">
                            <FiAlertCircle className="w-4 h-4" />
                            {csaError}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={handleCheckScore}
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cta-500 to-cta-600
                                   hover:shadow-lg hover:shadow-cta-500/40 hover:-translate-y-0.5
                                   active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        Check My Score
                        <FiArrowRight className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#E2E8F0]" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-4 bg-white text-sm text-zinc-400">or</span>
                      </div>
                    </div>

                    {/* Alt Actions */}
                    <div className="flex gap-3">
                      <Link
                        to="/pricing"
                        className="flex-1 py-3 rounded-xl font-semibold text-center text-primary-500 bg-primary-50 hover:bg-primary-100 transition-colors"
                      >
                        View Pricing
                      </Link>
                      <button
                        onClick={handleTryDemo}
                        disabled={demoLoading}
                        className="flex-1 py-3 rounded-xl font-semibold text-center text-white bg-primary-500 hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                      >
                        {demoLoading ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <FiPlay className="w-4 h-4" />
                            Try Demo
                          </>
                        )}
                      </button>
                    </div>

                    {/* Enhanced trust badges */}
                    <div className="mt-5 pt-5 border-t border-[#E2E8F0] grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <FiLock className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-medium text-zinc-600">SSL Secure</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <FiCheck className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-medium text-zinc-600">No Card Needed</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <FiClock className="w-4 h-4 text-cta-500" />
                        <span className="text-xs font-medium text-zinc-600">5 Min Setup</span>
                      </div>
                    </div>
                  </>
                )}

                {/* ===== LOADING STATE ===== */}
                {csaStep === 'loading' && (
                  <div className="py-8 text-center">
                    <div className="inline-flex items-center gap-2 mb-4">
                      <FiActivity className="w-5 h-5 text-cta-500 animate-pulse" />
                      <span className="text-sm text-primary-500 font-mono uppercase tracking-wider">Scanning FMCSA</span>
                    </div>
                    <div className="max-w-xs mx-auto mb-4">
                      <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cta-600 to-cta-400 rounded-full animate-pulse w-3/4" />
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono">{dotNumber}</p>
                  </div>
                )}

                {/* ===== PREVIEW STATE ===== */}
                {csaStep === 'preview' && carrierData && (
                  <div className="space-y-4">
                    {/* Carrier Header */}
                    <div className="pb-3 border-b border-[#E2E8F0]">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-base font-bold text-primary-500 truncate flex-1">
                          {carrierData.carrier?.legalName || 'Unknown Carrier'}
                        </h3>
                        <button
                          onClick={handleReset}
                          className="text-xs text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
                        >
                          <FiRefreshCw className="w-3 h-3" />
                          New
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-600 font-mono">
                        {carrierData.carrier?.mcNumber && <span>MC-{carrierData.carrier.mcNumber}</span>}
                        {carrierData.carrier?.mcNumber && carrierData.carrier?.dotNumber && <span className="text-zinc-400">|</span>}
                        {carrierData.carrier?.dotNumber && <span>DOT-{carrierData.carrier.dotNumber}</span>}
                        <span className="text-zinc-400">|</span>
                        <span className={carrierData.carrier?.operatingStatus === 'ACTIVE' ? 'text-emerald-500' : 'text-red-500'}>
                          {carrierData.carrier?.operatingStatus || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Risk Level Badge */}
                    {carrierData.riskLevel && (
                      <div className={`px-3 py-2 rounded-lg text-center ${
                        carrierData.riskLevel === 'HIGH' ? 'bg-red-500' :
                        carrierData.riskLevel === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}>
                        <span className="text-[10px] text-white/80 uppercase tracking-wider">Risk Level</span>
                        <p className="text-lg font-bold text-white">{carrierData.riskLevel} RISK</p>
                      </div>
                    )}

                    {/* Alert Banner */}
                    {carrierData.alerts?.count > 0 && (
                      <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                        <FiAlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="text-xs text-red-600 font-medium">
                          {carrierData.alerts.count} BASIC{carrierData.alerts.count > 1 ? 's' : ''} flagged
                        </span>
                      </div>
                    )}

                    {/* BASIC Scores */}
                    <div>
                      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">BASIC Scores</div>
                      <div className="space-y-1">
                        {BASIC_CONFIG.map((basic) => {
                          const score = carrierData.basics?.[basic.key];
                          const status = getScoreStatus(score, basic.threshold);
                          const Icon = basic.icon;
                          const barColors = {
                            green: 'bg-emerald-500',
                            amber: 'bg-amber-500',
                            red: 'bg-red-500',
                            gray: 'bg-gray-400'
                          };
                          const textColors = {
                            green: 'text-emerald-600',
                            amber: 'text-amber-600',
                            red: 'text-red-600',
                            gray: 'text-zinc-400'
                          };
                          return (
                            <div key={basic.key} className="flex items-center gap-2 py-0.5">
                              <Icon className={`w-3 h-3 flex-shrink-0 ${textColors[status.color]} opacity-60`} />
                              <span className="w-16 text-[10px] text-zinc-600 truncate">{basic.shortName}</span>
                              <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${barColors[status.color]} transition-all duration-500`}
                                  style={{ width: `${score ?? 0}%` }}
                                />
                              </div>
                              <span className={`w-8 text-right text-[10px] font-mono font-medium ${textColors[status.color]}`}>
                                {score !== null && score !== undefined ? `${score}%` : '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* DataQ Challenge Teaser */}
                    {carrierData.dataQOpportunities?.hasOpportunities && (
                      <div className="px-3 py-3 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="flex items-center gap-2 mb-1.5">
                          <FiLock className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">DataQ Challenge Opportunities</span>
                        </div>
                        <p className="text-sm text-amber-700">
                          <span className="font-bold text-amber-900">{carrierData.dataQOpportunities.estimatedCount}</span> potential violation{carrierData.dataQOpportunities.estimatedCount !== 1 ? 's' : ''} detected that may be eligible for DataQ challenge
                          {carrierData.dataQOpportunities.categories?.length > 0 && (
                            <span className="text-xs text-amber-600"> in {carrierData.dataQOpportunities.categories.map(c => c.name).join(', ')}</span>
                          )}
                        </p>
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <FiMail className="w-3 h-3" /> Enter your email below to see the full analysis
                        </p>
                      </div>
                    )}

                    {/* Email Capture & Actions */}
                    <div className="pt-2 space-y-2">
                      {reportStep === 'sent' ? (
                        <>
                          <div className="px-3 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                            <FiCheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                            <p className="text-sm font-semibold text-emerald-700">Report sent to {email}!</p>
                            <p className="text-xs text-emerald-600 mt-0.5">Check your inbox for the full AI analysis with PDF.</p>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              to="/pricing"
                              className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-cta-500 to-cta-600
                                         hover:shadow-lg hover:shadow-cta-500/40 transition-all text-sm text-center"
                            >
                              Start Free Trial
                            </Link>
                            <button
                              onClick={handleReset}
                              className="px-4 py-2.5 rounded-xl font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors text-sm"
                            >
                              Check Another
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                  type="email"
                                  value={email}
                                  onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                                  placeholder="Enter your email"
                                  disabled={reportStep === 'sending'}
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-[#E2E8F0] bg-white/80
                                             focus:border-cta-500 focus:shadow-[0_0_0_4px_rgba(249,115,22,0.15)]
                                             transition-all duration-200 placeholder:text-zinc-400 text-sm
                                             disabled:opacity-60 disabled:cursor-not-allowed"
                                  onKeyDown={(e) => e.key === 'Enter' && handleGetReport()}
                                />
                              </div>
                            </div>
                            {emailError && (
                              <p className="mt-1 text-red-500 text-xs flex items-center gap-1">
                                <FiAlertCircle className="w-3 h-3" />
                                {emailError}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={handleGetReport}
                            disabled={reportStep === 'sending'}
                            className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-cta-500 to-cta-600
                                       hover:shadow-lg hover:shadow-cta-500/40 hover:-translate-y-0.5
                                       active:translate-y-0 transition-all duration-200 text-sm flex items-center justify-center gap-2
                                       disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                          >
                            {reportStep === 'sending' ? (
                              <>
                                <FiLoader className="w-4 h-4 animate-spin" />
                                Generating Report...
                              </>
                            ) : (
                              <>
                                Send My Free Report
                                <FiSend className="w-4 h-4" />
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleReset}
                            disabled={reportStep === 'sending'}
                            className="w-full py-2 rounded-xl font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors text-sm
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Check Another
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Trust badges for preview state */}
                {csaStep !== 'input' && csaStep !== 'loading' && (
                  <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-center gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <FiCheckCircle className="w-3 h-3 text-emerald-500" />
                      <span>Live FMCSA Data</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiLock className="w-3 h-3 text-blue-500" />
                      <span>Secure</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default {
  HeroDesign1,
  HeroDesign2,
  HeroDesign3,
  HeroDesign4,
  HeroDesign5,
};

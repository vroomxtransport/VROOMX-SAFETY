import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiArrowRight,
  FiPlay,
  FiLoader,
  FiCheck,
  FiShield,
  FiTrendingUp,
  FiLock,
  FiDatabase,
  FiAward,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

/**
 * Design 6: Executive Grid Dashboard
 * Rigid 12-column grid with data metrics prominently displayed. Steel/metal aesthetic with thin accent lines.
 */
export const HeroDesign6 = ({ heroTextIndex, heroTexts }) => {
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
    <section className="relative min-h-screen overflow-hidden bg-white">
      {/* Full-width Navy Header Bar */}
      <div className="bg-[#1E3A5F] w-full">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-white/60 font-mono text-xs tracking-wider uppercase">
            Enterprise Compliance Platform
          </span>
          <div className="flex items-center gap-6">
            <span className="text-white/80 text-sm font-medium">500+ Carriers Trust Us</span>
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
        </div>
      </div>

      {/* Orange Accent Line */}
      <div className="h-[2px] w-full bg-[#EA580C]" />

      {/* Subtle Grid Background */}
      <div className="absolute inset-0 top-[60px] bg-grid-lines opacity-50" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-24 min-h-[calc(100vh-60px)]">
        <div className="grid grid-cols-12 gap-8 items-start">

          {/* Left: Headline + CTA (5 columns) */}
          <div className="col-span-12 lg:col-span-5">
            <div className="mb-8">
              <span className="inline-block px-3 py-1 text-xs font-mono uppercase tracking-wider text-[#1E3A5F] border border-[#1E3A5F]/20 rounded-none mb-6">
                FMCSA Compliance v2.0
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading text-[#1E3A5F] leading-[0.95] tracking-tight mb-6">
                Compliance
                <br />
                <span className="text-[#1E3A5F]/60">Engineered.</span>
              </h1>

              <p className="text-lg text-zinc-600 leading-relaxed mb-8 max-w-md">
                Enterprise-grade fleet compliance management. Real-time monitoring,
                automated alerts, audit-ready documentation.
              </p>
            </div>

            {/* CTA Buttons - Square corners */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/pricing"
                className="px-8 py-4 rounded-none font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] transition-colors flex items-center justify-center gap-2"
              >
                Start Free Trial
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={handleTryDemo}
                disabled={demoLoading}
                className="px-8 py-4 rounded-none font-bold text-[#1E3A5F] border border-[#1E3A5F]/30 hover:bg-[#1E3A5F]/5 transition-colors flex items-center justify-center gap-2"
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

          {/* Vertical Divider */}
          <div className="hidden lg:block col-span-1">
            <div className="h-full w-px bg-[#1E3A5F]/10 mx-auto" />
          </div>

          {/* Center: Vertical Metrics (3 columns) */}
          <div className="col-span-12 lg:col-span-3">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-6 border-b border-zinc-200 pb-2">
              Platform Metrics
            </div>

            <div className="space-y-8">
              {[
                { value: '3,247', label: 'CSA Checks Performed', trend: '+12%' },
                { value: '99.2%', label: 'Platform Uptime', trend: 'SLA Met' },
                { value: '$2.4M', label: 'Fines Prevented', trend: '+$340K MTD' },
              ].map((metric, i) => (
                <div key={i} className="border-l-2 border-[#1E3A5F]/20 pl-4">
                  <div className="font-mono text-3xl font-bold text-[#1E3A5F] tracking-tight">
                    {metric.value}
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">{metric.label}</div>
                  <div className="text-xs font-mono text-[#EA580C] mt-1">{metric.trend}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Mini Dashboard (3 columns) */}
          <div className="col-span-12 lg:col-span-3">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-6 border-b border-zinc-200 pb-2">
              Live Status
            </div>

            {/* Status Cards - No shadows, thin borders */}
            <div className="space-y-4">
              <div className="border border-[#1E3A5F]/10 rounded-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-zinc-400">Compliance Score</span>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <div className="font-mono text-4xl font-bold text-[#1E3A5F]">98%</div>
                <div className="h-1 bg-zinc-100 mt-3 rounded-none">
                  <div className="h-full w-[98%] bg-green-500 rounded-none" />
                </div>
              </div>

              <div className="border border-[#1E3A5F]/10 rounded-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-zinc-400">Active Drivers</span>
                  <FiTrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div className="font-mono text-2xl font-bold text-[#1E3A5F]">24</div>
              </div>

              <div className="border border-[#1E3A5F]/10 rounded-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-zinc-400">Alerts</span>
                  <FiShield className="w-4 h-4 text-[#1E3A5F]" />
                </div>
                <div className="font-mono text-2xl font-bold text-green-600">0</div>
                <div className="text-xs text-zinc-400 mt-1">All systems nominal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Horizontal Rule */}
        <div className="mt-16 pt-8 border-t border-zinc-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-8 text-xs text-zinc-400">
              <span className="flex items-center gap-2">
                <FiLock className="w-4 h-4" />
                SOC2 Compliant
              </span>
              <span className="flex items-center gap-2">
                <FiDatabase className="w-4 h-4" />
                FMCSA Integrated
              </span>
              <span className="flex items-center gap-2">
                <FiAward className="w-4 h-4" />
                Enterprise Ready
              </span>
            </div>
            <div className="text-xs font-mono text-zinc-400">
              No credit card required
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Design 7: Minimalist Command Center
 * Terminal/command-line inspired with a modern twist. Technical credibility for trucking compliance.
 */
export const HeroDesign7 = ({ heroTextIndex, heroTexts }) => {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
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
    <section className="relative min-h-screen overflow-hidden bg-[#1E3A5F]">
      {/* Terminal Header Bar */}
      <div className="bg-[#152A45] w-full border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27CA40]" />
            </div>
            <span className="text-white/40 font-mono text-sm ml-4">vroomx-compliance-system</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 font-mono text-xs">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 min-h-[calc(100vh-48px)] flex flex-col justify-center">
        {/* System Badge */}
        <div className="mb-12">
          <code className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-[#EA580C] font-mono text-sm">
            // FMCSA COMPLIANCE SYSTEM v2.0
          </code>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black font-heading text-white leading-[0.95] tracking-tight mb-8">
          Fleet Compliance
          <br />
          <span className="text-white/40">Automated.</span>
          <span
            className={`inline-block w-[4px] h-[1em] bg-[#EA580C] ml-2 align-middle ${
              cursorVisible ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </h1>

        {/* Subheading */}
        <p className="text-xl text-white/60 max-w-2xl leading-relaxed mb-12">
          Real-time CSA monitoring. Automated document tracking. Zero surprises at your next audit.
        </p>

        {/* Feature List as Code Blocks */}
        <div className="flex flex-wrap gap-3 mb-12">
          {[
            'CSA_MONITORING',
            'DQF_MANAGEMENT',
            'EXPIRATION_ALERTS',
            'DATAQ_CHALLENGES',
          ].map((feature, i) => (
            <code
              key={i}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-white/80 font-mono text-sm"
            >
              {feature}
            </code>
          ))}
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-8 mb-12 py-8 border-y border-white/10">
          {[
            { value: '3,247+', label: 'CHECKS_PERFORMED' },
            { value: '99.2%', label: 'SYSTEM_UPTIME' },
            { value: '500+', label: 'ACTIVE_CARRIERS' },
          ].map((metric, i) => (
            <div key={i}>
              <div className="font-mono text-3xl md:text-4xl font-bold text-[#EA580C]">
                {metric.value}
              </div>
              <div className="font-mono text-xs text-white/40 mt-2">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/pricing"
            className="px-8 py-4 rounded-sm font-bold text-[#1E3A5F] bg-white hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
          >
            Initialize Trial
            <FiArrowRight className="w-5 h-5" />
          </Link>
          <button
            onClick={handleTryDemo}
            disabled={demoLoading}
            className="px-8 py-4 rounded-sm font-bold text-white border border-white/30 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            {demoLoading ? (
              <FiLoader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <FiPlay className="w-5 h-5" />
                Run Demo
              </>
            )}
          </button>
        </div>

        {/* Bottom Info */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="font-mono text-xs text-white/30">
            $ vroomx --status: ready | no-credit-card-required | 5-min-setup
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Design 8: Split Vertical Bars
 * Vertical bars/columns creating structured visual rhythm. Inspired by architectural precision.
 */
export const HeroDesign8 = ({ heroTextIndex, heroTexts }) => {
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
      {/* 5-Column Layout */}
      <div className="flex min-h-screen">
        {/* Column 1-2: Navy with Content */}
        <div className="w-[45%] bg-[#1E3A5F] relative">
          <div className="absolute inset-0 flex items-center justify-end pr-12">
            <div className="max-w-lg text-right">
              <div className="inline-block px-3 py-1 text-xs font-mono uppercase tracking-wider text-white/50 border border-white/20 rounded-none mb-8">
                Enterprise Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading text-white leading-[0.95] tracking-tight mb-6 text-right">
                Fleet
                <br />
                Compliance
                <br />
                <span className="text-white/50">Precision.</span>
              </h1>

              <p className="text-lg text-white/60 leading-relaxed mb-8">
                Automated FMCSA compliance management built for carriers who demand reliability.
              </p>

              {/* Metrics */}
              <div className="flex justify-end gap-8 mb-8">
                {[
                  { value: '99.2%', label: 'Uptime' },
                  { value: '500+', label: 'Carriers' },
                ].map((stat, i) => (
                  <div key={i} className="text-right">
                    <div className="font-mono text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Orange Accent Bar */}
        <div className="w-[2%] bg-[#EA580C] relative">
          <div className="absolute inset-0 opacity-60 animate-pulse" style={{ animationDuration: '3s' }} />
        </div>

        {/* Column 4-5: White with Features/CTA */}
        <div className="w-[53%] bg-white relative">
          <div className="absolute inset-0 flex items-center pl-12">
            <div className="max-w-lg">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-8 pb-2 border-b border-zinc-200">
                Core Capabilities
              </div>

              {/* Features with square bullets */}
              <div className="space-y-4 mb-10">
                {[
                  'Real-time CSA score monitoring',
                  'Automated document expiration alerts',
                  'Complete DQF file management',
                  'DataQ challenge assistance',
                  'Audit-ready reporting',
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#1E3A5F] mt-2 flex-shrink-0" />
                    <span className="text-zinc-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTAs - Square corners */}
              <div className="flex flex-col gap-3">
                <Link
                  to="/pricing"
                  className="px-8 py-4 rounded-none font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] transition-colors flex items-center justify-center gap-2 w-fit"
                >
                  Start Free Trial
                  <FiArrowRight className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleTryDemo}
                  disabled={demoLoading}
                  className="px-8 py-4 rounded-none font-bold text-[#1E3A5F] border border-[#1E3A5F]/30 hover:bg-[#1E3A5F]/5 transition-colors flex items-center justify-center gap-2 w-fit"
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

              {/* Trust indicators */}
              <div className="mt-10 pt-6 border-t border-zinc-200 flex items-center gap-6 text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <FiLock className="w-4 h-4" />
                  SOC2 Compliant
                </span>
                <span className="flex items-center gap-2">
                  <FiShield className="w-4 h-4" />
                  Enterprise Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Strip with Trust Logos */}
      <div className="absolute bottom-0 left-0 right-0 bg-zinc-50 border-t border-zinc-200 py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
            Trusted by leading carriers
          </span>
          <div className="flex items-center gap-8">
            {['FMCSA', 'DOT', 'CSA'].map((logo, i) => (
              <span key={i} className="text-sm font-bold text-zinc-300">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Design 9: Floating Stats Tower
 * Central floating panel with stacked metrics, flanked by supporting content. Skyscraper/tower metaphor.
 */
export const HeroDesign9 = ({ heroTextIndex, heroTexts }) => {
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
    <section className="relative min-h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Geometric Pattern Background */}
      <div className="absolute inset-0 bg-geometric-lines opacity-30" />

      {/* Top Horizontal Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[#1E3A5F]/10" />

      {/* Bottom Horizontal Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[#1E3A5F]/10" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20 min-h-screen">
        <div className="grid grid-cols-12 gap-8 items-center min-h-[70vh]">

          {/* Left: Headline and Description */}
          <div className="col-span-12 lg:col-span-4">
            <div className="inline-block px-3 py-1 text-xs font-mono uppercase tracking-wider text-[#1E3A5F] border border-[#1E3A5F]/20 rounded-none mb-6">
              FMCSA Compliance
            </div>

            <h1 className="text-4xl sm:text-5xl font-black font-heading text-[#1E3A5F] leading-[0.95] tracking-tight mb-6">
              Build
              <br />
              Compliance
              <br />
              <span className="text-[#1E3A5F]/50">Confidence.</span>
            </h1>

            <p className="text-lg text-zinc-600 leading-relaxed mb-8">
              VroomX automates your fleet compliance, tracks expirations, and keeps you audit-ready.
              Focus on growing your business, not paperwork.
            </p>

            {/* Feature list */}
            <div className="space-y-3">
              {[
                'CSA Score Monitoring',
                'Document Automation',
                'Expiration Alerts',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <FiCheck className="w-4 h-4 text-[#EA580C]" />
                  <span className="text-sm text-zinc-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Stats Tower */}
          <div className="col-span-12 lg:col-span-4 flex justify-center">
            <div className="relative">
              {/* Tower Panel */}
              <div className="bg-white border border-[#1E3A5F]/20 rounded-none p-8 min-w-[280px]">
                <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-8 text-center">
                  Live Metrics
                </div>

                {/* Stacked Stats */}
                <div className="space-y-8">
                  {[
                    { value: '3,247', label: 'CSA CHECKS', highlight: false },
                    { value: '99.2%', label: 'UPTIME', highlight: false },
                    { value: '$2.4M', label: 'FINES PREVENTED', highlight: true },
                    { value: '500+', label: 'CARRIERS', highlight: false },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className={`text-center py-4 border-b border-zinc-100 last:border-0 ${
                        stat.highlight ? 'bg-[#EA580C]/5 -mx-8 px-8' : ''
                      }`}
                    >
                      <div
                        className={`font-mono text-4xl font-bold tracking-tight ${
                          stat.highlight ? 'text-[#EA580C]' : 'text-[#1E3A5F]'
                        }`}
                      >
                        {stat.value}
                      </div>
                      <div className="text-xs font-mono text-zinc-400 mt-2 tracking-widest">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: CTA Stack and Trust */}
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:pl-8">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-6 pb-2 border-b border-zinc-200">
                Get Started
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3 mb-10">
                <Link
                  to="/pricing"
                  className="w-full px-8 py-4 rounded-none font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] transition-colors flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <FiArrowRight className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleTryDemo}
                  disabled={demoLoading}
                  className="w-full px-8 py-4 rounded-none font-bold text-[#1E3A5F] border border-[#1E3A5F]/30 hover:bg-[#1E3A5F]/5 transition-colors flex items-center justify-center gap-2"
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

              {/* Trust Badges */}
              <div className="space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-200">
                  Trust & Security
                </div>
                {[
                  { icon: FiLock, label: 'SOC2 Compliant' },
                  { icon: FiDatabase, label: 'FMCSA Data Integration' },
                  { icon: FiShield, label: 'Enterprise Security' },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <badge.icon className="w-4 h-4 text-[#1E3A5F]/60" />
                    <span className="text-sm text-zinc-600">{badge.label}</span>
                  </div>
                ))}
              </div>

              {/* No CC Note */}
              <div className="mt-8 pt-4 border-t border-zinc-200">
                <div className="text-xs text-zinc-400">
                  14-day free trial. No credit card required.
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
 * Design 10: Cinematic Widescreen
 * Film/cinematic letterbox format with hero image and overlay text. Premium, high-end feel.
 */
export const HeroDesign10 = ({ heroTextIndex, heroTexts }) => {
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
    <section className="relative min-h-screen overflow-hidden bg-[#0A1525]">
      {/* Top Letterbox Bar */}
      <div className="bg-[#1E3A5F] w-full relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#EA580C] rounded-none flex items-center justify-center">
              <span className="text-white font-black text-sm">VX</span>
            </div>
            <span className="text-white font-bold">VroomX</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/pricing" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              Pricing
            </Link>
            <Link to="/csa-lookup" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              CSA Lookup
            </Link>
            <Link to="/login" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              Login
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content Area - 21:9 Aspect Cinematic */}
      <div className="relative" style={{ paddingBottom: '42.85%', minHeight: '60vh' }}>
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/images/hero-truck.jpg"
            alt="Fleet"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A5F] via-[#1E3A5F]/80 to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="max-w-2xl">
              {/* Solid Navy Backing for Text */}
              <div className="bg-[#1E3A5F] p-8 md:p-12 rounded-none">
                <div className="inline-block px-3 py-1 text-xs font-mono uppercase tracking-wider text-[#EA580C] border border-[#EA580C]/30 rounded-none mb-6">
                  FMCSA Compliance Platform
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-heading text-white leading-[0.95] tracking-tight mb-6">
                  Command Your
                  <br />
                  <span className="text-white/60">Fleet Compliance</span>
                </h1>

                <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
                  Enterprise-grade compliance automation. Real-time monitoring, automated alerts,
                  and audit-ready documentation for serious carriers.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/pricing"
                    className="px-8 py-4 rounded-none font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] transition-colors flex items-center gap-2"
                  >
                    Start Free Trial
                    <FiArrowRight className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={handleTryDemo}
                    disabled={demoLoading}
                    className="px-8 py-4 rounded-none font-bold text-white border border-white/30 hover:bg-white/10 transition-colors flex items-center gap-2"
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
            </div>
          </div>
        </div>

        {/* Right Side Geometric Shapes */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="w-32 h-32 border border-white/10 rounded-none transform rotate-45" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-[#EA580C]/30 rounded-none transform rotate-45" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#EA580C]/20 rounded-none transform rotate-45" />
          </div>
        </div>
      </div>

      {/* Bottom Letterbox Bar with Trust Badges */}
      <div className="bg-[#1E3A5F] w-full relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-white/40 font-mono uppercase tracking-wider">
              Trusted by 500+ carriers nationwide
            </div>
            <div className="flex items-center gap-8">
              {[
                { icon: FiLock, label: 'SOC2' },
                { icon: FiDatabase, label: 'FMCSA' },
                { icon: FiAward, label: 'Enterprise' },
                { icon: FiShield, label: 'Secure' },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-white/40">
                  <badge.icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fill remaining space */}
      <div className="bg-[#0A1525] flex-grow" />
    </section>
  );
};

export default {
  HeroDesign6,
  HeroDesign7,
  HeroDesign8,
  HeroDesign9,
  HeroDesign10,
};

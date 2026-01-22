import { Link } from 'react-router-dom';
import { FiArrowRight, FiPlay } from 'react-icons/fi';
import CSAChecker from '../CSAChecker';

const HeroSection = ({ heroTextIndex, heroTexts }) => {
  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center pt-32 pb-24 px-6 md:px-16 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260"
          className="w-full h-full object-cover"
          alt="American Truck Background"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/30 to-transparent" />
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

          <p className="text-[#1E293B] text-lg md:text-xl max-w-2xl mb-4 leading-relaxed font-medium animate-fade-in-up mx-auto lg:mx-0" style={{ animationDelay: '0.1s' }}>
            The all-in-one platform for 49 CFR compliance. Track DQF files, maintenance, and SMS BASICs with
            predictive alerts that keep you off the radar.
          </p>

          <p className="text-[#1E293B] text-lg md:text-xl max-w-2xl mb-4 leading-relaxed animate-fade-in-up mx-auto lg:mx-0" style={{ animationDelay: '0.12s' }}>
            <span className="text-cta-500 font-semibold">Avoid failed audits</span>,{' '}
            <span className="text-primary-500 font-semibold">spot missing documents</span>, and{' '}
            <span className="font-semibold">stay FMCSA-ready</span>.
          </p>

          <p className="text-[#475569] text-base md:text-lg max-w-xl mb-8 italic animate-fade-in-up mx-auto lg:mx-0" style={{ animationDelay: '0.14s' }}>
            We empower small carriers to take control of compliance — not outsource it.
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
  );
};

export default HeroSection;

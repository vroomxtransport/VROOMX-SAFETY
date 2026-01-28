import { Link } from 'react-router-dom';
import { FiArrowRight, FiPlay } from 'react-icons/fi';
import CSAChecker from '../CSAChecker';

const HeroSection = ({ heroTextIndex, heroTexts }) => {
  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center pt-32 pb-24 px-6 md:px-16 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-truck.webp"
          className="w-full h-full object-cover object-[center_70%]"
          alt="American Truck Background"
          fetchpriority="high"
          loading="eager"
          decoding="async"
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/10" />
      </div>

      <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Hero Text */}
        <div className="text-center lg:text-left order-2 lg:order-1">
          {/* Social Proof Badge */}
          <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full bg-white/90 border border-[#E2E8F0] shadow-sm animate-fade-in-up">
            <div className="flex -space-x-2">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" className="w-8 h-8 rounded-full border-2 border-white" alt="" loading="lazy" decoding="async" />
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face" className="w-8 h-8 rounded-full border-2 border-white" alt="" loading="lazy" decoding="async" />
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" className="w-8 h-8 rounded-full border-2 border-white" alt="" loading="lazy" decoding="async" />
            </div>
            <span className="text-sm text-zinc-600">
              <strong className="text-primary-500">500+</strong> carriers trust VroomX
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6 lg:mb-8 font-heading animate-fade-in-up text-white drop-shadow-lg">
            TOTAL<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-500 to-cta-600">COMPLIANCE.</span><br />
            <span className="inline-grid text-left">
              <span className="invisible col-start-1 row-start-1">ZERO STRESS.</span>
              <span
                key={heroTextIndex}
                className="typewriter-text col-start-1 row-start-1 text-white/90 drop-shadow-lg"
              >
                {heroTexts[heroTextIndex]}
              </span>
            </span>
          </h1>

          <p className="text-white drop-shadow-md text-lg md:text-xl max-w-2xl mb-4 leading-relaxed font-medium animate-fade-in-up mx-auto lg:mx-0" style={{ animationDelay: '0.1s' }}>
            The all-in-one platform for 49 CFR compliance. Track DQF files, maintenance, and SMS BASICs with
            predictive alerts that keep you off the radar.
          </p>

          <p className="text-white/80 drop-shadow-md text-base md:text-lg max-w-xl mb-8 italic animate-fade-in-up mx-auto lg:mx-0" style={{ animationDelay: '0.12s' }}>
            We empower small carriers to take control of compliance — not outsource it.
          </p>

          {/* Stats inline */}
          <div className="flex flex-wrap gap-6 mb-10 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="text-center">
              <div className="text-2xl font-black text-cta-500">3,247+</div>
              <div className="text-xs text-white/80">CSA Checks</div>
            </div>
            <div className="w-px bg-white/30" />
            <div className="text-center">
              <div className="text-2xl font-black text-white">99.2%</div>
              <div className="text-xs text-white/80">Uptime</div>
            </div>
            <div className="w-px bg-white/30" />
            <div className="text-center">
              <div className="text-2xl font-black text-success-400">4.9★</div>
              <div className="text-xs text-white/80">Rating</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <a
              href="#pricing"
              className="btn-glow px-8 py-4 rounded-xl font-bold text-white text-base tracking-wide flex items-center justify-center gap-3"
            >
              Get Started
              <FiArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#features"
              className="px-8 py-4 rounded-xl font-bold text-white text-base tracking-wide border-2 border-white/40 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all flex items-center justify-center gap-3 group"
            >
              View Demo
              <FiPlay className="w-5 h-5 group-hover:translate-x-1 transition-transform text-white" />
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

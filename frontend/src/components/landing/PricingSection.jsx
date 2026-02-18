import { Link } from 'react-router-dom';
import { FiCheck, FiShield, FiUsers, FiZap, FiX } from 'react-icons/fi';
import useInView from '../../hooks/useInView';
import { pricingPlan } from '../../data/landingData';

const PricingSection = () => {
  const [headerRef, headerInView] = useInView({ threshold: 0.3 });
  const [contentRef, contentInView] = useInView({ threshold: 0.1 });

  return (
    <section id="pricing" className="py-24 px-6 md:px-16 relative z-10 bg-white">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div
          ref={headerRef}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-gray-800 mb-4">
            One Price. <span className="text-cta-500">Lifetime Access.</span>
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Enterprise telematics platforms charge $30-50/truck/month for features you'll never use.
          </p>
          <p className="text-base text-gray-500">
            We charge once for what you actually need: document compliance. Nothing more.
          </p>
        </div>

        {/* 2-Column Layout */}
        <div
          ref={contentRef}
          className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto items-start transition-all duration-700 ${contentInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {/* Left Column — Feature Checklist */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">What You Get</h3>
              <p className="text-gray-500">Everything you need for FMCSA compliance — nothing you don't.</p>
            </div>

            <ul className="space-y-3.5">
              {pricingPlan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700">
                  <span className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiCheck className="w-4 h-4 text-emerald-500" strokeWidth={3} />
                  </span>
                  <span className="text-[15px] font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Competitor comparison note */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">Typical telematics platforms:</span>{' '}
                $30-50/truck/month = <span className="font-semibold text-red-500">$360-600/year per truck</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                VroomX: <span className="font-bold text-emerald-600">$249 once</span> for unlimited trucks. Forever.
              </p>
            </div>
          </div>

          {/* Right Column — Conversion Card */}
          <div className="relative">
            {/* Card glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-cta-500/20 via-primary-500/10 to-cta-500/20 rounded-3xl blur-2xl opacity-60" />

            <div className="relative bg-white border-2 border-cta-500 rounded-3xl p-8 md:p-10 shadow-2xl shadow-cta-500/10">
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-r from-cta-500 to-cta-600 px-6 py-2 rounded-full text-xs font-black text-white uppercase tracking-wider shadow-lg shadow-cta-500/40">
                  Lifetime Access
                </div>
              </div>

              {/* Urgency */}
              <div className="flex justify-center mt-4 mb-3">
                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full uppercase tracking-wide animate-pulse">Limited Time — First 50 Companies Only</span>
              </div>

              {/* Anchor price */}
              <div className="text-center mb-2">
                <span className="text-gray-400 text-lg line-through">$588/yr</span>
                <span className="text-xs text-gray-400 ml-2">(typical SaaS cost)</span>
              </div>

              {/* Main price */}
              <div className="text-center mb-2">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-cta-500">$</span>
                  <span className="text-7xl font-black text-gray-800 leading-none tracking-tight">249</span>
                </div>
                <p className="text-gray-500 font-medium mt-1">one-time payment — full access forever</p>
              </div>

              {/* Trial pill */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-full">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm font-bold text-emerald-700">7-Day Free Trial</span>
                </div>
              </div>

              {/* Microcopy */}
              <p className="text-center text-sm text-gray-500 mb-6">No credit card required to start</p>

              {/* CTA Button */}
              <Link
                to="/register"
                className="w-full py-4 rounded-xl font-bold text-center block bg-gradient-to-r from-cta-500 to-cta-600 hover:from-cta-600 hover:to-cta-700 text-white shadow-lg shadow-cta-500/30 hover:shadow-xl hover:scale-[1.02] transition-all text-lg"
              >
                Start Your 7-Day Free Trial
              </Link>

              {/* Trust line */}
              <p className="text-center text-sm text-gray-500 mt-4 font-medium">
                Pay only if you love it. Full access forever. No recurring fees.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges Row */}
        <div className={`mt-12 flex flex-wrap justify-center gap-4 md:gap-8 transition-all duration-700 delay-300 ${contentInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {[
            { icon: FiX, iconClass: 'text-red-400', text: 'No monthly fees', bgClass: 'bg-red-50' },
            { icon: FiUsers, iconClass: 'text-primary-500', text: 'Unlimited drivers', bgClass: 'bg-primary-50' },
            { icon: FiZap, iconClass: 'text-cta-500', text: 'All features included', bgClass: 'bg-cta-50' },
            { icon: FiShield, iconClass: 'text-emerald-500', text: 'Cancel trial anytime', bgClass: 'bg-emerald-50' },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm">
              <div className={`w-7 h-7 ${badge.bgClass} rounded-full flex items-center justify-center`}>
                <badge.icon className={`w-3.5 h-3.5 ${badge.iconClass}`} />
              </div>
              <span className="text-sm font-semibold text-gray-700">{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

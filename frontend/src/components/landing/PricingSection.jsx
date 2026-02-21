import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiShield, FiUsers, FiZap, FiArrowRight } from 'react-icons/fi';
import useInView from '../../hooks/useInView';
import { pricingPlans } from '../../data/landingData';

const PricingSection = () => {
  const [headerRef, headerInView] = useInView({ threshold: 0.3 });
  const [contentRef, contentInView] = useInView({ threshold: 0.1 });
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6 md:px-16 relative z-10 bg-white">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div
          ref={headerRef}
          className={`text-center max-w-3xl mx-auto mb-12 transition-all duration-700 ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-gray-800 mb-4">
            Simple, <span className="text-cta-500">Transparent Pricing</span>
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Enterprise telematics platforms charge $30-50/truck/month for features you'll never use.
          </p>
          <p className="text-base text-gray-500">
            Pick the plan that fits your fleet. Every plan includes all compliance features.
          </p>
        </div>

        {/* Monthly / Annual Toggle */}
        <div
          className={`flex items-center justify-center gap-4 mb-12 transition-all duration-700 ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span className={`text-sm font-semibold transition-colors ${!isAnnual ? 'text-gray-800' : 'text-gray-400'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-cta-500/50 ${isAnnual ? 'bg-cta-500' : 'bg-gray-300'}`}
            aria-label="Toggle annual billing"
          >
            <div
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`}
            />
          </button>
          <span className={`text-sm font-semibold transition-colors ${isAnnual ? 'text-gray-800' : 'text-gray-400'}`}>
            Annual
          </span>
          {isAnnual && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              Save 25%
            </span>
          )}
        </div>

        {/* Pricing Cards */}
        <div
          ref={contentRef}
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto transition-all duration-700 ${contentInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {pricingPlans.map((plan, index) => {
            const displayPrice = isAnnual ? plan.annualPrice : plan.price;
            const period = isAnnual ? '/year' : '/month';
            const monthlyEquivalent = isAnnual ? Math.round(plan.annualPrice / 12) : null;

            return (
              <div key={index} className="relative">
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-cta-500 to-cta-600 px-6 py-2 rounded-full text-xs font-black text-white uppercase tracking-wider shadow-lg shadow-cta-500/40">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Card glow for popular plan */}
                {plan.popular && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-cta-500/20 via-primary-500/10 to-cta-500/20 rounded-3xl blur-xl opacity-60" />
                )}

                <div
                  className={`relative bg-white rounded-3xl p-8 shadow-lg h-full flex flex-col transition-all hover:shadow-xl ${
                    plan.popular
                      ? 'border-2 border-cta-500 shadow-2xl shadow-cta-500/10'
                      : 'border border-gray-200'
                  }`}
                >
                  {/* Plan name */}
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-6">{plan.drivers}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-cta-500">$</span>
                      <span className="text-5xl font-black text-gray-800 leading-none tracking-tight">
                        {displayPrice}
                      </span>
                      <span className="text-gray-500 font-medium ml-1">{period}</span>
                    </div>
                    {isAnnual && monthlyEquivalent && (
                      <p className="text-sm text-emerald-600 font-medium mt-1">
                        ${monthlyEquivalent}/mo billed annually
                      </p>
                    )}
                  </div>

                  {/* Trial pill */}
                  <div className="flex mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-bold text-emerald-700">7-Day Free Trial</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link
                    to="/register"
                    className={`w-full py-3.5 rounded-xl font-bold text-center block transition-all text-base mb-6 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-cta-500 to-cta-600 hover:from-cta-600 hover:to-cta-700 text-white shadow-lg shadow-cta-500/30 hover:shadow-xl hover:scale-[1.02]'
                        : 'bg-gray-800 hover:bg-gray-900 text-white hover:scale-[1.02]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      Start Free Trial
                      <FiArrowRight className="w-4 h-4" />
                    </span>
                  </Link>

                  {/* Feature list */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-700">
                        <span className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiCheck className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />
                        </span>
                        <span className="text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Badges Row */}
        <div className={`mt-12 flex flex-wrap justify-center gap-4 md:gap-8 transition-all duration-700 delay-300 ${contentInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {[
            { icon: FiUsers, iconClass: 'text-primary-500', text: 'Per-driver pricing', bgClass: 'bg-primary-50' },
            { icon: FiShield, iconClass: 'text-emerald-500', text: 'Cancel anytime', bgClass: 'bg-emerald-50' },
            { icon: FiZap, iconClass: 'text-cta-500', text: '7-day free trial', bgClass: 'bg-cta-50' },
            { icon: FiCheck, iconClass: 'text-purple-500', text: 'No credit card required', bgClass: 'bg-purple-50' },
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

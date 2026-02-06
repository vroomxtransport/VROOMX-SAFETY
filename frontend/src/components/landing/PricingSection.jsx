import { Link } from 'react-router-dom';
import { FiCheck } from 'react-icons/fi';
import useInView from '../../hooks/useInView';

const PricingSection = ({ isAnnual, setIsAnnual, pricingPlans }) => {
  const [headerRef, headerInView] = useInView({ threshold: 0.3 });
  const [cardsRef, cardsInView] = useInView({ threshold: 0.1 });

  return (
    <section id="pricing" className="py-24 px-6 md:px-16 relative z-10 bg-white">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div
          ref={headerRef}
          className={`text-center max-w-3xl mx-auto mb-12 transition-all duration-700 ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-gray-800 dark:text-white mb-4">
            Pricing That <span className="text-cta-500">Makes Sense</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            Enterprise telematics platforms charge $30-50/truck/month for features you'll never use.
          </p>
          <p className="text-base text-gray-500 dark:text-gray-400 mb-10">
            We charge for what you actually need: document compliance. Nothing more.
          </p>

          {/* Toggle Pills */}
          <div className="inline-flex items-center gap-1.5 p-2 bg-white/85 backdrop-blur-xl rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.06)]">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                !isAnnual
                  ? 'bg-gradient-to-br from-[#FF6B4A] to-[#FF8A6B] text-white shadow-lg shadow-[#FF6B4A]/25'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                isAnnual
                  ? 'bg-gradient-to-br from-[#FF6B4A] to-[#FF8A6B] text-white shadow-lg shadow-[#FF6B4A]/25'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-white'
              }`}
            >
              Annual
              <span className={`text-xs font-bold ${isAnnual ? 'text-white/90' : 'text-emerald-500'}`}>Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pricingPlans.map((plan, i) => (
            <div
              key={i}
              className={`relative p-10 rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-3 ${
                plan.popular
                  ? 'bg-white border-2 border-cta-500 scale-105 z-10 shadow-xl shadow-cta-500/15'
                  : 'bg-white/85 backdrop-blur-xl border border-gray-200 hover:border-cta-500/30 hover:shadow-xl'
              } ${cardsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: cardsInView ? `${i * 150}ms` : '0ms' }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-[#FF6B4A] to-[#FF8A6B] px-5 py-1.5 rounded-b-xl text-xs font-bold text-white uppercase tracking-wider shadow-lg shadow-[#FF6B4A]/30">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Name */}
              <div className="mb-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{plan.name}</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{plan.subtitle}</p>

              {/* Price */}
              <div className="mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl text-cta-500 font-bold">$</span>
                  <span className="text-5xl font-extrabold text-gray-800 dark:text-white leading-none">
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">/month</span>
                </div>
              </div>

              {/* Billing info */}
              {isAnnual && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Billed <span className="text-gray-700 dark:text-gray-200 font-medium">${plan.annualPrice * 12}/year</span>
                  <span className="line-through ml-2 text-gray-500">${plan.monthlyPrice * 12}</span>
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {plan.drivers}
                {plan.extraDriver && <span className="block text-xs mt-0.5">{plan.extraDriver}</span>}
              </p>

              {/* Divider */}
              <div className="h-px bg-gray-200 mb-6" />

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <span className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiCheck className="w-4 h-4 text-emerald-500" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                to={`/register${plan.hasTrial === false ? '?plan=solo' : ''}`}
                className={`w-full py-4 rounded-xl font-bold text-center block transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-[#FF6B4A] to-[#FF8A6B] hover:shadow-lg hover:shadow-[#FF6B4A]/30 hover:scale-[1.02] text-white'
                    : 'bg-gray-100 border border-gray-200 text-gray-700 dark:text-gray-200 hover:bg-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.hasTrial === false ? 'Get Started' : 'Start Free Trial'}
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default PricingSection;

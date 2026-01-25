import { Link } from 'react-router-dom';
import { FiCheck, FiX } from 'react-icons/fi';
import useInView from '../../hooks/useInView';

const PricingSection = ({ isAnnual, setIsAnnual, pricingPlans, comparisonFeatures }) => {
  const [headerRef, headerInView] = useInView({ threshold: 0.3 });
  const [cardsRef, cardsInView] = useInView({ threshold: 0.1 });

  return (
    <section id="pricing" className="py-24 px-6 md:px-16 relative z-10 bg-[#F8FAFC]">
      {/* Floating decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cta-500/10 blur-[120px]" />
        <div className="absolute bottom-[10%] -left-20 w-72 h-72 rounded-full bg-primary-500/8 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div
          ref={headerRef}
          className={`text-center max-w-3xl mx-auto mb-12 transition-all duration-700 ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-gray-800 mb-4">
            Choose Your <span className="text-cta-500">Plan</span>
          </h2>
          <p className="text-lg text-gray-600 mb-10">
            No hidden fees. No long contracts. Cancel anytime.
          </p>

          {/* Toggle Pills */}
          <div className="inline-flex items-center gap-1.5 p-2 bg-white/85 backdrop-blur-xl rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.06)]">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                !isAnnual
                  ? 'bg-gradient-to-br from-[#FF6B4A] to-[#FF8A6B] text-white shadow-lg shadow-[#FF6B4A]/25'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                isAnnual
                  ? 'bg-gradient-to-br from-[#FF6B4A] to-[#FF8A6B] text-white shadow-lg shadow-[#FF6B4A]/25'
                  : 'text-gray-600 hover:text-gray-800'
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
                <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">{plan.subtitle}</p>

              {/* Price */}
              <div className="mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl text-cta-500 font-bold">$</span>
                  <span className="text-5xl font-extrabold text-gray-800 leading-none">
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-gray-500 ml-1">/month</span>
                </div>
              </div>

              {/* Billing info */}
              {isAnnual && (
                <p className="text-sm text-gray-500 mb-1">
                  Billed <span className="text-gray-700 font-medium">${plan.annualPrice * 12}/year</span>
                  <span className="line-through ml-2 text-gray-400">${plan.monthlyPrice * 12}</span>
                </p>
              )}
              <p className="text-sm text-gray-500 mb-6">
                {plan.drivers}
                {plan.extraDriver && <span className="block text-xs mt-0.5">{plan.extraDriver}</span>}
              </p>

              {/* Divider */}
              <div className="h-px bg-gray-200 mb-6" />

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-gray-600">
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
                    : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.hasTrial === false ? 'Get Started' : 'Start Free Trial'}
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-gray-800 text-center mb-4">
            VroomX vs <span className="text-cta-500">The Competition</span>
          </h3>
          <p className="text-gray-600 text-center mb-10">See why fleets are switching to VroomX</p>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
            {/* Table Header */}
            <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-200">
              <div className="p-4 font-bold text-gray-800">Feature</div>
              <div className="p-4 font-bold text-center text-cta-500 bg-cta-50">VroomX</div>
              <div className="p-4 font-bold text-center text-gray-500">Spreadsheets</div>
              <div className="p-4 font-bold text-center text-gray-500">Other Software</div>
            </div>

            {/* Table Body */}
            {comparisonFeatures.map((row, i) => (
              <div key={i} className={`grid grid-cols-4 ${i !== comparisonFeatures.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="p-4 text-sm text-gray-700 font-medium">{row.feature}</div>
                <div className="p-4 flex justify-center items-center bg-cta-50/50">
                  {typeof row.vroomx === 'boolean' ? (
                    row.vroomx ? (
                      <span className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <FiCheck className="w-4 h-4 text-emerald-500" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 bg-red-50 rounded-lg flex items-center justify-center">
                        <FiX className="w-4 h-4 text-red-400" />
                      </span>
                    )
                  ) : (
                    <span className="text-sm font-bold text-cta-500">{row.vroomx}</span>
                  )}
                </div>
                <div className="p-4 flex justify-center items-center">
                  {typeof row.spreadsheets === 'boolean' ? (
                    row.spreadsheets ? (
                      <span className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <FiCheck className="w-4 h-4 text-emerald-500" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 bg-red-50 rounded-lg flex items-center justify-center">
                        <FiX className="w-4 h-4 text-red-400" />
                      </span>
                    )
                  ) : row.spreadsheets === 'limited' ? (
                    <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded">Limited</span>
                  ) : (
                    <span className="text-sm text-gray-500">{row.spreadsheets}</span>
                  )}
                </div>
                <div className="p-4 flex justify-center items-center">
                  {typeof row.other === 'boolean' ? (
                    row.other ? (
                      <span className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <FiCheck className="w-4 h-4 text-emerald-500" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 bg-red-50 rounded-lg flex items-center justify-center">
                        <FiX className="w-4 h-4 text-red-400" />
                      </span>
                    )
                  ) : row.other === 'limited' ? (
                    <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded">Limited</span>
                  ) : (
                    <span className="text-sm text-gray-500">{row.other}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">*Spreadsheets require significant time investment and manual maintenance</p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

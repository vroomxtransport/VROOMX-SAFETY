import { Link } from 'react-router-dom';
import { FiCheck, FiX } from 'react-icons/fi';
import useInView from '../../hooks/useInView';

const PricingSection = ({ isAnnual, setIsAnnual, pricingPlans, comparisonFeatures }) => {
  const [headerRef, headerInView] = useInView({ threshold: 0.3 });
  const [cardsRef, cardsInView] = useInView({ threshold: 0.1 });

  return (
    <section id="pricing" className="py-24 px-6 md:px-16 relative z-10 bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div
          ref={headerRef}
          className={`text-center max-w-3xl mx-auto mb-12 transition-all duration-700 ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-white mb-4">
            Choose Your <span className="text-cta-500">Plan</span>
          </h2>
          <p className="text-lg text-zinc-400 mb-10">
            No hidden fees. No long contracts. Cancel anytime.
          </p>

          {/* Toggle Pills */}
          <div className="inline-flex items-center gap-2 p-1.5 bg-white/5 rounded-full">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-3 rounded-full font-semibold text-sm transition-all ${
                !isAnnual
                  ? 'bg-cta-500 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-3 rounded-full font-semibold text-sm transition-all flex items-center gap-2 ${
                isAnnual
                  ? 'bg-cta-500 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Annual
              <span className="text-emerald-400 text-xs font-bold">Save 20%</span>
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
                  ? 'bg-gradient-to-br from-cta-500/15 to-cta-500/5 border border-cta-500/40 scale-105 z-10 shadow-2xl shadow-black/50'
                  : 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-cta-500/30 hover:shadow-2xl hover:shadow-black/40'
              } ${cardsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: cardsInView ? `${i * 150}ms` : '0ms' }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-cta-500 to-cta-600 px-5 py-1.5 rounded-b-xl text-xs font-bold text-white uppercase tracking-wider shadow-lg shadow-cta-500/40">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Name */}
              <div className="mb-2">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              </div>
              <p className="text-sm text-zinc-500 mb-6">{plan.subtitle}</p>

              {/* Price */}
              <div className="mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl text-cta-500 font-bold">$</span>
                  <span className="text-5xl font-extrabold text-white leading-none">
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-zinc-500 ml-1">/month</span>
                </div>
              </div>

              {/* Billing info */}
              {isAnnual && (
                <p className="text-sm text-zinc-500 mb-1">
                  Billed <span className="text-zinc-300">${plan.annualPrice * 12}/year</span>
                  <span className="line-through ml-2 text-zinc-600">${plan.monthlyPrice * 12}</span>
                </p>
              )}
              <p className="text-sm text-zinc-500 mb-6">
                {plan.drivers}
                {plan.extraDriver && <span className="block text-xs mt-0.5">{plan.extraDriver}</span>}
              </p>

              {/* Divider */}
              <div className="h-px bg-white/10 mb-6" />

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-zinc-300">
                    <FiCheck className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                to={`/register${plan.hasTrial === false ? '?plan=solo' : ''}`}
                className={`w-full py-4 rounded-xl font-bold text-center block transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-cta-500 to-cta-600 hover:shadow-lg hover:shadow-cta-500/40 hover:scale-[1.02] text-white'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
              >
                {plan.hasTrial === false ? 'Get Started' : 'Start Free Trial'}
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-white text-center mb-4">
            VroomX vs <span className="text-cta-500">The Competition</span>
          </h3>
          <p className="text-zinc-400 text-center mb-10">See why fleets are switching to VroomX</p>

          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-4 bg-white/[0.02] border-b border-white/[0.08]">
              <div className="p-4 font-bold text-white">Feature</div>
              <div className="p-4 font-bold text-center text-cta-500 bg-cta-500/10">VroomX</div>
              <div className="p-4 font-bold text-center text-zinc-400">Spreadsheets</div>
              <div className="p-4 font-bold text-center text-zinc-400">Other Software</div>
            </div>

            {/* Table Body */}
            {comparisonFeatures.map((row, i) => (
              <div key={i} className={`grid grid-cols-4 ${i !== comparisonFeatures.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>
                <div className="p-4 text-sm text-zinc-300 font-medium">{row.feature}</div>
                <div className="p-4 flex justify-center items-center bg-cta-500/5">
                  {typeof row.vroomx === 'boolean' ? (
                    row.vroomx ? (
                      <FiCheck className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <FiX className="w-5 h-5 text-red-400" />
                    )
                  ) : (
                    <span className="text-sm font-bold text-cta-500">{row.vroomx}</span>
                  )}
                </div>
                <div className="p-4 flex justify-center items-center">
                  {typeof row.spreadsheets === 'boolean' ? (
                    row.spreadsheets ? (
                      <FiCheck className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <FiX className="w-5 h-5 text-red-400" />
                    )
                  ) : row.spreadsheets === 'limited' ? (
                    <span className="text-xs text-amber-400 font-medium">Limited</span>
                  ) : (
                    <span className="text-sm text-zinc-500">{row.spreadsheets}</span>
                  )}
                </div>
                <div className="p-4 flex justify-center items-center">
                  {typeof row.other === 'boolean' ? (
                    row.other ? (
                      <FiCheck className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <FiX className="w-5 h-5 text-red-400" />
                    )
                  ) : row.other === 'limited' ? (
                    <span className="text-xs text-amber-400 font-medium">Limited</span>
                  ) : (
                    <span className="text-sm text-zinc-500">{row.other}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-zinc-600 mt-4">*Spreadsheets require significant time investment and manual maintenance</p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

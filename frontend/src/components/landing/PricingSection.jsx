import { Link } from 'react-router-dom';
import { FiCheck, FiX } from 'react-icons/fi';

const PricingSection = ({ isAnnual, setIsAnnual, pricingPlans, comparisonFeatures }) => {
  return (
    <section id="pricing" className="py-24 px-6 md:px-16 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary-500 mb-4">
            Simple, Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-500 to-cta-600">Pricing</span>
          </h2>
          <p className="text-lg text-[#475569] mb-8">
            No hidden fees. No long contracts. Cancel anytime.
          </p>

          {/* Pricing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-primary-500' : 'text-[#94A3B8]'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? 'bg-cta-500' : 'bg-[#E2E8F0]'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${isAnnual ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-primary-500' : 'text-[#94A3B8]'}`}>
              Annual <span className="text-cta-500 font-bold">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pricingPlans.map((plan, i) => (
            <div
              key={i}
              className={`relative p-8 rounded-3xl overflow-hidden transition-all ${
                plan.popular
                  ? 'bg-primary-500 text-white shadow-xl shadow-primary-500/20 scale-105 z-10'
                  : 'bg-white border border-[#E2E8F0] hover:border-primary-500/30 hover:shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-cta-500 px-4 py-1 rounded-bl-xl text-xs font-bold text-white uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-bold mb-1 ${plan.popular ? 'text-white' : 'text-primary-500'}`}>{plan.name}</h3>
                <p className={`text-sm ${plan.popular ? 'text-white/70' : 'text-[#475569]'}`}>{plan.subtitle}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className={`text-5xl font-black tracking-tight ${plan.popular ? 'text-white' : 'text-primary-500'}`}>
                    ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className={plan.popular ? 'text-white/70' : 'text-[#475569]'}>/mo</span>
                </div>
                {isAnnual && (
                  <p className={`text-sm mt-1 ${plan.popular ? 'text-white/70' : 'text-[#475569]'}`}>
                    Billed <span className="font-semibold">${plan.annualPrice * 12}/year</span>
                    <span className={`line-through ml-2 ${plan.popular ? 'text-white/40' : 'text-[#94A3B8]'}`}>
                      ${plan.monthlyPrice * 12}
                    </span>
                  </p>
                )}
                <p className={`text-sm mt-1 ${plan.popular ? 'text-white/60' : 'text-[#94A3B8]'}`}>
                  {plan.drivers}
                  {plan.extraDriver && <span className="block">{plan.extraDriver}</span>}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className={`flex items-center gap-3 text-sm ${plan.popular ? 'text-white/90' : 'text-[#475569]'}`}>
                    <FiCheck className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-cta-400' : 'text-success-500'}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                to={`/register${plan.hasTrial === false ? '?plan=solo' : ''}`}
                className={`w-full py-4 rounded-xl font-bold text-center block transition-all hover:scale-[1.02] ${
                  plan.popular
                    ? 'bg-cta-500 hover:bg-cta-600 text-white shadow-lg shadow-cta-500/30'
                    : 'btn-glow text-white'
                }`}
              >
                {plan.hasTrial === false ? 'Register Now' : 'Start 3-Day Free Trial'}
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-primary-500 text-center mb-4">
            VroomX vs The Competition
          </h3>
          <p className="text-[#475569] text-center mb-10">See why fleets are switching to VroomX</p>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-lg">
            {/* Table Header */}
            <div className="grid grid-cols-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <div className="p-4 font-bold text-primary-500">Feature</div>
              <div className="p-4 font-bold text-center text-cta-500 bg-cta-50">VroomX</div>
              <div className="p-4 font-bold text-center text-[#475569]">Spreadsheets</div>
              <div className="p-4 font-bold text-center text-[#475569]">Other Software</div>
            </div>

            {/* Table Body */}
            {comparisonFeatures.map((row, i) => (
              <div key={i} className={`grid grid-cols-4 ${i !== comparisonFeatures.length - 1 ? 'border-b border-[#E2E8F0]' : ''}`}>
                <div className="p-4 text-sm text-[#1E293B] font-medium">{row.feature}</div>
                <div className="p-4 flex justify-center items-center bg-cta-50/50">
                  {typeof row.vroomx === 'boolean' ? (
                    row.vroomx ? (
                      <FiCheck className="w-5 h-5 text-success-500" />
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
                      <FiCheck className="w-5 h-5 text-success-500" />
                    ) : (
                      <FiX className="w-5 h-5 text-red-400" />
                    )
                  ) : row.spreadsheets === 'limited' ? (
                    <span className="text-xs text-amber-500 font-medium">Limited</span>
                  ) : (
                    <span className="text-sm text-[#475569]">{row.spreadsheets}</span>
                  )}
                </div>
                <div className="p-4 flex justify-center items-center">
                  {typeof row.other === 'boolean' ? (
                    row.other ? (
                      <FiCheck className="w-5 h-5 text-success-500" />
                    ) : (
                      <FiX className="w-5 h-5 text-red-400" />
                    )
                  ) : row.other === 'limited' ? (
                    <span className="text-xs text-amber-500 font-medium">Limited</span>
                  ) : (
                    <span className="text-sm text-[#475569]">{row.other}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-[#94A3B8] mt-4">*Spreadsheets require significant time investment and manual maintenance</p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

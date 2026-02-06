import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCheck, FiChevronDown, FiArrowRight, FiShield, FiClock,
  FiLock, FiHeadphones, FiZap, FiTruck
} from 'react-icons/fi';
import PublicHeader from '../components/PublicHeader';
import { FooterSection } from '../components/landing';
import { pricingPlans } from '../data/landingData';

// FAQ data specific to billing/pricing
const pricingFAQ = [
  {
    question: "How does the free trial work?",
    answer: "Start with a 3-day free trial on Fleet or Pro plans—no credit card required. You get full access to all features. If you love it, add your payment method to continue. If not, your account pauses automatically with no charges."
  },
  {
    question: "Can I change plans later?",
    answer: "Absolutely! Upgrade anytime and get immediate access to new features. When upgrading mid-cycle, you'll pay the prorated difference. Downgrade requests take effect at your next billing cycle—no partial refunds, but you keep access until then."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure Stripe payment processor. All transactions are encrypted with 256-bit SSL."
  },
  {
    question: "How does per-driver pricing work?",
    answer: "Each plan includes a set number of drivers. Solo includes 1, Fleet includes 3 (+$6/driver after), and Pro includes 10 (+$5/driver after). Add or remove drivers anytime from your dashboard—billing adjusts automatically."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, cancel anytime with no penalties or hidden fees. Your access continues until the end of your current billing period. We don't believe in locking customers in—if we're not delivering value, you shouldn't pay."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a full refund within the first 14 days if you're not satisfied. After that, we don't provide partial refunds for unused time, but you can cancel to prevent future charges."
  },
  {
    question: "Is there a contract or commitment?",
    answer: "No contracts, no commitments. All plans are month-to-month (or annual if you choose). Annual plans offer 20% savings but can still be canceled—you just won't get a refund for the remaining months."
  },
  {
    question: "What happens if I exceed my driver limit?",
    answer: "We'll notify you when you're approaching your limit. You can either upgrade to a higher plan or pay the per-driver rate. We never cut off access—we'll work with you to find the best solution."
  }
];

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Force light mode on public pricing page (prevents invisible text when OS is in dark mode)
  useEffect(() => {
    const wasDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');
    return () => {
      if (wasDark) {
        document.documentElement.classList.add('dark');
      }
    };
  }, []);

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      {/* Fixed Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.04]" />
      </div>

      {/* Navigation */}
      <PublicHeader activePage="pricing" />

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-16 px-6 md:px-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cta-500/10 border border-cta-500/20 mb-8">
            <FiZap className="w-4 h-4 text-cta-500" />
            <span className="text-sm font-semibold text-cta-600">Simple, Transparent Pricing</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-heading font-black text-primary-500 mb-6 tracking-tight">
            One Price. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-500 to-cta-600">Zero Surprises.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            No hidden fees. No long contracts. No per-feature upsells.
            Just straightforward pricing that scales with your fleet.
          </p>

          {/* Toggle Pills */}
          <div className="inline-flex items-center gap-1.5 p-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(0,0,0,0.06)]">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                !isAnnual
                  ? 'bg-gradient-to-br from-cta-500 to-cta-600 text-white shadow-lg shadow-cta-500/30'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-3 ${
                isAnnual
                  ? 'bg-gradient-to-br from-cta-500 to-cta-600 text-white shadow-lg shadow-cta-500/30'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Annual
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                isAnnual ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'
              }`}>
                -20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative z-10 pb-24 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`relative p-8 lg:p-10 rounded-3xl transition-all duration-500 hover:-translate-y-2 ${
                  plan.popular
                    ? 'bg-white border-2 border-cta-500 scale-[1.02] md:scale-105 z-10 shadow-2xl shadow-cta-500/20'
                    : 'bg-white/90 backdrop-blur-xl border border-gray-200 hover:border-cta-500/40 hover:shadow-xl'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-cta-500 to-cta-600 px-6 py-2 rounded-full text-xs font-black text-white uppercase tracking-wider shadow-lg shadow-cta-500/40 flex items-center gap-2">
                      <FiTruck className="w-3.5 h-3.5" />
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-primary-500">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.subtitle}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-cta-500">$</span>
                    <span className="text-6xl font-black text-primary-500 leading-none tracking-tight">
                      {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-gray-500 ml-1 text-lg">/mo</span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-gray-500 mt-2">
                      Billed <span className="font-semibold text-gray-700">${plan.annualPrice * 12}/year</span>
                      <span className="line-through text-gray-400 ml-2">${plan.monthlyPrice * 12}</span>
                    </p>
                  )}
                </div>

                {/* Drivers Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="font-bold text-gray-800">{plan.drivers}</p>
                  {plan.extraDriver && (
                    <p className="text-sm text-gray-500 mt-1">{plan.extraDriver}</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FiCheck className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  to={`/register?plan=${plan.name.toLowerCase()}`}
                  className={`w-full py-4 rounded-xl font-bold text-center block transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-cta-500 to-cta-600 hover:from-cta-600 hover:to-cta-700 text-white shadow-lg shadow-cta-500/30 hover:shadow-xl hover:shadow-cta-500/40 hover:scale-[1.02]'
                      : 'bg-primary-500 hover:bg-primary-600 text-white hover:shadow-lg'
                  }`}
                >
                  {plan.hasTrial === false ? 'Get Started' : 'Start Free Trial'}
                </Link>

                {plan.hasTrial && (
                  <p className="text-xs text-center text-gray-500 mt-3">
                    3-day free trial • No credit card required
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="relative z-10 py-16 px-6 md:px-16 bg-primary-500">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-2">
              Trusted by <span className="text-cta-400">500+</span> Fleets Nationwide
            </h2>
            <p className="text-white/70">Enterprise-grade security and reliability</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { Icon: FiShield, title: 'FMCSA Compliant', desc: 'Built for 49 CFR', color: 'emerald' },
              { Icon: FiLock, title: 'SSL Secured', desc: '256-bit encryption', color: 'blue' },
              { Icon: FiClock, title: '99.9% Uptime', desc: 'Enterprise SLA', color: 'amber' },
              { Icon: FiHeadphones, title: 'US Support', desc: 'Real humans, fast', color: 'purple' }
            ].map((badge, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/15 transition-all">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                  badge.color === 'emerald' ? 'bg-emerald-500/20' :
                  badge.color === 'blue' ? 'bg-blue-500/20' :
                  badge.color === 'amber' ? 'bg-amber-500/20' :
                  'bg-purple-500/20'
                }`}>
                  <badge.Icon className={`w-7 h-7 ${
                    badge.color === 'emerald' ? 'text-emerald-400' :
                    badge.color === 'blue' ? 'text-blue-400' :
                    badge.color === 'amber' ? 'text-amber-400' :
                    'text-purple-400'
                  }`} />
                </div>
                <h3 className="font-bold text-white mb-1">{badge.title}</h3>
                <p className="text-sm text-white/60">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-24 px-6 md:px-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-500/10 text-primary-500 font-mono text-xs uppercase tracking-widest mb-4">
              // FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-black text-primary-500 mb-4">
              Billing <span className="text-cta-500">Questions?</span>
            </h2>
            <p className="text-gray-600">
              Everything you need to know about plans, payments, and subscriptions.
            </p>
          </div>

          <div className="space-y-4">
            {pricingFAQ.map((item, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-cta-500/30 transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-bold text-primary-500 pr-4">{item.question}</span>
                  <FiChevronDown className={`w-5 h-5 text-cta-500 flex-shrink-0 transition-transform duration-300 ${
                    openFaq === i ? 'rotate-180' : ''
                  }`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${
                  openFaq === i ? 'max-h-96' : 'max-h-0'
                }`}>
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 px-6 md:px-16 bg-primary-500 overflow-hidden">

        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl md:text-5xl font-heading font-black text-white mb-6">
            Ready to Simplify <span className="text-cta-400">Compliance?</span>
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto">
            Join hundreds of owner-operators and small fleets who trust VroomX to keep them FMCSA compliant.
          </p>

          <Link
            to="/register"
            className="inline-flex items-center gap-3 bg-cta-500 hover:bg-cta-600 px-10 py-5 rounded-full font-bold text-white text-lg shadow-xl shadow-cta-500/30 transition-all hover:scale-105 hover:shadow-2xl"
          >
            Start Your Free Trial
            <FiArrowRight className="w-5 h-5" />
          </Link>

          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-white/70">
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-cta-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-cta-400" />
              Setup in 10 minutes
            </span>
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-cta-400" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default Pricing;

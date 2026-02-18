import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCheck, FiChevronDown, FiArrowRight, FiShield, FiClock,
  FiLock, FiHeadphones, FiZap, FiUsers, FiX
} from 'react-icons/fi';
import PublicHeader from '../components/PublicHeader';
import { FooterSection } from '../components/landing';
import { pricingPlan } from '../data/landingData';
import useForceLightMode from '../hooks/useForceLightMode';

// FAQ data specific to billing/pricing
const pricingFAQ = [
  {
    question: "How does the free trial work?",
    answer: "Start with a 7-day free trial — no credit card required. You get full access to every feature. If you love it, make a one-time $249 payment for lifetime access. If not, your account pauses automatically with no charges."
  },
  {
    question: "Is this really a one-time payment?",
    answer: "Yes! $249 once and you're in — forever. No monthly fees, no annual renewals, no hidden charges. You get every feature, every update, and unlimited drivers."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure Stripe payment processor. All transactions are encrypted with 256-bit SSL."
  },
  {
    question: "How many drivers can I add?",
    answer: "Unlimited! Your one-time $249 payment includes unlimited drivers. No per-driver fees, no tier limits. Whether you have 1 truck or 50, the price is the same."
  },
  {
    question: "Can I cancel my trial anytime?",
    answer: "Yes, cancel your free trial anytime with no penalties or charges. If you've already paid the one-time $249, you keep lifetime access — there's nothing to cancel."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a full refund within the first 14 days of payment if you're not satisfied. But with a 7-day free trial first, you'll know if VroomX is right for you before paying anything."
  },
  {
    question: "Is there a contract or commitment?",
    answer: "No contracts, no commitments. Try free for 7 days. If you want to continue, pay $249 once. That's it. No fine print, no recurring charges."
  },
  {
    question: "What's included in the $249?",
    answer: "Everything: unlimited drivers, full DQF management, AI regulation assistant, CSA score tracking, document expiry alerts, DataQ AI analysis, custom reports, priority email support, and all future updates."
  }
];

const Pricing = () => {
  useForceLightMode();

  const [openFaq, setOpenFaq] = useState(null);

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
            One Price. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-500 to-cta-600">Lifetime Access.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            No monthly fees. No per-driver charges. No hidden costs.
            Just one payment for everything you need.
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="relative z-10 pb-24 px-6 md:px-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left — Features */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Everything You Need</h3>
                <p className="text-gray-500">Full-platform access with every feature included.</p>
              </div>

              <ul className="space-y-3.5">
                {pricingPlan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <span className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiCheck className="w-4 h-4 text-emerald-600" strokeWidth={3} />
                    </span>
                    <span className="text-[15px] font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Competitor note */}
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

            {/* Right — Price Card */}
            <div className="relative">
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

                {/* CTA */}
                <Link
                  to="/register"
                  className="w-full py-4 rounded-xl font-bold text-center block bg-gradient-to-r from-cta-500 to-cta-600 hover:from-cta-600 hover:to-cta-700 text-white shadow-lg shadow-cta-500/30 hover:shadow-xl hover:scale-[1.02] transition-all text-lg"
                >
                  Start Your 7-Day Free Trial
                </Link>

                {/* Trust */}
                <p className="text-center text-sm text-gray-500 mt-4 font-medium">
                  Pay only if you love it. Full access forever. No recurring fees.
                </p>
              </div>
            </div>
          </div>

          {/* Trust badges row */}
          <div className="mt-12 flex flex-wrap justify-center gap-4 md:gap-8">
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
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-black text-primary-500 mb-4">
              Pricing <span className="text-cta-500">Questions?</span>
            </h2>
            <p className="text-gray-600">
              Everything you need to know about our one-time pricing model.
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
            Start Your 7-Day Free Trial
            <FiArrowRight className="w-5 h-5" />
          </Link>

          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-white/70">
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-cta-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-cta-400" />
              7-day free trial
            </span>
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-cta-400" />
              One-time $249 payment
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

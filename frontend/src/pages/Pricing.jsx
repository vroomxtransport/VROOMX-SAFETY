import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FiCheck, FiChevronDown, FiArrowRight, FiShield, FiClock,
  FiLock, FiHeadphones, FiZap, FiUsers, FiStar
} from 'react-icons/fi';
import PublicHeader from '../components/PublicHeader';
import { FooterSection } from '../components/landing';
import SEO from '../components/SEO';
import useForceLightMode from '../hooks/useForceLightMode';

const pricingFAQ = [
  {
    question: "What's included in the free plan?",
    answer: "The Free plan is free forever — no credit card, no time limit. You get 1 driver, 1 vehicle, 1 company, full document management, expiration alerts, FMCSA data sync, DQF compliance checklist, and basic violation tracking. Perfect for owner-operators who want to stay compliant without spending a dime."
  },
  {
    question: "Can I upgrade later?",
    answer: "Absolutely. Start free and upgrade to Fleet ($79/mo) or Pro ($149/mo) anytime from your account settings. You'll get instant access to AI compliance tools, CSA monitoring, DataQ analytics, and more. Paid plans come with a 7-day free trial."
  },
  {
    question: "Can I change plans anytime?",
    answer: "Yes. Upgrade or downgrade your plan at any time from your account settings. When you switch, we prorate the difference so you only pay for what you use."
  },
  {
    question: "How many drivers can I add?",
    answer: "It depends on your plan. Free includes 1 driver. Fleet starts with 5 drivers. Pro starts with 15 drivers. Need more? Upgrade to the next tier at any time."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure Stripe payment processor. All transactions are encrypted with 256-bit SSL."
  },
  {
    question: "Do you offer annual billing?",
    answer: "Yes! Switch to annual billing and save 25% on paid plans. That's $711/year for Fleet and $1,341/year for Pro."
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes. If you're not satisfied, we offer a full refund within 30 days of your first payment — no questions asked."
  },
  {
    question: "Is there a contract?",
    answer: "No contracts and no commitments. The Free plan is free forever. Paid plans are cancel-anytime. You can pause or cancel your subscription from your account settings whenever you like."
  }
];

const plans = [
  {
    name: 'Free',
    planId: 'free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Everything an owner-operator needs to stay compliant.',
    cta: 'Get Started Free',
    isFree: true,
    popular: false,
    features: [
      '1 Driver, 1 Vehicle, 1 Company',
      'Document Management & Storage',
      'Document Expiration Alerts',
      'FMCSA Data Sync',
      'DQF Compliance Checklist',
      'Basic Violation Tracking',
      'Compliance Reminders',
      'Email Support',
    ],
  },
  {
    name: 'Fleet',
    planId: 'small_fleet',
    monthlyPrice: 79,
    annualPrice: 711,
    description: 'Built for growing fleets that need powerful compliance tools.',
    cta: 'Start 7-Day Free Trial',
    popular: true,
    features: [
      'Everything in Free, plus:',
      'Up to 5 Drivers & Unlimited Vehicles',
      'Up to 3 Companies',
      'AI Compliance Assistant (500 queries/mo)',
      'CSA Score Monitoring',
      'DataQ Challenge Analytics',
      'Drug & Alcohol Management',
      'Multi-User Access & Roles',
      'Priority Support',
    ],
  },
  {
    name: 'Pro',
    planId: 'fleet_pro',
    monthlyPrice: 149,
    annualPrice: 1341,
    description: 'Advanced analytics and tools for established fleet operations.',
    cta: 'Start 7-Day Free Trial',
    popular: false,
    features: [
      'Everything in Fleet, plus:',
      'Up to 15 Drivers & Unlimited Vehicles',
      'Up to 10 Companies',
      'Unlimited AI Queries',
      'Advanced Compliance Analytics',
      'Custom Report Builder',
      'Audit Preparation Tools',
      'Dedicated Account Manager',
      'Phone & Priority Support',
    ],
  },
];

const Pricing = () => {
  useForceLightMode();

  const [openFaq, setOpenFaq] = useState(null);
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      {/* Fixed Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.04]" />
      </div>

      <SEO
        title="Free Trucking Compliance Plan | Fleet Plans from $79/mo"
        description="Start free forever for owner-operators. Fleet plans from $79/mo include AI compliance assistant, CSA monitoring, and DataQ analytics. No credit card required."
        path="/pricing"
        image="/images/og-image.png"
        faqItems={pricingFAQ}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Pricing', url: '/pricing' }
        ]}
      />

      {/* Product structured data for Google rich snippets */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "VroomX Safety",
            "description": "FMCSA compliance management platform for trucking companies",
            "brand": { "@type": "Brand", "name": "VroomX Safety" },
            "offers": plans.map(plan => ({
              "@type": "Offer",
              "name": plan.name,
              "description": plan.description,
              "price": plan.monthlyPrice.toString(),
              "priceCurrency": "USD",
              "url": "https://vroomxsafety.com/pricing",
              "availability": "https://schema.org/InStock",
              "priceValidUntil": "2027-12-31"
            }))
          })}
        </script>
      </Helmet>

      {/* Navigation */}
      <PublicHeader activePage="pricing" />

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-12 px-6 md:px-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cta-500/10 border border-cta-500/20 mb-8">
            <FiZap className="w-4 h-4 text-cta-500" />
            <span className="text-sm font-semibold text-cta-600">Simple, Transparent Pricing</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-heading font-black text-primary-500 mb-6 tracking-tight">
            Plans That Scale <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-500 to-cta-600">With Your Fleet</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Free forever for owner-operators. Upgrade to Fleet or Pro when you're ready to grow.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className={`text-sm font-semibold transition-colors ${!isAnnual ? 'text-primary-500' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-cta-500/50 ${
                isAnnual ? 'bg-cta-500' : 'bg-gray-300'
              }`}
              aria-label="Toggle annual billing"
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  isAnnual ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-semibold transition-colors ${isAnnual ? 'text-primary-500' : 'text-gray-400'}`}>
              Annual
            </span>
            {isAnnual && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Save 25%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative z-10 pb-24 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {plans.map((plan) => {
              const displayPrice = plan.isFree ? 0 : (isAnnual ? plan.annualPrice : plan.monthlyPrice);
              const period = plan.isFree ? '/forever' : (isAnnual ? '/yr' : '/mo');

              return (
                <div key={plan.name} className="relative">
                  {/* Glow behind popular card */}
                  {plan.popular && (
                    <div className="absolute -inset-2 bg-gradient-to-r from-cta-500/20 via-primary-500/10 to-cta-500/20 rounded-3xl blur-2xl opacity-60" />
                  )}

                  <div
                    className={`relative bg-white rounded-3xl p-8 shadow-xl transition-all hover:shadow-2xl ${
                      plan.popular
                        ? 'border-2 border-cta-500 shadow-cta-500/10'
                        : 'border border-gray-200'
                    }`}
                  >
                    {/* MOST POPULAR badge */}
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <div className="bg-gradient-to-r from-cta-500 to-cta-600 px-6 py-2 rounded-full text-xs font-black text-white uppercase tracking-wider shadow-lg shadow-cta-500/40 flex items-center gap-1.5">
                          <FiStar className="w-3 h-3" />
                          Most Popular
                        </div>
                      </div>
                    )}

                    {/* Plan Name */}
                    <div className={plan.popular ? 'mt-4' : ''}>
                      <h3 className="text-xl font-bold text-primary-500 mb-1">{plan.name}</h3>
                      <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-cta-500">$</span>
                        <span className="text-5xl font-black text-gray-800 leading-none tracking-tight">
                          {displayPrice.toLocaleString()}
                        </span>
                        <span className="text-gray-400 font-medium ml-1">{period}</span>
                      </div>
                      {!plan.isFree && isAnnual && (
                        <p className="text-sm text-emerald-600 font-medium mt-1">
                          ${plan.monthlyPrice}/mo billed monthly
                        </p>
                      )}
                    </div>

                    {/* Trial pill / Free pill */}
                    <div className="flex mb-6">
                      {plan.isFree ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="text-sm font-bold text-blue-700">Free Forever</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-sm font-bold text-emerald-700">7-Day Free Trial</span>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <Link
                      to={`/register?plan=${plan.planId}`}
                      className={`w-full py-4 rounded-xl font-bold text-center block transition-all text-lg ${
                        plan.popular
                          ? 'bg-gradient-to-r from-cta-500 to-cta-600 hover:from-cta-600 hover:to-cta-700 text-white shadow-lg shadow-cta-500/30 hover:shadow-xl hover:scale-[1.02]'
                          : 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:scale-[1.02]'
                      }`}
                    >
                      {plan.cta}
                    </Link>

                    <p className="text-center text-xs text-gray-400 mt-3">No credit card required</p>

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-6" />

                    {/* Feature List */}
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-700">
                          <span className="w-5 h-5 bg-emerald-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FiCheck className="w-3 h-3 text-emerald-600" strokeWidth={3} />
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

          {/* Trust badges row */}
          <div className="mt-12 flex flex-wrap justify-center gap-4 md:gap-8">
            {[
              { icon: FiShield, iconClass: 'text-emerald-500', text: '7-day free trial', bgClass: 'bg-emerald-50' },
              { icon: FiUsers, iconClass: 'text-primary-500', text: 'No contracts', bgClass: 'bg-primary-50' },
              { icon: FiZap, iconClass: 'text-cta-500', text: 'Cancel anytime', bgClass: 'bg-cta-50' },
              { icon: FiLock, iconClass: 'text-blue-500', text: '30-day money-back guarantee', bgClass: 'bg-blue-50' },
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
              Built for Compliance
            </h2>
            <p className="text-white/70">Your data protected with AES-256 encryption at rest and TLS in transit</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { Icon: FiShield, title: 'FMCSA Compliant', desc: 'Built for 49 CFR', color: 'emerald' },
              { Icon: FiLock, title: 'SSL Secured', desc: '256-bit encryption', color: 'blue' },
              { Icon: FiClock, title: 'Always Available', desc: 'Reliable cloud hosting', color: 'amber' },
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
              Everything you need to know about our plans and billing.
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
            Stop worrying about compliance. Start running your business.
          </p>

          <Link
            to="/register?plan=free"
            className="inline-flex items-center gap-3 bg-cta-500 hover:bg-cta-600 px-10 py-5 rounded-full font-bold text-white text-lg shadow-xl shadow-cta-500/30 transition-all hover:scale-105 hover:shadow-2xl"
          >
            Get Started Free
            <FiArrowRight className="w-5 h-5" />
          </Link>

          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-white/70">
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-cta-400" />
              Free forever for 1 driver
            </span>
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-cta-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-cta-400" />
              Upgrade anytime
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

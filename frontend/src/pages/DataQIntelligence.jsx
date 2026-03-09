import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiShield, FiZap, FiFileText, FiTarget, FiCheckCircle,
  FiTrendingDown, FiChevronDown, FiArrowRight, FiBarChart2, FiClock
} from 'react-icons/fi';
import PublicHeader from '../components/PublicHeader';
import { FooterSection } from '../components/landing';
import SEO from '../components/SEO';
import useForceLightMode from '../hooks/useForceLightMode';

// FAQ data for SEO
const faqData = [
  {
    question: 'What is the FMCSA DataQ process?',
    answer: 'DataQs (Data Quality) is an FMCSA system that allows motor carriers, drivers, and others to request a review of federal and state data issued by FMCSA. You can challenge crashes, inspections, and violations that contain errors or were conducted improperly.'
  },
  {
    question: 'How long does a DataQ challenge take?',
    answer: 'The typical DataQ review process takes 60-90 days. The state that issued the original record reviews your challenge and supporting evidence before making a determination. Complex cases involving multiple violations may take longer.'
  },
  {
    question: 'What types of violations can be challenged through DataQ?',
    answer: 'You can challenge violations that contain factual errors (wrong vehicle, wrong driver), procedural issues (improper inspection process), or where you have documentation proving compliance at the time of inspection. Common challenges include HOS violations with ELD records, vehicle maintenance violations with repair receipts, and driver qualification violations with valid documentation.'
  },
  {
    question: 'How does VroomX calculate the Challenge Score?',
    answer: 'The Challenge Score (1-10) is based on multiple factors including violation age, severity weight, out-of-service status, available documentation, and court outcomes. Older violations with lower severity and strong documentation score higher because they are historically more likely to be successfully challenged.'
  },
  {
    question: 'Will a successful DataQ challenge improve my CSA scores?',
    answer: 'Yes. When a DataQ challenge is accepted, the violation is removed from your FMCSA record. This reduces the severity points in the affected BASIC category, which can lower your percentile ranking. The impact depends on the violation severity weight and how recently it occurred — newer, higher-severity violations have the biggest impact when removed.'
  }
];

// How it works steps
const steps = [
  {
    number: '01',
    icon: FiBarChart2,
    title: 'AI Scans Your Violations',
    description: 'Our system analyzes every violation on your FMCSA record, evaluating age, severity, documentation, and historical challenge success rates for similar violations.'
  },
  {
    number: '02',
    icon: FiTarget,
    title: 'Challenge Score Assigned',
    description: 'Each violation gets a Challenge Score from 1-10. High scores mean strong supporting evidence or common challenge-success patterns. You see exactly which violations are worth fighting.'
  },
  {
    number: '03',
    icon: FiTrendingDown,
    title: 'CSA Impact Estimated',
    description: 'For every challengeable violation, we estimate how many CSA percentile points you could recover. Focus your efforts on the violations hurting your scores the most.'
  },
  {
    number: '04',
    icon: FiFileText,
    title: 'AI Generates Your Petition',
    description: 'One click generates a complete DataQ petition letter citing the relevant CFR sections, your supporting evidence, and proven challenge arguments — ready to submit to FMCSA.'
  }
];

// Benefits
const benefits = [
  {
    icon: FiZap,
    title: 'AI-Powered Analysis',
    description: 'Every violation is scored using data-driven rules that evaluate challenge likelihood based on violation type, age, severity, and documentation.',
  },
  {
    icon: FiTrendingDown,
    title: 'CSA Impact Estimates',
    description: 'See exactly how many percentile points each violation costs you — and how much you stand to gain from a successful challenge.',
  },
  {
    icon: FiFileText,
    title: 'One-Click Petition Letters',
    description: 'Generate professional DataQ challenge letters that cite CFR sections, reference your evidence, and follow proven challenge templates.',
  },
  {
    icon: FiShield,
    title: 'Priority Ranking',
    description: 'Violations are ranked by impact so you focus on the challenges that will improve your safety rating the most.',
  },
];

// FAQ item component
const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className={`border-b border-[#E2E8F0] last:border-b-0 transition-all duration-300 ${isOpen ? 'bg-primary-50/30' : ''}`}>
    <button
      onClick={onClick}
      className="w-full px-6 py-5 flex items-center justify-between text-left group"
    >
      <span className={`font-semibold transition-colors ${isOpen ? 'text-primary-600' : 'text-[#1E293B] group-hover:text-primary-600'}`}>
        {question}
      </span>
      <FiChevronDown
        className={`w-5 h-5 text-[#64748B] transition-transform duration-300 flex-shrink-0 ml-4 ${isOpen ? 'rotate-180 text-primary-600' : ''}`}
      />
    </button>
    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-48 pb-5' : 'max-h-0'}`}>
      <p className="px-6 text-[#64748B] leading-relaxed">{answer}</p>
    </div>
  </div>
);

const DataQIntelligence = () => {
  useForceLightMode();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      {/* Background elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/8 blur-[150px] rounded-full animate-blob" />
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-cta-500/6 blur-[120px] rounded-full animate-blob" style={{ animationDelay: '2s' }} />
      </div>

      <SEO
        title="DataQ Challenge Intelligence | Fight Unfair FMCSA Violations"
        description="Use AI-powered DataQ analysis to identify challengeable violations, estimate CSA score impact, and generate petition letters. Improve your safety rating by fighting unfair violations."
        path="/dataq"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'DataQ Challenge Intelligence', url: '/dataq' }
        ]}
        faqItems={faqData}
      />

      <PublicHeader activePage="dataq" />

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cta-500/10 border border-cta-500/20 mb-8">
            <FiZap className="w-4 h-4 text-cta-600" />
            <span className="text-sm font-semibold text-cta-700">AI-Powered DataQ Challenges</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-[#0F172A] font-heading mb-6">
            Fight Unfair Violations with{' '}
            <span className="text-primary-500">AI-Powered</span>{' '}
            DataQ Challenges
          </h1>

          <p className="text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto mb-10 leading-relaxed">
            Every violation on your FMCSA record costs you CSA points, higher insurance premiums, and lost contracts.
            VroomX identifies which violations you can challenge — and helps you win.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/csa-checker"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-cta-500 hover:bg-cta-600 text-white font-semibold text-lg shadow-lg shadow-cta-500/25 hover:shadow-xl hover:shadow-cta-500/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              Check Your Violations Free
              <FiArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-[#CBD5E1] hover:border-primary-400 text-[#334155] hover:text-primary-600 font-semibold text-lg transition-all duration-300"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* What is DataQ Section */}
      <section className="relative z-10 py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-[#0F172A] font-heading mb-4">
              What is the FMCSA DataQ Process?
            </h2>
            <p className="text-lg text-[#64748B] max-w-3xl mx-auto leading-relaxed">
              DataQs is FMCSA's official system for requesting a review of safety data. If an inspection or violation contains errors,
              was conducted improperly, or you have documentation proving compliance, you have the right to challenge it.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
                <FiTarget className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">The Problem</h3>
              <p className="text-[#64748B] leading-relaxed">
                Violations stay on your record for 24 months. Each one adds severity points to your CSA percentile,
                potentially triggering audits, raising insurance, and costing you loads.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
                <FiFileText className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">The Process</h3>
              <p className="text-[#64748B] leading-relaxed">
                Through FMCSA's DataQs system, you submit a Request for Data Review (RDR) with supporting evidence.
                The issuing state reviews your challenge within 60-90 days.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">The Result</h3>
              <p className="text-[#64748B] leading-relaxed">
                If accepted, the violation is removed from your FMCSA record. Your CSA percentile drops,
                your safety profile improves, and you become more competitive for freight.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How VroomX Helps Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-[#0F172A] font-heading mb-4">
              How VroomX Helps You Win DataQ Challenges
            </h2>
            <p className="text-lg text-[#64748B] max-w-3xl mx-auto">
              Our AI analyzes your entire violation history and identifies the best opportunities to challenge — then generates the petition for you.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4 p-6 rounded-xl bg-white border border-[#E2E8F0] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{step.number}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                    <step.icon className="w-5 h-5 text-primary-500" />
                    {step.title}
                  </h3>
                  <p className="text-[#64748B] leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="p-5 rounded-xl bg-white border border-[#E2E8F0] text-center hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center mx-auto mb-3">
                  <benefit.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h4 className="font-bold text-[#0F172A] mb-2">{benefit.title}</h4>
                <p className="text-sm text-[#64748B] leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Challenge Score Section */}
      <section className="relative z-10 py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[#0F172A] font-heading mb-4">
              Understanding the Challenge Score
            </h2>
            <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
              Each violation is scored 1-10 based on factors that predict challenge success.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* High score */}
            <div className="p-6 rounded-xl border-2 border-green-200 bg-green-50/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-green-600">8-10</span>
                </div>
                <div>
                  <p className="font-bold text-green-700">High Chance</p>
                  <p className="text-xs text-green-600">Strong challenge candidate</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Court dismissed or not guilty
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Strong supporting documentation
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Low severity weight
                </li>
              </ul>
            </div>

            {/* Medium score */}
            <div className="p-6 rounded-xl border-2 border-amber-200 bg-amber-50/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-amber-600">5-7</span>
                </div>
                <div>
                  <p className="font-bold text-amber-700">Moderate</p>
                  <p className="text-xs text-amber-600">Worth evaluating</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li className="flex items-start gap-2">
                  <FiClock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  Violation older than 12 months
                </li>
                <li className="flex items-start gap-2">
                  <FiClock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  Moderate severity weight
                </li>
                <li className="flex items-start gap-2">
                  <FiClock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  Some documentation available
                </li>
              </ul>
            </div>

            {/* Low score */}
            <div className="p-6 rounded-xl border-2 border-red-200 bg-red-50/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-red-600">1-4</span>
                </div>
                <div>
                  <p className="font-bold text-red-700">Low Chance</p>
                  <p className="text-xs text-red-600">Difficult to overturn</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li className="flex items-start gap-2">
                  <FiTarget className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  High severity or OOS violation
                </li>
                <li className="flex items-start gap-2">
                  <FiTarget className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  Recent violation (under 6 months)
                </li>
                <li className="flex items-start gap-2">
                  <FiTarget className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  No supporting documents
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-2xl shadow-primary-500/25">
            <FiShield className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-black mb-4 font-heading">
              Stop Paying for Violations You Can Fight
            </h2>
            <p className="text-lg text-primary-100 mb-8 max-w-xl mx-auto">
              The average carrier has 2-3 violations eligible for DataQ challenge. Each successful challenge can reduce your CSA percentile by 3-8 points.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/csa-checker"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-primary-700 font-semibold text-lg hover:bg-primary-50 transition-all duration-300 hover:-translate-y-0.5 shadow-lg"
              >
                Check Your Violations Free
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold text-lg hover:bg-white/10 transition-all duration-300"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[#0F172A] font-heading mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-[#64748B]">
              Everything you need to know about the DataQ challenge process
            </p>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white">
            {faqData.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default DataQIntelligence;

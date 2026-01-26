import { useState } from 'react';
import {
  LuBot, LuBarChart3, LuFolderOpen, LuFileText, LuBellRing,
  LuSparkles, LuTrendingUp, LuCheck, LuArrowRight, LuUser,
  LuCreditCard, LuStethoscope, LuFileCheck, LuAlertTriangle, LuCheckCircle,
  LuFileCheck2
} from 'react-icons/lu';
import useInView from '../../hooks/useInView';

const FeaturesSection = () => {
  const [activeTab, setActiveTab] = useState(2);
  const [headerRef, headerInView] = useInView({ threshold: 0.2 });
  const [tabsRef, tabsInView] = useInView({ threshold: 0.2 });
  const [cardRef, cardInView] = useInView({ threshold: 0.1 });

  const features = [
    {
      id: 0,
      icon: LuBot,
      title: 'AI Assistant',
      label: 'AI',
      accent: 'coral',
      category: { icon: LuSparkles, text: 'AI-Powered', color: 'text-purple-500' },
      heading: 'AI Regulation Assistant',
      description: "Ask any FMCSA regulation question and get instant, accurate answers. Like having a compliance expert on call 24/7.",
      bullets: ['Instant answers', 'Always up-to-date', 'Plain English', '24/7 available'],
      cta: 'Try It Free',
      mockup: 'chat'
    },
    {
      id: 1,
      icon: LuBarChart3,
      title: 'CSA Tracking',
      accent: 'navy',
      category: { icon: LuTrendingUp, text: 'Analytics', color: 'text-[#1E3A5F]' },
      heading: 'CSA Score Tracking',
      description: "Monitor your CSA scores across all 7 BASICs in real-time. Get actionable recommendations to improve your safety rating.",
      bullets: ['All 7 BASICs', 'Historical trends', 'Score alerts', 'AI recommendations'],
      cta: 'Check Your Score',
      mockup: 'chart'
    },
    {
      id: 2,
      icon: LuFolderOpen,
      title: 'DQF Files',
      accent: 'mint',
      category: { icon: LuFolderOpen, text: 'Document Management', color: 'text-emerald-500' },
      heading: 'DQF Management',
      description: "Store, organize, and track all Driver Qualification Files in one secure place with automatic expiration tracking.",
      bullets: ['Secure cloud storage', 'Auto expiration alerts', 'One-click reports', 'Audit-ready'],
      cta: 'Upload Documents',
      mockup: 'files'
    },
    {
      id: 3,
      icon: LuFileText,
      title: 'DataQ',
      label: 'AI',
      accent: 'purple',
      category: { icon: LuSparkles, text: 'AI-Powered', color: 'text-purple-500' },
      heading: 'DataQ Challenge Generator',
      description: "Our AI identifies challengeable violations and drafts professional DataQ letters automatically.",
      bullets: ['Auto-detect opportunities', 'Generate letters', 'Track status', '40% success rate'],
      cta: 'Challenge a Violation',
      mockup: 'dataq'
    },
    {
      id: 4,
      icon: LuBellRing,
      title: 'Alerts',
      accent: 'amber',
      category: { icon: LuBellRing, text: 'Notifications', color: 'text-amber-500' },
      heading: 'Smart Alerts',
      description: "Never miss an expiring document or compliance deadline. Automated reminders via email, SMS, or push.",
      bullets: ['Email, SMS, push', 'Custom schedules', 'Driver alerts', 'Score notifications'],
      cta: 'Set Up Alerts',
      mockup: 'alerts'
    }
  ];

  const accentBorders = {
    coral: 'border-l-[#FF6B4A]',
    navy: 'border-l-[#1E3A5F]',
    mint: 'border-l-emerald-400',
    purple: 'border-l-purple-400',
    amber: 'border-l-amber-400'
  };

  const visualBg = {
    coral: 'before:bg-gradient-to-br before:from-[#FFF0ED] before:to-[#FFE4DE]',
    navy: 'before:bg-gradient-to-br before:from-[#E8EEF4] before:to-[#D8E3ED]',
    mint: 'before:bg-gradient-to-br before:from-emerald-50 before:to-emerald-100',
    purple: 'before:bg-gradient-to-br before:from-purple-50 before:to-purple-100',
    amber: 'before:bg-gradient-to-br before:from-amber-50 before:to-amber-100'
  };

  // Mini mockup components
  const ChatMockup = () => (
    <div className="space-y-3.5">
      <div className="flex gap-3 animate-[fadeSlideUp_0.5s_ease_0.4s_both]">
        <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
          <LuUser className="w-4 h-4" />
        </div>
        <div className="px-4 py-3 rounded-2xl bg-white border border-gray-200 text-sm text-gray-700 max-w-[240px]">
          What's the HOS limit for property-carrying drivers?
        </div>
      </div>
      <div className="flex gap-3 animate-[fadeSlideUp_0.5s_ease_0.8s_both]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-purple-300 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-purple-400/30">
          <LuBot className="w-4 h-4" />
        </div>
        <div className="px-4 py-3 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 text-sm text-gray-700 max-w-[240px]">
          11-hour driving limit after 10 consecutive hours off duty, per FMCSA §395.3.
        </div>
      </div>
    </div>
  );

  const ChartMockup = () => (
    <div className="space-y-3">
      {[
        { label: 'Unsafe Driving', value: 32, color: 'bg-gradient-to-r from-emerald-400 to-emerald-300' },
        { label: 'HOS Compliance', value: 45, color: 'bg-gradient-to-r from-emerald-400 to-emerald-300' },
        { label: 'Vehicle Maint.', value: 68, color: 'bg-gradient-to-r from-amber-400 to-amber-300' },
        { label: 'Driver Fitness', value: 21, color: 'bg-gradient-to-r from-emerald-400 to-emerald-300' }
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <span className="w-20 text-xs font-medium text-gray-600">{item.label}</span>
          <div className="flex-1 h-3.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${item.color} animate-[barGrow_1s_ease_forwards]`}
              style={{ width: `${item.value}%`, animationDelay: `${i * 0.15}s` }}
            />
          </div>
          <span className="w-9 text-xs font-semibold text-gray-700 text-right">{item.value}%</span>
        </div>
      ))}
    </div>
  );

  const FilesMockup = () => (
    <div className="space-y-2.5">
      {[
        { icon: LuCreditCard, iconBg: 'bg-gradient-to-br from-[#1E3A5F] to-[#2D5A87]', name: 'CDL - Mike Rodriguez', meta: 'Expires Dec 2026', status: 'Valid', statusClass: 'bg-emerald-50 text-emerald-600' },
        { icon: LuStethoscope, iconBg: 'bg-gradient-to-br from-red-500 to-red-400', name: 'Medical Card', meta: 'Expires Mar 2026', status: '45 days', statusClass: 'bg-amber-50 text-amber-600' },
        { icon: LuFileCheck, iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-300', name: 'MVR Report', meta: 'Updated Jan 2026', status: 'Current', statusClass: 'bg-emerald-50 text-emerald-600' }
      ].map((file, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 animate-[fadeSlideRight_0.4s_ease_forwards]"
          style={{ animationDelay: `${0.3 + i * 0.2}s` }}
        >
          <div className={`w-9 h-9 rounded-lg ${file.iconBg} flex items-center justify-center text-white`}>
            <file.icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-800 truncate">{file.name}</div>
            <div className="text-xs text-gray-500">{file.meta}</div>
          </div>
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg ${file.statusClass}`}>
            {file.status}
          </span>
        </div>
      ))}
    </div>
  );

  const DataQMockup = () => (
    <div className="text-center py-5">
      <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-purple-400 to-purple-300 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-purple-400/35 animate-[bounce_3s_ease-in-out_infinite]">
        <LuFileCheck2 className="w-9 h-9" />
      </div>
      <div className="text-xl font-semibold text-gray-800 mb-1.5">DataQ Letter Ready</div>
      <div className="text-sm text-gray-600">
        Success probability: <strong className="text-emerald-500 font-bold">68%</strong>
      </div>
    </div>
  );

  const AlertsMockup = () => (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 animate-[fadeScale_0.4s_ease_0.3s_forwards] opacity-0">
        <div className="w-9 h-9 rounded-lg bg-amber-400/25 flex items-center justify-center text-amber-600">
          <LuAlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800">Medical Card Expiring</div>
          <div className="text-xs text-gray-500">Mike Rodriguez - 45 days remaining</div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 animate-[fadeScale_0.4s_ease_0.5s_forwards] opacity-0">
        <div className="w-9 h-9 rounded-lg bg-emerald-400/25 flex items-center justify-center text-emerald-600">
          <LuCheckCircle className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800">Inspection Complete</div>
          <div className="text-xs text-gray-500">Truck #1042 passed all checks</div>
        </div>
      </div>
    </div>
  );

  const mockupComponents = {
    chat: ChatMockup,
    chart: ChartMockup,
    files: FilesMockup,
    dataq: DataQMockup,
    alerts: AlertsMockup
  };

  const activeFeature = features[activeTab];
  const MockupComponent = mockupComponents[activeFeature.mockup];

  return (
    <section id="features" className="relative py-24 px-6 overflow-hidden bg-[#F8FAFC]">
      {/* Floating decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-500/10 blur-[120px] animate-[float1_20s_ease-in-out_infinite]" />
        <div className="absolute bottom-[10%] -left-20 w-72 h-72 rounded-full bg-cta-500/8 blur-[120px] animate-[float2_25s_ease-in-out_infinite]" />
        <div className="absolute top-[40%] right-[5%] w-60 h-60 rounded-full bg-primary-300/15 blur-[120px] animate-[float3_18s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div
          ref={headerRef}
          className={`text-center mb-8 transition-all duration-700 ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-gray-800 mb-4 tracking-tight">
            Compliance made <em className="italic text-[#FF6B4A]">simple</em>,
            <br />so you can focus on the road.
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Powerful tools for owner-operators and small fleets to stay DOT compliant without the headache.
          </p>
        </div>

        {/* Tab Navigation */}
        <div
          ref={tabsRef}
          className={`flex justify-center mb-10 transition-all duration-700 delay-150 ${tabsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="inline-flex gap-1.5 p-2 bg-white/85 backdrop-blur-xl rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.06)]">
            {features.map((feature, i) => (
              <button
                key={feature.id}
                onClick={() => setActiveTab(i)}
                aria-label={feature.title}
                aria-pressed={activeTab === i}
                className={`relative flex items-center gap-2.5 px-5 py-3.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                  activeTab === i
                    ? 'text-white shadow-lg shadow-[#FF6B4A]/25'
                    : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                {activeTab === i && (
                  <span className="absolute inset-0 bg-gradient-to-br from-[#FF6B4A] to-[#FF8A6B] rounded-xl" aria-hidden="true" />
                )}
                <feature.icon className="relative z-10 w-5 h-5" aria-hidden="true" />
                <span className="relative z-10 hidden sm:inline">{feature.title}</span>
                {feature.label && (
                  <span className={`relative z-10 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    activeTab === i ? 'bg-white/25' : 'bg-purple-400 text-white'
                  }`}>
                    {feature.label}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Card */}
        <div
          ref={cardRef}
          key={activeTab}
          className={`bg-white/85 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_24px_rgba(0,0,0,0.04),0_24px_48px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(0,0,0,0.06)] border-l-[5px] ${accentBorders[activeFeature.accent]} transition-all duration-700 delay-300 ${cardInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <div className="grid md:grid-cols-2">
            {/* Visual Panel */}
            <div className={`relative p-12 flex items-center justify-center before:absolute before:inset-5 before:rounded-3xl before:opacity-60 ${visualBg[activeFeature.accent]}`}>
              <div className="relative z-10 w-full max-w-[380px] bg-white rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.04)] overflow-hidden animate-[mockupFloat_5s_ease-in-out_infinite]">
                <div className="flex items-center gap-2 px-4 py-3.5 bg-gradient-to-r from-gray-800 to-gray-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="p-6 bg-gray-50 min-h-[200px]">
                  <MockupComponent />
                </div>
              </div>
            </div>

            {/* Content Panel */}
            <div className="p-12 flex flex-col justify-center">
              <div className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest ${activeFeature.category.color} mb-4 animate-[contentReveal_0.5s_ease_0.15s_forwards] opacity-0`}>
                <activeFeature.category.icon className="w-3.5 h-3.5" />
                {activeFeature.category.text}
              </div>
              <h3 className="font-serif text-3xl font-semibold text-gray-800 mb-4 tracking-tight animate-[contentReveal_0.5s_ease_0.25s_forwards] opacity-0">
                {activeFeature.heading}
              </h3>
              <p className="text-base text-gray-600 mb-8 leading-relaxed animate-[contentReveal_0.5s_ease_0.35s_forwards] opacity-0">
                {activeFeature.description}
              </p>
              <div className="grid grid-cols-2 gap-3.5 mb-9 animate-[contentReveal_0.5s_ease_0.45s_forwards] opacity-0">
                {activeFeature.bullets.map((bullet, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <span className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <LuCheck className="w-3.5 h-3.5" />
                    </span>
                    {bullet}
                  </div>
                ))}
              </div>
              <a
                href="#pricing"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-[#FF6B4A] to-[#FF8A6B] text-white rounded-xl font-semibold text-base shadow-lg shadow-[#FF6B4A]/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#FF6B4A]/40 transition-all duration-300 animate-[contentReveal_0.5s_ease_0.55s_forwards] opacity-0 w-fit"
              >
                {activeFeature.cta}
                <LuArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Keyframes */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(5deg); }
          66% { transform: translate(-20px, 20px) rotate(-3deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -20px) scale(1.1); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-25px, 25px); }
          75% { transform: translate(25px, -15px); }
        }
        @keyframes cardSlideIn {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes mockupFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes contentReveal {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeSlideRight {
          from { opacity: 0; transform: translateX(15px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes barGrow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.05); }
        }

        /* Respect user's reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
};

export default FeaturesSection;

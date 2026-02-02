import { Link } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';

/**
 * Version 1: Split Cards with Animated Gradient Border
 * Modern split design with glowing divider
 */
const DiffV1 = () => {
  const dontDo = ['GPS Tracking', 'ELD / HOS Logging', 'Fuel Card Integration', 'Dashcams', 'Dispatch Software'];
  const weDo = ['DQF File Management', 'Document Expiration Alerts', 'CSA Score Monitoring', 'DataQ Challenge Letters', 'Audit Prep & Compliance'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-zinc-200 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          <FiArrowLeft /> Back to Landing Page
        </button>
        <span className="text-sm text-zinc-500">Design V1: Split Cards</span>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      {/* Section */}
      <section className="py-20 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cta-500/10 to-primary-500/10 border border-cta-500/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-cta-500 animate-pulse"></span>
              <span className="text-sm font-semibold text-cta-600 uppercase tracking-wider">What Makes Us Different</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-primary-500 mb-6">
              We're Not Trying to<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-500 to-orange-400">Replace Your ELD</span>
            </h2>
            <p className="text-lg md:text-xl text-zinc-600 max-w-3xl mx-auto leading-relaxed">
              The big telematics platforms are great at fleet tracking. But when the DOT auditor shows up?
              <span className="font-semibold text-primary-500"> That's where they fall short. And that's ALL we do.</span>
            </p>
          </div>

          {/* Split Cards Container */}
          <div className="relative max-w-5xl mx-auto">
            {/* Glowing Center Divider */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 hidden md:block">
              <div className="h-full w-full bg-gradient-to-b from-transparent via-cta-500 to-transparent opacity-50"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cta-500 to-transparent blur-xl opacity-30"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {/* Left Card - What We Don't Do */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-300 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative bg-white/80 backdrop-blur-sm border border-zinc-200 rounded-3xl p-8 md:p-10 hover:border-zinc-300 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center">
                      <FiX className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-zinc-400">What We Don't Do</h3>
                      <p className="text-sm text-zinc-400">Leave this to the specialists</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {dontDo.map((item, i) => (
                      <li key={i} className="flex items-center gap-4 group/item">
                        <span className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-zinc-300 text-lg">—</span>
                        </span>
                        <span className="text-zinc-400 line-through decoration-zinc-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Card - What We Do */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cta-500 to-orange-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 border border-primary-400/30 rounded-3xl p-8 md:p-10 hover:shadow-2xl hover:shadow-cta-500/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-cta-500 flex items-center justify-center shadow-lg shadow-cta-500/30">
                      <FiCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">What We Do</h3>
                      <p className="text-sm text-white/70">100% focused compliance</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {weDo.map((item, i) => (
                      <li key={i} className="flex items-center gap-4 group/item hover:translate-x-1 transition-transform">
                        <span className="w-8 h-8 rounded-xl bg-cta-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cta-500/30">
                          <FiCheck className="w-4 h-4 text-white" />
                        </span>
                        <span className="text-white font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Tagline */}
          <div className="text-center mt-16">
            <p className="text-2xl md:text-3xl font-bold text-zinc-700">
              We do <span className="text-cta-500">one thing</span>. We do it <span className="text-cta-500">well</span>. We charge <span className="text-cta-500">fairly</span>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DiffV1;

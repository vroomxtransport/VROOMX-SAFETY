import { Link } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';

/**
 * Version 3: Comparison Table
 * Clean professional table layout
 */
const DiffV3 = () => {
  const features = [
    { category: 'Fleet Operations', items: [
      { name: 'GPS Tracking', others: true, us: false },
      { name: 'ELD / HOS Logging', others: true, us: false },
      { name: 'Fuel Card Integration', others: true, us: false },
      { name: 'Dashcams', others: true, us: false },
      { name: 'Dispatch Software', others: true, us: false },
    ]},
    { category: 'Compliance & Safety', items: [
      { name: 'DQF File Management', others: false, us: true },
      { name: 'Document Expiration Alerts', others: false, us: true },
      { name: 'CSA Score Monitoring', others: false, us: true },
      { name: 'DataQ Challenge Letters', others: false, us: true },
      { name: 'Audit Prep & Compliance', others: false, us: true },
    ]},
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-zinc-200 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          <FiArrowLeft /> Back to Landing Page
        </button>
        <span className="text-sm text-zinc-500">Design V3: Comparison Table</span>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      {/* Section */}
      <section className="py-20 px-6 md:px-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full border border-primary-200 bg-primary-50 text-primary-600 text-sm font-semibold mb-6">
              Feature Comparison
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary-500 mb-6">
              They Do Everything.<br />
              <span className="text-cta-500">We Do Compliance.</span>
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Big telematics platforms try to be everything. We specialize in one thing:
              keeping you DOT compliant.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-3 bg-zinc-50 border-b border-zinc-200">
              <div className="p-6 font-semibold text-zinc-600">Feature</div>
              <div className="p-6 text-center border-l border-zinc-200">
                <span className="text-zinc-400 font-semibold">Big Telematics</span>
                <p className="text-xs text-zinc-400 mt-1">$30-50/truck/mo</p>
              </div>
              <div className="p-6 text-center border-l border-zinc-200 bg-gradient-to-r from-cta-50 to-orange-50">
                <span className="text-cta-600 font-bold">VroomX Safety</span>
                <p className="text-xs text-cta-500 mt-1">From $19/mo</p>
              </div>
            </div>

            {/* Table Body */}
            {features.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {/* Section Header */}
                <div className="grid grid-cols-3 bg-zinc-50/50 border-b border-zinc-100">
                  <div className="p-4 col-span-3">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{section.category}</span>
                  </div>
                </div>

                {/* Section Items */}
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="grid grid-cols-3 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/50 transition-colors">
                    <div className="p-5 flex items-center">
                      <span className="text-zinc-700 font-medium">{item.name}</span>
                    </div>
                    <div className="p-5 flex items-center justify-center border-l border-zinc-100">
                      {item.others ? (
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                          <FiCheck className="w-4 h-4 text-zinc-400" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                          <FiX className="w-4 h-4 text-zinc-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex items-center justify-center border-l border-zinc-100 bg-gradient-to-r from-cta-50/50 to-orange-50/50">
                      {item.us ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cta-500 to-orange-500 flex items-center justify-center shadow-lg shadow-cta-500/30">
                          <FiCheck className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                          <span className="text-zinc-400 text-xs font-medium">N/A</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Table Footer */}
            <div className="grid grid-cols-3 bg-primary-500">
              <div className="p-6 text-white font-bold">Bottom Line</div>
              <div className="p-6 text-center border-l border-primary-400/30">
                <span className="text-white/70 text-sm">Jack of all trades</span>
              </div>
              <div className="p-6 text-center border-l border-primary-400/30 bg-cta-500">
                <span className="text-white font-bold text-sm">Compliance Specialist</span>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-12">
            <p className="text-2xl font-bold text-zinc-700 mb-6">
              We do <span className="text-cta-500">one thing</span>. We do it <span className="text-cta-500">exceptionally well</span>.
            </p>
            <p className="text-zinc-500">
              Stop paying for features you don't need. Start with compliance that actually works.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DiffV3;

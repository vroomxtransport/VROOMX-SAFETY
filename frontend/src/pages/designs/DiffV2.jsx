import { Link } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiTarget } from 'react-icons/fi';

/**
 * Version 2: Centered Single Focus
 * Large centered card showing ONLY what we do
 * "Others" items shown as small faded badges around the edges
 */
const DiffV2 = () => {
  const others = ['GPS Tracking', 'ELD Logging', 'Fuel Cards', 'Dashcams', 'Dispatch'];
  const weDo = ['DQF File Management', 'Document Expiration Alerts', 'CSA Score Monitoring', 'DataQ Challenge Letters', 'Audit Prep & Compliance'];

  return (
    <div className="min-h-screen bg-[#0a1628] overflow-hidden">
      {/* Back Link */}
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white font-medium">
          <FiArrowLeft /> Back to Home
        </Link>
        <span className="ml-4 text-sm text-white/30">Design V2: Centered Focus</span>
      </div>

      {/* Section */}
      <section className="py-20 px-6 md:px-16 relative">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cta-500/20 rounded-full blur-[150px]"></div>

        <div className="max-w-6xl mx-auto relative">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cta-500/30 bg-cta-500/10 mb-6">
              <FiTarget className="w-4 h-4 text-cta-500" />
              <span className="text-sm font-semibold text-cta-400 uppercase tracking-wider">Laser Focus</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-6">
              While Others Do <span className="text-zinc-500">Everything</span>,<br />
              We Do <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-400 to-orange-400">One Thing Right</span>
            </h2>
          </div>

          {/* Main Content */}
          <div className="relative">
            {/* Floating "Others" badges - positioned around the center */}
            <div className="absolute inset-0 pointer-events-none hidden lg:block">
              {others.map((item, i) => {
                const positions = [
                  'top-0 left-10',
                  'top-20 right-0',
                  'bottom-40 left-0',
                  'bottom-10 right-10',
                  'top-1/2 left-0 -translate-y-1/2'
                ];
                return (
                  <div
                    key={i}
                    className={`absolute ${positions[i]} bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-full px-4 py-2 text-zinc-500 text-sm`}
                  >
                    <span className="line-through decoration-zinc-600">{item}</span>
                  </div>
                );
              })}
            </div>

            {/* Center Focus Card */}
            <div className="relative max-w-2xl mx-auto">
              {/* Glow Ring */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cta-500 via-orange-500 to-cta-500 rounded-3xl blur opacity-30 animate-pulse"></div>

              <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-900/90 border border-zinc-700/50 rounded-3xl p-10 md:p-12">
                {/* Icon */}
                <div className="flex justify-center mb-8">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cta-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-cta-500/30">
                    <FiTarget className="w-10 h-10 text-white" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white text-center mb-8">
                  FMCSA Compliance.<br />
                  <span className="text-cta-400">Nothing Else.</span>
                </h3>

                <ul className="space-y-5">
                  {weDo.map((item, i) => (
                    <li key={i} className="flex items-center gap-4 group">
                      <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-cta-500/20 to-orange-500/20 border border-cta-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-cta-500/30 transition-all">
                        <FiCheck className="w-5 h-5 text-cta-400" />
                      </span>
                      <span className="text-white/90 text-lg font-medium group-hover:text-white transition-colors">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Bottom Badge */}
                <div className="mt-10 pt-8 border-t border-zinc-700/50 text-center">
                  <p className="text-zinc-400 text-sm uppercase tracking-wider mb-2">Our Promise</p>
                  <p className="text-xl font-bold text-white">
                    One thing. Done <span className="text-cta-400">exceptionally</span> well.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Show others below */}
          <div className="lg:hidden mt-12 flex flex-wrap justify-center gap-3">
            <p className="w-full text-center text-zinc-500 text-sm mb-2">What we leave to others:</p>
            {others.map((item, i) => (
              <span key={i} className="bg-zinc-800/50 border border-zinc-700/50 rounded-full px-3 py-1 text-zinc-500 text-sm line-through">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DiffV2;

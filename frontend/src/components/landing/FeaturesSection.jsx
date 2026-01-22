import {
  FiUsers, FiTruck, FiBarChart2, FiAlertTriangle, FiDroplet, FiClipboard
} from 'react-icons/fi';

const iconMap = {
  FiUsers,
  FiTruck,
  FiBarChart2,
  FiAlertTriangle,
  FiDroplet,
  FiClipboard
};

const FeaturesSection = ({ features }) => {
  return (
    <section id="features" className="py-24 px-6 md:px-16 relative z-10 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary-500/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <span className="font-mono text-xs text-cta-500 uppercase tracking-widest">// Platform Modules</span>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary-500 mt-4 mb-6">
            Everything You Need.<br />
            <span className="text-[#475569] line-through decoration-2 decoration-red-500">Nothing You Don't.</span>
          </h2>
          <p className="text-lg text-[#475569] max-w-2xl mx-auto">
            A complete suite of tools engineered for 49 CFR compliance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = iconMap[feature.icon] || FiUsers;
            return (
              <div key={i} className="group relative bg-white border border-[#E2E8F0] p-8 rounded-3xl overflow-hidden hover:-translate-y-2 hover:border-primary-500/30 hover:shadow-lg transition-all duration-300">
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-cta-50 border border-cta-200 group-hover:border-cta-500/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-7 h-7 text-cta-500" />
                  </div>
                  <h3 className="text-xl font-bold text-primary-500 mb-3">{feature.title}</h3>
                  <p className="text-sm text-[#475569] mb-6 leading-relaxed">{feature.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.tags.map((tag, j) => (
                      <span key={j} className="px-2 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[10px] text-[#475569] uppercase tracking-wide">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

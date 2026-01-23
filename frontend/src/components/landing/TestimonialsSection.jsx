import useInView from '../../hooks/useInView';

const TestimonialsSection = ({ testimonials }) => {
  const [headerRef, headerInView] = useInView({ threshold: 0.3 });
  const [carouselRef, carouselInView] = useInView({ threshold: 0.1 });

  return (
    <section className="py-24 relative z-10 overflow-hidden bg-primary-500">
      <div
        ref={headerRef}
        className={`max-w-7xl mx-auto px-6 mb-12 text-center transition-all duration-700 ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-white">
          Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-400 to-cta-500">Fleets Everywhere.</span>
        </h2>
      </div>

      <div
        ref={carouselRef}
        className={`relative w-full overflow-hidden transition-all duration-700 delay-200 ${carouselInView ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Mask for fading edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-primary-500 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-primary-500 to-transparent z-20 pointer-events-none" />

        <div className="flex w-max animate-scroll hover:[animation-play-state:paused] gap-8">
          {/* First set of testimonials */}
          {testimonials.map((t, i) => (
            <div key={i} className="w-[400px] bg-white/10 backdrop-blur-sm border border-white/10 p-8 rounded-2xl flex-shrink-0 relative group hover:border-white/30 transition-colors">
              <div className={`absolute -top-4 left-8 w-8 h-8 ${t.featured ? 'bg-cta-500 shadow-lg shadow-cta-500/30' : 'bg-white/20'} rounded-full flex items-center justify-center text-xl font-black text-white`}>
                "
              </div>
              <p className="text-white/90 text-lg mb-6 leading-relaxed relative z-10 pt-2">{t.quote}</p>
              <div className="flex items-center gap-4">
                <img
                  src={t.image}
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                />
                <div>
                  <div className="text-white font-bold text-sm">{t.name}</div>
                  <div className="text-cta-400 text-xs uppercase tracking-wider font-bold">
                    {t.role}{t.fleet && ` • ${t.fleet}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* Duplicate set for infinite scroll */}
          {testimonials.map((t, i) => (
            <div key={`dup-${i}`} className="w-[400px] bg-white/10 backdrop-blur-sm border border-white/10 p-8 rounded-2xl flex-shrink-0 relative group hover:border-white/30 transition-colors">
              <div className={`absolute -top-4 left-8 w-8 h-8 ${t.featured ? 'bg-cta-500 shadow-lg shadow-cta-500/30' : 'bg-white/20'} rounded-full flex items-center justify-center text-xl font-black text-white`}>
                "
              </div>
              <p className="text-white/90 text-lg mb-6 leading-relaxed relative z-10 pt-2">{t.quote}</p>
              <div className="flex items-center gap-4">
                <img
                  src={t.image}
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                />
                <div>
                  <div className="text-white font-bold text-sm">{t.name}</div>
                  <div className="text-cta-400 text-xs uppercase tracking-wider font-bold">
                    {t.role}{t.fleet && ` • ${t.fleet}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

import { FiStar } from 'react-icons/fi';
import useInView from '../../hooks/useInView';

const TestimonialsSection = () => {
  const [headerRef, headerInView] = useInView({ threshold: 0.3 });
  const [statsRef, statsInView] = useInView({ threshold: 0.3 });
  const [cardsRef, cardsInView] = useInView({ threshold: 0.1 });

  const stats = [
    { value: '500+', label: 'Active Fleets' },
    { value: '7,000+', label: 'Drivers Managed' },
    { value: '4.9/5', label: 'Customer Rating' }
  ];

  const testimonials = [
    {
      quote: "We were one violation away from FMCSA intervention. After 90 days with VroomX, we dropped 23 points and passed a surprise DOT inspection with flying colors.",
      result: { icon: '📉', text: 'CSA Score: 78% → 55% in 90 days' },
      name: 'Mike Rodriguez',
      role: 'Fleet Owner • 12 trucks',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      quote: "I used to spend 15+ hours a week on compliance paperwork. VroomX automated everything. Now I spend that time actually growing my business.",
      result: { icon: '⏱️', text: 'Saved 10+ hours per week' },
      name: 'Sarah Johnson',
      role: 'Safety Manager • 45 trucks',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face'
    },
    {
      quote: "The AI assistant is incredible. I asked about a complex HOS regulation and got a clear, accurate answer in seconds. It's like having a compliance expert on call 24/7.",
      result: { icon: '🤖', text: '500+ AI queries answered' },
      name: 'David Thompson',
      role: 'Owner-Operator',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    }
  ];

  return (
    <section className="py-24 px-6 md:px-16 relative z-10 bg-[#F8FAFC]">
      {/* Floating decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-cta-500/10 blur-[120px]" />
        <div className="absolute bottom-[20%] -right-20 w-72 h-72 rounded-full bg-primary-500/8 blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div
          ref={headerRef}
          className={`text-center mb-12 transition-all duration-700 ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-gray-800 dark:text-white mb-4">
            Trusted by <span className="text-cta-500">2,500+</span> Carriers
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            See why fleet managers choose VroomX Safety
          </p>
        </div>

        {/* Stats Row */}
        <div
          ref={statsRef}
          className={`flex flex-wrap justify-center gap-8 md:gap-16 mb-16 transition-all duration-700 delay-150 ${statsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-heading font-extrabold text-cta-500">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial Cards Grid */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-500 ${cardsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: cardsInView ? `${i * 150}ms` : '0ms' }}
            >
              {/* Quote Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B4A] to-[#FF8A6B] rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-[#FF6B4A]/25">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <FiStar key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Quote Text */}
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                "{t.quote}"
              </p>

              {/* Result Highlight */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
                <span className="text-xl">{t.result.icon}</span>
                <span className="text-emerald-600 font-semibold text-sm">
                  {t.result.text}
                </span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={t.image}
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-bold text-gray-800 dark:text-white">{t.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.role}</div>
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

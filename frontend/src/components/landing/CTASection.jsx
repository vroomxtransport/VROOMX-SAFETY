import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import useInView from '../../hooks/useInView';

const CTASection = () => {
  const [sectionRef, sectionInView] = useInView({ threshold: 0.2 });

  return (
    <section className="py-32 px-6 md:px-16 text-center relative overflow-hidden z-10 bg-primary-500">
      <div className="absolute inset-0 bg-gradient-to-t from-primary-600/50 to-transparent pointer-events-none" />
      <div
        ref={sectionRef}
        className={`max-w-3xl mx-auto relative z-10 transition-all duration-700 ${sectionInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight font-heading">
          Ready to Simplify <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta-400 to-cta-500">Compliance?</span>
        </h2>
        <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto">
          Join hundreds of owner-operators and small fleets who trust VroomX to keep them FMCSA compliant.
        </p>
        <Link
          to="/pricing"
          className="bg-cta-500 hover:bg-cta-600 px-12 py-5 rounded-full font-bold text-white text-lg inline-flex items-center gap-2 shadow-lg shadow-cta-500/30 transition-all hover:scale-105 mb-6"
        >
          Get Started
          <FiArrowRight className="w-5 h-5" />
        </Link>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-white/70">
          <span className="flex items-center gap-2">
            <FiCheck className="w-4 h-4 text-cta-400" />
            No credit card required
          </span>
          <span className="flex items-center gap-2">
            <FiCheck className="w-4 h-4 text-cta-400" />
            Setup in 10 minutes
          </span>
          <span className="flex items-center gap-2">
            <FiCheck className="w-4 h-4 text-cta-400" />
            Cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

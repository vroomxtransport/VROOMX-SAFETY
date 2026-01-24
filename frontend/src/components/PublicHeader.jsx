import { Link } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import VroomXLogo from './VroomXLogo';

const PublicHeader = ({ activePage = 'landing', variant = 'light' }) => {
  const isLight = variant === 'light';

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
      <div className={`${isLight ? 'bg-white/90' : 'bg-black/60'} backdrop-blur-xl border ${isLight ? 'border-[#E2E8F0]' : 'border-white/10'} rounded-2xl px-6 py-4 flex justify-between items-center shadow-lg ${isLight ? 'shadow-primary-500/5' : 'shadow-black/20'}`}>
        {/* Logo */}
        <VroomXLogo size="md" showText={true} animate={true} linkToHome={true} />

        {/* Navigation Links */}
        <div className={`hidden md:flex items-center gap-8 ${isLight ? 'bg-[#F1F5F9]' : 'bg-white/10'} px-8 py-2 rounded-full border ${isLight ? 'border-[#E2E8F0]' : 'border-white/10'}`}>
          <Link
            to="/csa-checker"
            className={`${activePage === 'csa-checker' ? 'text-cta-600 font-bold' : 'text-cta-500'} text-sm font-medium hover:text-cta-600 transition-colors flex items-center gap-1.5 cursor-pointer`}
          >
            <FiSearch className="w-3.5 h-3.5" />
            Free CSA Check
          </Link>
          <a
            href={activePage === 'landing' ? '#features' : '/#features'}
            className={`${isLight ? 'text-[#475569]' : 'text-white/70'} text-sm font-medium hover:text-primary-500 transition-colors`}
          >
            Features
          </a>
          <a
            href={activePage === 'landing' ? '#pricing' : '/#pricing'}
            className={`${isLight ? 'text-[#475569]' : 'text-white/70'} text-sm font-medium hover:text-primary-500 transition-colors`}
          >
            Pricing
          </a>
          <Link
            to="/blog"
            className={`${activePage === 'blog' ? 'text-cta-500 font-bold' : isLight ? 'text-[#475569]' : 'text-white/70'} text-sm font-medium hover:text-primary-500 transition-colors`}
          >
            Blog
          </Link>
          <Link
            to="/login"
            className={`${activePage === 'login' ? 'text-cta-500 font-bold' : isLight ? 'text-[#475569]' : 'text-white/70'} text-sm font-medium hover:text-primary-500 transition-colors`}
          >
            Login
          </Link>
        </div>

        {/* CTA Button */}
        <a href="#pricing" className="btn-glow px-6 py-2.5 rounded-lg font-bold text-white text-sm tracking-wide shadow-lg">
          Get Started
        </a>
      </div>
    </nav>
  );
};

export default PublicHeader;

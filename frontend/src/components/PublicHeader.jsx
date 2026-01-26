import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiMenu, FiX } from 'react-icons/fi';
import VroomXLogo from './VroomXLogo';

const PublicHeader = ({ activePage = 'landing', variant = 'light' }) => {
  const isLight = variant === 'light';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/csa-checker', label: 'Free CSA Check', icon: FiSearch, isLink: true, highlight: true },
    { href: activePage === 'landing' ? '#features' : '/#features', label: 'Features', isLink: false },
    { href: activePage === 'landing' ? '#pricing' : '/#pricing', label: 'Pricing', isLink: false },
    { to: '/blog', label: 'Blog', isLink: true },
    { to: '/login', label: 'Login', isLink: true },
  ];

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
      <div className={`${isLight ? 'bg-white/90' : 'bg-black/60'} backdrop-blur-xl border ${isLight ? 'border-[#E2E8F0]' : 'border-white/10'} rounded-2xl px-6 py-4 flex justify-between items-center shadow-lg ${isLight ? 'shadow-primary-500/5' : 'shadow-black/20'}`}>
        {/* Logo */}
        <VroomXLogo size="md" showText={true} animate={true} linkToHome={true} />

        {/* Desktop Navigation Links */}
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

        {/* Desktop CTA Button */}
        <a href="#pricing" className="hidden md:block btn-glow px-6 py-2.5 rounded-lg font-bold text-white text-sm tracking-wide shadow-lg">
          Get Started
        </a>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`md:hidden p-2 rounded-lg ${isLight ? 'text-zinc-700 hover:bg-zinc-100' : 'text-white hover:bg-white/10'} transition-colors`}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className={`md:hidden mt-2 ${isLight ? 'bg-white/95' : 'bg-black/90'} backdrop-blur-xl border ${isLight ? 'border-[#E2E8F0]' : 'border-white/10'} rounded-2xl shadow-lg overflow-hidden`}>
          <div className="p-4 space-y-1">
            {navLinks.map((link, index) => (
              link.isLink ? (
                <Link
                  key={index}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    link.highlight
                      ? 'text-cta-500 hover:bg-cta-50'
                      : activePage === link.to?.slice(1)
                        ? 'text-cta-500 bg-cta-50'
                        : isLight
                          ? 'text-zinc-700 hover:bg-zinc-100'
                          : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              ) : (
                <a
                  key={index}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isLight ? 'text-zinc-700 hover:bg-zinc-100' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </a>
              )
            ))}

            {/* Mobile CTA Button */}
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block mt-3 btn-glow px-6 py-3 rounded-xl font-bold text-white text-base tracking-wide shadow-lg text-center"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default PublicHeader;

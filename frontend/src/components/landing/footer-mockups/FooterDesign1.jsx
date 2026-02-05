import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiTwitter,
  FiLinkedin,
  FiFacebook,
  FiShield,
  FiLock,
  FiServer,
  FiCheckCircle,
  FiArrowUp,
} from 'react-icons/fi';
import VroomXLogo from '../../VroomXLogo';

const FooterDesign1 = () => {
  const [email, setEmail] = useState('');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    setEmail('');
  };

  const productLinks = [
    { label: 'Features', to: '#features', isAnchor: true },
    { label: 'Pricing', to: '/pricing' },
    { label: 'CSA Checker', to: '/csa-checker' },
    { label: 'Platform', to: '/platform' },
  ];

  const resourceLinks = [
    { label: 'Blog', to: '/blog' },
    {
      label: 'FMCSA Regulations',
      href: 'https://www.fmcsa.dot.gov/regulations',
      external: true,
    },
    {
      label: 'DataQs Portal',
      href: 'https://dataqs.fmcsa.dot.gov/',
      external: true,
    },
    {
      label: 'Support',
      href: 'mailto:support@vroomxsafety.com',
      external: true,
    },
  ];

  const companyLinks = [
    { label: 'About Us', to: '/about' },
    { label: 'Contact', to: '/contact' },
    { label: 'Privacy', to: '/privacy' },
    { label: 'Terms', to: '/terms' },
  ];

  const trustBadges = [
    { icon: FiShield, label: 'FMCSA Registered' },
    { icon: FiLock, label: '256-bit Encryption' },
    { icon: FiServer, label: '99.9% Uptime' },
    { icon: FiCheckCircle, label: 'SOC 2 Compliant' },
  ];

  const renderLink = (link) => {
    if (link.external || link.href) {
      return (
        <a
          key={link.label}
          href={link.href}
          target={link.href?.startsWith('mailto:') ? undefined : '_blank'}
          rel={link.href?.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
          className="text-white/70 text-sm hover:text-white transition-colors block"
        >
          {link.label}
        </a>
      );
    }
    if (link.isAnchor) {
      return (
        <a
          key={link.label}
          href={link.to}
          className="text-white/70 text-sm hover:text-white transition-colors block"
        >
          {link.label}
        </a>
      );
    }
    return (
      <Link
        key={link.label}
        to={link.to}
        className="text-white/70 text-sm hover:text-white transition-colors block"
      >
        {link.label}
      </Link>
    );
  };

  return (
    <footer
      className="relative"
      style={{
        background: 'linear-gradient(180deg, #1E3A5F 0%, #152A45 100%)',
      }}
    >
      {/* Top accent line */}
      <div
        className="h-[3px] w-full"
        style={{
          background: 'linear-gradient(90deg, #FF6B4A 0%, #EA580C 100%)',
        }}
      />

      <div className="max-w-7xl mx-auto py-16 px-6 md:px-16">
        {/* Upper section - 5-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <VroomXLogo
              size="md"
              showText={true}
              textColor="light"
              linkToHome={true}
            />
            <p className="text-white/60 text-sm leading-relaxed mt-4 max-w-sm">
              AI-powered FMCSA compliance made simple for owner-operators and
              small fleets.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/70 hover:text-white"
                aria-label="Twitter"
              >
                <FiTwitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/70 hover:text-white"
                aria-label="LinkedIn"
              >
                <FiLinkedin className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/70 hover:text-white"
                aria-label="Facebook"
              >
                <FiFacebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product column */}
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <div className="space-y-3">
              {productLinks.map(renderLink)}
            </div>
          </div>

          {/* Resources column */}
          <div>
            <h4 className="text-white font-bold mb-4">Resources</h4>
            <div className="space-y-3">
              {resourceLinks.map(renderLink)}
            </div>
          </div>

          {/* Company column */}
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <div className="space-y-3">
              {companyLinks.map(renderLink)}
            </div>
          </div>
        </div>

        {/* Newsletter signup */}
        <div className="bg-white/5 rounded-2xl p-6 mt-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-white font-bold text-lg">
                Stay compliant. Stay informed.
              </h3>
              <p className="text-white/60 text-sm mt-1">
                Get weekly compliance tips and FMCSA updates.
              </p>
            </div>
            <form
              onSubmit={handleSubscribe}
              className="flex items-center gap-3 w-full md:w-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 md:w-72 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors"
                required
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm whitespace-nowrap transition-all hover:shadow-lg hover:shadow-orange-500/25"
                style={{
                  background:
                    'linear-gradient(135deg, #FF6B4A 0%, #EA580C 100%)',
                }}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mt-8">
          {trustBadges.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 text-white/40"
            >
              <badge.icon className="w-4 h-4" />
              <span className="text-xs font-medium">{badge.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 mt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            &copy; 2026 VroomX Safety. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-sm">
              Made with &hearts; for truckers
            </span>
            <button
              onClick={scrollToTop}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-cta-500 transition-all flex items-center justify-center text-white/70 hover:text-white"
              aria-label="Scroll to top"
            >
              <FiArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterDesign1;

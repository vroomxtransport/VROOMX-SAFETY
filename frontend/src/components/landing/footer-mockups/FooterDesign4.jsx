import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiTwitter,
  FiLinkedin,
  FiFacebook,
  FiArrowUp,
} from 'react-icons/fi';
import VroomXLogo from '../../VroomXLogo';

const FooterDesign4 = () => {
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
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
    { label: 'Privacy', to: '/privacy' },
    { label: 'Terms', to: '/terms' },
  ];

  const renderLink = (link) => {
    const linkClasses =
      'group relative text-white/50 text-sm hover:text-cta-400 transition-colors inline-block';

    const underline = (
      <span className="absolute left-0 -bottom-0.5 h-[1px] w-0 bg-cta-400 transition-all duration-300 group-hover:w-full" />
    );

    if (link.external || link.href) {
      return (
        <a
          key={link.label}
          href={link.href}
          target={link.href?.startsWith('mailto:') ? undefined : '_blank'}
          rel={link.href?.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
          className={linkClasses}
        >
          {link.label}
          {underline}
        </a>
      );
    }
    if (link.isAnchor) {
      return (
        <a
          key={link.label}
          href={link.to}
          className={linkClasses}
        >
          {link.label}
          {underline}
        </a>
      );
    }
    return (
      <Link
        key={link.label}
        to={link.to}
        className={linkClasses}
      >
        {link.label}
        {underline}
      </Link>
    );
  };

  return (
    <footer className="relative bg-primary-700 py-20 px-6 md:px-16 overflow-hidden">
      {/* Decorative floating orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-cta-500/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-primary-300/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-cta-400/10 blur-[80px] pointer-events-none" />

      {/* Glass Card */}
      <div className="max-w-7xl mx-auto relative z-10 bg-white/[0.07] backdrop-blur-xl rounded-3xl border border-white/[0.12] p-12 md:p-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
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
                className="text-white/50 hover:text-cta-400 transition-colors"
                aria-label="Twitter"
              >
                <FiTwitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-cta-400 transition-colors"
                aria-label="LinkedIn"
              >
                <FiLinkedin className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-cta-400 transition-colors"
                aria-label="Facebook"
              >
                <FiFacebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product column */}
          <div>
            <h4 className="text-white/90 font-semibold text-sm uppercase tracking-wider mb-5">
              Product
            </h4>
            <div className="space-y-3">
              {productLinks.map(renderLink)}
            </div>
          </div>

          {/* Resources column */}
          <div>
            <h4 className="text-white/90 font-semibold text-sm uppercase tracking-wider mb-5">
              Resources
            </h4>
            <div className="space-y-3">
              {resourceLinks.map(renderLink)}
            </div>
          </div>

          {/* Company column */}
          <div>
            <h4 className="text-white/90 font-semibold text-sm uppercase tracking-wider mb-5">
              Company
            </h4>
            <div className="space-y-3">
              {companyLinks.map(renderLink)}
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter row - below glass card */}
      <div className="mt-10 max-w-7xl mx-auto relative z-10">
        <form
          onSubmit={handleSubscribe}
          className="flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <p className="text-white/70 font-medium">
            Stay ahead of FMCSA changes
          </p>
          <div className="flex items-center w-full md:w-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 md:w-72 bg-white/10 border border-white/10 rounded-xl px-5 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-colors"
              required
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-cta-500 to-cta-600 px-6 py-3 rounded-xl text-white font-bold text-sm whitespace-nowrap hover:shadow-lg hover:shadow-cta-500/25 transition-all ml-3"
            >
              Subscribe
            </button>
          </div>
        </form>
      </div>

      {/* Bottom bar */}
      <div className="mt-10 pt-8 border-t border-white/[0.08] max-w-7xl mx-auto relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-white/40 text-sm">
          &copy; 2026 VroomX Safety. All rights reserved.
        </p>
        <button
          onClick={scrollToTop}
          className="text-white/40 hover:text-cta-400 text-sm flex items-center gap-2 cursor-pointer transition-colors"
        >
          Back to top
          <FiArrowUp className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};

export default FooterDesign4;

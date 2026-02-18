import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiCheck,
  FiTwitter,
  FiLinkedin,
  FiFacebook,
  FiMail,
  FiPhone,
  FiMapPin,
} from 'react-icons/fi';
import VroomXLogo from '../../VroomXLogo';

const FooterDesign3 = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setEmail('');
  };

  const trustItems = [
    'No credit card required',
    '7-day free trial',
    'Cancel anytime',
  ];

  const quickLinks = [
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
    { label: 'API Docs', to: '/docs/api' },
  ];

  const renderLink = (link) => {
    if (link.external) {
      return (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-white/70 text-sm hover:text-white transition-colors"
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
          className="block text-white/70 text-sm hover:text-white transition-colors"
        >
          {link.label}
        </a>
      );
    }
    return (
      <Link
        key={link.label}
        to={link.to}
        className="block text-white/70 text-sm hover:text-white transition-colors"
      >
        {link.label}
      </Link>
    );
  };

  return (
    <footer>
      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-cta-500 to-cta-600 py-16 px-6 md:px-16 text-center">
        <h2 className="text-white text-3xl md:text-4xl font-heading font-black">
          Ready to Get Audit-Ready?
        </h2>
        <p className="text-white/80 text-lg mt-3">
          Join 500+ carriers who trust VroomX for compliance.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex justify-center">
          <div className="flex w-full max-w-md">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 rounded-l-xl px-6 py-4 bg-white text-gray-800 border-0 focus:ring-2 focus:ring-white focus:outline-none"
              required
            />
            <button
              type="submit"
              className="rounded-r-xl px-8 py-4 bg-primary-500 hover:bg-primary-700 text-white font-bold transition-all flex items-center gap-2"
            >
              Start Free Trial
              <FiArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>

        <div className="flex justify-center gap-6 mt-4 flex-wrap">
          {trustItems.map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-white/70 text-sm">
              <FiCheck className="w-4 h-4" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Road decoration divider */}
      <div className="h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Footer Links */}
      <div className="bg-primary-500 py-16 px-6 md:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1 - Brand */}
          <div>
            <VroomXLogo size="md" showText={true} textColor="light" linkToHome={true} />
            <p className="text-white/70 text-sm mt-4 leading-relaxed">
              The all-in-one compliance platform built for modern trucking companies. Stay audit-ready, reduce violations, and protect your CSA scores.
            </p>
            <div className="flex gap-3 mt-6">
              {[
                { icon: FiTwitter, label: 'Twitter' },
                { icon: FiLinkedin, label: 'LinkedIn' },
                { icon: FiFacebook, label: 'Facebook' },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-cta-500 transition-all flex items-center justify-center text-white"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <div className="space-y-3">
              {quickLinks.map(renderLink)}
            </div>
          </div>

          {/* Column 3 - Resources */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Resources
            </h3>
            <div className="space-y-3">
              {resourceLinks.map(renderLink)}
            </div>
          </div>

          {/* Column 4 - Contact */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Contact
            </h3>
            <div className="space-y-3">
              <a
                href="mailto:support@vroomxsafety.com"
                className="flex items-center gap-3 text-white/70 text-sm hover:text-white transition-colors"
              >
                <FiMail className="w-4 h-4 shrink-0" />
                support@vroomxsafety.com
              </a>
              <a
                href="tel:+15551234567"
                className="flex items-center gap-3 text-white/70 text-sm hover:text-white transition-colors"
              >
                <FiPhone className="w-4 h-4 shrink-0" />
                (555) 123-4567
              </a>
              <span className="flex items-center gap-3 text-white/70 text-sm">
                <FiMapPin className="w-4 h-4 shrink-0" />
                Atlanta, GA
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()} VroomX Safety. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-white/50 text-sm">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <span>|</span>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterDesign3;

import { Link } from 'react-router-dom';
import { FiTwitter, FiLinkedin, FiFacebook, FiInstagram } from 'react-icons/fi';
import VroomXLogo from '../../VroomXLogo';

const navLinks = [
  { label: 'Features', href: '#features', type: 'anchor' },
  { label: 'Pricing', to: '/pricing', type: 'link' },
  { label: 'CSA Checker', to: '/csa-checker', type: 'link' },
  { label: 'Blog', to: '/blog', type: 'link' },
  { label: 'Support', href: 'mailto:support@vroomxsafety.com', type: 'anchor' },
  { label: 'Privacy', to: '/privacy', type: 'link' },
  { label: 'Terms', to: '/terms', type: 'link' },
];

const socialLinks = [
  { icon: FiTwitter, href: '#', label: 'Twitter' },
  { icon: FiLinkedin, href: '#', label: 'LinkedIn' },
  { icon: FiFacebook, href: '#', label: 'Facebook' },
  { icon: FiInstagram, href: '#', label: 'Instagram' },
];

const FooterDesign2 = () => {
  return (
    <footer className="bg-white relative">
      {/* Gradient top border */}
      <div className="h-[2px] bg-gradient-to-r from-cta-500 via-cta-400 to-primary-500" />

      <div className="max-w-7xl mx-auto py-16 px-6 md:px-16">
        {/* Centered logo */}
        <div className="flex flex-col items-center">
          <VroomXLogo size="lg" showText={true} textColor="default" linkToHome={true} />
          <p className="text-gray-500 text-sm italic mt-3">
            Built for truckers who'd rather drive than file paperwork.
          </p>
        </div>

        {/* Navigation links with dot separators */}
        <nav className="mt-10 flex flex-wrap justify-center items-center gap-y-2">
          {navLinks.map((link, index) => (
            <span key={link.label} className="flex items-center">
              {index > 0 && (
                <span className="text-gray-300 mx-3 select-none" aria-hidden="true">&middot;</span>
              )}
              {link.type === 'link' ? (
                <Link
                  to={link.to}
                  className="text-gray-600 text-sm font-medium hover:text-cta-500 transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className="text-gray-600 text-sm font-medium hover:text-cta-500 transition-colors"
                >
                  {link.label}
                </a>
              )}
            </span>
          ))}
        </nav>

        {/* Social icons */}
        <div className="mt-8 flex justify-center items-center gap-3">
          {socialLinks.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-cta-500 hover:border-cta-500 transition-all"
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-xs">
            &copy; 2026 VroomX Safety. All rights reserved.
          </p>
          <p className="text-gray-300 text-xs mt-1">
            Trusted by carriers across America
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterDesign2;

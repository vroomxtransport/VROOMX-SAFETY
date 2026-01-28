import { Link } from 'react-router-dom';
import VroomXLogo from '../VroomXLogo';

const FooterSection = () => {
  return (
    <footer className="py-16 px-6 md:px-16 bg-primary-500 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Top Section - Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <VroomXLogo size="md" showText={true} textColor="light" animate={true} linkToHome={true} />
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              AI-powered FMCSA compliance made simple for owner-operators and small fleets.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-white/70 text-sm hover:text-white transition-colors">Features</a></li>
              <li><Link to="/pricing" className="text-white/70 text-sm hover:text-white transition-colors">Pricing</Link></li>
              <li><a href="#csa-checker" className="text-white/70 text-sm hover:text-white transition-colors">Free CSA Checker</a></li>
              <li><Link to="/api" className="text-white/70 text-sm hover:text-white transition-colors">API</Link></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-white font-bold mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><Link to="/blog" className="text-white/70 text-sm hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/fmcsa-guide" className="text-white/70 text-sm hover:text-white transition-colors">FMCSA Guide</Link></li>
              <li><Link to="/dataq-help" className="text-white/70 text-sm hover:text-white transition-colors">DataQ Help</Link></li>
              <li><Link to="/support" className="text-white/70 text-sm hover:text-white transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-white/70 text-sm hover:text-white transition-colors">About</Link></li>
              <li><a href="mailto:support@vroomxsafety.com" className="text-white/70 text-sm hover:text-white transition-colors">Contact</a></li>
              <li><Link to="/privacy" className="text-white/70 text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-white/70 text-sm hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/70 text-sm">
            &copy; 2026 VroomX Safety. All rights reserved.
          </p>
          <p className="text-white/70 text-sm">
            Made with <span className="text-cta-400">❤️</span> for truckers
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;

import { Link } from 'react-router-dom';
import { FiCheck, FiArrowRight } from 'react-icons/fi';
import VroomXLogo from '../VroomXLogo';

const BlogFooter = () => {
  return (
    <>
      {/* Final CTA Section */}
      <section className="py-32 px-6 md:px-16 text-center relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-primary-500/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-primary-500 mb-8 tracking-tight font-heading">
            Ready to Simplify <span className="text-cta-500">Compliance?</span>
          </h2>
          <p className="text-xl text-[#475569] mb-10 max-w-xl mx-auto">
            Join hundreds of owner-operators and small fleets who trust VroomX to keep them FMCSA compliant.
          </p>
          <Link
            to="/register"
            className="btn-glow px-12 py-5 rounded-full font-bold text-white text-lg inline-flex items-center gap-2 mb-6"
          >
            Start Your Free 3-Day Trial
            <FiArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#475569]">
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-success-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-success-500" />
              Setup in 10 minutes
            </span>
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-success-500" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 md:px-16 bg-primary-500 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Top Section - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <VroomXLogo size="md" showText={true} textColor="light" animate={true} linkToHome={true} />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                AI-powered FMCSA compliance made simple for owner-operators and small fleets.
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link to="/#features" className="text-gray-400 text-sm hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/#pricing" className="text-gray-400 text-sm hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/#csa-checker" className="text-gray-400 text-sm hover:text-white transition-colors">Free CSA Checker</Link></li>
                <li><Link to="/api" className="text-gray-400 text-sm hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><Link to="/blog" className="text-gray-400 text-sm hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/fmcsa-guide" className="text-gray-400 text-sm hover:text-white transition-colors">FMCSA Guide</Link></li>
                <li><Link to="/dataq-help" className="text-gray-400 text-sm hover:text-white transition-colors">DataQ Help</Link></li>
                <li><Link to="/support" className="text-gray-400 text-sm hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-gray-400 text-sm hover:text-white transition-colors">About</Link></li>
                <li><Link to="/contact" className="text-gray-400 text-sm hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/privacy" className="text-gray-400 text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-400 text-sm hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; 2026 VroomX Safety. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm">
              Made with <span className="text-cta-500">❤️</span> for truckers
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default BlogFooter;

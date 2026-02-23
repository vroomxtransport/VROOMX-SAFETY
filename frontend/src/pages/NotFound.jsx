import { Link } from 'react-router-dom';
import { FiShield, FiSearch, FiHome, FiArrowRight } from 'react-icons/fi';

function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Shield Icon */}
        <div className="mx-auto w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mb-6">
          <FiShield className="w-10 h-10 text-primary-500" />
        </div>

        {/* Error Code */}
        <h1 className="text-7xl font-extrabold text-primary-500 mb-2 font-display tracking-tight">404</h1>

        {/* Branded Message */}
        <h2 className="text-2xl font-bold text-zinc-800 mb-3 font-heading">
          Compliance Record Not Found
        </h2>
        <p className="text-zinc-500 mb-8 text-lg leading-relaxed">
          We track every driver document and expiration date, but we couldn't find this page.
          It may have been moved or no longer exists.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-cta-500 hover:bg-cta-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-cta-500/25"
          >
            <FiHome className="w-4 h-4" />
            Protect My Fleet
          </Link>
          <Link
            to="/csa-checker"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold rounded-xl border border-zinc-200 transition-colors"
          >
            <FiSearch className="w-4 h-4" />
            Check CSA Score
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="pt-6 border-t border-zinc-200">
          <p className="text-sm text-zinc-400 mb-3">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/pricing" className="text-primary-500 hover:text-primary-600 inline-flex items-center gap-1">
              Pricing <FiArrowRight className="w-3 h-3" />
            </Link>
            <Link to="/platform" className="text-primary-500 hover:text-primary-600 inline-flex items-center gap-1">
              How It Works <FiArrowRight className="w-3 h-3" />
            </Link>
            <Link to="/blog" className="text-primary-500 hover:text-primary-600 inline-flex items-center gap-1">
              Blog <FiArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;

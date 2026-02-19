import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiMail, FiLock, FiUser, FiHash, FiEye, FiEyeOff,
  FiShield, FiCheckCircle, FiArrowRight, FiBriefcase, FiClock, FiAward,
  FiAlertCircle, FiLoader
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import VroomXLogo from '../components/VroomXLogo';
import api from '../utils/api';
import useForceLightMode from '../hooks/useForceLightMode';

const Register = () => {
  useForceLightMode();

  const selectedPlan = 'complete';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    dotNumber: '',
    mcNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // FMCSA lookup state
  const [dotLookupStatus, setDotLookupStatus] = useState('idle'); // idle, loading, verified, not_found, error
  const [fmcsaData, setFmcsaData] = useState(null);

  // Debounced DOT lookup
  const lookupDOT = useCallback(async (dotNumber) => {
    const cleaned = dotNumber.replace(/[^0-9]/g, '');

    if (!cleaned || cleaned.length < 5) {
      setDotLookupStatus('idle');
      setFmcsaData(null);
      return;
    }

    setDotLookupStatus('loading');

    try {
      const response = await api.get(`/fmcsa/lookup/${cleaned}`);

      if (response.data.success && response.data.carrier) {
        setFmcsaData(response.data.carrier);
        setDotLookupStatus('verified');

        // Auto-fill company name if empty or different
        if (!formData.companyName || formData.companyName !== response.data.carrier.legalName) {
          setFormData(prev => ({
            ...prev,
            companyName: response.data.carrier.legalName || prev.companyName,
            mcNumber: response.data.carrier.mcNumber ? `MC-${response.data.carrier.mcNumber}` : prev.mcNumber
          }));
        }

        toast.success(`Verified: ${response.data.carrier.legalName}`, { duration: 3000 });
      } else {
        setDotLookupStatus('not_found');
        setFmcsaData(null);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setDotLookupStatus('not_found');
      } else {
        setDotLookupStatus('error');
      }
      setFmcsaData(null);
    }
  }, [formData.companyName]);

  // Debounce DOT lookup (500ms after typing stops)
  useEffect(() => {
    const cleaned = formData.dotNumber.replace(/[^0-9]/g, '');

    if (cleaned.length >= 5 && cleaned.length <= 8) {
      const timer = setTimeout(() => {
        lookupDOT(formData.dotNumber);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setDotLookupStatus('idle');
      setFmcsaData(null);
    }
  }, [formData.dotNumber, lookupDOT]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Password complexity validation
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('one special character');
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password complexity
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      toast.error(`Password must contain ${passwordErrors.join(', ')}`);
      return;
    }

    setLoading(true);

    try {
      // Include FMCSA verification status and selected plan in registration
      const registrationData = {
        ...formData,
        fmcsaVerified: dotLookupStatus === 'verified',
        fmcsaData: fmcsaData,
        selectedPlan: selectedPlan
      };

      await register(registrationData);
      toast.success('Account created successfully!');
      navigate('/app/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message
        || error.response?.data?.errors?.map(e => e.msg).join(', ')
        || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // DOT field status indicator
  const getDotStatusIndicator = () => {
    switch (dotLookupStatus) {
      case 'loading':
        return (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <FiLoader className="w-4 h-4 text-cta-500 animate-spin" />
            <span className="text-xs text-zinc-400 dark:text-zinc-400">Verifying...</span>
          </div>
        );
      case 'verified':
        return (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <FiCheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600 font-medium">Verified</span>
          </div>
        );
      case 'not_found':
        return (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <FiAlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-amber-600">Not found</span>
          </div>
        );
      case 'error':
        return (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <FiAlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-600">Error</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F8FAFC] via-white to-[#F1F5F9]" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

        {/* Animated blobs */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary-500/10 blur-[120px] rounded-full animate-blob" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-cta-500/8 blur-[120px] rounded-full animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-[550px] h-[550px] bg-primary-300/12 blur-[120px] rounded-full animate-blob" style={{ animationDelay: '4s' }} />

        {/* Subtle radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-white/50" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-12">
        {/* Logo */}
        <div className="mb-6 animate-fade-in-up">
          <VroomXLogo size="lg" showText={true} animate={true} linkToHome={true} />
        </div>

        {/* Hero Text */}
        <div className="text-center mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-500 mb-3 font-heading tracking-tight">
            Start Your 7-Day Free Trial
          </h1>
          <p className="text-zinc-600 text-lg max-w-lg mx-auto">
            Join 500+ carriers managing their FMCSA compliance with VroomX Safety
          </p>
        </div>

        {/* Benefits Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          {[
            { icon: FiCheckCircle, text: 'No credit card required' },
            { icon: FiClock, text: 'Setup in 5 minutes' },
            { icon: FiAward, text: '7-day free trial' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-[#E2E8F0] text-sm text-zinc-600"
            >
              <item.icon className="w-4 h-4 text-cta-500" />
              <span className="font-medium">{item.text}</span>
            </div>
          ))}
        </div>

        {/* One-time pricing hint */}
        <div className="w-full max-w-2xl mx-auto mb-4 animate-fade-in-up" style={{ animationDelay: '0.18s' }}>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-3 flex items-center justify-center gap-2 flex-wrap text-sm">
            <span className="text-emerald-700 font-semibold">💰</span>
            <span className="text-zinc-700">Launch special: $249 one-time payment after your free trial — full access forever, no monthly fees.</span>
          </div>
        </div>

        {/* Glassmorphic Form Card */}
        <div
          className="w-full max-w-2xl mx-auto animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="relative">
            {/* Card shine effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 via-cta-500/10 to-primary-500/20 rounded-3xl blur-xl opacity-50" />

            {/* Main card */}
            <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-[#E2E8F0] shadow-xl p-8">
              {/* Inner shine */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Section: Personal Info */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-primary-500" />
                  </div>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Personal Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      className="w-full px-4 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all duration-200"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      className="w-full px-4 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all duration-200"
                      placeholder="Smith"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-400 group-focus-within:text-primary-500 transition-colors">
                      <FiMail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      className="w-full pl-12 pr-4 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all duration-200"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-400 group-focus-within:text-primary-500 transition-colors">
                        <FiLock className="w-5 h-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        className="w-full pl-12 pr-12 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all duration-200"
                        placeholder="8+ chars, upper, lower, number, special"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-400 hover:text-primary-500 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        className="w-full px-4 pr-12 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all duration-200"
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-400 hover:text-primary-500 transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E2E8F0]"></div>
                  </div>
                </div>

                {/* Section: Company Info */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-cta-50 flex items-center justify-center">
                    <FiBriefcase className="w-4 h-4 text-cta-500" />
                  </div>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Company Information</span>
                </div>

                {/* DOT Number - with FMCSA auto-lookup */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                      DOT Number <span className="text-cta-500">*</span>
                      {dotLookupStatus === 'verified' && (
                        <span className="ml-2 text-xs text-green-600 font-normal">Auto-fills company info</span>
                      )}
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-400 group-focus-within:text-cta-500 transition-colors">
                        <FiHash className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        name="dotNumber"
                        className={`w-full pl-12 pr-28 py-3.5 bg-[#F8FAFC] border rounded-xl text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 ${
                          dotLookupStatus === 'verified'
                            ? 'border-green-400 focus:border-green-500 focus:ring-green-500/20'
                            : dotLookupStatus === 'not_found'
                            ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500/20'
                            : 'border-[#E2E8F0] focus:border-cta-500/50 focus:ring-cta-500/20'
                        }`}
                        placeholder="Enter your DOT number"
                        value={formData.dotNumber}
                        onChange={handleChange}
                        required
                        pattern="\d{5,8}"
                        title="DOT number must be 5-8 digits"
                      />
                      {getDotStatusIndicator()}
                    </div>
                    {dotLookupStatus === 'not_found' && (
                      <p className="mt-1.5 text-xs text-amber-600">
                        Carrier not found in FMCSA. You can still register manually.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                      MC Number <span className="text-zinc-400 dark:text-zinc-400 text-xs font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="mcNumber"
                      className="w-full px-4 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all duration-200"
                      placeholder="MC-123456"
                      value={formData.mcNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Company Name - auto-filled from FMCSA */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                    Company Name
                    {dotLookupStatus === 'verified' && fmcsaData?.legalName && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600 font-normal">
                        <FiCheckCircle className="w-3 h-3" />
                        From FMCSA
                      </span>
                    )}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-400 group-focus-within:text-cta-500 transition-colors">
                      <FiBriefcase className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      name="companyName"
                      className={`w-full pl-12 pr-4 py-3.5 border rounded-xl text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 ${
                        dotLookupStatus === 'verified' && fmcsaData?.legalName
                          ? 'bg-green-50 border-green-200 focus:border-green-500 focus:ring-green-500/20'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] focus:border-cta-500/50 focus:ring-cta-500/20'
                      }`}
                      placeholder="ABC Trucking LLC"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {dotLookupStatus === 'verified' && fmcsaData && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-800 font-medium flex items-center gap-1.5">
                        <FiCheckCircle className="w-3.5 h-3.5" />
                        Verified with FMCSA
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Status: <span className="font-medium">{fmcsaData.operatingStatus || 'ACTIVE'}</span>
                        {fmcsaData.fleetSize?.powerUnits && (
                          <> • Fleet: <span className="font-medium">{fmcsaData.fleetSize.powerUnits} units</span></>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Terms notice */}
                <p className="text-xs text-zinc-400 dark:text-zinc-400 mt-4">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="text-primary-500 hover:text-primary-600 underline transition-colors">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-primary-500 hover:text-primary-600 underline transition-colors">Privacy Policy</a>.
                </p>

                {/* Submit button */}
                <button
                  type="submit"
                  className="btn-glow w-full py-4 mt-3 rounded-xl font-bold text-white text-base tracking-wide flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      Start My Free Trial
                      <FiArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sign in link */}
        <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          Already have an account?{' '}
          <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold transition-colors">
            Sign in
          </Link>
        </p>

        {/* Trust Badges */}
        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-6 md:gap-10 animate-fade-in-up"
          style={{ animationDelay: '0.35s' }}
        >
          <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-400">
            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
              <FiLock className="w-4 h-4 text-primary-500" />
            </div>
            <span className="text-sm font-medium">SSL Secure</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-400">
            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
              <FiShield className="w-4 h-4 text-primary-500" />
            </div>
            <span className="text-sm font-medium">FMCSA Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-400">
            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
              <FiCheckCircle className="w-4 h-4 text-primary-500" />
            </div>
            <span className="text-sm font-medium">99.9% Uptime</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

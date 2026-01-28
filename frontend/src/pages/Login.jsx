import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiCheckCircle, FiArrowRight, FiTruck, FiClock } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import VroomXLogo from '../components/VroomXLogo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const lockoutTimer = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for rate limit lockout
  useEffect(() => {
    if (lockoutSeconds > 0) {
      lockoutTimer.current = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(lockoutTimer.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(lockoutTimer.current);
  }, [lockoutSeconds > 0]);

  const formatCountdown = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return mins > 0
      ? `${mins}:${secs.toString().padStart(2, '0')}`
      : `${secs}s`;
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Enter your email address first');
      return;
    }
    setForgotLoading(true);
    try {
      await authAPI.forgotPassword(email);
      toast.success('If that email exists, a reset link has been sent');
    } catch (error) {
      toast.success('If that email exists, a reset link has been sent');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      navigate('/app/dashboard');
    } catch (error) {
      if (error.response?.status === 429) {
        const resetHeader = error.response.headers['ratelimit-reset'];
        let seconds = 15 * 60; // fallback: 15 minutes
        if (resetHeader) {
          const resetTime = Number(resetHeader);
          // express-rate-limit standardHeaders sends seconds remaining
          seconds = resetTime > Date.now() / 1000
            ? Math.ceil(resetTime - Date.now() / 1000)
            : Math.max(resetTime, 1);
        }
        setLockoutSeconds(seconds);
        toast.error(`Too many attempts. Try again in ${formatCountdown(seconds)}`);
      } else {
        toast.error(error.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
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
        <div className="mb-8 animate-fade-in-up">
          <VroomXLogo size="lg" showText={true} animate={true} linkToHome={true} />
        </div>

        {/* Hero Text */}
        <div className="text-center mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-500 mb-3 font-heading tracking-tight">
            Welcome Back
          </h1>
          <p className="text-zinc-600 dark:text-zinc-300 text-lg max-w-md mx-auto">
            Sign in to continue managing your fleet's compliance
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div
          className="w-full max-w-md mx-auto animate-fade-in-up"
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
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-400 group-focus-within:text-primary-500 transition-colors">
                      <FiMail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      className="w-full pl-12 pr-4 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all duration-200"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-400 group-focus-within:text-primary-500 transition-colors">
                      <FiLock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-12 pr-12 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all duration-200"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-400 hover:text-primary-500 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={forgotLoading}
                      className="text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors disabled:opacity-50"
                    >
                      {forgotLoading ? 'Sending...' : 'Forgot password?'}
                    </button>
                  </div>
                </div>

                {/* Rate limit warning */}
                {lockoutSeconds > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <FiClock className="w-4 h-4 flex-shrink-0" />
                    <span>Too many attempts. Try again in <strong>{formatCountdown(lockoutSeconds)}</strong></span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  className={`w-full py-4 mt-3 rounded-xl font-bold text-white text-base tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all duration-300 ${
                    lockoutSeconds > 0
                      ? 'bg-zinc-400 cursor-not-allowed'
                      : 'btn-glow hover:shadow-xl'
                  }`}
                  disabled={loading || lockoutSeconds > 0}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : lockoutSeconds > 0 ? (
                    <>
                      <FiClock className="w-5 h-5" />
                      Locked ({formatCountdown(lockoutSeconds)})
                    </>
                  ) : (
                    <>
                      Sign In
                      <FiArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E2E8F0]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-zinc-400 dark:text-zinc-400 font-medium">New to VroomX Safety?</span>
                </div>
              </div>

              {/* Register link */}
              <Link
                to="/register"
                className="w-full py-3.5 rounded-xl font-semibold text-center border-2 border-primary-500/20 text-primary-500 hover:bg-primary-50 hover:border-primary-500/40 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                Create an account
                <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div
          className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10 animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
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
            <span className="text-sm font-medium">256-bit Encryption</span>
          </div>
        </div>

        {/* Bottom link */}
        <p className="mt-8 text-sm text-zinc-400 dark:text-zinc-400 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          Need help?{' '}
          <a href="mailto:support@vroomxsafety.com" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;

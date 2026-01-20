import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <img
          src="https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          alt="Truck Background"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/80 to-black" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        {/* Animated Blob */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-500/20 blur-[100px] rounded-full animate-blob" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary-600/10 blur-[80px] rounded-full animate-blob" style={{ animationDelay: '3s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="mb-10">
            <div className="w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center shadow-glow">
              <FiShield className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight font-heading">
            Stay Compliant.
            <br />
            <span className="text-primary-500">Stay on the Road.</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-md mb-10">
            FMCSA compliance management built for modern trucking operations. Track drivers, vehicles, and violations in one place.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {[
              'Driver Qualification Files (DQF)',
              'Vehicle Maintenance Tracking',
              'SMS BASICs Monitoring',
              'Audit-Ready Reports'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-400">
                <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <FiCheckCircle className="w-4 h-4 text-primary-400" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex items-center gap-6 text-zinc-500">
            <div className="flex items-center gap-2">
              <FiShield className="w-5 h-5 text-primary-500" />
              <span className="text-sm">256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="w-5 h-5 text-primary-500" />
              <span className="text-sm">FMCSA Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-zinc-100 dark:bg-black">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-glow-sm">
              <FiShield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-900 dark:text-white font-heading">VroomX Safety</h1>
              <p className="text-xs text-primary-500">FMCSA Management</p>
            </div>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 font-heading">Welcome back</h2>
            <p className="text-zinc-500 dark:text-zinc-400">Sign in to your account to continue</p>
          </div>

          {/* Form card */}
          <div className="bg-white dark:glass-card rounded-2xl p-8 shadow-lg border border-zinc-200 dark:border-white/5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                  <input
                    type="email"
                    className="form-input pl-12"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input pl-12 pr-12"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="btn-glow w-full py-3 mt-2 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    Sign In
                    <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-surface-200 text-zinc-400">New to VroomX Safety?</span>
              </div>
            </div>

            {/* Register link */}
            <Link
              to="/register"
              className="w-full py-3 rounded-xl font-semibold text-center border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center"
            >
              Create an account
            </Link>
          </div>

          {/* Demo hint */}
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Register a new company account to get started
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

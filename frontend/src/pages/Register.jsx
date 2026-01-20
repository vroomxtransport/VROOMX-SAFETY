import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiMail, FiLock, FiUser, FiHash, FiEye, FiEyeOff,
  FiShield, FiCheckCircle, FiArrowRight, FiBriefcase
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const Register = () => {
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
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
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary-500/20 blur-[100px] rounded-full animate-blob" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary-600/10 blur-[80px] rounded-full animate-blob" style={{ animationDelay: '3s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-10 xl:px-16">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-14 h-14 bg-primary-500 rounded-xl flex items-center justify-center shadow-glow">
              <FiShield className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-3xl xl:text-4xl font-bold text-white mb-4 leading-tight font-heading">
            Start Your
            <br />
            <span className="text-primary-500">Compliance Journey</span>
          </h2>
          <p className="text-zinc-400 text-base max-w-sm mb-8">
            Join thousands of carriers managing their FMCSA compliance efficiently and staying audit-ready.
          </p>

          {/* Benefits list */}
          <div className="space-y-3">
            {[
              'Free 14-day trial',
              'No credit card required',
              'Setup in under 5 minutes',
              'Cancel anytime'
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-400">
                <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <FiCheckCircle className="w-3 h-3 text-primary-400" />
                </div>
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex items-center gap-4 text-zinc-500">
            <div className="flex items-center gap-2">
              <FiShield className="w-4 h-4 text-primary-500" />
              <span className="text-xs">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-primary-500" />
              <span className="text-xs">99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-zinc-100 dark:bg-black overflow-y-auto">
        <div className="w-full max-w-xl py-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-primary-500 rounded-xl flex items-center justify-center shadow-glow-sm">
              <FiShield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-900 dark:text-white font-heading">VroomX Safety</h1>
              <p className="text-xs text-primary-500">FMCSA Management</p>
            </div>
          </div>

          {/* Form header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1 font-heading">Create your account</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Fill in your details to get started</p>
          </div>

          {/* Form card */}
          <div className="bg-white dark:glass-card rounded-2xl p-6 sm:p-8 shadow-lg border border-zinc-200 dark:border-white/5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Section: Personal Info */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-white/10 flex items-center justify-center">
                  <FiUser className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
                </div>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Personal Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    className="form-input"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    className="form-input"
                    placeholder="Smith"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input
                    type="email"
                    name="email"
                    className="form-input pl-10"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="form-input pl-10 pr-10"
                      placeholder="Min 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      className="form-input pr-10"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-white/10"></div>
                </div>
              </div>

              {/* Section: Company Info */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center">
                  <FiBriefcase className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400" />
                </div>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Company Information</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Company Name
                </label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input
                    type="text"
                    name="companyName"
                    className="form-input pl-10"
                    placeholder="ABC Trucking LLC"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    DOT Number <span className="text-danger-500">*</span>
                  </label>
                  <div className="relative">
                    <FiHash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                    <input
                      type="text"
                      name="dotNumber"
                      className="form-input pl-10"
                      placeholder="1234567"
                      value={formData.dotNumber}
                      onChange={handleChange}
                      required
                      pattern="\d{5,8}"
                      title="DOT number must be 5-8 digits"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    MC Number <span className="text-zinc-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="mcNumber"
                    className="form-input"
                    placeholder="MC-123456"
                    value={formData.mcNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Terms notice */}
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white underline">Privacy Policy</a>.
              </p>

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
                    Create Account
                    <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sign in link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Already have an account?{' '}
              <Link to="/login" className="text-zinc-700 dark:text-white hover:text-zinc-900 dark:hover:text-primary-400 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { FiCheckCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import VroomXLogo from '../components/VroomXLogo';
import useForceLightMode from '../hooks/useForceLightMode';

const VerifyEmail = () => {
  useForceLightMode();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const res = await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(res.data?.message || 'Email verified successfully!');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Invalid or expired verification link.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6 py-12">
      <div className="mb-8">
        <VroomXLogo size="lg" showText={true} linkToHome={true} />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-zinc-600">Verifying your email...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">Email Verified!</h2>
              <p className="text-zinc-600 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors"
              >
                Sign In <FiArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">Verification Failed</h2>
              <p className="text-zinc-600 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-primary-500 border-2 border-primary-500/20 hover:bg-primary-50 transition-colors"
              >
                Go to Login <FiArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

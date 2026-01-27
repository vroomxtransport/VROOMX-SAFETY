import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { invitationsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiCheckCircle, FiAlertCircle, FiArrowRight, FiUsers } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import VroomXLogo from '../components/VroomXLogo';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No invitation token provided.');
    }
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate(`/login?redirect=/accept-invitation?token=${token}`);
      return;
    }

    setStatus('loading');
    try {
      const res = await invitationsAPI.accept(token);
      setStatus('success');
      setMessage(res.data?.message || 'Invitation accepted! You have been added to the company.');
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Invalid or expired invitation link.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6 py-12">
      <div className="mb-8">
        <VroomXLogo size="lg" showText={true} linkToHome={true} />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-8 text-center">
          {status === 'idle' && token && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <FiUsers className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">Company Invitation</h2>
              <p className="text-zinc-600 mb-6">
                {isAuthenticated
                  ? "You've been invited to join a company on VroomX Safety. Click below to accept."
                  : "You've been invited to join a company. Please sign in first to accept the invitation."}
              </p>
              <button
                onClick={handleAccept}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors"
              >
                {isAuthenticated ? 'Accept Invitation' : 'Sign In to Accept'} <FiArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {status === 'loading' && (
            <>
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-zinc-600">Accepting invitation...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">Welcome to the Team!</h2>
              <p className="text-zinc-600 mb-6">{message}</p>
              <Link
                to="/app/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors"
              >
                Go to Dashboard <FiArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">Invitation Error</h2>
              <p className="text-zinc-600 mb-6">{message}</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-primary-500 border-2 border-primary-500/20 hover:bg-primary-50 transition-colors"
              >
                Go Home <FiArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;

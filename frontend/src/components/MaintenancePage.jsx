import { useState, useEffect } from 'react';
import { FiTool } from 'react-icons/fi';
import VroomXLogo from './VroomXLogo';

const MaintenancePage = ({ message }) => {
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setChecking(true);
        const response = await fetch('/health');
        if (response.ok) {
          window.location.href = '/app/dashboard';
        }
      } catch {
        // Server still down, keep waiting
      } finally {
        setChecking(false);
      }
    };

    // Check every 60 seconds
    const interval = setInterval(checkHealth, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <VroomXLogo size="lg" showText={true} />
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
            <FiTool className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          We're performing scheduled maintenance
        </h1>

        {/* Message */}
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          {message || 'Our team is working on improving VroomX. This should only take a few minutes.'}
        </p>

        {/* Subtext */}
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          We'll be back shortly. This page will automatically refresh when we're ready.
        </p>

        {/* Loading indicator */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500">
            {checking ? (
              <span>Checking server status...</span>
            ) : (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Auto-checking every 60 seconds</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;

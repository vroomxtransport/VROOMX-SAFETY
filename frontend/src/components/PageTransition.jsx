import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Page transition loading bar
 * Shows a smooth loading animation at the top of the page when navigating
 */
const PageTransition = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start loading animation
    setLoading(true);
    setProgress(0);

    // Animate progress
    const timer1 = setTimeout(() => setProgress(30), 50);
    const timer2 = setTimeout(() => setProgress(60), 150);
    const timer3 = setTimeout(() => setProgress(80), 300);
    const timer4 = setTimeout(() => setProgress(100), 400);
    const timer5 = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-cta-500 via-cta-400 to-cta-500 transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(249, 115, 22, 0.7), 0 0 5px rgba(249, 115, 22, 0.5)'
        }}
      />
    </div>
  );
};

export default PageTransition;

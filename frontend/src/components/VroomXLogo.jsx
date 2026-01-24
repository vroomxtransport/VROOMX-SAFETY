import { Link } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';

/**
 * VroomX Safety Logo Component
 *
 * @param {string} size - "sm" | "md" | "lg" | "xl" - Controls icon and text size
 * @param {boolean} showText - Whether to show "VroomX Safety" text
 * @param {boolean} animate - Whether to animate the spinner
 * @param {boolean} linkToHome - Whether to wrap in Link to "/"
 * @param {string} className - Additional classes for the container
 */
const VroomXLogo = ({
  size = 'md',
  showText = true,
  animate = true,
  linkToHome = true,
  className = ''
}) => {
  // Size configurations
  const sizes = {
    sm: {
      container: 'w-8 h-8',
      svg: 'w-8 h-8',
      inner: 'w-5 h-5',
      icon: 'w-3 h-3',
      text: 'text-base',
      gap: 'gap-2'
    },
    md: {
      container: 'w-10 h-10',
      svg: 'w-10 h-10',
      inner: 'w-6 h-6',
      icon: 'w-4 h-4',
      text: 'text-xl',
      gap: 'gap-3'
    },
    lg: {
      container: 'w-14 h-14',
      svg: 'w-14 h-14',
      inner: 'w-8 h-8',
      icon: 'w-5 h-5',
      text: 'text-2xl',
      gap: 'gap-3'
    },
    xl: {
      container: 'w-16 h-16',
      svg: 'w-16 h-16',
      inner: 'w-10 h-10',
      icon: 'w-6 h-6',
      text: 'text-3xl',
      gap: 'gap-4'
    }
  };

  const sizeConfig = sizes[size] || sizes.md;

  const LogoContent = () => (
    <div className={`flex items-center ${sizeConfig.gap} ${className}`}>
      {/* Animated Spinner + Checkmark Icon */}
      <div className={`relative ${sizeConfig.container} flex items-center justify-center flex-shrink-0`}>
        {/* Outer spinning ring */}
        <svg
          className={`${sizeConfig.svg} absolute text-primary-500 dark:text-white ${animate ? 'animate-spin-slow' : ''}`}
          viewBox="0 0 100 100"
          fill="none"
        >
          <path
            d="M50 10 L50 20 M50 80 L50 90 M10 50 L20 50 M80 50 L90 50"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r="35"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 6"
          />
        </svg>
        {/* Center checkmark icon */}
        <div className={`${sizeConfig.inner} bg-primary-500 rounded-full flex items-center justify-center shadow-glow`}>
          <FiCheckCircle className={`${sizeConfig.icon} text-white`} />
        </div>
      </div>

      {/* Text */}
      {showText && (
        <div className={`${sizeConfig.text} font-bold tracking-tight font-heading text-primary-500 dark:text-white`}>
          VroomX <span className="text-cta-500 dark:text-cta-400">Safety</span>
        </div>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="flex items-center group">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
};

export default VroomXLogo;

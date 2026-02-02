import { Link } from 'react-router-dom';

/**
 * VroomX Safety Logo Component
 *
 * Uses the official VroomX Safety logo image
 *
 * @param {string} size - "sm" | "md" | "lg" | "xl" - Controls logo size
 * @param {boolean} showText - Whether to show full logo with "Safety" text
 * @param {string} textColor - "default" | "light" - Color scheme (light = inverted for dark backgrounds)
 * @param {boolean} linkToHome - Whether to wrap in Link to "/"
 * @param {string} className - Additional classes for the container
 */
const VroomXLogo = ({
  size = 'md',
  showText = true,
  textColor = 'default',
  linkToHome = true,
  className = ''
}) => {
  // Size configurations - width in pixels, height auto-scales
  const sizes = {
    sm: 120,
    md: 160,
    lg: 200,
    xl: 260
  };

  const width = sizes[size] || sizes.md;

  // For light text color (dark backgrounds), we invert the logo
  // For default, we show normal in light mode and inverted in dark mode
  // mix-blend-mode: multiply makes white background transparent on light backgrounds
  // mix-blend-mode: screen makes black transparent on dark backgrounds (after invert)
  const filterClass = textColor === 'light'
    ? 'brightness-0 invert mix-blend-screen' // White logo on dark bg
    : 'mix-blend-multiply dark:brightness-0 dark:invert dark:mix-blend-screen'; // Auto dark mode

  const LogoContent = () => (
    <div className={`flex items-center ${className}`}>
      <img
        src="/images/vroomx-logo.png"
        alt="VroomX Safety"
        width={width}
        className={`h-auto ${filterClass}`}
        style={{
          maxHeight: size === 'sm' ? '40px' : size === 'md' ? '52px' : size === 'lg' ? '65px' : '85px'
        }}
      />
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

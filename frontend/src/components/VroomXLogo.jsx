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

  // Map size to appropriate optimized image file
  const getLogoSrc = () => {
    switch (size) {
      case 'xl':
        return '/images/full_logo_large.png';  // 1200×555
      case 'lg':
        return '/images/full_logo_medium.png'; // 600×277
      default:
        return '/images/full_logo_small.png';  // 300×138 for sm, md
    }
  };

  const width = sizes[size] || sizes.md;

  // Logo has white/light text - make it dark on light backgrounds
  // textColor='light' = on dark bg, keep logo white (no filter)
  // textColor='default' = light mode needs dark logo, dark mode keeps white
  const filterClass = textColor === 'light'
    ? '' // Dark background - keep logo white
    : 'brightness-0 dark:brightness-100'; // Light bg: black, dark mode: original white

  const LogoContent = () => (
    <div className={`flex items-center ${className}`}>
      <img
        src={getLogoSrc()}
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

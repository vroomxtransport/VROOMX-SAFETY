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
  // textColor='light' = dark background, use white-text logos
  // textColor='default' = light background, use navy-text logos (dark mode uses white-text)
  const getLogoSrc = (forDarkBg = false) => {
    const useWhiteLogo = forDarkBg || textColor === 'light';
    const prefix = useWhiteLogo ? 'full_logo' : 'full_logo_dark_orange_lines';

    switch (size) {
      case 'xl':
        return `/images/${prefix}_large.png`;
      case 'lg':
        return `/images/${prefix}_medium.png`;
      default:
        return `/images/${prefix}_small.png`;
    }
  };

  const width = sizes[size] || sizes.md;

  const LogoContent = () => (
    <div className={`flex items-center ${className}`}>
      {/* Light mode: navy logo, Dark mode: white logo */}
      {textColor === 'light' ? (
        <img
          src={getLogoSrc(true)}
          alt="VroomX Safety"
          width={width}
          className="h-auto"
          style={{
            maxHeight: size === 'sm' ? '40px' : size === 'md' ? '52px' : size === 'lg' ? '65px' : '85px'
          }}
        />
      ) : (
        <>
          <img
            src={getLogoSrc(false)}
            alt="VroomX Safety"
            width={width}
            className="h-auto dark:hidden"
            style={{
              maxHeight: size === 'sm' ? '40px' : size === 'md' ? '52px' : size === 'lg' ? '65px' : '85px'
            }}
          />
          <img
            src={getLogoSrc(true)}
            alt="VroomX Safety"
            width={width}
            className="h-auto hidden dark:block"
            style={{
              maxHeight: size === 'sm' ? '40px' : size === 'md' ? '52px' : size === 'lg' ? '65px' : '85px'
            }}
          />
        </>
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

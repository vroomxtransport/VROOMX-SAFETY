import { Link } from 'react-router-dom';

/**
 * VroomX Safety Logo Component
 *
 * New design featuring:
 * - Stylized "V" with speed lines extending left
 * - "roomX" with orange diagonal stripe through the X
 * - "Safety" text below
 *
 * @param {string} size - "sm" | "md" | "lg" | "xl" - Controls logo size
 * @param {boolean} showText - Whether to show "Safety" text (false = VroomX only)
 * @param {string} textColor - "default" | "light" - Color scheme
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
  // Size configurations for the SVG logo
  const sizes = {
    sm: { width: 130, height: showText ? 45 : 32 },
    md: { width: 170, height: showText ? 58 : 42 },
    lg: { width: 210, height: showText ? 72 : 52 },
    xl: { width: 280, height: showText ? 95 : 68 }
  };

  const sizeConfig = sizes[size] || sizes.md;

  // Determine fill colors based on textColor prop and dark mode
  // textColor="light" forces white (for dark backgrounds like footer)
  // textColor="default" uses navy for light mode, white for dark mode
  const textFillClass = textColor === 'light'
    ? 'fill-white'
    : 'fill-[#1a2744] dark:fill-white';

  const orangeFill = '#f97316';

  const LogoContent = () => (
    <div className={`flex items-center ${className}`}>
      <svg
        width={sizeConfig.width}
        height={sizeConfig.height}
        viewBox={showText ? "0 0 280 95" : "0 0 280 68"}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Speed lines extending left from V */}
        <g className={textFillClass}>
          <rect x="2" y="18" width="14" height="3" rx="1.5" />
          <rect x="0" y="26" width="20" height="3" rx="1.5" />
          <rect x="2" y="34" width="14" height="3" rx="1.5" />
        </g>

        {/* V shape - italic style */}
        <path
          d="M22 8 L44 58 L66 8 L56 8 L44 40 L32 8 Z"
          className={textFillClass}
        />

        {/* "r" */}
        <path
          d="M72 24 L72 58 L82 58 L82 38 C82 32 86 28 93 28 L93 20 C86 20 80 24 78 29 L78 24 Z"
          className={textFillClass}
        />

        {/* First "o" */}
        <path
          d="M98 39 C98 28 106 20 118 20 C130 20 138 28 138 39 C138 50 130 58 118 58 C106 58 98 50 98 39 Z M108 39 C108 46 112 51 118 51 C124 51 128 46 128 39 C128 32 124 27 118 27 C112 27 108 32 108 39 Z"
          className={textFillClass}
        />

        {/* Second "o" */}
        <path
          d="M142 39 C142 28 150 20 162 20 C174 20 182 28 182 39 C182 50 174 58 162 58 C150 58 142 50 142 39 Z M152 39 C152 46 156 51 162 51 C168 51 172 46 172 39 C172 32 168 27 162 27 C156 27 152 32 152 39 Z"
          className={textFillClass}
        />

        {/* "m" */}
        <path
          d="M188 24 L188 58 L198 58 L198 40 C198 34 201 30 208 30 C214 30 217 34 217 40 L217 58 L227 58 L227 40 C227 34 230 30 237 30 C243 30 246 34 246 40 L246 58 L256 58 L256 36 C256 26 250 20 240 20 C233 20 228 23 225 28 C222 23 217 20 210 20 C204 20 199 23 196 27 L196 24 Z"
          className={textFillClass}
        />

        {/* X - Navy parts */}
        <g className={textFillClass}>
          {/* X left stroke going down-right */}
          <path d="M262 8 L278 32 L274 38 L258 14 Z" />
          {/* X left stroke going up-right (bottom part) */}
          <path d="M262 58 L270 46 L276 52 L268 64 Z" />
        </g>

        {/* X - Orange diagonal stripe cutting through */}
        <path
          d="M258 52 L268 38 L280 8 L272 8 L262 32 L254 44 Z"
          fill={orangeFill}
        />

        {/* "Safety" text */}
        {showText && (
          <text
            x="175"
            y="82"
            className={textFillClass}
            style={{
              fontSize: '22px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: '500',
              letterSpacing: '0.02em'
            }}
            textAnchor="middle"
          >
            Safety
          </text>
        )}
      </svg>
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

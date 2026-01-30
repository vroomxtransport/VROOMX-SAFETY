import { Link } from 'react-router-dom';

/**
 * VroomX Safety Logo Component
 *
 * New design featuring:
 * - Stylized "V" with speed lines
 * - "roomX" with orange checkmark swoosh on the X
 * - "Safety" text below in italic
 *
 * @param {string} size - "sm" | "md" | "lg" | "xl" - Controls logo size
 * @param {boolean} showText - Whether to show full logo (false = icon only)
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
    sm: { width: 120, height: 40 },
    md: { width: 160, height: 52 },
    lg: { width: 200, height: 65 },
    xl: { width: 260, height: 85 }
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
        viewBox="0 0 260 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Speed lines on left of V */}
        <g className={textFillClass}>
          <rect x="0" y="22" width="12" height="3" rx="1.5" />
          <rect x="0" y="29" width="18" height="3" rx="1.5" />
          <rect x="0" y="36" width="12" height="3" rx="1.5" />
        </g>

        {/* V shape */}
        <path
          d="M18 15 L38 55 L58 15 L50 15 L38 42 L26 15 Z"
          className={textFillClass}
        />

        {/* "room" text */}
        <g className={textFillClass}>
          {/* r */}
          <path d="M62 28 L62 55 L69 55 L69 38 C69 33 72 30 77 30 L77 23 C72 23 68 26 66 30 L66 28 Z" />
          {/* o */}
          <path d="M80 41.5 C80 33 86 27 95 27 C104 27 110 33 110 41.5 C110 50 104 56 95 56 C86 56 80 50 80 41.5 Z M87 41.5 C87 46 90 49 95 49 C100 49 103 46 103 41.5 C103 37 100 34 95 34 C90 34 87 37 87 41.5 Z" />
          {/* o */}
          <path d="M114 41.5 C114 33 120 27 129 27 C138 27 144 33 144 41.5 C144 50 138 56 129 56 C120 56 114 50 114 41.5 Z M121 41.5 C121 46 124 49 129 49 C134 49 137 46 137 41.5 C137 37 134 34 129 34 C124 34 121 37 121 41.5 Z" />
          {/* m */}
          <path d="M148 28 L148 55 L155 55 L155 40 C155 36 157 33 162 33 C166 33 168 36 168 40 L168 55 L175 55 L175 40 C175 36 177 33 182 33 C186 33 188 36 188 40 L188 55 L195 55 L195 38 C195 31 191 27 184 27 C179 27 175 29 173 33 C171 29 167 27 162 27 C158 27 154 29 152 32 L152 28 Z" />
        </g>

        {/* X with orange checkmark swoosh */}
        <g>
          {/* X base - left part */}
          <path
            d="M200 15 L215 37 L200 55 L209 55 L220 40"
            className={textFillClass}
          />
          {/* X base - right part (partial) */}
          <path
            d="M240 15 L232 15 L225 26"
            className={textFillClass}
          />
          {/* Orange checkmark swoosh */}
          <path
            d="M218 45 L228 55 L255 20 L248 20 L228 46 L222 40 Z"
            fill={orangeFill}
          />
        </g>

        {/* "Safety" text - italic style */}
        {showText && (
          <text
            x="135"
            y="78"
            className={textFillClass}
            style={{
              fontSize: '24px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: '500',
              fontStyle: 'italic',
              letterSpacing: '0.05em'
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

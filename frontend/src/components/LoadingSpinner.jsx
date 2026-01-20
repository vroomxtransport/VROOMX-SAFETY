import { FiTruck } from 'react-icons/fi';

const LoadingSpinner = ({ size = 'md', variant = 'default', className = '' }) => {
  const sizeClasses = {
    sm: { spinner: 'w-5 h-5', border: 'border-2' },
    md: { spinner: 'w-8 h-8', border: 'border-[3px]' },
    lg: { spinner: 'w-12 h-12', border: 'border-4' },
    xl: { spinner: 'w-16 h-16', border: 'border-4' }
  };

  const sizes = sizeClasses[size];

  // Truck variant - branded loader
  if (variant === 'truck') {
    const truckSizes = {
      sm: 'w-6 h-6',
      md: 'w-10 h-10',
      lg: 'w-14 h-14',
      xl: 'w-20 h-20'
    };

    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="relative">
          <FiTruck className={`${truckSizes[size]} text-primary-600 animate-bounce`} />
        </div>
        <div className="w-16 h-1 bg-primary-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: '40%',
              background: 'linear-gradient(90deg, #f97316, #fb923c)',
              animation: 'shimmer 1.5s ease-in-out infinite'
            }}
          />
        </div>
      </div>
    );
  }

  // Dots variant - three bouncing dots
  if (variant === 'dots') {
    const dotSizes = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4'
    };

    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${dotSizes[size]} rounded-full bg-primary-500`}
            style={{
              animation: 'bounce 1s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
    );
  }

  // Default circular spinner with gradient
  return (
    <div className={`relative ${sizes.spinner} ${className}`}>
      {/* Track */}
      <div
        className={`absolute inset-0 rounded-full ${sizes.border} border-primary-200`}
      />
      {/* Spinner */}
      <div
        className={`absolute inset-0 rounded-full ${sizes.border} border-transparent animate-spin`}
        style={{
          borderTopColor: '#475569',
          borderRightColor: '#47556940'
        }}
      />
    </div>
  );
};

export default LoadingSpinner;

import { useEffect, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, icon: Icon, children, size = 'md', footer }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Trigger animation
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      document.body.style.overflow = 'unset';
      setIsAnimating(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = modalRef.current.querySelectorAll(focusableSelector);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      const elements = modalRef.current?.querySelectorAll(focusableSelector);
      if (!elements || elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-[calc(100vw-2rem)] sm:max-w-md',
    md: 'max-w-[calc(100vw-2rem)] sm:max-w-lg',
    lg: 'max-w-[calc(100vw-2rem)] sm:max-w-xl md:max-w-2xl',
    xl: 'max-w-[calc(100vw-2rem)] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl'
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 bg-primary-950/60 backdrop-blur-sm ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-white dark:bg-primary-800 rounded-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 shadow-2xl border border-primary-200/50 dark:border-primary-700 ${
          sizeClasses[size]
        } ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 border-b border-primary-100 dark:border-primary-700 bg-gradient-to-b from-white to-primary-50/50 dark:from-primary-800 dark:to-primary-900/50">
          {/* Gradient line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-300/50 dark:via-primary-600/50 to-transparent" />

          {/* Icon */}
          {Icon && (
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-700 text-primary-600 dark:text-primary-300">
              <Icon className="w-5 h-5" />
            </span>
          )}

          {/* Title */}
          <h3 className="flex-1 text-lg font-semibold text-primary-900 dark:text-primary-100">{title}</h3>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 text-primary-400 hover:text-primary-600 dark:hover:text-primary-200 hover:bg-primary-100 dark:hover:bg-primary-700 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-4 sm:px-6 sm:py-5 overflow-y-auto">
          {children}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-4 py-3 sm:px-6 sm:py-4 border-t border-primary-100 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;

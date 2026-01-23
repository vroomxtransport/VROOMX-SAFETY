import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for detecting when an element enters the viewport
 * @param {Object} options - Intersection Observer options
 * @param {number} options.threshold - Visibility threshold (0-1), default 0.1
 * @param {string} options.rootMargin - Margin around root, default "0px"
 * @param {boolean} options.triggerOnce - Only trigger once, default true
 * @returns {[React.RefObject, boolean]} - [ref to attach, isInView boolean]
 */
const useInView = (options = {}) => {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
  const [isInView, setIsInView] = useState(false);
  const ref = useRef(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Skip if already triggered and triggerOnce is true
    if (triggerOnce && hasTriggered.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          hasTriggered.current = true;

          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isInView];
};

export default useInView;

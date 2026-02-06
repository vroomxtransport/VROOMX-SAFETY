import { useLayoutEffect } from 'react';

const useForceLightMode = () => {
  useLayoutEffect(() => {
    const wasDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');
    return () => {
      if (wasDark) {
        document.documentElement.classList.add('dark');
      }
    };
  }, []);
};

export default useForceLightMode;

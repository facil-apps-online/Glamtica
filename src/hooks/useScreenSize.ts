
import { useState, useEffect } from 'react';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

type ScreenSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>('lg');

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      if (width < breakpoints.sm) {
        setScreenSize('sm');
      } else if (width >= breakpoints.sm && width < breakpoints.md) {
        setScreenSize('md');
      } else if (width >= breakpoints.md && width < breakpoints.lg) {
        setScreenSize('lg');
      } else if (width >= breakpoints.lg && width < breakpoints.xl) {
        setScreenSize('xl');
      } else {
        setScreenSize('2xl');
      }
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}

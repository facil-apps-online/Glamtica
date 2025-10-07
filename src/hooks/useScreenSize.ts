
import { useState, useEffect } from 'react';

const breakpoints = {
  sm: 640,
  md: 1024,
  lg: 1280,
};

type ScreenSize = 'mobile' | 'tablet' | 'desktop';

export function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      if (width < breakpoints.md) {
        setScreenSize('mobile');
      } else if (width >= breakpoints.md && width < breakpoints.lg) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Llamar al inicio para establecer el tamaño inicial

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}

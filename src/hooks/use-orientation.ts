import { useState, useEffect } from 'react';

export type Orientation = 'portrait' | 'landscape';

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  useEffect(() => {
    const getOrientation = (): Orientation => {
      if (typeof window === 'undefined') return 'portrait';
      return window.matchMedia("(orientation: landscape)").matches ? 'landscape' : 'portrait';
    };

    const handleOrientationChange = () => {
      setOrientation(getOrientation());
    };

    const mediaQuery = window.matchMedia("(orientation: landscape)");
    
    handleOrientationChange(); // Set initial orientation

    mediaQuery.addEventListener('change', handleOrientationChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleOrientationChange);
    };
  }, []);

  return orientation;
}

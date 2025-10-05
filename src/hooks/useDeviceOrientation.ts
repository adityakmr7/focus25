import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

interface DeviceOrientation {
  isLandscape: boolean;
  isPortrait: boolean;
  isTablet: boolean;
  screenWidth: number;
  screenHeight: number;
}

export const useDeviceOrientation = (): DeviceOrientation => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isLandscape = width > height;
  const isPortrait = height > width;
  const isTablet = Math.min(width, height) >= 768;

  return {
    isLandscape,
    isPortrait,
    isTablet,
    screenWidth: width,
    screenHeight: height,
  };
};

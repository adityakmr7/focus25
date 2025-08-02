import { Dimensions } from 'react-native';

interface ResponsiveConfig {
    phone: {
        portrait: string;
        landscape: string;
    };
    tablet: {
        portrait: string;
        landscape: string;
    };
}

export const getResponsiveValue = <T>(config: {
    phone?: T;
    tablet?: T;
    phonePortrait?: T;
    phoneLandscape?: T;
    tabletPortrait?: T;
    tabletLandscape?: T;
}): T => {
    const { width, height } = Dimensions.get('window');
    const isLandscape = width > height;
    const isTablet = Math.min(width, height) >= 768;

    if (isTablet) {
        if (isLandscape && config.tabletLandscape !== undefined) {
            return config.tabletLandscape;
        }
        if (!isLandscape && config.tabletPortrait !== undefined) {
            return config.tabletPortrait;
        }
        if (config.tablet !== undefined) {
            return config.tablet;
        }
    } else {
        if (isLandscape && config.phoneLandscape !== undefined) {
            return config.phoneLandscape;
        }
        if (!isLandscape && config.phonePortrait !== undefined) {
            return config.phonePortrait;
        }
        if (config.phone !== undefined) {
            return config.phone;
        }
    }

    // Fallback to the first available value
    return (
        config.phone ||
        config.tablet ||
        config.phonePortrait ||
        config.phoneLandscape ||
        config.tabletPortrait ||
        config.tabletLandscape
    ) as T;
};

export const responsiveStyles = (config: ResponsiveConfig) => {
    const { width, height } = Dimensions.get('window');
    const isLandscape = width > height;
    const isTablet = Math.min(width, height) >= 768;

    if (isTablet) {
        return isLandscape ? config.tablet.landscape : config.tablet.portrait;
    } else {
        return isLandscape ? config.phone.landscape : config.phone.portrait;
    }
};

export const deviceInfo = () => {
    const { width, height } = Dimensions.get('window');
    const isLandscape = width > height;
    const isTablet = Math.min(width, height) >= 768;
    
    return {
        isLandscape,
        isPortrait: !isLandscape,
        isTablet,
        isPhone: !isTablet,
        width,
        height,
    };
};
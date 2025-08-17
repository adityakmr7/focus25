const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Optimize for Android performance
config.transformer.minifierConfig = {
    ecma: 8,
    keep_fnames: true,
    mangle: {
        keep_fnames: true,
    },
};

// Enable Hermes for better Android performance
config.transformer.hermesCommand = 'hermes';

module.exports = withNativeWind(config, { input: './global.css' });

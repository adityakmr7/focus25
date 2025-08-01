const { withPlugins } = require('@expo/config-plugins');

/**
 * Expo plugin for Focus25 Widget Module
 */
module.exports = function withFocus25Widget(config) {
  return withPlugins(config, [
    // Add any additional config modifications here if needed
    (config) => {
      // Ensure the module is properly configured
      if (!config.ios) {
        config.ios = {};
      }
      
      // Add entitlements for app groups if not already present
      if (!config.ios.entitlements) {
        config.ios.entitlements = {};
      }
      
      if (!config.ios.entitlements['com.apple.security.application-groups']) {
        config.ios.entitlements['com.apple.security.application-groups'] = [
          'com.focus25.app.focus25Widget'
        ];
      }
      
      return config;
    }
  ]);
};
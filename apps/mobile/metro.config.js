// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable package.json exports field resolution (needed for better-auth/react)
config.resolver.unstable_enablePackageExports = true;

// Specify condition names for export resolution
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

// Ensure platform-specific extensions are resolved
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Use resolveRequest to conditionally resolve react-native-webview on web
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect react-native-webview to web shim on web platform
  if (platform === 'web' && moduleName === 'react-native-webview') {
    return {
      filePath: require.resolve('@10play/react-native-web-webview'),
      type: 'sourceFile',
    };
  }
  // Fall back to default resolution
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

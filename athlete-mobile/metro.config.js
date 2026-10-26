const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

// @expo/ui has no "main" field, only "exports", so it can't resolve with the
// flag above off (that flag was turned off for Zustand's web bundling).
// Resolve it through Node's own exports-aware require.resolve instead of
// flipping the flag project-wide.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@expo/ui" || moduleName.startsWith("@expo/ui/")) {
    return { type: "sourceFile", filePath: require.resolve(moduleName) };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

// Exclude local supabase and trainer-dashboard folders from the bundle
const projectRoot = __dirname;
config.resolver.blockList = [
  new RegExp(`^${path.resolve(projectRoot, "supabase")}`),
  new RegExp(`^${path.resolve(projectRoot, "trainer-dashboard")}`),
];

module.exports = config;

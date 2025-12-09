const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

// Exclude supabase and trainer-dashboard folders from the bundle
config.resolver.blockList = [/supabase\/.*/, /trainer-dashboard\/.*/];

module.exports = config;

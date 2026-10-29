const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude local supabase and trainer-dashboard folders from the bundle
const projectRoot = __dirname;
config.resolver.blockList = [
  new RegExp(`^${path.resolve(projectRoot, "supabase")}`),
  new RegExp(`^${path.resolve(projectRoot, "trainer-dashboard")}`),
];

module.exports = config;

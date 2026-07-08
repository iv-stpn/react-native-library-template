/** biome-ignore-all lint/style/noCommonJs: exception for metro config */
const path = require('node:path');
const { withStorybook } = require('@storybook/react-native/metro/withStorybook');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = import.meta.dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo: watch the whole workspace and resolve hoisted dependencies.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules'), path.resolve(workspaceRoot, 'node_modules')];

module.exports = withStorybook(config, {
  enabled: true,
  configPath: path.resolve(projectRoot, '.rnstorybook'),
});

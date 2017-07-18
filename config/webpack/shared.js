// Note: You must restart bin/webpack-dev-server for changes to take effect

const { existsSync } = require('fs');
const webpack = require('webpack');
const { basename, dirname, join, relative, resolve, sep } = require('path');
const { sync } = require('glob');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const extname = require('path-complete-extname');
const { env, settings, output, loadersDir } = require('./configuration.js');
const localePackPaths = require('./generateLocalePacks');

const extensionGlob = `**/*{${settings.extensions.join(',')}}*`;
const entryPath = join(settings.source_path, settings.source_entry_path);
const packPaths = sync(join(entryPath, extensionGlob));
const entryPacks = [...packPaths, ...localePackPaths].filter(path => path !== join(entryPath, 'custom.js'));

const customApplicationStyle = resolve(join(settings.source_path, 'styles/custom.scss'));
const originalApplicationStyle = resolve(join(settings.source_path, 'styles/application.scss'));

module.exports = {
  entry: entryPacks.reduce(
    (map, entry) => {
      const localMap = map;
      let namespace = relative(join(entryPath), dirname(entry));
      if (namespace === join('..', '..', '..', 'tmp', 'packs')) {
        namespace = ''; // generated by generateLocalePacks.js
      }
      localMap[join(namespace, basename(entry, extname(entry)))] = resolve(entry);
      return localMap;
    }, {}
  ),

  output: {
    filename: '[name].js',
    chunkFilename: '[name]-[chunkhash].js',
    path: output.path,
    publicPath: output.publicPath,
  },

  module: {
    rules: sync(join(loadersDir, '*.js')).map(loader => require(loader)),
  },

  plugins: [
    new webpack.EnvironmentPlugin(JSON.parse(JSON.stringify(env))),
    new ExtractTextPlugin({
      filename: env.NODE_ENV === 'production' ? '[name]-[hash].css' : '[name].css',
      allChunks: true,
    }),
    new ManifestPlugin({
      publicPath: output.publicPath,
      writeToFileEmit: true,
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      minChunks: (module, count) => {
        const reactIntlPathRegexp = new RegExp(`node_modules\\${sep}react-intl`);

        if (module.resource && reactIntlPathRegexp.test(module.resource)) {
          // skip react-intl because it's useless to put in the common chunk,
          // e.g. because "shared" modules between zh-TW and zh-CN will never
          // be loaded together
          return false;
        }

        return count >= 2;
      },
    }),
  ],

  resolve: {
    alias: {
      'mastodon-application-style': existsSync(customApplicationStyle) ?
                                    customApplicationStyle : originalApplicationStyle,
    },
    extensions: settings.extensions,
    modules: [
      resolve(settings.source_path),
      'node_modules',
    ],
  },

  resolveLoader: {
    modules: ['node_modules'],
  },

  node: {
    // Called by http-link-header in an API we never use, increases
    // bundle size unnecessarily
    Buffer: false,
  },
};

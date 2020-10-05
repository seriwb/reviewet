require('@babel/register');

const { merge } = require('webpack-merge');
const common = require('./webpack.common.js').default;

// const LiveReloadPlugin = require('webpack-livereload-plugin');

module.exports = merge(common, {
  mode: 'development',

  // plugins: [new LiveReloadPlugin({ appendScriptTag : true })],
});
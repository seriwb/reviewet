require('@babel/register');

const { merge } = require('webpack-merge');
const common = require('./webpack.common.js').default;

module.exports = merge(common, {
  mode: 'production',
});
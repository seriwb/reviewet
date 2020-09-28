import path from 'path';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

const src = path.resolve(__dirname, 'src');
const dist = path.resolve(__dirname, 'dist');

export default {
  entry: {
    app: src + '/app.ts'
  },

  plugins: [new CleanWebpackPlugin()],

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
      }
    ]
  },

  resolve: {
    extensions: ['.js', '.ts', '.json']
  },

  output: {
    filename: '[name].js',
    publicPath: dist,
    path: dist
  }
};
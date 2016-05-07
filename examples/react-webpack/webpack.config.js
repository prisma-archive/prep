const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const cssnano = require('cssnano')

module.exports = {
  entry: './src/main.js',
  output: {
    publicPath: '/',
    path: './dist',
    filename: 'bundle.[hash].js',
  },
  module: {
    preLoaders: [{
      test: /\.js$/,
      loader: 'eslint',
      exclude: /node_modules/,
    }],
    loaders: [{
      test: /\.css/,
      loader: 'style!css?modules!postcss',
    }, {
      test: /\.js$/,
      loader: 'babel',
      exclude: /node_modules/,
    }, {
      test: /\.jpg/,
      loader: 'url?limit=10000',
    }],
  },
  plugins: [
    new HtmlWebpackPlugin({
      favicon: 'static/favicon.png',
      template: 'src/index.html',
    }),
  ],
  postcss: [cssnano()],
}

var path       = require('path');
var webpack    = require('webpack');
var assetsPath = path.join(__dirname, '..', 'public', 'assets');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

require('es6-promise').polyfill();

module.exports = {

  devtool: 'eval',

  name: 'browser',

  entry: {
    app: [
      path.join(__dirname, '..', 'app', 'client'),
      path.join(__dirname, '..', 'app', 'style')
    ]
  },

  output: {
    path: assetsPath,
    filename: 'bundle.js',
    publicPath: '/assets/'
  },

  module: {
    preLoaders: [
      {
        test: /\.js$|\.jsx$/,
        loaders: ['eslint-loader'],
        include: path.join(__dirname, '..', 'app'),
        exclude: path.resolve(__dirname, 'node_modules')
      }
    ],

    loaders: [
      {
        test: /\.jsx?$/,
        loaders: ['react-hot','babel?presets[]=stage-0,presets[]=react,presets[]=es2015'],
        include: path.join(__dirname, '..', 'app'),
        exclude: path.resolve(__dirname, 'node_modules')
      },

      { test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff$|\.ttf|\.ico|\.eot|\.mp3$/, loader: 'file-loader' },
      { test: /\.html$/, loader: 'html-loader' },
      { test: /\.scss$/, loader: ExtractTextPlugin.extract("css!sass") },
    ]
  },

  resolve: {
    extensions: ['', '.js', '.jsx', '.scss'],

    modulesDirectories: [
      'app', 'node_modules'
    ]
  },

  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),

    new webpack.NoErrorsPlugin(),

    new ExtractTextPlugin('style.css', {
      allChunks: true
    }),
  ],

  eslint: {
    configFile: '.eslintrc'
  }
};

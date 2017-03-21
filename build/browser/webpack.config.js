const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const resolveConfig = require('../common/resolve')
const fs = require('fs')
const json5 = require('json5')
const babelConfig = json5.parse(fs.readFileSync(path.resolve(__dirname, '.babelrc'), 'utf8'))

/*
 * Base configuration
 */

module.exports = merge.smart({
  // TODO: only in development?
  target: 'web',
  devtool: 'source-map',
  context: path.resolve(__dirname, '../../src'),
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, '../../dist'),
    filename: 'index.browser.js',
    // TODO: only in development
    pathinfo: true,
    library: 'ns-api',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: merge.smart(babelConfig, {
          babelrc: false
        })
      }
    ]
  },
  plugins: [
    // new webpack.NoEmitOnErrorsPlugin(),
    // TODO: detect development/production
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
    // TODO: only in production
    // new webpack.optimize.UglifyJsPlugin({
    //   sourceMap: true,
    //   compress: {
    //     warnings: false
    //   },
    //   output: {
    //     comments: false
    //   }
    // })
  ],
  watchOptions: {
    ignored: /node_modules/
  },
  bail: true
}, resolveConfig)

/*
 * Node configuration
 */

// new webpack.BannerPlugin({
//   banner: `require('source-map-support').install();\n`,
//   raw: true
// })


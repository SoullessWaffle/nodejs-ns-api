const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')

const baseConfig = {
  // TODO: only in development?
  devtool: 'source-map',
  context: path.resolve(__dirname, 'src'),
  entry: {
    index: './index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
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
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    alias: {
      'joi$': 'joi-browser'
    }
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
}

const nodeConfig = merge.smart(baseConfig, {
  target: 'node',
  output: {
    filename: '[name].js'
  },
  plugins: [
    // TODO: only in development
    new webpack.BannerPlugin({
      banner: `require('source-map-support').install();\n`,
      raw: true
    })
  ]
})

const browserConfig = merge.smart(baseConfig, {
  target: 'web',
  output: {
    filename: '[name].browser.js'
  }
})

module.exports = [
  nodeConfig,
  browserConfig
]

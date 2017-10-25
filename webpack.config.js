var webpack = require('webpack');
var path = require('path');

var APP_DIR = path.resolve(__dirname, 'examples');

module.exports = {
  entry: [
    'react-hot-loader/patch',
    APP_DIR + '/index.jsx'
  ],
  output: {
    filename: 'bundle.js'
  },
  module : {
    rules: [
      {
        test: /\.jsx?$/,
        use: ['babel-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      }
    ]
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ],
  devServer: {
      contentBase: './examples',
      hot: true
    },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};

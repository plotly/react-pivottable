var webpack = require('webpack');

module.exports = {
  entry: [
    'react-hot-loader/patch',
    './examples/index.jsx'
  ],
  output: {
    filename: 'examples/bundle.js'
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
      hot: true
    },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};

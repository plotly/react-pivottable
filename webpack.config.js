var webpack = require('webpack');

module.exports = {
  entry: [
    'react-hot-loader/patch',
    './examples/index.jsx'
  ],
  output: {
    filename: 'bundle.js'
  },
  module : {
    rules: [
      {
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            "presets" : [["es2015", {"modules": false}], "react"],
            "plugins": ["react-hot-loader/babel", "transform-class-properties"]
          }
        },
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

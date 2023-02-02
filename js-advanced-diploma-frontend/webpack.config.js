const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const cssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

// --env prod
// Переменная окружения
// Значение prod означает, что данная сборка для продакшена
// По умолчанию - development
module.exports = (env) => ({
  // Вебпак не может использовать в качестве точки входа html-файлы
  entry: './src/js/main.js',
  output: {
    filename: 'main.[contenthash].js', // product/id, /product/main.js
    publicPath: '/', // префикс для путей
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.(png|jpg|jpeg|gif|ttf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader',
      },
      {
        test: /\.css$/i,
        use: [
          env.prod ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      },
    ]
  },
  optimization: {
    minimizer: [
      new cssMinimizerPlugin(),
      new TerserPlugin(),
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminMinify,
          options: {
            plugins: [
              ['gifsicle', { interlaced: true }],
              ['jpegtran', { progressive: true }],
              ['optipng', { optimizationLevel: 5 }],
            ]
          },
        },
        generator: [
          {
            // You can apply generator using `?as=webp`, you can use any name and provide more options
            preset: 'webp',
            implementation: ImageMinimizerPlugin.imageminGenerate,
            options: {
              plugins: ['imagemin-webp'],
            },
          },
        ]
      }),
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Coin',
    }),
    new MiniCssExtractPlugin({
      filename: 'main.[contenthash].css',
    }),
  ],
  devServer: {
    historyApiFallback: true,
    hot: true,
    // port: 80,
    allowedHosts: 'all', // for ngrok
  },
});

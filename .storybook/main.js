const path = require('path')

const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  stories: ['../ui/app/**/*.stories.js'],
  addons: [
    '@storybook/addon-knobs',
    '@storybook/addon-actions',
    '@storybook/addon-backgrounds',
    '@storybook/addon-toolbars',
    './i18n-party-addon/register.js',
  ],
  webpackFinal: async (config) => {
    config.module.strictExportPresence = true
    config.module.rules.push({
      test: /\.scss$/,
      loaders: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            import: false,
            url: false,
          },
        },
        'resolve-url-loader',
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
            implementation: require('sass'),
            sassOptions: {
              includePaths: ['ui/app/css/'],
            },
          },
        },
      ],
    })
    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.join(
              'node_modules',
              '@fortawesome',
              'fontawesome-free',
              'webfonts',
            ),
            to: path.join('fonts', 'fontawesome'),
          },
        ],
      }),
    )
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource: (resource) => {
          if (resource === './intl') {
            return true
          }
          return false
        }
      })
    )
    return config
  },
}

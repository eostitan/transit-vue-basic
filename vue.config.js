// vue.config.js
var webpack = require('webpack');

module.exports = {
    // devServer: {
    //     open: process.platform === 'darwin',
    //     host: '0.0.0.0',
    //     port: 8080, 
    //     https: false,
    //     hot:true,
    //     // hotOnly: true,
    // },
    configureWebpack: {
        devtool: 'source-map'
    }
  }
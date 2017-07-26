let path = require('path');
let webpack = require('webpack');

module.exports = {
    entry: {
        read: './read.js'
    },
    output: {
        libraryTarget: 'commonjs',
        filename: '[name].js',
        path: __dirname + '/.webpack'
    },
    target: 'node',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options:{
                        presets: ['es2015']
                    }
                }
            }
        ]
    },
    externals: [
        function (context, request, callback) {
            if (/^aws-sdk$/.test(request)) {
                return callback(null, 'commonjs ' + request);
            }
            callback();
        }
    ]
};

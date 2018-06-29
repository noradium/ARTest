const path = require('path');

const chokidar = require('chokidar');
const stringify = require('json-stringify-safe');
const WebSocket = require('ws');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'development'
};

module.exports.serve = {
  content: [path.resolve(__dirname, 'dist')],

  config: {
  },
  hot: {
    host: 'localhost',
    port: 8081,
  },
  open: true,
  on: {
    'listening': () => {
      console.log('listening');
      const socket = new WebSocket('ws://localhost:8081');
      const watchPath = __dirname;
      const options = {};
      const watcher = chokidar.watch(watchPath, options);
      watcher.on('change', () => {
        const data = {
          type: 'broadcast',
          data: {
            type: 'window-reload',
            data: {},
          },
        };

        socket.send(stringify(data));
      });
    }
  },
};

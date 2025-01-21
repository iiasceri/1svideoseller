const path = require('path');

module.exports = function override(config, env) {
  // Add WebAssembly support
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    path: false,
    crypto: false
  };
  
  // Enable WebAssembly
  config.experiments = {
    ...config.experiments,
    asyncWebAssembly: true
  };

  config.module.rules.push({
    test: /\.wasm$/,
    type: 'javascript/auto',
  });

  config.resolve.alias = {
    ...config.resolve.alias,
    '@ffmpeg/core': path.resolve(__dirname, 'node_modules/@ffmpeg/core'),
  };

  return config;
} 
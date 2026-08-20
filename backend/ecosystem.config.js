export default {
  apps: [
    {
      name: 'bima-unggul-backend',
      script: './src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      watch: ['src'],
      ignore_watch: ['node_modules', 'logs'],
      max_memory_restart: '500M',
    },
  ],
};

module.exports = {
  apps: [
    {
      name: "packageRecognition",
      script: "/root/.nvm/versions/node/v20.14.0/bin/yarn",
      args: "--cwd '/root/cronjobs-arbitrage' packageRecognition",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      interpreter: "/root/.nvm/versions/node/v20.14.0/bin/node",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

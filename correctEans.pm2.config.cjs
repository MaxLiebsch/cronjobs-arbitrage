module.exports = {
  apps: [
    {
      name: "correctEans",
      script: "/root/.nvm/versions/node/v20.14.0/bin/yarn",
      args: "--cwd '/root/cronjobs-arbitrage' correctEans",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      interpreter: "/root/.nvm/versions/node/v20.14.0/bin/node",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

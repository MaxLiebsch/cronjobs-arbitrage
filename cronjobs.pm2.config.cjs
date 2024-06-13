const version = process.env.APP_VERSION || require("./package.json").version;

module.exports = {
  apps: [
    {
      name: `cronjobs_${version}`,
      script: "/root/.nvm/versions/node/v20.14.0/bin/yarn",
      args: "--cwd '/root/cronjobs-arbitrage' start",
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      interpreter: "/root/.nvm/versions/node/v20.14.0/bin/node",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

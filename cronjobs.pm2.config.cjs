const version = process.env.APP_VERSION || require("./package.json").version;

module.exports = {
  apps: [
    {
      name: `cronjobs_${version}`,
      script: "/root/.nvm/versions/node/v20.11.1/bin/yarn",
      args: "--cwd '/root/cronjobs-arbitrage' start",
      interpreter: "/root/.nvm/versions/node/v20.11.1/bin/node",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

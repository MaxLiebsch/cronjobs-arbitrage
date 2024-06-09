const version = process.env.APP_VERSION || require("./package.json").version;

module.exports = {
  apps: [
    {
      name: `cronjobs_${version}`,
      script: "yarn",
      args: "--cwd '/root/cronjobs-arbitrage' start",
      interpreter: "/bin/bash",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

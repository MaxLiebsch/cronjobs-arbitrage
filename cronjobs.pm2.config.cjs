const version = process.env.APP_VERSION || require("./package.json").version;

module.exports = {
  apps: [
    {
      name: `cronjobs_${version}`,
      script: "./src/index.js",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

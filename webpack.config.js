/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");

module.exports = {
  entry: {
    bb_stashStealable: "./src/bb_stashStealable.ts",
    bb_drumMacFarm: "./src/bb_drumMacFarm.ts",
    bb_pvpCalc: "./src/bb_pvpCalc.ts",
    bb_pirateRealm: "./src/bb_pirateRealm.ts",
    bb_hobo: "./src/bb_hobo.ts",
    bb_combat: "./src/bb_combat.ts",
    bb_login: "./src/bb_login.ts",
    bb_runTyson: "./src/bb_runTyson.ts",
    bb_logout: "./src/bb_logout.ts",
    bb_runLove: "./src/bb_runLove.ts",
    bb_sea: "./src/bb_sea.ts",
    bb_kingFreed: "./src/bb_kingFreed.ts",
    overdrink: "./src/overdrink.ts",
  },
  mode: "development",
  devtool: false,
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].js",
    libraryTarget: "commonjs",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
  },
  module: {
    rules: [
      {
        // Include ts, tsx, js, and jsx files.
        test: /\.(ts|js)x?$/,
        // exclude: /node_modules/,
        loader: "babel-loader",
      },
    ],
  },
  plugins: [],
  externals: {
    kolmafia: "commonjs kolmafia",
  },
};

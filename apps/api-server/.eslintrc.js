/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/library.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  env: {
    node: true,
    jest: true,
  },
  rules: {
    "no-unused-vars": "off",
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "../../packages/",
  ],
};

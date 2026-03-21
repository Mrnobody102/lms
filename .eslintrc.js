/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  env: {
    node: true,
    browser: true,
    es2020: true,
  },
  rules: {
    "no-unused-vars": "off",
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    ".next/",
    "packages/",
    "apps/*/dist/",
    "apps/*/.next/",
    "apps/*/node_modules/",
  ],
};

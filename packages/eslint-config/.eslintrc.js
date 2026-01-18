/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["./library.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
};

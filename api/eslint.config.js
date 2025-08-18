// eslint.config.js (Flat Config, ESM)
import eslintPluginJs from "@eslint/js";
import eslintConfigGoogle from "eslint-config-google";
import babelParser from "@babel/eslint-parser";

export default [
  {
    ignores: ["dist/", "node_modules/"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-env"],
        },
        ecmaVersion: 2018,
        sourceType: "module",
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      ...eslintPluginJs.configs.recommended.rules,
      ...eslintConfigGoogle.rules,
      "no-restricted-globals": ["error", "name", "length"],
      "prefer-arrow-callback": "error",
      "quotes": ["error", "double", { allowTemplateLiterals: true }],
      "object-curly-spacing": ["error", "always"],
    },
  },
];

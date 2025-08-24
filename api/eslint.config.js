import eslintPluginJs from "@eslint/js";
import eslintConfigGoogle from "eslint-config-google";
import babelParser from "@babel/eslint-parser";
import globals from "globals";

export default [
  {
    ignores: ["dist/", "node_modules/"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
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
      "indent": ["error", 2],
      "no-restricted-globals": ["error", "name", "length"],
      "prefer-arrow-callback": "error",
      "quotes": [
        "error",
        "double",
        {
          allowTemplateLiterals: true,
          avoidEscape: true,
        },
      ],
      "object-curly-spacing": ["error", "always"],
      "require-jsdoc": 0,
    },
  },
];

import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "out/**"],
  },
  ...compat.extends("next", "next/core-web-vitals"),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        jest: "readonly",
        test: "readonly",
        expect: "readonly",
      },
    },
  },
  {
    files: [
      "jest.config.js",
      "jest.setup.js",
      "next.config.*",
      "tailwind.config.*",
      "vitest.setup.ts",
    ],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        jest: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["next-env.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  prettier,
];

export default config;

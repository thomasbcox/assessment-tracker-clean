import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Import our custom ESLint rules
import customRules from "./eslint-rules/index.js";
import noLoggerMockingInTests from './eslint-rules/no-logger-mocking-in-tests.js';

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ['**/*.test.ts', '**/*.test.js', '**/*.test.tsx', '**/*.test.jsx'],
    plugins: {
      "assessment-tracker": customRules,
      "no-logger-mocking": {
        rules: {
          "no-logger-mocking-in-tests": noLoggerMockingInTests
        }
      }
    },
    rules: {
      "no-logger-mocking/no-logger-mocking-in-tests": "error",
      // Custom rules for service-layer-first architecture
      "assessment-tracker/no-logic-in-api-routes": "error",
      "assessment-tracker/no-framework-objects-in-services": "error",
      "assessment-tracker/no-json-in-tests": "warn",
      "assessment-tracker/validate-test-inputs": "warn",
      "assessment-tracker/restrict-api-route-imports": "error"
    },
  }
];

export default eslintConfig;

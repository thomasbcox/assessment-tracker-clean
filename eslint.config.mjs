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

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      "assessment-tracker": customRules
    },
    rules: {
      // Custom rules for service-layer-first architecture
      "assessment-tracker/no-logic-in-api-routes": "error",
      "assessment-tracker/no-framework-objects-in-services": "error",
      "assessment-tracker/no-json-in-tests": "warn",
      "assessment-tracker/validate-test-inputs": "warn",
      "assessment-tracker/restrict-api-route-imports": "error"
    }
  }
];

export default eslintConfig;

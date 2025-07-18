/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "jsdom",
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  maxWorkers: 1, // Run tests sequentially to avoid database conflicts
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      useESM: true,
      tsconfig: {
        jsx: "react-jsx",
        module: "esnext",
        moduleResolution: "bundler",
        target: "es2020",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        resolveJsonModule: true,
        isolatedModules: true,
        incremental: true,
        types: ["jest", "@testing-library/jest-dom"],
        paths: {
          "@/*": ["./src/*"]
        }
      }
    }],
    "^.+\\.(js|jsx)$": ["ts-jest", {
      useESM: true,
      tsconfig: {
        jsx: "react-jsx",
        module: "esnext",
        moduleResolution: "bundler",
        target: "es2020",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        resolveJsonModule: true,
        isolatedModules: true,
        incremental: true,
        types: ["jest", "@testing-library/jest-dom"],
        paths: {
          "@/*": ["./src/*"]
        }
      }
    }]
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transformIgnorePatterns: [
    "node_modules/(?!(next|@next)/)"
  ],
  testMatch: [
    "**/__tests__/**/*.(ts|tsx|js|jsx)",
    "**/*.(test|spec).(ts|tsx|js|jsx)"
  ],
};
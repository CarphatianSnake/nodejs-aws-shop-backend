module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^@/products(.*)$": "<rootDir>/products$1",
    "^/opt(.*)$": "<rootDir>/lambda-layer$1",
  },
};

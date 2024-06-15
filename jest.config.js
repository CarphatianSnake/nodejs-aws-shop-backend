module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^@/products-service(.*)$": "<rootDir>/products-service$1",
    "^@/utils(.*)$": "<rootDir>/utils$1",
    "^/opt(.*)$": "<rootDir>/lambda-layer$1",
  },
};

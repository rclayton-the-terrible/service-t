module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/*.integ.(ts|js)'],
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/', '[.]*[.]d[.]ts'],
  collectCoverageFrom: [
    '!src/**/*.integ.{ts,js}',
    '!src/**/*.test.{ts,js}',
    '!src/integ/*.{ts,js}',
    'src/**/*.{ts,js}',
  ],
  modulePathIgnorePatterns: [
    '.*Interface.ts',
    '.*.type.ts',
    'run-*',
    'build/*'
  ],
  globalSetup: './tests/globalSetup.ts',
  globalTeardown: './tests/globalTeardown.ts',
};

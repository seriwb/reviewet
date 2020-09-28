module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  roots: [
    '<rootDir>/test'
  ],
  // TODO:testディレクトリにテストを置く場合、rootDirから変える
  // rootDir: 'test',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  // setupFilesAfterEnv: [
  //   '<rootDir>/test/setupTests.ts'
  // ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    // '^.+\\.(js|jsx)$': '<rootDir>/node_modules/babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/',
  ],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  globals: {
    'ts-jest': {
      'tsConfig': '<rootDir>/test/tsconfig.jest.json'
    }
  }
};
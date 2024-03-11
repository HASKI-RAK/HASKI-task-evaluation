/* eslint-disable immutable/no-mutation */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  setupFilesAfterEnv: ['<rootDir>/singleton.ts']
}

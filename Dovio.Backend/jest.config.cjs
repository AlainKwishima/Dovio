/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {},
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
};



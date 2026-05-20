export default {
  testEnvironment: 'node',
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/__test__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[tj]s?(x)"
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
}
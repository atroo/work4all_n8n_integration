/** @type {import('jest').Config} */
module.exports = {
	testEnvironment: 'node',
	roots: ['<rootDir>/tests'],
	testTimeout: 30000,
	transform: {
		'^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
	},
};

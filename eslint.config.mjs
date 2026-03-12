import { config } from '@n8n/node-cli/eslint';

export default [
	...config,
	{
		// Test files are never published to n8n Cloud — relax the node-specific restrictions
		files: ['tests/**/*.ts'],
		rules: {
			'@n8n/community-nodes/no-restricted-imports': 'off',
			'@n8n/community-nodes/no-restricted-globals': 'off',
			'import-x/no-unresolved': 'off',
		},
	},
];

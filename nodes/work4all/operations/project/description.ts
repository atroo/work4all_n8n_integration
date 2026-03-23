import { INodeProperties } from 'n8n-workflow';

export const projectDescription: INodeProperties[] = [
	// ── getProject ────────────────────────────────────────────────────────────
	{
		displayName: 'Project Code',
		name: 'projectCode',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { operation: ['getProject'] } },
		description: 'Internal work4all project code',
	},

	// ── getAllProjects ─────────────────────────────────────────────────────────
	{
		displayName: 'Page Size',
		name: 'projectQuerySize',
		type: 'number',
		default: 100,
		displayOptions: { show: { operation: ['getAllProjects'] } },
	},
	{
		displayName: 'Page',
		name: 'projectQueryPage',
		type: 'number',
		default: 1,
		displayOptions: { show: { operation: ['getAllProjects'] } },
	},
	{
		displayName: 'Filter (JSON)',
		name: 'projectFilter',
		type: 'string',
		default: '',
		displayOptions: { show: { operation: ['getAllProjects'] } },
		description: 'Optional filter as JSON, e.g. [{"name":{"$eq":"My Project"}}]',
		placeholder: '[{"name":{"$eq":"My Project"}}]',
	},
];

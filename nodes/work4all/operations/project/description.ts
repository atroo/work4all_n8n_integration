import { INodeProperties } from 'n8n-workflow';

const OUTPUT_OPTIONS = [
	{ name: 'Raw', value: 'raw', description: 'Return the full API response without any filtering' },
	{ name: 'Selected Fields', value: 'selectedFields', description: 'Return only the fields specified below' },
	{ name: 'Simplified', value: 'simplified', description: 'Return a reduced set of the most useful fields' },
];

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

	// ── getManyProjects ───────────────────────────────────────────────────────
	{
		displayName: 'Page Size',
		name: 'projectQuerySize',
		type: 'number',
		default: 100,
		displayOptions: { show: { operation: ['getManyProjects'] } },
	},
	{
		displayName: 'Page',
		name: 'projectQueryPage',
		type: 'number',
		default: 1,
		displayOptions: { show: { operation: ['getManyProjects'] } },
	},
	{
		displayName: 'Filter (JSON)',
		name: 'projectFilter',
		type: 'string',
		default: '',
		displayOptions: { show: { operation: ['getManyProjects'] } },
		description: 'Optional filter as JSON',
		placeholder: 'e.g. [{"name":{"$eq":"My Project"}}]',
	},

	// ── Output — for getProject and getManyProjects ───────────────────────────
	{
		displayName: 'Output',
		name: 'projectOutput',
		type: 'options',
		options: OUTPUT_OPTIONS,
		default: 'simplified',
		displayOptions: { show: { operation: ['getProject', 'getManyProjects'] } },
		description: 'How to filter the response fields',
	},
	{
		displayName: 'Fields',
		name: 'projectOutputFields',
		type: 'string',
		default: '',
		placeholder: 'e.g. ["name","number","startDateInner"]',
		displayOptions: { show: { operation: ['getProject', 'getManyProjects'], projectOutput: ['selectedFields'] } },
		description: 'JSON array of field names to include in the response',
	},
];

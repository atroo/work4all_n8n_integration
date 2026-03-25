import { INodeProperties } from 'n8n-workflow';

const OUTPUT_OPTIONS = [
	{ name: 'Raw', value: 'raw', description: 'Return the full API response without any filtering' },
	{ name: 'Selected Fields', value: 'selectedFields', description: 'Return only the fields specified below' },
	{ name: 'Simplified', value: 'simplified', description: 'Return a reduced set of the most useful fields' },
];

export const customerDescription: INodeProperties[] = [
	// ── customerCode — for getCustomer and updateCustomer ─────────────────────
	{
		displayName: 'Customer Code',
		name: 'customerCode',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { operation: ['getCustomer', 'updateCustomer'] } },
		description: 'Internal work4all customer code',
	},

	// ── Shared fields for createCustomer and updateCustomer ───────────────────
	{
		displayName: 'Company Name',
		name: 'firma1',
		type: 'string',
		default: '',
		displayOptions: { show: { operation: ['createCustomer', 'updateCustomer'] } },
		description: 'Company / firm name (Firma 1)',
	},
	{
		displayName: 'Email',
		name: 'eMail',
		type: 'string',
		default: '',
		displayOptions: { show: { operation: ['createCustomer', 'updateCustomer'] } },
	},
	{
		displayName: 'Phone',
		name: 'telefon',
		type: 'string',
		default: '',
		displayOptions: { show: { operation: ['createCustomer', 'updateCustomer'] } },
	},
	{
		displayName: 'Street',
		name: 'strasse',
		type: 'string',
		default: '',
		displayOptions: { show: { operation: ['createCustomer', 'updateCustomer'] } },
	},
	{
		displayName: 'Postal Code',
		name: 'plz',
		type: 'string',
		default: '',
		displayOptions: { show: { operation: ['createCustomer', 'updateCustomer'] } },
	},
	{
		displayName: 'City',
		name: 'ort',
		type: 'string',
		default: '',
		displayOptions: { show: { operation: ['createCustomer', 'updateCustomer'] } },
	},
	{
		displayName: 'Website',
		name: 'interNet',
		type: 'string',
		default: '',
		displayOptions: { show: { operation: ['createCustomer', 'updateCustomer'] } },
	},
	{
		displayName: 'Note',
		name: 'notiz',
		type: 'string',
		default: '',
		displayOptions: { show: { operation: ['createCustomer', 'updateCustomer'] } },
	},

	// ── getManyCustomers fields ───────────────────────────────────────────────
	{
		displayName: 'Page Size',
		name: 'querySize',
		type: 'number',
		default: 100,
		displayOptions: { show: { operation: ['getManyCustomers'] } },
	},
	{
		displayName: 'Page',
		name: 'queryPage',
		type: 'number',
		default: 1,
		displayOptions: { show: { operation: ['getManyCustomers'] } },
	},
	{
		displayName: 'Filter (JSON)',
		name: 'filter',
		type: 'string',
		default: '',
		displayOptions: { show: { operation: ['getManyCustomers'] } },
		description: 'Optional filter as JSON',
		placeholder: 'e.g. [{"name":{"$eq":"work4all GmbH"}}]',
	},

	// ── Output — for getCustomer and getManyCustomers ─────────────────────────
	{
		displayName: 'Output',
		name: 'output',
		type: 'options',
		options: OUTPUT_OPTIONS,
		default: 'simplified',
		displayOptions: { show: { operation: ['getCustomer', 'getManyCustomers'] } },
		description: 'How to filter the response fields',
	},
	{
		displayName: 'Fields',
		name: 'outputFields',
		type: 'string',
		default: '',
		placeholder: 'e.g. ["code","name","eMail","telefon"]',
		displayOptions: { show: { operation: ['getCustomer', 'getManyCustomers'], output: ['selectedFields'] } },
		description: 'JSON array of field names to include in the response',
	},
];

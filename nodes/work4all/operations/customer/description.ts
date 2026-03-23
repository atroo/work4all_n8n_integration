import { INodeProperties } from 'n8n-workflow';

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

	// ── getAllCustomers fields ─────────────────────────────────────────────────
	{
		displayName: 'Page Size',
		name: 'querySize',
		type: 'number',
		default: 100,
		displayOptions: { show: { operation: ['getAllCustomers'] } },
	},
	{
		displayName: 'Page',
		name: 'queryPage',
		type: 'number',
		default: 1,
		displayOptions: { show: { operation: ['getAllCustomers'] } },
	},
	{
		displayName: 'Filter (JSON)',
		name: 'filter',
		type: 'string',
		default: '',
		displayOptions: { show: { operation: ['getAllCustomers'] } },
		description: 'Optional filter as JSON, e.g. [{"name":{"$eq":"work4all GmbH"}}]',
		placeholder: '[{"name":{"$eq":"work4all GmbH"}}]',
	},
];

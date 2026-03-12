/* eslint-disable n8n-nodes-base/node-param-fixed-collection-type-unsorted-items */
import { INodeProperties } from 'n8n-workflow';

export const createIncomingInvoiceDescription: INodeProperties[] = [
	{
		displayName: 'Invoice Data',
		name: 'dataFields',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Invoice Data',
		displayOptions: { show: { operation: ['createIncomingInvoice'] } },
		options: [
			{
				name: 'details',
				displayName: 'Details',
				values: [
					// ── Supplier (server resolves in priority order: Code > CustomerNumber > Email > IBAN) ──
					{ displayName: 'Supplier Code', name: 'supplierCode', type: 'number', default: 0, description: 'Internal work4all supplier code. Takes priority over all other supplier lookup fields.' },
					{ displayName: 'Supplier Name', name: 'supplierName', type: 'string', default: '', description: 'Look up supplier by name. Match must be unique.' },
					{ displayName: 'Customer Number at Supplier', name: 'supplierCustomerNumberAtSupplier', type: 'string', default: '', description: 'Your own customer number at this supplier. Match must be unique.' },
					{ displayName: 'Supplier Contact Email', name: 'supplierContactMailAddress', type: 'string', default: '', description: 'Email address of the supplier or one of their contacts. Match must be unique.' },
					{ displayName: 'Supplier IBAN', name: 'supplierIban', type: 'string', default: '', description: 'IBAN of the supplier. Match must be unique.' },
					// ── Project (server resolves in priority order: Code > Number > Name) ──────────────────
					{ displayName: 'Project Code', name: 'projectCode', type: 'number', default: 0, description: 'Internal work4all project code. Takes priority over project number and name.' },
					{ displayName: 'Project Number', name: 'projectNumber', type: 'string', default: '', description: 'Human-readable project number. Match must be unique.' },
					{ displayName: 'Project Name', name: 'projectName', type: 'string', default: '', description: 'Project name. Match must be unique.' },
					// ── Invoice header ────────────────────────────────────────────────────────────────────
					{ displayName: 'Supplier Invoice Number', name: 'invoiceNumberSupplier', type: 'string', default: '' },
					{ displayName: 'Note', name: 'note', type: 'string', default: '' },
					{ displayName: 'Invoice Date', name: 'invoiceDate', type: 'dateTime', default: '' },
					{ displayName: 'Entry Date', name: 'entryDate', type: 'dateTime', default: '' },
					{ displayName: 'Receipt Date', name: 'receiptDate', type: 'dateTime', default: '' },
					{ displayName: 'Payment Term (Days)', name: 'paymentTermDays', type: 'number', default: 0 },
					{ displayName: 'Skonto 1 Rate (%)', name: 'discount1Rate', type: 'number', default: 0 },
					{ displayName: 'Skonto 1 Days', name: 'discount1Days', type: 'number', default: 0 },
					{ displayName: 'Skonto 2 Rate (%)', name: 'discount2Rate', type: 'number', default: 0 },
					{ displayName: 'Skonto 2 Days', name: 'discount2Days', type: 'number', default: 0 },
					{ displayName: 'Currency Code', name: 'currencyCode', type: 'number', default: 1 },
				],
			},
		],
	},
	{
		displayName: 'Input Mode',
		name: 'inputMode',
		type: 'options',
		displayOptions: { show: { operation: ['createIncomingInvoice'] } },
		options: [
			{ name: 'Manual Mapping', value: 'manual' },
			{ name: 'JSON String', value: 'json' },
		],
		default: 'manual',
		description: 'How to enter invoice line items',
	},
	{
		displayName: 'Invoice Items',
		name: 'invoiceItemsUi',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Item',
		default: {},
		displayOptions: {
			show: {
				operation: ['createIncomingInvoice'],
				inputMode: ['manual'],
			},
		},
		options: [
			{
				name: 'items',
				displayName: 'Items',
				values: [
					{ displayName: 'Account', name: 'account', type: 'number', default: 0 },
					{ displayName: 'Cost Center', name: 'costCenter', type: 'number', default: 0 },
					{ displayName: 'Cost Group', name: 'costGroup', type: 'number', default: 0 },
					{ displayName: 'Project Code', name: 'projectCode', type: 'number', default: 0 },
					{ displayName: 'Tax Code', name: 'taxCode', type: 'number', default: 0 },
					{ displayName: 'Tax Rate (%)', name: 'taxRate', type: 'number', default: 19 },
					{ displayName: 'Net Amount', name: 'netAmount', type: 'number', default: 0 },
					{ displayName: 'Gross Amount', name: 'grossAmount', type: 'number', default: 0 },
					{ displayName: 'VAT Amount', name: 'vatAmount', type: 'number', default: 0 },
					{ displayName: 'Note', name: 'note', type: 'string', default: '' },
				],
			},
		],
	},
	{
		displayName: 'Invoice Items (JSON)',
		name: 'invoiceItemsJson',
		type: 'json',
		default: '',
		placeholder: '[{ "account": 1000, "netAmount": 50.50, ... }]',
		displayOptions: {
			show: {
				operation: ['createIncomingInvoice'],
				inputMode: ['json'],
			},
		},
		description: 'Array of invoice items as JSON',
	},
	{
		displayName: 'Attachments',
		name: 'attachmentsUi',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Attachment',
		default: {},
		displayOptions: { show: { operation: ['createIncomingInvoice'] } },
		description: 'Files to attach to the invoice. Each file must be available as binary data from a previous node (e.g. HTTP Request, Read Binary File).',
		options: [
			{
				name: 'files',
				displayName: 'Files',
				values: [
					{
						displayName: 'Binary Property',
						name: 'binaryPropertyName',
						type: 'string',
						default: 'data',
						description: 'Name of the binary property in the current item that contains the file to upload',
					},
				],
			},
		],
	},
];

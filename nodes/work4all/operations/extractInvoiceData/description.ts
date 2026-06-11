import { INodeProperties } from 'n8n-workflow';

export const extractInvoiceDataDescription: INodeProperties[] = [
	{
		displayName: 'Attachments',
		name: 'extractAttachments',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { operation: ['extractInvoiceData'] } },
		options: [
			{
				name: 'All Binary Properties',
				value: 'all',
				description: 'Send every binary attachment on the current item',
			},
			{
				name: 'JSON',
				value: 'json',
				description: 'Provide the list of binary property names as a JSON array',
			},
			{
				name: 'Form Fields',
				value: 'form',
				description: 'Select the binary properties to send manually',
			},
		],
		default: 'all',
		description: 'Which binary attachments to send to the extraction backend',
	},
	{
		displayName: 'Attachments (JSON)',
		name: 'extractAttachmentsJson',
		type: 'json',
		default: '',
		displayOptions: { show: { operation: ['extractInvoiceData'], extractAttachments: ['json'] } },
		description:
			'Array of attachments as JSON. Each entry must have a binaryPropertyName that matches a binary property on the current item.',
		placeholder:
			'[{ "binaryPropertyName": "attachment_0" }, { "binaryPropertyName": "attachment_2" }]',
	},
	{
		displayName: 'Attachments',
		name: 'extractAttachmentsUi',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Attachment',
		default: {},
		displayOptions: { show: { operation: ['extractInvoiceData'], extractAttachments: ['form'] } },
		description:
			'Binary properties to send for extraction. Each must be available as binary data from a previous node.',
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
						description:
							'Name of the binary property in the current item that contains the file to send',
					},
				],
			},
		],
	},
];

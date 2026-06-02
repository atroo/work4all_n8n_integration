import type { INodeProperties } from 'n8n-workflow';

export const mandantDescription: INodeProperties = {
	displayName: 'Mandant Name or ID',
	name: 'mandant',
	type: 'options',
	default: '1',
	description:
		'The work4all tenant (Mandant) sent as the x-work4all-mandant header. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	typeOptions: {
		loadOptionsMethod: 'getMandanten',
	},
};

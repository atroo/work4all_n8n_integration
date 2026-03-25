import { IDataObject, IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';

import { createIncomingInvoice, customer, project } from './operations';

const customerOps = ['createCustomer', 'getCustomer', 'getManyCustomers', 'updateCustomer'];
const projectOps = ['getProject', 'getManyProjects'];

export class Work4all implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Work4all',
		name: 'work4all',
		icon: 'file:w4a.svg',
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with the work4all API',
		defaults: { name: 'Work4all' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'work4allApi', required: true }],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create Customer',
						value: 'createCustomer',
						action: 'Create a customer',
						description: 'Create a new customer in work4all',
					},
					{
						name: 'Create Incoming Invoice',
						value: 'createIncomingInvoice',
						action: 'Create an incoming invoice',
						description: 'Create a new incoming invoice in work4all',
					},
					{
						name: 'Get Customer',
						value: 'getCustomer',
						action: 'Get a customer',
						description: 'Retrieve a single customer by code',
					},
					{
						name: 'Get Many Customers',
						value: 'getManyCustomers',
						action: 'Get many customers',
						description: 'Retrieve a list of customers from work4all',
					},
					{
						name: 'Get Many Projects',
						value: 'getManyProjects',
						action: 'Get many projects',
						description: 'Retrieve a list of projects from work4all',
					},
					{
						name: 'Get Project',
						value: 'getProject',
						action: 'Get a project',
						description: 'Retrieve a single project by code',
					},
					{
						name: 'Update Customer',
						value: 'updateCustomer',
						action: 'Update a customer',
						description: 'Update an existing customer in work4all',
					},
				],
				default: 'createIncomingInvoice',
			},
			...createIncomingInvoice.description,
			...customer.description,
			...project.description,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'createIncomingInvoice') {
					const result = await createIncomingInvoice.execute.call(this, i);
					returnData.push({ json: result as IDataObject });
				} else if (customerOps.includes(operation)) {
					const result = await customer.execute.call(this, i);
					returnData.push({ json: result as IDataObject });
				} else if (projectOps.includes(operation)) {
					const result = await project.execute.call(this, i);
					returnData.push({ json: result as IDataObject });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

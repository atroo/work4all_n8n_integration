import { IDataObject, IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';

import { createIncomingInvoice, customer, project } from './operations';

const customerOps = ['createCustomer', 'getCustomer', 'getAllCustomers', 'updateCustomer'];
const projectOps = ['getProject', 'getAllProjects'];

export class Work4all implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'work4all',
		name: 'work4all',
		icon: 'file:w4a.svg',
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with the work4all API',
		defaults: { name: 'work4all' },
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
					{ name: 'Create Incoming Invoice', value: 'createIncomingInvoice' },
					{ name: 'Create Customer', value: 'createCustomer' },
					{ name: 'Get Customer', value: 'getCustomer' },
					{ name: 'Get All Customers', value: 'getAllCustomers' },
					{ name: 'Update Customer', value: 'updateCustomer' },
					{ name: 'Get Project', value: 'getProject' },
					{ name: 'Get All Projects', value: 'getAllProjects' },
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

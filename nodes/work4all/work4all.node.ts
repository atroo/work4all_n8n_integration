/* eslint-disable n8n-nodes-base/node-param-fixed-collection-type-unsorted-items */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
    IExecuteFunctions, 
    INodeExecutionData, 
    INodeType, 
    INodeTypeDescription 
} from 'n8n-workflow';

export class work4all implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'work4all Node',
		subtitle: "",
		name: 'work4all',
		icon: 'file:myService.svg',
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		description: 'Interagiert mit unserer API (REST & GQL)',
		defaults: { name: 'work4all' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'myApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Create Incoming Invoice', value: 'createInvoice' },
				],
				default: 'createInvoice',
			},
			// Kopfdaten der Eingangsrechnung
			{
				displayName: 'Invoice Data',
				name: 'dataFields',
				type: 'fixedCollection',
				default: {},
				placeholder: 'Add Invoice Data',
				options: [
					{
						name: 'details',
						displayName: 'Details',
						
						values: [
							{ displayName: 'Supplier Code', name: 'supplierCode', type: 'number', default: 0 },
							{ displayName: 'Project Code', name: 'projectCode', type: 'number', default: 0 },
							{ displayName: 'Supplier Invoice Number', name: 'invoiceNumberSupplier', type: 'string', default: '' },
							{ displayName: 'Note of the Invoice', name: 'note', type: 'string', default: '' },
							{ displayName: 'The Date of the Invoice', name: 'invoiceDate', type: 'dateTime', default: ''},
							{ displayName: 'The Entry Date of the Invoice', name: 'entryDate', type: 'dateTime', default: ''},
							{ displayName: 'The Receipt Date of the Invoice', name: 'receiptDate', type: 'dateTime', default: ''},
							{ displayName: 'Payment in Days', name: 'paymentTermDays', type: 'number', default: 0},
							{ displayName: 'Discount Rate for Skonto1', name: 'discount1Rate', type: 'number', default: 0},
							{ displayName: 'Days for Skonto1', name: 'discount1Days', type: 'number', default: 0},
							{ displayName: 'Discount Rate for Skonto2', name: 'discount2Rate', type: 'number', default: 0},
							{ displayName: 'Days for Skonto2', name: 'discount2Days', type: 'number', default: 0},
							{ displayName: 'Code of the Currency', name: 'currencyCode', type: 'number', default: 1},
						],
					},
				],
			},
			// Positionen der Eingangsrechnung
			// Auswahl für manuelle Eingabe oder Json
			{
				displayName: 'Input Mode',
				name: 'inputMode',
				type: 'options',
				options: [
					{ name: 'Manual Mapping', value: 'manual' },
					{ name: 'JSON String', value: 'json' },
				],
				default: 'manual',
				description: 'Wie möchtest du die Posten eingeben?',
			},
			// Manuelle Eingabe
			{
				displayName: 'Invoice Items',
				name: 'invoiceItemsUi',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				placeholder: 'Add Item',
				default: {},
				displayOptions: {
					show: {
						inputMode: ['manual'],
					},
				},
				options: [
					{
						name: 'items',
						displayName: 'Items',
						values: [
							{ displayName: 'Account', name: 'account', type: 'number', default: 0 },
							{ displayName: 'Cost Center', name: 'costCenter', type: 'number', default: 0},
							{ displayName: 'Cost Group', name: 'costGroup', type: 'number', default: 0},
							{ displayName: 'Project Code', name: 'projectCode', type: 'number', default: 0},
							{ displayName: 'Tax Code', name: 'taxCode', type: 'number', default: 0},
							{ displayName: 'Tax Rate', name: 'taxRate', type: 'number', default: 19 },
							{ displayName: 'Net Amount', name: 'netAmount', type: 'number', default: 0 },
							{ displayName: 'Gross Amount', name: 'grossAmount', type: 'number', default: 0},
							{ displayName: 'VAT Amount', name: 'vatAmount', type: 'number', default: 0},
							{ displayName: 'Note', name: 'note', type: 'string', default: '' },
						],
					},
				],
			},
			// JSON Eingabe
			{
				displayName: 'Invoice Items (JSON)',
				name: 'invoiceItemsJson',
				type: 'json',
				default: '',
				placeholder: '[{ "account": 1000, "netAmount": 50.50, ... }]',
				displayOptions: {
					show: {
						inputMode: ['json'],
					},
				},
				description: 'Ein Array aus Objekten im JSON-Format',
			},
			// Anhänge
			{
				displayName: 'Receipts',
				name: 'receiptsUi',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				placeholder: 'Add Receipt ID',
				default: {},
				options: [
					{
						name: 'add',
						displayName: 'Add Receipt',
						values: [
							{ displayName: 'Temp File ID', name: 'tempFileId', type: 'string', default: '' },
						],
					},
				],
			},
		],
	};

async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
			const credentials = await this.getCredentials('myApi');
			const baseUrl = credentials.baseUrl as string;
			const accessToken = credentials.accessToken as string;

            // 1. UI-Parameter abrufen (entspricht der Struktur in 'properties')
            const operation = this.getNodeParameter('operation', i) as string;

            if (operation === 'createInvoice') {
                const details = this.getNodeParameter('dataFields.details', i, {}) as any;

				const mode = this.getNodeParameter('inputMode', i);
				let items;
				if (mode === 'manual') {
					items = (this.getNodeParameter('invoiceItemsUi', i) as any)?.items || [];
				} else {
					items = this.getNodeParameter('invoiceItemsJson', i);
					if (typeof items === 'string') items = JSON.parse(items);
				}

                const receiptsUi = this.getNodeParameter('receiptsUi.add', i, []) as any[];

                // 2. Das JSON-Objekt für die API exakt so zusammenbauen wie gefordert
                const gqlData = {
                    ...details,
                    invoiceItems: items,
                };

                const gqlReceipts = {
                    add: receiptsUi,
                };

                // 3. Die GraphQL Mutation definieren
                const statement = `
                    mutation ahf_CreateCompleteIncomingInvoice($data: InputCompleteIncomingInvoice!, $receipts: InputErpAnhangAttachementsRelation) {
                        ahf_CreateCompleteIncomingInvoice(input: $data, receipts: $receipts) {
                            code
                            notiz
                            rNummer
                            rNummerbeiLieferant
                            datum
                            faelligDatum
                            eingangsDatum
                            buchungsDatum
                            lieferant { name }
                            projekt { name }
                        }
                    }
                `;

                // 4. Den Request über den n8n-Helper absetzen
                const responseData = await this.helpers.httpRequest({
                    method: 'POST',
                    url: baseUrl+"/graphql", 
					headers: {
						'Authorization': `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
                    body: {
                        query: statement,
                        variables: {
                            data: gqlData,
                            receipts: gqlReceipts,
                        },
                    },
                    json: true,
                });

                // 5. Ergebnis in den n8n Output-Stream pushen
                returnData.push({ json: responseData });
            }
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push({ json: { error: error.message, stack: error.stack } });
                continue;
            }
            throw error;
        }
    }
    return [returnData];
}



}

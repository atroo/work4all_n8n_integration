import { IExecuteFunctions } from 'n8n-workflow';

const GQL_MUTATION = `
	mutation ahf_CreateCompleteIncomingInvoice(
		$data: InputCompleteIncomingInvoice!,
		$receipts: InputErpAnhangAttachementsRelation
	) {
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

export async function execute(this: IExecuteFunctions, itemIndex: number): Promise<object> {
	const credentials = await this.getCredentials('work4allApi');
	const baseUrl = credentials.baseUrl as string;
	const accessToken = credentials.accessToken as string;

	const details = this.getNodeParameter('dataFields.details', itemIndex, {}) as Record<string, unknown>;

	const mode = this.getNodeParameter('inputMode', itemIndex) as string;
	let invoiceItems: unknown[];
	if (mode === 'manual') {
		const ui = this.getNodeParameter('invoiceItemsUi', itemIndex) as Record<string, unknown>;
		invoiceItems = (ui?.items as unknown[]) ?? [];
	} else {
		let raw = this.getNodeParameter('invoiceItemsJson', itemIndex) as string | unknown[];
		if (typeof raw === 'string') raw = JSON.parse(raw) as unknown[];
		invoiceItems = raw;
	}

	const receiptsUi = this.getNodeParameter('receiptsUi.add', itemIndex, []) as unknown[];

	return this.helpers.httpRequest({
		method: 'POST',
		url: `${baseUrl}/graphql`,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		},
		body: {
			query: GQL_MUTATION,
			variables: {
				data: { ...details, invoiceItems },
				receipts: { add: receiptsUi },
			},
		},
		json: true,
	});
}

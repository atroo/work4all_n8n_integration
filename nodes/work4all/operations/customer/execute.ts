import { IExecuteFunctions, NodeApiError, NodeOperationError } from 'n8n-workflow';

import { getClient } from '../../auth';

const GQL_GET_KUNDEN = `
	query getKunden($querySize: Int, $queryPage: Int, $filter: String) {
		getKunden(querySize: $querySize, queryPage: $queryPage, querySortBy: "name", querySortOrder: ASCENDING, filter: $filter) {
			total
			size
			page
			data {
				code
				nummer
				name
				eMail
				telefon
				telefon2
				strasse
				plz
				ort
				notiz
				interNet
				privatkunde
				hauptansprechpartnerCode
				zahlungsfrist
				erstkontakt
				gesperrt
				gruppe { code name }
				ansprechpartner {
					code
					anzeigename
					vorname
					name
					telefon
					telefon2
					mobilfunk
					eMail
					notiz
					funktion
					hauptansprechpartner
					abteilungCode
					anrede { code maennlich weiblich }
				}
			}
		}
	}
`;

const GQL_UPSERT_KUNDE = `
	mutation upsertKunde($input: InputKunde!, $relations: InputKundeRelation) {
		upsertKunde(input: $input, relations: $relations) {
			code
			nummer
			name
			eMail
			telefon
			strasse
			plz
			ort
			notiz
			interNet
			gruppe { code name }
			ansprechpartner {
				code
				anzeigename
				vorname
				name
				telefon
				mobilfunk
				eMail
				funktion
				hauptansprechpartner
			}
		}
	}
`;

const SIMPLIFIED_CUSTOMER_FIELDS = ['code', 'name', 'eMail', 'telefon', 'strasse', 'plz', 'ort', 'notiz', 'interNet', 'gruppe'];

function pickFields(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const f of fields) {
		if (f in obj) result[f] = obj[f];
	}
	return result;
}

function filterCustomerResponse(response: unknown, output: string, outputFieldsRaw: string): unknown {
	if (output === 'raw') return response;
	const res = response as { data?: { getKunden?: { total?: number; size?: number; page?: number; data?: unknown[] } } };
	const items = res.data?.getKunden?.data;
	if (!Array.isArray(items)) return response;
	const fields =
		output === 'simplified'
			? SIMPLIFIED_CUSTOMER_FIELDS
			: (JSON.parse(outputFieldsRaw || '[]') as string[]);
	if (!fields.length) return response;
	return {
		...res,
		data: {
			...res.data,
			getKunden: {
				...res.data?.getKunden,
				data: items.map((item) => pickFields(item as Record<string, unknown>, fields)),
			},
		},
	};
}

export async function execute(this: IExecuteFunctions, itemIndex: number): Promise<object> {
	const { baseUrl, accessToken } = await getClient(this);
	const operation = this.getNodeParameter('operation', itemIndex) as string;

	const gql = (query: string, variables: Record<string, unknown>) =>
		this.helpers.httpRequest({
			method: 'POST',
			url: `${baseUrl}/graphql`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: { query, variables },
			json: true,
		});

	try {
		if (operation === 'getCustomer') {
			const customerCode = this.getNodeParameter('customerCode', itemIndex) as number;
			const output = this.getNodeParameter('output', itemIndex, 'simplified') as string;
			const outputFields = this.getNodeParameter('outputFields', itemIndex, '') as string;
			const result = await gql(GQL_GET_KUNDEN, {
				querySize: 1,
				filter: JSON.stringify([{ code: { $eq: String(customerCode) } }]),
			});
			return filterCustomerResponse(result, output, outputFields) as object;
		}

		if (operation === 'getManyCustomers') {
			const querySize = this.getNodeParameter('querySize', itemIndex, 100) as number;
			const queryPage = this.getNodeParameter('queryPage', itemIndex, 1) as number;
			const filterRaw = this.getNodeParameter('filter', itemIndex, '') as string;
			const output = this.getNodeParameter('output', itemIndex, 'simplified') as string;
			const outputFields = this.getNodeParameter('outputFields', itemIndex, '') as string;
			const result = await gql(GQL_GET_KUNDEN, {
				querySize,
				queryPage,
				...(filterRaw ? { filter: filterRaw } : {}),
			});
			return filterCustomerResponse(result, output, outputFields) as object;
		}

		if (operation === 'createCustomer' || operation === 'updateCustomer') {
			const input: Record<string, unknown> = {};

			if (operation === 'updateCustomer') {
				input['code'] = this.getNodeParameter('customerCode', itemIndex) as number;
			}

			const stringFields = ['firma1', 'eMail', 'telefon', 'strasse', 'plz', 'ort', 'interNet', 'notiz'];
			for (const field of stringFields) {
				const val = this.getNodeParameter(field, itemIndex, '') as string;
				if (val) input[field] = val;
			}

			return gql(GQL_UPSERT_KUNDE, { input, relations: {} });
		}

		throw new NodeOperationError(this.getNode(), `Unknown customer operation: ${operation}`);
	} catch (error) {
		if (error instanceof NodeOperationError || error instanceof NodeApiError) throw error;
		throw new NodeApiError(this.getNode(), { message: (error as Error).message }, {
			message: `work4all customer operation "${operation}" failed`,
			description: 'Verify your work4all credentials and that the requested resource exists.',
		});
	}
}

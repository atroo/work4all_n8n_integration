import { IExecuteFunctions } from 'n8n-workflow';

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

	if (operation === 'getCustomer') {
		const customerCode = this.getNodeParameter('customerCode', itemIndex) as number;
		return gql(GQL_GET_KUNDEN, {
			querySize: 1,
			filter: JSON.stringify([{ code: { $eq: String(customerCode) } }]),
		});
	}

	if (operation === 'getAllCustomers') {
		const querySize = this.getNodeParameter('querySize', itemIndex, 100) as number;
		const queryPage = this.getNodeParameter('queryPage', itemIndex, 1) as number;
		const filterRaw = this.getNodeParameter('filter', itemIndex, '') as string;
		return gql(GQL_GET_KUNDEN, {
			querySize,
			queryPage,
			...(filterRaw ? { filter: filterRaw } : {}),
		});
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

	throw new Error(`Unknown customer operation: ${operation}`);
}

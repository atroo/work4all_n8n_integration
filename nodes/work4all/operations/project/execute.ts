import { IExecuteFunctions, NodeApiError, NodeOperationError } from 'n8n-workflow';

import { getClient } from '../../auth';

const GQL_GET_PROJEKTE = `
	query getProjekte($querySize: Int, $queryPage: Int, $filter: String) {
		getProjekte(querySize: $querySize, queryPage: $queryPage, querySortBy: "name", querySortOrder: ASCENDING, filter: $filter) {
			total
			size
			page
			data {
				id: code
				name
				number: nummer
				startDateInner: anfangDatum
				startDateOuter: vonDatum
				endDateInner: endeDatum
				endDateOuter: bisDatum
				customerId: kundenCode
				customer: kunde {
					id: code
					name
					number: nummer
					website: interNet
					mainContact: hauptansprechpartner {
						id: code
						displayName: anzeigename
					}
				}
				supplierId: lieferantenCode
				supplier: lieferant {
					id: code
					name
					number: nummer
					website: interNet
					mainContact: hauptansprechpartner {
						id: code
						displayName: anzeigename
					}
				}
				projectProcessList: projectSteps {
					id: code
					process: vorgang
					duration: dauer
					startDatum
					endDateInner: endeDatum
					parentId: parentCode
					parent {
						id: code
						process: vorgang
					}
					comment: bemerkung
					kindId: art
					isClosed: abgeschlossen
					number: nummer
					planningAmount: planungsAnzahl
					planningCosts: planKosten
					ressource
					projectId: projektCode
					ressourceClassId: ressourcenKlasseCode
					index
					ressourceClass: ressourcenKlasse {
						id: code
						color: farbe
						name
						hexColorPair
					}
				}
			}
		}
	}
`;

const SIMPLIFIED_PROJECT_FIELDS = ['id', 'name', 'number', 'startDateInner', 'endDateInner', 'customerId', 'customer', 'supplierId', 'supplier'];

function pickFields(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const f of fields) {
		if (f in obj) result[f] = obj[f];
	}
	return result;
}

function filterProjectResponse(response: unknown, output: string, outputFieldsRaw: string): unknown {
	if (output === 'raw') return response;
	const res = response as { data?: { getProjekte?: { total?: number; size?: number; page?: number; data?: unknown[] } } };
	const items = res.data?.getProjekte?.data;
	if (!Array.isArray(items)) return response;
	const fields =
		output === 'simplified'
			? SIMPLIFIED_PROJECT_FIELDS
			: (JSON.parse(outputFieldsRaw || '[]') as string[]);
	if (!fields.length) return response;
	return {
		...res,
		data: {
			...res.data,
			getProjekte: {
				...res.data?.getProjekte,
				data: items.map((item) => pickFields(item as Record<string, unknown>, fields)),
			},
		},
	};
}

export async function execute(this: IExecuteFunctions, itemIndex: number): Promise<object> {
	const { baseUrl, accessToken } = await getClient(this);
	const operation = this.getNodeParameter('operation', itemIndex) as string;

	const gql = (variables: Record<string, unknown>) =>
		this.helpers.httpRequest({
			method: 'POST',
			url: `${baseUrl}/graphql`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: { query: GQL_GET_PROJEKTE, variables },
			json: true,
		});

	try {
		if (operation === 'getProject') {
			const projectCode = this.getNodeParameter('projectCode', itemIndex) as number;
			const output = this.getNodeParameter('projectOutput', itemIndex, 'simplified') as string;
			const outputFields = this.getNodeParameter('projectOutputFields', itemIndex, '') as string;
			const result = await gql({
				querySize: 1,
				filter: JSON.stringify([{ code: { $in: [projectCode] } }]),
			});
			return filterProjectResponse(result, output, outputFields) as object;
		}

		if (operation === 'getManyProjects') {
			const querySize = this.getNodeParameter('projectQuerySize', itemIndex, 100) as number;
			const queryPage = this.getNodeParameter('projectQueryPage', itemIndex, 1) as number;
			const filterRaw = this.getNodeParameter('projectFilter', itemIndex, '') as string;
			const output = this.getNodeParameter('projectOutput', itemIndex, 'simplified') as string;
			const outputFields = this.getNodeParameter('projectOutputFields', itemIndex, '') as string;
			const result = await gql({
				querySize,
				queryPage,
				...(filterRaw ? { filter: filterRaw } : {}),
			});
			return filterProjectResponse(result, output, outputFields) as object;
		}

		throw new NodeOperationError(this.getNode(), `Unknown project operation: ${operation}`);
	} catch (error) {
		if (error instanceof NodeOperationError || error instanceof NodeApiError) throw error;
		throw new NodeApiError(this.getNode(), { message: (error as Error).message }, {
			message: `work4all project operation "${operation}" failed`,
			description: 'Verify your work4all credentials and that the requested resource exists.',
		});
	}
}

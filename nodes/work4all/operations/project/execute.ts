import { IExecuteFunctions } from 'n8n-workflow';

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

	if (operation === 'getProject') {
		const projectCode = this.getNodeParameter('projectCode', itemIndex) as number;
		return gql({
			querySize: 1,
			filter: JSON.stringify([{ code: { $in: [projectCode] } }]),
		});
	}

	if (operation === 'getAllProjects') {
		const querySize = this.getNodeParameter('projectQuerySize', itemIndex, 100) as number;
		const queryPage = this.getNodeParameter('projectQueryPage', itemIndex, 1) as number;
		const filterRaw = this.getNodeParameter('projectFilter', itemIndex, '') as string;
		return gql({
			querySize,
			queryPage,
			...(filterRaw ? { filter: filterRaw } : {}),
		});
	}

	throw new Error(`Unknown project operation: ${operation}`);
}

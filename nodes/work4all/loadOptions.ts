import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

import { getClient } from './auth';

interface Mandant {
	code: number;
	name?: string | null;
	mandantenbezeichnung?: string | null;
}

interface FullResponse {
	statusCode: number;
	body: unknown;
}

const FIRST_MANDANT = 1;
const MAX_MANDANTEN = 200;
const MAX_CONSECUTIVE_MISSES = 3;

function mandantLabel(mandant: Mandant): string {
	const name = mandant.name?.trim() || mandant.mandantenbezeichnung?.trim();
	return name ? `${name} (${mandant.code})` : String(mandant.code);
}

/**
 * Loads the list of work4all tenants (Mandanten) for the Mandant dropdown.
 *
 * The work4all GraphQL `getMandanten` query and the REST `/api/Mandant/query`
 * endpoint return nothing for OAuth2 client-credentials tokens, so we instead
 * probe `GET /api/Mandant/{code}` sequentially. Tenants are numbered from 1
 * upward; a 204 (No Content) marks a non-existent tenant. We tolerate a few
 * consecutive gaps before stopping and cap the scan as a safety net.
 */
export async function getMandanten(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const { baseUrl } = await getClient(this);

	const options: INodePropertyOptions[] = [];
	let consecutiveMisses = 0;

	for (let code = FIRST_MANDANT; code <= MAX_MANDANTEN; code++) {
		const response = (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'work4allOAuth2Api',
			{
				method: 'GET',
				url: `${baseUrl}/api/Mandant/${code}`,
				returnFullResponse: true,
				json: true,
			},
		)) as FullResponse;

		const mandant = response.body as Mandant | '' | null | undefined;
		const exists = response.statusCode === 200 && mandant && typeof mandant === 'object';

		if (exists) {
			consecutiveMisses = 0;
			options.push({ name: mandantLabel(mandant), value: String(mandant.code ?? code) });
		} else {
			consecutiveMisses++;
			if (consecutiveMisses >= MAX_CONSECUTIVE_MISSES) break;
		}
	}

	if (options.length === 0) {
		return [{ name: '1 (Default)', value: '1' }];
	}

	return options;
}

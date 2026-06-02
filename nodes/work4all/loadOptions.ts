import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

import { getClient } from './auth';

interface Mandant {
	code: number;
	name?: string | null;
	mandantenbezeichnung?: string | null;
}

function mandantLabel(mandant: Mandant): string {
	const name = mandant.mandantenbezeichnung?.trim() || mandant.name?.trim();
	return name ? `${name} (${mandant.code})` : String(mandant.code);
}

/**
 * Loads the list of work4all tenants (Mandanten) for the Mandant dropdown.
 *
 * Uses the REST endpoint `POST /api/Mandant/query`, which returns every tenant
 * the authenticated principal has access to (including `code` and `name`). The
 * `x-version: 2` header selects the current API contract.
 *
 * If the principal has no tenants assigned (e.g. a service without a Mandant
 * mapping), the endpoint returns an empty array and we fall back to the default
 * tenant `1`. The numeric `code` is what gets sent as the `x-work4all-mandant`
 * header on subsequent requests.
 */
export async function getMandanten(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const { baseUrl } = await getClient(this);

	const response = (await this.helpers.httpRequestWithAuthentication.call(
		this,
		'work4allOAuth2Api',
		{
			method: 'POST',
			url: `${baseUrl}/api/Mandant/query`,
			headers: { 'Content-Type': 'application/json', 'x-version': '2' },
			body: {},
			json: true,
		},
	)) as Mandant[] | undefined;

	const mandanten = (Array.isArray(response) ? response : []).filter(
		(mandant): mandant is Mandant => typeof mandant?.code === 'number',
	);

	if (mandanten.length === 0) {
		return [{ name: '1 (Default)', value: '1' }];
	}

	return mandanten.map((mandant) => ({
		name: mandantLabel(mandant),
		value: String(mandant.code),
	}));
}

import type { IExecuteFunctions, IHttpRequestMethods } from 'n8n-workflow';

import { getClient } from './auth';

export const MANDANT_HEADER = 'x-work4all-mandant';

export function getMandant(ctx: IExecuteFunctions, itemIndex = 0): string {
	return String(ctx.getNodeParameter('mandant', itemIndex, '1'));
}

export function work4allHeaders(
	mandant: string,
	extra: Record<string, string> = {},
): Record<string, string> {
	return {
		...extra,
		[MANDANT_HEADER]: mandant,
	};
}

export async function graphqlRequest(
	ctx: IExecuteFunctions,
	query: string,
	variables: Record<string, unknown> = {},
	itemIndex = 0,
): Promise<unknown> {
	const { baseUrl } = await getClient(ctx);
	const mandant = getMandant(ctx, itemIndex);

	return ctx.helpers.httpRequestWithAuthentication.call(ctx, 'work4allOAuth2Api', {
		method: 'POST',
		url: `${baseUrl}/graphql`,
		headers: work4allHeaders(mandant, { 'Content-Type': 'application/json' }),
		body: { query, variables },
		json: true,
	});
}

export async function work4allRequest(
	ctx: IExecuteFunctions,
	options: {
		method: IHttpRequestMethods;
		path: string;
		body?: FormData | object;
		headers?: Record<string, string>;
		json?: boolean;
	},
	itemIndex = 0,
): Promise<unknown> {
	const { baseUrl } = await getClient(ctx);
	const mandant = getMandant(ctx, itemIndex);

	return ctx.helpers.httpRequestWithAuthentication.call(ctx, 'work4allOAuth2Api', {
		method: options.method,
		url: `${baseUrl}${options.path}`,
		headers: work4allHeaders(mandant, options.headers),
		body: options.body,
		json: options.json,
	});
}

import type { FunctionsBase } from 'n8n-workflow';

export interface Work4allClient {
	baseUrl: string;
}

export async function getClient(ctx: FunctionsBase): Promise<Work4allClient> {
	const credentials = await ctx.getCredentials('work4allOAuth2Api');
	return { baseUrl: credentials.baseUrl as string };
}

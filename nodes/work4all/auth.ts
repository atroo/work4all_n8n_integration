import { IExecuteFunctions } from 'n8n-workflow';

export interface Work4allClient {
	baseUrl: string;
}

export async function getClient(ctx: IExecuteFunctions): Promise<Work4allClient> {
	const credentials = await ctx.getCredentials('work4allApi');
	return { baseUrl: credentials.baseUrl as string };
}

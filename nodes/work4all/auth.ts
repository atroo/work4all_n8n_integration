import { IExecuteFunctions } from 'n8n-workflow';

export interface Work4allClient {
	baseUrl: string;
	accessToken: string;
}

async function getAccessToken(tokenUrl: string, clientId: string, clientSecret: string): Promise<string> {
	const body = new URLSearchParams({
		grant_type: 'client_credentials',
		client_id: clientId,
		client_secret: clientSecret,
	});

	const response = await fetch(tokenUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	});

	if (!response.ok) {
		throw new Error(`Authentication failed (HTTP ${response.status})`);
	}

	const json = (await response.json()) as { access_token: string };
	return json.access_token;
}

export async function getClient(ctx: IExecuteFunctions): Promise<Work4allClient> {
	const credentials = await ctx.getCredentials('work4allApi');
	const baseUrl = credentials.baseUrl as string;
	const accessToken = await getAccessToken(
		credentials.tokenUrl as string,
		credentials.clientId as string,
		credentials.clientSecret as string,
	);
	return { baseUrl, accessToken };
}

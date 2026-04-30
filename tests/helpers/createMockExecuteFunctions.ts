import type { IBinaryData, IExecuteFunctions, INode } from 'n8n-workflow';

export interface MockBinaryEntry {
	data: IBinaryData;
	buffer: Buffer;
}

export interface MockOptions {
	credentials: Record<string, unknown>;
	/** Flat map of parameter names as used in getNodeParameter() calls, e.g. 'dataFields.details' */
	parameters: Record<string, unknown>;
	binaryData?: Record<string, MockBinaryEntry>;
	/** Override httpRequestWithAuthentication. Defaults to a real OAuth2 client-credentials fetch (for integration tests). */
	httpRequestWithAuthentication?: (credType: string, opts: Record<string, unknown>) => Promise<unknown>;
}

const MOCK_NODE: INode = {
	id: 'mock',
	name: 'Work4all',
	type: 'work4all',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

/**
 * Creates a minimal IExecuteFunctions mock for testing the execute() functions.
 * For integration tests, httpRequestWithAuthentication defaults to a real OAuth2
 * client-credentials flow so the GraphQL endpoint is actually called.
 * Override it for unit tests.
 */
export function createMockExecuteFunctions(opts: MockOptions): IExecuteFunctions {
	let cachedToken: string | null = null;

	async function getAccessToken(): Promise<string> {
		if (cachedToken) return cachedToken;
		const tokenUrl = (opts.credentials['accessTokenUrl'] ?? opts.credentials['tokenUrl']) as string;
		const clientId = opts.credentials['clientId'] as string;
		const clientSecret = opts.credentials['clientSecret'] as string;
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
			throw new Error(`Token exchange failed (HTTP ${response.status})`);
		}
		const json = (await response.json()) as { access_token: string };
		cachedToken = json.access_token;
		return cachedToken;
	}

	return {
		getCredentials: async () => opts.credentials,
		getNode: () => MOCK_NODE,

		getNodeParameter: (name: string, _itemIndex: number, fallback?: unknown) => {
			const value = opts.parameters[name as string];
			return value !== undefined ? value : (fallback ?? undefined);
		},

		helpers: {
			assertBinaryData: (_itemIndex: number, propName: string): IBinaryData => {
				const entry = opts.binaryData?.[propName];
				if (!entry) throw new Error(`No binary data configured for property "${propName}"`);
				return entry.data;
			},

			getBinaryDataBuffer: async (_itemIndex: number, propName: string): Promise<Buffer> => {
				const entry = opts.binaryData?.[propName];
				if (!entry) throw new Error(`No binary data configured for property "${propName}"`);
				return entry.buffer;
			},

			httpRequestWithAuthentication: opts.httpRequestWithAuthentication
				? opts.httpRequestWithAuthentication
				: async (_credType: string, requestOpts: Record<string, unknown>): Promise<unknown> => {
						const accessToken = await getAccessToken();
						const url = requestOpts['url'] as string;
						const method = (requestOpts['method'] as string) ?? 'GET';
						const extraHeaders = (requestOpts['headers'] as Record<string, string>) ?? {};
						const body = requestOpts['body'];

						const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
						const headers: Record<string, string> = {
							...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
							...extraHeaders,
							Authorization: `Bearer ${accessToken}`,
						};

						const response = await fetch(url, {
							method,
							headers,
							body: isFormData ? (body as FormData) : (body ? JSON.stringify(body) : undefined),
						});

						const text = await response.text();
						if (!response.ok) {
							throw new Error(
								`HTTP ${response.status} ${response.statusText} for ${url}\n${text.slice(0, 500)}`,
							);
						}
						try {
							return JSON.parse(text) as unknown;
						} catch {
							throw new Error(
								`Non-JSON response (HTTP ${response.status}) from ${url}:\n${text.slice(0, 500)}`,
							);
						}
					},
		},
	} as unknown as IExecuteFunctions;
}

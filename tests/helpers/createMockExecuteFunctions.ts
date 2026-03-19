import type { IBinaryData, IExecuteFunctions } from 'n8n-workflow';

export interface MockBinaryEntry {
	data: IBinaryData;
	buffer: Buffer;
}

export interface MockOptions {
	credentials: Record<string, unknown>;
	/** Flat map of parameter names as used in getNodeParameter() calls, e.g. 'dataFields.details' */
	parameters: Record<string, unknown>;
	binaryData?: Record<string, MockBinaryEntry>;
	/** Override httpRequest. Defaults to a real fetch call (for integration tests). */
	httpRequest?: (opts: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Creates a minimal IExecuteFunctions mock for testing the execute() functions.
 * For integration tests, httpRequest defaults to a real fetch so the GraphQL
 * endpoint is actually called. Override it for unit tests.
 */
export function createMockExecuteFunctions(opts: MockOptions): IExecuteFunctions {
	return {
		getCredentials: async () => opts.credentials,

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

			httpRequest: opts.httpRequest
				? opts.httpRequest
				: async (requestOpts: Record<string, unknown>): Promise<unknown> => {
						const url = requestOpts['url'] as string;
						const response = await fetch(url, {
							method: requestOpts['method'] as string,
							headers: requestOpts['headers'] as Record<string, string>,
							body: requestOpts['body'] ? JSON.stringify(requestOpts['body']) : undefined,
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
							throw new Error(`Non-JSON response (HTTP ${response.status}) from ${url}:\n${text.slice(0, 500)}`);
						}
					},
		},
	} as unknown as IExecuteFunctions;
}

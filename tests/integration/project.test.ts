/* eslint-disable @n8n/community-nodes/no-restricted-imports, @n8n/community-nodes/no-restricted-globals */
/**
 * Integration tests for project operations — hits the real work4all API.
 *
 * Required env vars (put in .env.test, which is gitignored):
 *   W4A_BASE_URL                 e.g. https://api.work4all.de
 *   W4A_API_ACCESS_TOKEN_URL     OAuth2 token endpoint URL
 *   W4A_API_CLIENT_ID            OAuth2 client ID
 *   W4A_API_CLIENT_SECRET        OAuth2 client secret
 *   W4A_TEST_PROJECT_CODE        A project code that exists in your tenant
 *
 * All tests are skipped automatically when the env vars are not set.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

import { execute } from '../../nodes/work4all/operations/project/execute';
import { createMockExecuteFunctions } from '../helpers/createMockExecuteFunctions';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// ── Credentials & config ──────────────────────────────────────────────────────

const BASE_URL = process.env['W4A_BASE_URL'] ?? '';
const TOKEN_URL = process.env['W4A_API_ACCESS_TOKEN_URL'] ?? '';
const CLIENT_ID = process.env['W4A_API_CLIENT_ID'] ?? '';
const CLIENT_SECRET = process.env['W4A_API_CLIENT_SECRET'] ?? '';
const PROJECT_CODE = parseInt(process.env['W4A_TEST_PROJECT_CODE'] ?? '0', 10);

const hasCredentials = Boolean(BASE_URL && TOKEN_URL && CLIENT_ID && CLIENT_SECRET);
const hasProjectCode = hasCredentials && Boolean(PROJECT_CODE);

const test = hasCredentials ? it : it.skip;
const testWithProject = hasProjectCode ? it : it.skip;

// ── Helpers ───────────────────────────────────────────────────────────────────

const credentials = { baseUrl: BASE_URL, tokenUrl: TOKEN_URL, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET };

function ctx(operation: string, extra: Record<string, unknown> = {}) {
	return createMockExecuteFunctions({
		credentials,
		parameters: { operation, ...extra },
	});
}

interface GqlResponse {
	data?: {
		getProjekte?: { total: number; size: number; page: number; data: Array<{ id: number; name: string }> };
	};
	errors?: Array<{ message: string }>;
}

function assertSuccess(result: unknown) {
	const res = result as GqlResponse;
	if (res.errors?.length) {
		throw new Error(`GraphQL errors: ${res.errors.map((e) => e.message).join(', ')}`);
	}
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('project (integration)', () => {
	test('gets all projects (first page, 10 results)', async () => {
		const result = await execute.call(ctx('getManyProjects', { projectQuerySize: 10, projectQueryPage: 1 }), 0);
		assertSuccess(result);
		const res = result as GqlResponse;
		expect(res.data?.getProjekte?.data).toBeInstanceOf(Array);
		expect((res.data?.getProjekte?.data ?? []).length).toBeGreaterThan(0);
	});

	test('gets all projects — page 2', async () => {
		const result = await execute.call(ctx('getManyProjects', { projectQuerySize: 5, projectQueryPage: 2 }), 0);
		assertSuccess(result);
		const res = result as GqlResponse;
		expect(res.data?.getProjekte?.data).toBeInstanceOf(Array);
	});

	testWithProject('gets a single project by code', async () => {
		const result = await execute.call(ctx('getProject', { projectCode: PROJECT_CODE }), 0);
		assertSuccess(result);
		const res = result as GqlResponse;
		const data = res.data?.getProjekte?.data ?? [];
		expect(data.length).toBe(1);
		expect(data[0]?.id).toBe(PROJECT_CODE);
	});

	// ── Output mode tests ─────────────────────────────────────────────────────

	test('getManyProjects — output: simplified trims to core fields', async () => {
		const result = await execute.call(
			ctx('getManyProjects', { projectQuerySize: 1, projectQueryPage: 1, projectOutput: 'simplified' }),
			0,
		);
		assertSuccess(result);
		const items = (result as GqlResponse).data?.getProjekte?.data ?? [];
		expect(items.length).toBeGreaterThan(0);
		const item = items[0] as unknown as Record<string, unknown>;
		// simplified fields are present
		expect(item).toHaveProperty('name');
		expect(item).toHaveProperty('customerId');
		// fields outside the simplified set are absent
		expect(item).not.toHaveProperty('projectProcessList');
		expect(item).not.toHaveProperty('startDateOuter');
	});

	test('getManyProjects — output: raw returns full response', async () => {
		const result = await execute.call(
			ctx('getManyProjects', { projectQuerySize: 1, projectQueryPage: 1, projectOutput: 'raw' }),
			0,
		);
		assertSuccess(result);
		const items = (result as GqlResponse).data?.getProjekte?.data ?? [];
		expect(items.length).toBeGreaterThan(0);
		const item = items[0] as unknown as Record<string, unknown>;
		// raw includes fields outside the simplified set
		expect(item).toHaveProperty('projectProcessList');
		expect(item).toHaveProperty('startDateOuter');
	});

	test('getManyProjects — output: selectedFields returns only the requested fields', async () => {
		const result = await execute.call(
			ctx('getManyProjects', {
				projectQuerySize: 1,
				projectQueryPage: 1,
				projectOutput: 'selectedFields',
				projectOutputFields: '["name","number"]',
			}),
			0,
		);
		assertSuccess(result);
		const items = (result as GqlResponse).data?.getProjekte?.data ?? [];
		expect(items.length).toBeGreaterThan(0);
		const item = items[0] as unknown as Record<string, unknown>;
		expect(Object.keys(item)).toEqual(['name', 'number']);
	});

	testWithProject('getProject — output: simplified trims to core fields', async () => {
		const result = await execute.call(
			ctx('getProject', { projectCode: PROJECT_CODE, projectOutput: 'simplified' }),
			0,
		);
		assertSuccess(result);
		const items = (result as GqlResponse).data?.getProjekte?.data ?? [];
		expect(items.length).toBe(1);
		const item = items[0] as unknown as Record<string, unknown>;
		expect(item).toHaveProperty('name');
		expect(item).not.toHaveProperty('projectProcessList');
	});

	testWithProject('getProject — output: selectedFields', async () => {
		const result = await execute.call(
			ctx('getProject', {
				projectCode: PROJECT_CODE,
				projectOutput: 'selectedFields',
				projectOutputFields: '["name","customerId"]',
			}),
			0,
		);
		assertSuccess(result);
		const items = (result as GqlResponse).data?.getProjekte?.data ?? [];
		expect(items.length).toBe(1);
		const item = items[0] as unknown as Record<string, unknown>;
		expect(Object.keys(item)).toEqual(['name', 'customerId']);
	});
});

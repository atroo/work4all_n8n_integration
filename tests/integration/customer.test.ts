/* eslint-disable @n8n/community-nodes/no-restricted-imports, @n8n/community-nodes/no-restricted-globals */
/**
 * Integration tests for customer operations — hits the real work4all API.
 *
 * Required env vars (put in .env.test, which is gitignored):
 *   W4A_BASE_URL                 e.g. https://api.work4all.de
 *   W4A_API_ACCESS_TOKEN_URL     OAuth2 token endpoint URL
 *   W4A_API_CLIENT_ID            OAuth2 client ID
 *   W4A_API_CLIENT_SECRET        OAuth2 client secret
 *
 * All tests are skipped automatically when the env vars are not set.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

import { execute } from '../../nodes/work4all/operations/customer/execute';
import { createMockExecuteFunctions } from '../helpers/createMockExecuteFunctions';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// ── Credentials & config ──────────────────────────────────────────────────────

const BASE_URL = process.env['W4A_BASE_URL'] ?? '';
const TOKEN_URL = process.env['W4A_API_ACCESS_TOKEN_URL'] ?? '';
const CLIENT_ID = process.env['W4A_API_CLIENT_ID'] ?? '';
const CLIENT_SECRET = process.env['W4A_API_CLIENT_SECRET'] ?? '';

const hasCredentials = Boolean(BASE_URL && TOKEN_URL && CLIENT_ID && CLIENT_SECRET);
const test = hasCredentials ? it : it.skip;

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
		getKunden?: { total: number; data: object[] };
		upsertKunde?: { code: number; name: string };
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

describe('customer (integration)', () => {
	// Code of the customer created in the create test — reused by get/update tests.
	let createdCustomerCode = 0;

	test('gets all customers (first page, 10 results)', async () => {
		const result = await execute.call(ctx('getManyCustomers', { querySize: 10, queryPage: 1 }), 0);
		assertSuccess(result);
		const res = result as GqlResponse;
		expect(res.data?.getKunden?.data).toBeInstanceOf(Array);
		expect((res.data?.getKunden?.data ?? []).length).toBeGreaterThan(0);
	});

	test('gets all customers — page 2', async () => {
		const result = await execute.call(
			ctx('getManyCustomers', { querySize: 5, queryPage: 2 }),
			0,
		);
		assertSuccess(result);
		const res = result as GqlResponse;
		expect(res.data?.getKunden?.data).toBeInstanceOf(Array);
	});

	test('creates a new customer', async () => {
		const testName = `n8n-test-${Date.now()}`;
		const result = await execute.call(
			ctx('createCustomer', {
				firma1: testName,
				eMail: 'test@n8n-integration.example',
				telefon: '+49 000 000000',
				strasse: 'Teststraße 1',
				plz: '12345',
				ort: 'Teststadt',
				notiz: '[n8n integration test — safe to delete]',
			}),
			0,
		);
		assertSuccess(result);
		const res = result as GqlResponse;
		expect(res.data?.upsertKunde?.code).toBeGreaterThan(0);
		createdCustomerCode = res.data?.upsertKunde?.code ?? 0;
	});

	test('gets a single customer by code (uses customer created above)', async () => {
		if (!createdCustomerCode) return;
		const result = await execute.call(ctx('getCustomer', { customerCode: createdCustomerCode }), 0);
		assertSuccess(result);
		const res = result as GqlResponse;
		expect(res.data?.getKunden?.data).toBeInstanceOf(Array);
		expect((res.data?.getKunden?.data ?? []).length).toBe(1);
	});

	test('updates the created customer note', async () => {
		if (!createdCustomerCode) return;
		const newNote = `[n8n test update ${Date.now()}]`;
		const result = await execute.call(
			ctx('updateCustomer', {
				customerCode: createdCustomerCode,
				notiz: newNote,
			}),
			0,
		);
		assertSuccess(result);
		const res = result as GqlResponse;
		expect(res.data?.upsertKunde?.code).toBeGreaterThan(0);
	});

	// ── Output mode tests ─────────────────────────────────────────────────────

	test('getManyCustomers — output: simplified trims to core fields', async () => {
		const result = await execute.call(
			ctx('getManyCustomers', { querySize: 1, queryPage: 1, output: 'simplified' }),
			0,
		);
		assertSuccess(result);
		const items = (result as GqlResponse).data?.getKunden?.data ?? [];
		expect(items.length).toBeGreaterThan(0);
		const item = items[0] as Record<string, unknown>;
		// simplified fields are present
		expect(item).toHaveProperty('name');
		expect(item).toHaveProperty('code');
		// fields outside the simplified set are absent
		expect(item).not.toHaveProperty('telefon2');
		expect(item).not.toHaveProperty('ansprechpartner');
	});

	test('getManyCustomers — output: raw returns full response', async () => {
		const result = await execute.call(
			ctx('getManyCustomers', { querySize: 1, queryPage: 1, output: 'raw' }),
			0,
		);
		assertSuccess(result);
		const items = (result as GqlResponse).data?.getKunden?.data ?? [];
		expect(items.length).toBeGreaterThan(0);
		const item = items[0] as Record<string, unknown>;
		// raw includes fields outside the simplified set
		expect(item).toHaveProperty('telefon2');
		expect(item).toHaveProperty('ansprechpartner');
	});

	test('getManyCustomers — output: selectedFields returns only the requested fields', async () => {
		const result = await execute.call(
			ctx('getManyCustomers', {
				querySize: 1,
				queryPage: 1,
				output: 'selectedFields',
				outputFields: '["code","name"]',
			}),
			0,
		);
		assertSuccess(result);
		const items = (result as GqlResponse).data?.getKunden?.data ?? [];
		expect(items.length).toBeGreaterThan(0);
		const item = items[0] as Record<string, unknown>;
		expect(Object.keys(item)).toEqual(['code', 'name']);
	});

	test('getCustomer — output: simplified trims to core fields (uses customer created above)', async () => {
		if (!createdCustomerCode) return;
		const result = await execute.call(
			ctx('getCustomer', { customerCode: createdCustomerCode, output: 'simplified' }),
			0,
		);
		assertSuccess(result);
		const items = (result as GqlResponse).data?.getKunden?.data ?? [];
		expect(items.length).toBe(1);
		const item = items[0] as Record<string, unknown>;
		expect(item).toHaveProperty('name');
		expect(item).not.toHaveProperty('telefon2');
		expect(item).not.toHaveProperty('ansprechpartner');
	});

	test('getCustomer — output: selectedFields (uses customer created above)', async () => {
		if (!createdCustomerCode) return;
		const result = await execute.call(
			ctx('getCustomer', {
				customerCode: createdCustomerCode,
				output: 'selectedFields',
				outputFields: '["code","name","eMail"]',
			}),
			0,
		);
		assertSuccess(result);
		const items = (result as GqlResponse).data?.getKunden?.data ?? [];
		expect(items.length).toBe(1);
		const item = items[0] as Record<string, unknown>;
		expect(Object.keys(item)).toEqual(['code', 'name', 'eMail']);
	});
});

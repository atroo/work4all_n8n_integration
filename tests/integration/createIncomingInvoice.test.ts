/* eslint-disable @n8n/community-nodes/no-restricted-imports, @n8n/community-nodes/no-restricted-globals */
/**
 * Integration tests for createIncomingInvoice — hits the real work4all API.
 *
 * Required env vars (put in .env.test, which is gitignored):
 *   W4A_BASE_URL                 e.g. https://api.work4all.de
 *   W4A_API_ACCESS_TOKEN_URL     OAuth2 token endpoint URL
 *   W4A_API_CLIENT_ID            OAuth2 client ID
 *   W4A_API_CLIENT_SECRET        OAuth2 client secret
 *   W4A_TEST_SUPPLIER_CODE       Internal supplier code (number) — must exist in your tenant
 *   W4A_TEST_ACCOUNT_CODE        Sachkonto code for the invoice line item
 *
 * All tests are skipped automatically when the env vars are not set.
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';
import type { IBinaryData } from 'n8n-workflow';

import { execute } from '../../nodes/work4all/operations/createIncomingInvoice/execute';
import { createMockExecuteFunctions, MockBinaryEntry } from '../helpers/createMockExecuteFunctions';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// ── Credentials & config ──────────────────────────────────────────────────────

const BASE_URL = process.env['W4A_BASE_URL'] ?? '';
const TOKEN_URL = process.env['W4A_API_ACCESS_TOKEN_URL'] ?? '';
const CLIENT_ID = process.env['W4A_API_CLIENT_ID'] ?? '';
const CLIENT_SECRET = process.env['W4A_API_CLIENT_SECRET'] ?? '';
const SUPPLIER_CODE = parseInt(process.env['W4A_TEST_SUPPLIER_CODE'] ?? '0', 10);
const ACCOUNT_CODE = parseInt(process.env['W4A_TEST_ACCOUNT_CODE'] ?? '0', 10);

const hasCredentials = Boolean(BASE_URL && TOKEN_URL && CLIENT_ID && CLIENT_SECRET && SUPPLIER_CODE && ACCOUNT_CODE);

// Use `it` when credentials are present, `it.skip` otherwise — tests will appear
// as "skipped" in the report rather than failing the suite in CI without credentials.
const test = hasCredentials ? it : it.skip;

// ── Test fixtures ─────────────────────────────────────────────────────────────

const DATA_DIR = path.resolve(__dirname, '../../data/receipts');

function readFixture(fileName: string): Buffer {
	return fs.readFileSync(path.join(DATA_DIR, fileName));
}

function makeBinaryEntry(fileName: string, mimeType: string): MockBinaryEntry {
	return {
		data: { data: '', fileName, mimeType } as IBinaryData,
		buffer: readFixture(fileName),
	};
}

/** Minimal invoice details referencing the test supplier */
function baseDetails(testName: string) {
	const today = new Date().toISOString();
	return {
		supplierCode: SUPPLIER_CODE,
		invoiceNumberSupplier: `IT-${Date.now()}`,
		note: `[n8n test] ${testName}`,
		invoiceDate: today,
		entryDate: today,
		currency: 'EUR',
	};
}

/** One line item hitting the test account */
function baseItems() {
	return JSON.stringify([
		{
			account: ACCOUNT_CODE,
			taxRate: 19,
			netAmount: 10.0,
			grossAmount: 11.9,
			vatAmount: 1.9,
			note: 'n8n integration test',
		},
	]);
}

/** Base mock options using JSON input mode (no attachments) */
function baseOpts(testName: string, extraParams: Record<string, unknown> = {}) {
	return {
		credentials: { baseUrl: BASE_URL, tokenUrl: TOKEN_URL, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET },
		parameters: {
			'dataFields.details': baseDetails(testName),
			inputMode: 'json',
			invoiceItemsJson: baseItems(),
			attachmentsUi: {},
			...extraParams,
		},
	};
}

/** Base mock options using manual mapping input mode */
function baseOptsManual(testName: string, extraParams: Record<string, unknown> = {}) {
	return {
		credentials: { baseUrl: BASE_URL, tokenUrl: TOKEN_URL, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET },
		parameters: {
			'dataFields.details': baseDetails(testName),
			inputMode: 'manual',
			invoiceItemsUi: {
				items: [
					{
						account: ACCOUNT_CODE,
						taxRate: 19,
						netAmount: 10.0,
						grossAmount: 11.9,
						vatAmount: 1.9,
						note: 'n8n integration test (manual)',
					},
				],
			},
			attachmentsUi: {},
			...extraParams,
		},
	};
}

// ── Helper: assert a successful GraphQL response ──────────────────────────────

interface GqlResponse {
	data?: { ahf_CreateCompleteIncomingInvoice?: { code: number; rNummer?: string } };
	errors?: Array<{ message: string }>;
}

function assertSuccess(result: unknown): void {
	const res = result as GqlResponse;
	if (res.errors?.length) {
		throw new Error(`GraphQL errors: ${res.errors.map((e) => e.message).join(', ')}`);
	}
	expect(res.data?.ahf_CreateCompleteIncomingInvoice?.code).toBeGreaterThan(0);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createIncomingInvoice (integration)', () => {
	test('creates invoice without attachments', async () => {
		const mock = createMockExecuteFunctions(baseOpts('no attachments'));
		const result = await execute.call(mock, 0);
		assertSuccess(result);
	});

	// NOTE: supplierName / supplierContactMailAddress / supplierIban lookup fields are not yet
	// deployed on the test server — supplierCode is added as fallback until then.
	// Once deployed, remove the supplierCode line.
	test('creates invoice from LLM output with supplier lookup by name/email/IBAN (no supplierCode)', async () => {
		const invoiceData = {
			// supplierCode: SUPPLIER_CODE, // TODO: remove once backend lookup fields are deployed
			supplierName: 'atroo GmbH',
			supplierContactMailAddress: 'info@atroo.de',
			supplierIban: 'DE16100100100937368106',
			invoiceNumberSupplier: 'atroo/2026/00001',
			note: 'Vielen Dank für die Zusammenarbeit!',
			invoiceDate: '2026-01-07T00:00:00Z',
			receiptDate: '2026-01-07T00:00:00Z',
			paymentTermDays: 24,
			currency: 'EUR',
			invoiceItems: [
				{
					taxRate: 19,
					netAmount: 12558.13,
					grossAmount: 14944.18,
					vatAmount: 2386.05,
					note: 'FE-Entwicklung / AI4all',
				},
			],
		};

		const mock = createMockExecuteFunctions({
			credentials: { baseUrl: BASE_URL, tokenUrl: TOKEN_URL, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET },
			parameters: {
				dataMode: 'json',
				invoiceDataJson: JSON.stringify(invoiceData),
				attachmentsMode: 'json',
				attachmentsJson: JSON.stringify([{ binaryPropertyName: 'invoice' }]),
			},
			binaryData: {
				invoice: makeBinaryEntry('atroo xrechnung.xml', 'application/xml'),
			},
		});
		const result = await execute.call(mock, 0);
		assertSuccess(result);
	});

	test('creates invoice via top-level JSON mode (LLM output path)', async () => {
		const today = new Date().toISOString();
		const invoiceData = {
			supplierCode: SUPPLIER_CODE,
			invoiceNumberSupplier: `IT-${Date.now()}`,
			note: '[n8n test] JSON mode',
			invoiceDate: today,
			entryDate: today,
			currency: 'EUR',
			invoiceItems: [
				{
					account: ACCOUNT_CODE,
					taxRate: 19,
					netAmount: 10.0,
					grossAmount: 11.9,
					vatAmount: 1.9,
					note: 'n8n integration test (json mode)',
				},
			],
		};

		// Without attachment
		const mockNoAttach = createMockExecuteFunctions({
			credentials: { baseUrl: BASE_URL, tokenUrl: TOKEN_URL, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET },
			parameters: { dataMode: 'json', invoiceDataJson: JSON.stringify(invoiceData), attachmentsUi: {} },
		});
		assertSuccess(await execute.call(mockNoAttach, 0));

		// With attachment
		const mockWithAttach = createMockExecuteFunctions({
			credentials: { baseUrl: BASE_URL, tokenUrl: TOKEN_URL, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET },
			parameters: {
				dataMode: 'json',
				invoiceDataJson: JSON.stringify({ ...invoiceData, invoiceNumberSupplier: `IT-${Date.now()}` }),
				attachmentsUi: { files: [{ binaryPropertyName: 'receipt' }] },
			},
			binaryData: {
				receipt: makeBinaryEntry('Teamviewer - normales PDF.pdf', 'application/pdf'),
			},
		});
		assertSuccess(await execute.call(mockWithAttach, 0));
	});

	test('creates invoice with one PDF attachment (normal PDF)', async () => {
		const mock = createMockExecuteFunctions({
			...baseOpts('PDF normal', {
				attachmentsUi: { files: [{ binaryPropertyName: 'receipt' }] },
			}),
			binaryData: {
				receipt: makeBinaryEntry('Teamviewer - normales PDF.pdf', 'application/pdf'),
			},
		});

		const result = await execute.call(mock, 0);
		assertSuccess(result);
	});

	test('creates invoice with one ZUGFeRD PDF attachment', async () => {
		const mock = createMockExecuteFunctions({
			...baseOpts('PDF ZUGFeRD', {
				attachmentsUi: { files: [{ binaryPropertyName: 'receipt' }] },
			}),
			binaryData: {
				receipt: makeBinaryEntry('Lisa Jäckel - ZUGFeRD.pdf', 'application/pdf'),
			},
		});

		const result = await execute.call(mock, 0);
		assertSuccess(result);
	});

	test('creates invoice with one XRechnung XML attachment', async () => {
		const mock = createMockExecuteFunctions({
			...baseOpts('XML XRechnung', {
				attachmentsUi: { files: [{ binaryPropertyName: 'receipt' }] },
			}),
			binaryData: {
				receipt: makeBinaryEntry('atroo xrechnung.xml', 'application/xml'),
			},
		});

		const result = await execute.call(mock, 0);
		assertSuccess(result);
	});

	test('creates invoice with multiple PDF attachments', async () => {
		const mock = createMockExecuteFunctions({
			...baseOpts('multi PDF', {
				attachmentsUi: {
					files: [
						{ binaryPropertyName: 'receipt0' },
						{ binaryPropertyName: 'receipt1' },
					],
				},
			}),
			binaryData: {
				receipt0: makeBinaryEntry('Teamviewer - normales PDF.pdf', 'application/pdf'),
				receipt1: makeBinaryEntry('Teamviewer - normales Addition.pdf', 'application/pdf'),
			},
		});

		const result = await execute.call(mock, 0);
		assertSuccess(result);
	});

	test('creates invoice with non-valid ZUGFeRD PDF (API should still accept the file)', async () => {
		const mock = createMockExecuteFunctions({
			...baseOpts('PDF invalid ZUGFeRD', {
				attachmentsUi: { files: [{ binaryPropertyName: 'receipt' }] },
			}),
			binaryData: {
				receipt: makeBinaryEntry('EMOVA - nicht valides ZUGFeRD.pdf', 'application/pdf'),
			},
		});

		const result = await execute.call(mock, 0);
		assertSuccess(result);
	});

	test('creates invoice with attachments provided as JSON array (LLM attachment selection path)', async () => {
		const mock = createMockExecuteFunctions({
			...baseOpts('JSON attachments', {
				attachmentsMode: 'json',
				attachmentsJson: JSON.stringify([{ binaryPropertyName: 'attach_0' }, { binaryPropertyName: 'attach_1' }]),
			}),
			binaryData: {
				attach_0: makeBinaryEntry('Teamviewer - normales PDF.pdf', 'application/pdf'),
				attach_1: makeBinaryEntry('Teamviewer - normales Addition.pdf', 'application/pdf'),
			},
		});

		const result = await execute.call(mock, 0);
		assertSuccess(result);
	});

	test('creates invoice with manual mapping (no attachments)', async () => {
		const mock = createMockExecuteFunctions(baseOptsManual('manual no attach'));
		const result = await execute.call(mock, 0);
		assertSuccess(result);
	});

	test('creates invoice with manual mapping and one PDF attachment', async () => {
		const mock = createMockExecuteFunctions({
			...baseOptsManual('manual PDF', {
				attachmentsUi: { files: [{ binaryPropertyName: 'receipt' }] },
			}),
			binaryData: {
				receipt: makeBinaryEntry('Teamviewer - normales PDF.pdf', 'application/pdf'),
			},
		});

		const result = await execute.call(mock, 0);
		assertSuccess(result);
	});

	test('creates invoice with ZIP — contents extracted and uploaded individually', async () => {
		// The node itself does not extract ZIPs (no external deps allowed).
		// This test simulates what an upstream "Extract Zip" node would do:
		// it reads the ZIP, extracts each entry, and passes them as separate
		// binary properties — each appearing as its own attachment.
		const zipBuffer = readFixture('Invoice.zip');
		const zip = await JSZip.loadAsync(zipBuffer);

		const binaryData: Record<string, MockBinaryEntry> = {};
		const attachmentFiles: Array<{ binaryPropertyName: string }> = [];

		let index = 0;
		for (const [entryName, zipEntry] of Object.entries(zip.files)) {
			if (zipEntry.dir) continue;
			const entryBuffer = Buffer.from(await zipEntry.async('arraybuffer'));
			const propName = `zipFile${index}`;
			const mimeType = entryName.toLowerCase().endsWith('.pdf')
				? 'application/pdf'
				: entryName.toLowerCase().endsWith('.xml')
					? 'application/xml'
					: 'application/octet-stream';

			binaryData[propName] = {
				data: { data: '', fileName: entryName, mimeType } as IBinaryData,
				buffer: entryBuffer,
			};
			attachmentFiles.push({ binaryPropertyName: propName });
			index++;
		}

		expect(attachmentFiles.length).toBeGreaterThan(0);

		const mock = createMockExecuteFunctions({
			...baseOpts('ZIP extracted', { attachmentsUi: { files: attachmentFiles } }),
			binaryData,
		});

		const result = await execute.call(mock, 0);
		assertSuccess(result);
	});
});

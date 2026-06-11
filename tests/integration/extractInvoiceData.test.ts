/**
 * Unit tests for extractInvoiceData.
 *
 * These do NOT hit the network: httpRequestWithAuthentication is stubbed so we can
 * assert how the node calls the work4all AI extraction backend (URL, headers,
 * multipart body) and how it normalizes the response.
 */

import type { IBinaryData } from 'n8n-workflow';

import { DEFAULT_EXTRACTION_URL } from '../../nodes/work4all/operations/extractInvoiceData/description';
import { execute } from '../../nodes/work4all/operations/extractInvoiceData/execute';
import { MANDANT_HEADER } from '../../nodes/work4all/request';
import { createMockExecuteFunctions, MockBinaryEntry } from '../helpers/createMockExecuteFunctions';

// A custom endpoint to prove the node uses the configurable extractionUrl parameter.
const EXTRACTION_URL = 'http://localhost:8000/invoice_information_extraction';
const APIURL_HEADER = 'x-work4all-apiurl';
const BASE_URL = 'https://backend-dev.work4alltest.work4allcloud.de';

function binaryEntry(fileName: string, mimeType: string, content = 'dummy'): MockBinaryEntry {
	return {
		data: { data: '', fileName, mimeType } as IBinaryData,
		buffer: Buffer.from(content),
	};
}

const credentials = { baseUrl: BASE_URL, accessTokenUrl: 'x', clientId: 'x', clientSecret: 'x' };

const SAMPLE_RESPONSE = {
	found_invoice: true,
	reason: 'looks like an invoice',
	relevantAttachmentKeys: ['attachment_0'],
	invoiceData: {
		supplierName: 'ACME GmbH',
		supplierCode: null,
		note: '',
		invoiceItems: [{ account: 4500, netAmount: 100, costCenter: null }],
	},
};

describe('extractInvoiceData (unit)', () => {
	it('posts all binary attachments as multipart with apiurl + mandant headers', async () => {
		let captured: Record<string, unknown> | undefined;

		const mock = createMockExecuteFunctions({
			credentials,
			parameters: {
				operation: 'extractInvoiceData',
				extractAttachments: 'all',
				mandant: '7',
				extractionUrl: EXTRACTION_URL,
			},
			binaryData: {
				attachment_0: binaryEntry('invoice.pdf', 'application/pdf'),
				attachment_1: binaryEntry('note.xml', 'application/xml'),
			},
			httpRequestWithAuthentication: async (_credType, requestOpts) => {
				captured = requestOpts;
				return SAMPLE_RESPONSE;
			},
		});

		const result = await execute.call(mock, 0);

		expect(captured?.['url']).toBe(EXTRACTION_URL);
		expect(captured?.['method']).toBe('POST');

		const headers = captured?.['headers'] as Record<string, string>;
		expect(headers[APIURL_HEADER]).toBe(BASE_URL);
		expect(headers[MANDANT_HEADER]).toBe('7');

		const body = captured?.['body'];
		expect(typeof FormData !== 'undefined' && body instanceof FormData).toBe(true);
		const files = (body as FormData).getAll('attachments');
		expect(files).toHaveLength(2);

		// The node returns the backend response verbatim — normalization (null stripping,
		// found_invoice coercion) is done by the shared parser node in the workflow.
		expect(result).toEqual(SAMPLE_RESPONSE);
	});

	it('sends only the selected binary properties in JSON mode', async () => {
		let captured: Record<string, unknown> | undefined;

		const mock = createMockExecuteFunctions({
			credentials,
			parameters: {
				operation: 'extractInvoiceData',
				extractAttachments: 'json',
				extractAttachmentsJson: JSON.stringify([{ binaryPropertyName: 'attachment_1' }]),
			},
			binaryData: {
				attachment_0: binaryEntry('invoice.pdf', 'application/pdf'),
				attachment_1: binaryEntry('receipt.pdf', 'application/pdf'),
			},
			httpRequestWithAuthentication: async (_credType, requestOpts) => {
				captured = requestOpts;
				return { found_invoice: false, reason: 'no', relevantAttachmentKeys: [], invoiceData: {} };
			},
		});

		const result = await execute.call(mock, 0);

		const files = (captured?.['body'] as FormData).getAll('attachments');
		expect(files).toHaveLength(1);
		expect((files[0] as File).name).toBe('attachment_1');

		expect(result).toEqual({
			found_invoice: false,
			reason: 'no',
			relevantAttachmentKeys: [],
			invoiceData: {},
		});
	});

	it('falls back to the default endpoint URL when extractionUrl is not set', async () => {
		let captured: Record<string, unknown> | undefined;

		const mock = createMockExecuteFunctions({
			credentials,
			parameters: { operation: 'extractInvoiceData', extractAttachments: 'all' },
			binaryData: { attachment_0: binaryEntry('invoice.pdf', 'application/pdf') },
			httpRequestWithAuthentication: async (_credType, requestOpts) => {
				captured = requestOpts;
				return SAMPLE_RESPONSE;
			},
		});

		await execute.call(mock, 0);
		expect(captured?.['url']).toBe(DEFAULT_EXTRACTION_URL);
	});

	it('throws when there are no attachments to send', async () => {
		const mock = createMockExecuteFunctions({
			credentials,
			parameters: { operation: 'extractInvoiceData', extractAttachments: 'all' },
			httpRequestWithAuthentication: async () => ({}),
		});

		await expect(execute.call(mock, 0)).rejects.toThrow(/No binary attachments/);
	});
});

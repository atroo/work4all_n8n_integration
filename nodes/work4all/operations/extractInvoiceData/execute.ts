import { IExecuteFunctions, NodeApiError, NodeOperationError } from 'n8n-workflow';

import { getClient } from '../../auth';
import { MANDANT_HEADER, getMandant } from '../../request';
import { DEFAULT_EXTRACTION_URL } from './description';

// The AI extraction backend is the same for every tenant. The target work4all
// instance is selected via the x-work4all-apiurl / x-work4all-mandant headers,
// using the values from the configured work4allOAuth2Api credential. The endpoint
// URL is configurable on the node (defaults to DEFAULT_EXTRACTION_URL).
const APIURL_HEADER = 'x-work4all-apiurl';

function resolveBinaryKeys(ctx: IExecuteFunctions, itemIndex: number): string[] {
	const mode = ctx.getNodeParameter('extractAttachments', itemIndex, 'all') as string;

	if (mode === 'json') {
		let raw = ctx.getNodeParameter('extractAttachmentsJson', itemIndex, '[]') as
			| string
			| Array<{ binaryPropertyName: string }>;
		if (typeof raw === 'string') raw = JSON.parse(raw) as Array<{ binaryPropertyName: string }>;
		return Array.isArray(raw)
			? raw
					.filter(
						(entry): entry is { binaryPropertyName: string } =>
							typeof entry === 'object' &&
							entry !== null &&
							typeof (entry as { binaryPropertyName?: unknown }).binaryPropertyName === 'string',
					)
					.map((entry) => entry.binaryPropertyName)
			: [];
	}

	if (mode === 'form') {
		const ui = ctx.getNodeParameter('extractAttachmentsUi', itemIndex, {}) as {
			files?: Array<{ binaryPropertyName: string }>;
		};
		return (ui?.files ?? []).map((f) => f.binaryPropertyName);
	}

	// mode === 'all'
	const item = ctx.getInputData()[itemIndex];
	return Object.keys(item?.binary ?? {});
}

export async function execute(this: IExecuteFunctions, itemIndex: number): Promise<object> {
	try {
		const binaryKeys = resolveBinaryKeys(this, itemIndex);

		if (binaryKeys.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'No binary attachments found to send for extraction.',
			);
		}

		const form = new FormData();
		for (const key of binaryKeys) {
			const binaryData = this.helpers.assertBinaryData(itemIndex, key);
			const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, key);
			const arrayBuffer = buffer.buffer.slice(
				buffer.byteOffset,
				buffer.byteOffset + buffer.byteLength,
			) as ArrayBuffer;
			// Send the n8n binary property name as the multipart filename so the backend
			// echoes it back in relevantAttachmentKeys — that keeps the downstream
			// attachment lookup (keyed by binary property name) stable. The file type is
			// still conveyed via the per-part Content-Type from the binary's mimeType.
			form.append('attachments', new Blob([arrayBuffer], { type: binaryData.mimeType }), key);
		}

		const { baseUrl } = await getClient(this);
		const mandant = getMandant(this, itemIndex);
		const extractionUrl =
			(this.getNodeParameter('extractionUrl', itemIndex, DEFAULT_EXTRACTION_URL) as string)?.trim() ||
			DEFAULT_EXTRACTION_URL;

		// Return the backend response as-is. Normalization (null stripping, found_invoice
		// coercion) is handled downstream by the shared parser so the LLM and backend
		// extraction paths converge on a single normalization step.
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'work4allOAuth2Api',
			{
				method: 'POST',
				url: extractionUrl,
				headers: {
					[APIURL_HEADER]: baseUrl,
					[MANDANT_HEADER]: mandant,
					Accept: 'application/json',
				},
				body: form as unknown as object,
				json: true,
			},
		);

		return (response ?? {}) as object;
	} catch (error) {
		if (error instanceof NodeApiError || error instanceof NodeOperationError) throw error;
		throw new NodeApiError(
			this.getNode(),
			{ message: (error as Error).message },
			{
				message: 'work4all extractInvoiceData failed',
				description:
					'Verify your work4all credentials and that the extraction backend is reachable.',
			},
		);
	}
}

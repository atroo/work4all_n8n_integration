import { IExecuteFunctions } from 'n8n-workflow';

const GQL_MUTATION = `
	mutation ahf_CreateCompleteIncomingInvoice(
		$data: InputCompleteIncomingInvoice!,
		$receipts: InputErpAnhangAttachementsRelation
	) {
		ahf_CreateCompleteIncomingInvoice(input: $data, receipts: $receipts) {
			code
			notiz
			rNummer
			rNummerbeiLieferant
			datum
			faelligDatum
			eingangsDatum
			buchungsDatum
			rBetrag
			rMwst
			summe
			waehrungCode
			paymentTermDays
			skontoProzent
			skontoTg
			statusCode
			creationDate
			sDObjMemberCode
			projektCode
			buchungen {
				code
				sachkontoCode
				sachkontoNummer
				kostenstelleCode
				kostenstelleNummer
				kostengruppeCode
				projektCode
				steuerschluessel
				mwst
				valueNet
				mwstBetrag
				anteilDM
				notiz
			}
			lieferant { code nummer name }
			projekt { code nummer name }
		}
	}
`;

interface UploadResponse {
	fileStored: boolean;
	generatedObject: string;
	errorMessage?: string;
}

async function uploadFile(
	baseUrl: string,
	accessToken: string,
	buffer: Buffer,
	fileName: string,
	mimeType: string,
): Promise<string> {
	const form = new FormData();
	const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
	form.append('myFile', new Blob([arrayBuffer], { type: mimeType }), fileName);

	const response = await fetch(`${baseUrl}/api/file?type=TempDatei`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${accessToken}` },
		body: form,
	});

	if (!response.ok) {
		throw new Error(`File upload failed for "${fileName}" (HTTP ${response.status})`);
	}

	const json = (await response.json()) as UploadResponse;
	if (!json.fileStored || !json.generatedObject) {
		throw new Error(
			`File upload rejected for "${fileName}": ${json.errorMessage ?? JSON.stringify(json)}`,
		);
	}

	return json.generatedObject;
}

export async function execute(this: IExecuteFunctions, itemIndex: number): Promise<object> {
	const credentials = await this.getCredentials('work4allApi');
	const baseUrl = credentials.baseUrl as string;
	const accessToken = credentials.accessToken as string;

	const dataMode = this.getNodeParameter('dataMode', itemIndex) as string;

	let details: Record<string, unknown>;
	let invoiceItems: unknown[];

	if (dataMode === 'json') {
		let raw = this.getNodeParameter('invoiceDataJson', itemIndex) as string | Record<string, unknown>;
		if (typeof raw === 'string') raw = JSON.parse(raw) as Record<string, unknown>;
		const { invoiceItems: items, ...rest } = raw;
		details = rest;
		invoiceItems = Array.isArray(items) ? items : [];
	} else {
		details = this.getNodeParameter('dataFields.details', itemIndex, {}) as Record<string, unknown>;
		const inputMode = this.getNodeParameter('inputMode', itemIndex) as string;
		if (inputMode === 'manual') {
			const ui = this.getNodeParameter('invoiceItemsUi', itemIndex) as Record<string, unknown>;
			invoiceItems = (ui?.items as unknown[]) ?? [];
		} else {
			let raw = this.getNodeParameter('invoiceItemsJson', itemIndex) as string | unknown[];
			if (typeof raw === 'string') raw = JSON.parse(raw) as unknown[];
			invoiceItems = raw;
		}
	}

	// ── File attachments ──────────────────────────────────────────────────────
	const attachmentsUi = this.getNodeParameter('attachmentsUi', itemIndex) as {
		files?: Array<{ binaryPropertyName: string }>;
	};
	const filesToUpload = attachmentsUi?.files ?? [];

	const uploadedFiles: Array<{ tempFileId: string }> = [];
	for (const { binaryPropertyName } of filesToUpload) {
		const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
		const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
		const tempFileId = await uploadFile(
			baseUrl,
			accessToken,
			buffer,
			binaryData.fileName ?? 'attachment',
			binaryData.mimeType,
		);
		uploadedFiles.push({ tempFileId });
	}

	const receipts = uploadedFiles.length > 0 ? { add: uploadedFiles } : undefined;

	return this.helpers.httpRequest({
		method: 'POST',
		url: `${baseUrl}/graphql`,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		},
		body: {
			query: GQL_MUTATION,
			variables: {
				data: { ...details, invoiceItems },
				...(receipts && { receipts }),
			},
		},
		json: true,
	});
}

import { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class Work4allApi implements ICredentialType {
	name = 'work4allApi';
	displayName = 'work4all API';
	documentationUrl = 'https://docs.work4all.de';
	properties: INodeProperties[] = [
		{
			displayName: 'API URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.work4all.de',
			required: true,
		},
		{
			displayName: 'Token URL',
			name: 'tokenUrl',
			type: 'string',
			default: '',
			required: true,
			description: 'OAuth2 token endpoint, e.g. https://auth.work4all.de/connect/token',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
	];

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: '={{$credentials.tokenUrl}}',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: '={{"grant_type=client_credentials&client_id=" + encodeURIComponent($credentials.clientId) + "&client_secret=" + encodeURIComponent($credentials.clientSecret)}}',
		},
	};
}

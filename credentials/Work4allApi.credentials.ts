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
			displayName: 'Bearer Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
	];

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: '={{$credentials.baseUrl}}/graphql',
			headers: {
				Authorization: '={{ "Bearer " + $credentials.accessToken }}',
				'Content-Type': 'application/json',
			},
			body: {
				query: '{ __typename }',
			},
		},
	};
}

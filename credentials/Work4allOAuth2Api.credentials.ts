import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class Work4allOAuth2Api implements ICredentialType {
	name = 'work4allOAuth2Api';
	displayName = 'Work4all OAuth2 API';
	extends = ['oAuth2Api'];
	icon = { light: 'file:../nodes/work4all/w4a.svg', dark: 'file:../nodes/work4all/w4a.svg' } as ICredentialType['icon'];
	documentationUrl = 'https://docs.work4all.de';
	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'clientCredentials',
		},
		{
			displayName: 'API URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.work4all.de',
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'string',
			default: 'https://auth.work4all.de/connect/token',
			required: true,
		},
	];
}

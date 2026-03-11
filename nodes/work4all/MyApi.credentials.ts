import {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
    Icon,
} from 'n8n-workflow';

export class MyApi implements ICredentialType {
	name = 'myApi';
	displayName = 'My API Credentials';
    icon: Icon = 'file:w4a.svg';
	documentationUrl = 'https://deine-docs.de';
	properties: INodeProperties[] = [
		{
			displayName: 'API URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.deine-firma.de',
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

	// Diese Methode wird aufgerufen, wenn der User auf "Test Connection" klickt
    test: ICredentialTestRequest = {
        request: {
            method: 'POST',
            url: '={{$credentials.baseUrl}}/graphql',
            headers: {
                'Authorization': '={{ "Bearer " + $credentials.accessToken }}',
                'Content-Type': 'application/json',
            },
            body: {
                // Fragt nur den Typnamen des Root-Objekts ab - das funktioniert fast immer
                query: '{ __typename }', 
            },
        },
    };

}

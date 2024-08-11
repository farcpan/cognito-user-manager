import {
	CognitoIdentityProviderClient,
	InitiateAuthCommand,
	RespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';

export const loginHandler = async (event: any, context: any) => {
	const userPoolId = process.env['userPoolId'];
	if (!userPoolId) {
		return getResponse({
			statusCode: 500,
			body: JSON.stringify({ message: 'userPoolId required.' }),
		});
	}
	const clientId = process.env['clientId'];
	if (!clientId) {
		return getResponse({
			statusCode: 500,
			body: JSON.stringify({ message: 'clientId required.' }),
		});
	}

	const body = event.body;
	if (!body) {
		return getResponse({
			statusCode: 400,
			body: JSON.stringify({ message: 'request body required.' }),
		});
	}
	const { username, password } = JSON.parse(body) as { username: string; password: string };

	const client = new CognitoIdentityProviderClient();
	try {
		// custom auth
		const initiateAuthResponseV2 = await client.send(
			new InitiateAuthCommand({
				AuthFlow: 'CUSTOM_AUTH',
				ClientId: clientId,
				AuthParameters: {
					USERNAME: username,
					PASSWORD: password,
				},
			})
		);

		const challengeName = initiateAuthResponseV2.ChallengeName;
		const session = initiateAuthResponseV2.Session;
		return getResponse({
			statusCode: 200,
			body: JSON.stringify({
				challengeName: challengeName,
				session: session,
			}),
		});
	} catch (e) {
		return getResponse({ statusCode: 500, body: JSON.stringify(e) });
	}
};

export const loginVerifyHandler = async (event: any, context: any) => {
	const userPoolId = process.env['userPoolId'];
	if (!userPoolId) {
		return getResponse({
			statusCode: 500,
			body: JSON.stringify({ message: 'userPoolId required.' }),
		});
	}
	const clientId = process.env['clientId'];
	if (!clientId) {
		return getResponse({
			statusCode: 500,
			body: JSON.stringify({ message: 'clientId required.' }),
		});
	}

	const body = event.body;
	if (!body) {
		return getResponse({
			statusCode: 400,
			body: JSON.stringify({ message: 'request body required.' }),
		});
	}
	const { username, password, code, session } = JSON.parse(body) as {
		username: string;
		password: string;
		code: string;
		session: string;
	};

	const client = new CognitoIdentityProviderClient();
	try {
		// username + password check
		await client.send(
			new InitiateAuthCommand({
				AuthFlow: 'USER_PASSWORD_AUTH',
				ClientId: clientId,
				AuthParameters: {
					USERNAME: username,
					PASSWORD: password,
				},
			})
		);

		// custom auth
		const response = await client.send(
			new RespondToAuthChallengeCommand({
				ClientId: clientId,
				ChallengeName: 'CUSTOM_CHALLENGE',
				ChallengeResponses: {
					USERNAME: username,
					ANSWER: code,
				},
				Session: session,
			})
		);

		return getResponse({
			statusCode: 200,
			body: JSON.stringify(response.AuthenticationResult),
		});
	} catch (e) {
		return getResponse({ statusCode: 500, body: JSON.stringify(e) });
	}
};

/////////////////////////////////////////////////////////////////////////////
// 内部処理
/////////////////////////////////////////////////////////////////////////////
const getResponse = ({ statusCode, body }: { statusCode: number; body: string }) => {
	return {
		statusCode: statusCode,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Content-Type': 'application/json; charset=utf-8',
		},
		body: body,
	};
};

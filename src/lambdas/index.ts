import {
	CognitoIdentityProviderClient,
	InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { randomBytes } from 'crypto';

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
		const SRP_A = calculateSRP_A();
		console.log(SRP_A);

		const response = await client.send(
			new InitiateAuthCommand({
				AuthFlow: 'CUSTOM_AUTH',
				ClientId: clientId,
				AuthParameters: {
					USERNAME: username,
					PASSWORD: password,
					SRP_A: SRP_A,
				},
			})
		);
		return getResponse({ statusCode: 200, body: JSON.stringify(response) });
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

const calculateSRP_A = (): string => {
	const bigInt = require('big-integer');

	// N, g, k などのSRP定数を定義
	const N_HEX =
		'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1' +
		'29024E088A67CC74020BBEA63B139B22514A08798E3404DD' +
		'EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245' +
		'E485B576625E7EC6F44C42E9A63A36210000000000090563';
	const g = bigInt(2);
	const N = bigInt(N_HEX, 16);

	// クライアントランダム値 (a) を生成
	function generateRandomHex(length: number): string {
		return randomBytes(length).toString('hex');
	}

	const a = bigInt(generateRandomHex(128), 16);
	const A = g.modPow(a, N);
	return A.toString(16);
};

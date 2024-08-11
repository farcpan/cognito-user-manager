import { randomBytes } from 'crypto';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';

/////////////////////////////////////////////////////////////////////////////////
// カスタムチャレンジLambda
/////////////////////////////////////////////////////////////////////////////////
/**
 * Cognitoカスタムメッセージ送信Handler
 *
 * @param event Lambdaイベント
 * @param context Lambdaコンテキスト
 * @returns Cognitoカスタムメッセージ送信結果
 */
export const defineAuthChallengeHandler = async (event: any, context: any) => {
	const index = event.request.session.length - 1;
	console.log(event);

	if (event.request.session.length === 0) {
		event.response.issueTokens = false;
		event.response.failAuthentication = false;
		event.response.challengeName = 'PASSWORD_VERIFIER';
	} else if (
		event.request.session[index].challengeName === 'PASSWORD_VERIFIER' &&
		event.request.session[index].challengeResult === true
	) {
		event.response.issueTokens = false;
		event.response.failAuthentication = false;
		event.response.challengeName = 'CUSTOM_CHALLENGE';
	} else if (
		event.request.session[index].challengeName === 'CUSTOM_CHALLENGE' &&
		event.request.session[index].challengeResult === true
	) {
		event.response.issueTokens = true;
		event.response.failAuthentication = false;
	} else {
		event.response.issueTokens = false;
		event.response.failAuthentication = true;
	}

	return event;
};

/**
 *
 * @param event
 * @param context
 * @returns
 */
export const createAuthChallengeHandler = async (event: any, context: any) => {
	//const len = event.request.session.length - 1;
	console.log(event);

	if (event.request.challengeName === 'CUSTOM_CHALLENGE') {
		/*
		let verificationCode;
		if (event.request.session[len].challengeName === 'CUSTOM_CHALLENGE') {
			verificationCode = event.request.session[len].challengeMetadata;
		} else {
			verificationCode = randomBytes(3).toString('hex');
			await sendEmail(event.request.userAttributes['email'], verificationCode);
		}
        */

		const verificationCode = randomBytes(3).toString('hex');
		await sendEmail(event.request.userAttributes['email'], verificationCode);

		event.response.privateChallengeParameters = { answer: verificationCode };
		event.response.challengeMetadata = verificationCode;
	}

	return event;
};

const sendEmail = async (email: string, code: string) => {
	const client = new SESClient();
	await client.send(
		new SendEmailCommand({
			Destination: {
				ToAddresses: [email],
			},
			Message: {
				Body: {
					Text: {
						Data: `Your verification code is ${code}.`,
					},
				},
				Subject: {
					Data: 'Custom Flow of Authentication',
				},
			},
			Source: 'miyazaki.carp@gmail.com', // 仮メールアドレス（送信元）
		})
	);
};

/**
 *
 *
 * @param event
 * @param context
 */
export const verifyAuthChallengeHandler = async (event: any, context: any) => {
	console.log(event);

	const answer = event.request.privateChallengeParameters.answer;
	if (event.request.challengeAnswer === answer) {
		event.response.answerCorrect = true;
	} else {
		event.response.answerCorrect = false;
	}

	return event;
};

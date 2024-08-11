/////////////////////////////////////////////////////////////////////////////////
// カスタムメッセージLambda
/////////////////////////////////////////////////////////////////////////////////
/**
 * パスワードを忘れた場合に送信するメッセージを取得する
 *
 * @returns パスワードリセットメッセージ
 */
const getPasswordForgotMessage = () => {
	return (
		'<html>' +
		'<head></head>' +
		'<body>' +
		'<p>確認コード: {####} </p>' +
		'<br/>' +
		'<p>※有効期限は30分です。ご注意ください。</p>' +
		'</body>' +
		'</html>'
	);
};

/**
 * アカウント作成時の検証メッセージを取得する
 *
 * @returns アカウント作成メッセージ
 */
const getVerificationMessage = () => {
	return (
		'<html>' +
		'<head></head>' +
		'<body>' +
		'<p>アカウント登録ありがとうございます。下記確認コードを入力し、アカウント登録を完了してください。</p>' +
		'<br/>' +
		'<p>確認コード：{####} </p>' +
		'<br/>' +
		'</body>' +
		'</html>'
	);
};

/**
 * メールアドレス変更時の検証メッセージを取得する
 *
 * @returns メールアドレス変更メッセージ
 */
const getEmailChangeMessage = () => {
	return (
		'<html>' +
		'<head></head>' +
		'<body>' +
		'<p>確認コード: {####} </p>' +
		'<br/>' +
		'<p>※有効期限は30分です。ご注意ください。</p>' +
		'</body>' +
		'</html>'
	);
};

/**
 * Cognitoカスタムメッセージ送信Handler
 *
 * @param event Lambdaイベント
 * @param context Lambdaコンテキスト
 * @returns Cognitoカスタムメッセージ送信結果
 */
export const handler = async (event: any, context: any) => {
	if (event.triggerSource === 'CustomMessage_SignUp') {
		event.response.emailSubject = '本登録用検証コード';
		event.response.emailMessage = getVerificationMessage();
	} else if (event.triggerSource === 'CustomMessage_ForgotPassword') {
		event.response.emailSubject = 'パスワードリセット用検証コード';
		event.response.emailMessage = getPasswordForgotMessage();
	} else if (event.triggerSource === 'CustomMessage_UpdateUserAttribute') {
		event.response.emailSubject = 'メールアドレス変更用検証コード';
		event.response.emailMessage = getEmailChangeMessage();
	}
	return event;
};

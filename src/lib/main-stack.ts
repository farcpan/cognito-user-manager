import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

import { ContextParameters } from '../utils/context';
import { AccountRecovery, OAuthScope, UserPool, UserPoolEmail } from 'aws-cdk-lib/aws-cognito';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

interface MainStackProps extends StackProps {
	context: ContextParameters;
}

export class MainStack extends Stack {
	constructor(scope: Construct, id: string, props: MainStackProps) {
		super(scope, id, props);

		// カスタムメッセージLambdaトリガー用Lambda
		const customMessageLambdaPath = join(__dirname, '../customMessageLambda/index.ts');
		const customMessageLambdaName = props.context.getResourceId('custom-message-func');
		const lambdaFunction = new NodejsFunction(this, customMessageLambdaName, {
			functionName: customMessageLambdaName,
			runtime: Runtime.NODEJS_LATEST,
			entry: customMessageLambdaPath,
			handler: 'handler',
			logRetention: RetentionDays.ONE_DAY,
		});

		// Cognito
		const userPoolName = props.context.getResourceId('user-pool');
		const userPool = new UserPool(this, userPoolName, {
			userPoolName: userPoolName,

			// アカウント復元手段
			accountRecovery: AccountRecovery.EMAIL_ONLY,

			// 検証方法
			autoVerify: {
				email: true,
				phone: false,
			},

			// アカウント削除保護
			deletionProtection: false,

			// Cognitoからのメール配信設定
			email: UserPoolEmail.withCognito(),
			// SESを経由する場合
			/*
			email: cognito.UserPoolEmail.withSES({
						sesRegion: 'ap-northeast-1', // 必須（無いとエラーになる）
						fromEmail: props.context.stageParameters.cognito.fromEmail,
						fromName: props.context.stageParameters.cognito.fromName,
						replyTo: undefined,
				  }),
            */

			// スタック削除時のユーザープール削除設定
			removalPolicy: RemovalPolicy.DESTROY,

			// ログインパスワードポリシー
			passwordPolicy: {
				minLength: 8,
				requireLowercase: true,
				requireUppercase: true,
				requireDigits: true,
				requireSymbols: true,
				tempPasswordValidity: Duration.days(1),
			},

			// ユーザーが自分でアカウント登録できるか？
			selfSignUpEnabled: true,

			// ユーザーIDの大文字小文字を区別するか？
			signInCaseSensitive: false,

			// ユーザー登録に必要な要素
			standardAttributes: {
				email: { required: true, mutable: true },
			},

			// ログイン時に利用可能なエイリアス: [!] ユーザープール作成後に変更できない
			signInAliases: {
				email: true,
				// username: true, // username:trueは必ず指定する必要がある
			},

			// ユーザー検証方法のオプション: カスタムメッセージを使用するため設定不要
			userVerification: undefined,

			// カスタムメッセージLambdaトリガー
			lambdaTriggers: {
				customMessage: lambdaFunction,
			},

			// メールアドレス変更、検証が完了するまでは値を変更しない
			keepOriginal: {
				email: true,
			},
		});

		// クライアント登録
		const userPoolClientName = props.context.getResourceId('user-pool-client');
		const client = userPool.addClient(userPoolClientName, {
			userPoolClientName: userPoolClientName,
			generateSecret: false,
			enableTokenRevocation: true,
			preventUserExistenceErrors: true,
			authFlows: {
				// ユーザー名+パスワードによる認証を追加
				userPassword: true,
			},
			oAuth: {
				flows: {
					authorizationCodeGrant: true,
					implicitCodeGrant: true,
				},
				// Cognito標準UIを使用する場合はコールバック先のURLを指定する
				// callbackUrls: ['http://localhost:3000'],
				// Cognito標準UIを使用する場合はログアウト時のコールバック先のURLを指定する
				// logoutUrls: ['http://localhost:3000/logout'],
				scopes: [OAuthScope.EMAIL, OAuthScope.PHONE, OAuthScope.OPENID, OAuthScope.PROFILE],
			},

			// IDトークンの有効期限
			idTokenValidity: Duration.hours(24),
			// 更新トークンの有効期限
			refreshTokenValidity: Duration.days(30),
		});
	}
}

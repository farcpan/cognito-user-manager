import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

import { ContextParameters } from '../utils/context';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RestApi, EndpointType, LambdaIntegration, Cors } from 'aws-cdk-lib/aws-apigateway';

interface ApiStackProps extends StackProps {
	context: ContextParameters;
	userPool: UserPool;
	clientId: string;
}

export class ApiStack extends Stack {
	constructor(scope: Construct, id: string, props: ApiStackProps) {
		super(scope, id, props);

		const lambdaPath = join(__dirname, '../lambdas/index.ts');

		// ログインAPI
		const loginLambdaName = props.context.getResourceId('login-func');
		const loginLambdaFunction = new NodejsFunction(this, loginLambdaName, {
			functionName: loginLambdaName,
			runtime: Runtime.NODEJS_LATEST,
			entry: lambdaPath,
			handler: 'loginHandler',
			environment: {
				userPoolId: props.userPool.userPoolId,
				clientId: props.clientId,
			},
			logRetention: RetentionDays.ONE_DAY,
		});

		loginLambdaFunction.addToRolePolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['cognito-idp:initiateAuth'],
				resources: [props.userPool.userPoolArn],
			})
		);

		/////////////////////////////////////////////////////////////////////////////
		// APIGateway
		/////////////////////////////////////////////////////////////////////////////
		const restApiId = props.context.getResourceId('rest-api');
		const stageName: string = 'v1';
		const restApi = new RestApi(this, restApiId, {
			restApiName: restApiId,
			endpointTypes: [EndpointType.REGIONAL],
			deployOptions: {
				stageName: stageName,
			},
			defaultCorsPreflightOptions: {
				allowOrigins: Cors.ALL_ORIGINS,
				allowMethods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
				statusCode: 200,
				allowHeaders: Cors.DEFAULT_HEADERS,
			},
		});

		const loginLambdaIntegration = new LambdaIntegration(loginLambdaFunction);

		const loginResource = restApi.root.addResource('login');

		loginResource.addMethod('POST', loginLambdaIntegration, {});

		/////////////////////////////////////////////////////////////////////////////
		// API URL
		/////////////////////////////////////////////////////////////////////////////
		const registerApiUrlId: string = props.context.getResourceId('api-base-url');
		new CfnOutput(this, registerApiUrlId, {
			value: `https://${restApi.restApiId}.execute-api.${props.context.stageParameters.region}.amazonaws.com/${stageName}/`,
		});
	}
}

import { App } from 'aws-cdk-lib';
import { MainStack } from '../lib/main-stack';
import { ApiStack } from '../lib/api-stack';
import { ContextParameters } from '../utils/context';

const app = new App();
const context = new ContextParameters(app);

const mainStack = new MainStack(app, context.getResourceId('main-stack'), {
	env: {
		region: context.stageParameters.region,
	},
	context: context,
});

new ApiStack(app, context.getResourceId('api-stack'), {
	env: {
		region: context.stageParameters.region,
	},
	context: context,
	userPool: mainStack.userPool,
	clientId: mainStack.clientId,
});

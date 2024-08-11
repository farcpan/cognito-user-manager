import { App } from 'aws-cdk-lib';
import { MainStack } from '../lib/main-stack';
import { ContextParameters } from '../utils/context';

const app = new App();
const context = new ContextParameters(app);

new MainStack(app, context.getResourceId('main-stack'), {
	env: {
		region: context.stageParameters.region,
	},
	context: context,
});

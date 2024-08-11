import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { ContextParameters } from '../utils/context';

interface MainStackProps extends StackProps {
	context: ContextParameters;
}

export class MainStack extends Stack {
	constructor(scope: Construct, id: string, props: MainStackProps) {
		super(scope, id, props);

		//
	}
}

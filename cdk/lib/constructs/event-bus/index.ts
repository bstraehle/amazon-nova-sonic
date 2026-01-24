import { Construct } from 'constructs';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import { CfnOutput, Names } from 'aws-cdk-lib';
import { IUserPool } from 'aws-cdk-lib/aws-cognito';
import { join } from 'path';

export interface EventBusProps {
  userPool: IUserPool;
}

export class EventBus extends Construct {
  public readonly httpEndpoint: string;
  public readonly api: appsync.EventApi;
  public readonly defaultChannelName = 'event-bus';

  constructor(scope: Construct, id: string, props: EventBusProps) {
    super(scope, id);

    const iamProvider: appsync.AppSyncAuthProvider = {
      authorizationType: appsync.AppSyncAuthorizationType.IAM,
    };

    const userPoolProvider: appsync.AppSyncAuthProvider = {
      authorizationType: appsync.AppSyncAuthorizationType.USER_POOL,
      cognitoConfig: {
        userPool: props.userPool,
      },
    };

    const api = new appsync.EventApi(this, 'Api', {
      apiName: Names.uniqueResourceName(this, { maxLength: 30 }),
      authorizationConfig: {
        authProviders: [iamProvider, userPoolProvider],
        connectionAuthModeTypes: [appsync.AppSyncAuthorizationType.IAM, appsync.AppSyncAuthorizationType.USER_POOL],
        defaultPublishAuthModeTypes: [appsync.AppSyncAuthorizationType.IAM, appsync.AppSyncAuthorizationType.USER_POOL],
        defaultSubscribeAuthModeTypes: [
          appsync.AppSyncAuthorizationType.IAM,
          appsync.AppSyncAuthorizationType.USER_POOL,
        ],
      },
    });

    new appsync.ChannelNamespace(this, 'Namespace', {
      api,
      channelNamespaceName: this.defaultChannelName,
      code: appsync.Code.fromAsset(join(__dirname, 'resources', 'bus-event-handler.mjs')),
    });

    this.httpEndpoint = `https://${api.httpDns}`;
    this.api = api;

    new CfnOutput(this, 'EventBusEndpoint', {
      value: this.httpEndpoint,
      description: 'EventBus Endpoint URL',
    });
  }
}

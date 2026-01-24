import { CfnOutput, CfnResource, CustomResource, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
  CfnManagedLoginBranding,
  ManagedLoginVersion,
  UserPool,
  UserPoolClient,
  UserPoolOperation,
} from 'aws-cdk-lib/aws-cognito';
import { Code, Runtime, SingletonFunction, Function } from 'aws-cdk-lib/aws-lambda';
import { CnameRecord, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface AuthProps {
  readonly selfSignUpEnabled: boolean;
  readonly hostedZone?: IHostedZone;
  readonly sharedCertificate?: ICertificate;
  readonly allowedEmailDomainList?: string[];
}

export class Auth extends Construct {
  readonly userPool: UserPool;
  readonly client: UserPoolClient;
  readonly domainName: string;

  private callbackUrlCount = 0;

  constructor(scope: Construct, id: string, props: AuthProps) {
    super(scope, id);
    const { hostedZone } = props;
    const subDomain = 'auth';
    let domainPrefix = '';
    if (!hostedZone) {
      // When we do not use a custom domain, we must make domainPrefix unique in the AWS region.
      // To avoid a collision, we generate a random string with CFn custom resource.
      const generator = new SingletonFunction(this, 'RandomStringGenerator', {
        runtime: Runtime.NODEJS_22_X,
        handler: 'index.handler',
        timeout: Duration.seconds(5),
        lambdaPurpose: 'RandomStringGenerator',
        uuid: '11e9c903-f11a-4989-833c-985dddef5eb2',
        code: Code.fromInline(readFileSync(join(__dirname, 'resources', 'prefix-generator.js')).toString()),
      });

      const domainPrefixResource = new CustomResource(this, 'DomainPrefix', {
        serviceToken: generator.functionArn,
        resourceType: 'Custom::RandomString',
        properties: { prefix: 'webapp-', length: 10 },
        serviceTimeout: Duration.seconds(10),
      });
      domainPrefix = domainPrefixResource.getAttString('generated');
    }

    const preSignupHandler = new Function(this, 'PreSignupHandler', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'index.handler',
      timeout: Duration.seconds(5),
      code: Code.fromInline(readFileSync(join(__dirname, 'resources', 'pre-signup.js')).toString()),
      environment: {
        ALLOWED_DOMAINS: (props.allowedEmailDomainList ?? []).join(','),
      },
    });

    this.domainName = hostedZone
      ? `${subDomain}.${hostedZone.zoneName}`
      : `${domainPrefix}.auth.${Stack.of(this).region}.amazoncognito.com`;

    const userPool = new UserPool(this, 'UserPool', {
      passwordPolicy: {
        requireUppercase: true,
        requireSymbols: true,
        requireDigits: true,
        minLength: 8,
      },
      selfSignUpEnabled: props.selfSignUpEnabled,
      signInAliases: {
        username: false,
        email: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const client = userPool.addClient(`Client`, {
      idTokenValidity: Duration.days(1),
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        callbackUrls: ['http://localhost/dummy'],
        logoutUrls: ['http://localhost/dummy'],
      },
    });

    userPool.addTrigger(UserPoolOperation.PRE_SIGN_UP, preSignupHandler);

    this.client = client;
    this.userPool = userPool;

    const domain = userPool.addDomain('CognitoDomain', {
      ...(hostedZone && props.sharedCertificate
        ? {
            customDomain: {
              domainName: this.domainName,
              certificate: props.sharedCertificate,
            },
          }
        : {
            cognitoDomain: {
              domainPrefix,
            },
          }),
      managedLoginVersion: ManagedLoginVersion.NEWER_MANAGED_LOGIN,
    });

    if (hostedZone) {
      new CnameRecord(this, 'CognitoDomainRecord', {
        zone: hostedZone,
        recordName: subDomain,
        domainName: domain.cloudFrontEndpoint,
      });
    }

    new CfnManagedLoginBranding(this, 'Branding', {
      userPoolId: this.userPool.userPoolId,
      clientId: client.userPoolClientId,
      useCognitoProvidedValues: true,
    });

    new CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: client.userPoolClientId });
    new CfnOutput(this, 'UserPoolDomain', { value: this.domainName });
  }

  public addAllowedCallbackUrls(callbackUrl: string, logoutUrl: string) {
    const resource = this.client.node.defaultChild;
    if (!CfnResource.isCfnResource(resource)) {
      throw new Error('Expected CfnResource');
    }
    resource.addPropertyOverride(`CallbackURLs.${this.callbackUrlCount}`, callbackUrl);
    resource.addPropertyOverride(`LogoutURLs.${this.callbackUrlCount}`, logoutUrl);
    this.callbackUrlCount += 1;
  }
}

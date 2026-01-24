import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, Billing, TableV2, ProjectionType } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface DatabaseProps {}

export class Database extends Construct {
  public readonly table: TableV2;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    const table = new TableV2(this, 'History', {
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billing: Billing.onDemand(),
      timeToLiveAttribute: 'TTL',
      removalPolicy: RemovalPolicy.DESTROY,
      localSecondaryIndexes: [
        {
          indexName: 'LSI1',
          sortKey: { name: 'LSI1', type: AttributeType.STRING },
          projectionType: ProjectionType.ALL,
        },
      ],
      globalSecondaryIndexes: [
        {
          indexName: 'GSI1',
          partitionKey: { name: 'GSI1PK', type: AttributeType.STRING },
          sortKey: { name: 'GSI1SK', type: AttributeType.STRING },
          projectionType: ProjectionType.ALL,
        },
      ],
    });

    this.table = table;

    new CfnOutput(this, 'TableName', { value: table.tableName });
  }
}

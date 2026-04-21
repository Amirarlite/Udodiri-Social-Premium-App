import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const secretsClient = new SecretsManagerClient({});

const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE!;
const USERS_TABLE = process.env.USERS_TABLE!;
const PAYSTACK_SECRET_NAME = process.env.PAYSTACK_SECRET_NAME!;
const FLUTTERWAVE_SECRET_NAME = process.env.FLUTTERWAVE_SECRET_NAME!;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { httpMethod, path } = event;

  try {
    // Validate authentication
    if (!event.requestContext.authorizer?.claims) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const userId = event.requestContext.authorizer.claims.sub;

    if (httpMethod === 'GET' && path === '/api/subscriptions') {
      return await getSubscription(userId);
    } else if (httpMethod === 'POST' && path === '/api/subscriptions') {
      return await createOrUpdateSubscription(userId, event);
    } else if (httpMethod === 'POST' && path === '/api/subscriptions/premium') {
      return await upgradeToPremium(userId, event);
    } else if (httpMethod === 'POST' && path === '/api/subscriptions/verify') {
      return await verifySubscriptionPayment(userId, event);
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
  } catch (error) {
    console.error('Subscriptions error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function getSubscription(userId: string): Promise<APIGatewayProxyResult> {
  const result = await docClient.send(new GetCommand({
    TableName: SUBSCRIPTIONS_TABLE,
    Key: { 
      userId,
      tier: 'premium',
    },
  }));

  if (!result.Item) {
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        subscription: {
          userId,
          tier: 'free',
          isActive: false,
        },
      }),
    };
  }

  const now = new Date();
  const endDate = new Date(result.Item.endDate);
  const isActive = result.Item.isActive && endDate > now;

  return {
    statusCode: 200,
    body: JSON.stringify({ 
      subscription: {
        ...result.Item,
        isActive,
      },
    }),
  };
}

async function createOrUpdateSubscription(userId: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { tier, startDate, endDate, paymentReference, paymentGateway } = body;

  if (!tier || !startDate || !endDate) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: tier, startDate, endDate' }),
    };
  }

  await docClient.send(new PutCommand({
    TableName: SUBSCRIPTIONS_TABLE,
    Item: {
      userId,
      tier,
      startDate,
      endDate,
      isActive: true,
      paymentReference: paymentReference || null,
      paymentGateway: paymentGateway || null,
      updatedAt: new Date().toISOString(),
    },
  }));

  // Update user's subscription tier
  await docClient.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { id: userId },
    UpdateExpression: 'SET subscriptionTier = :tier, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':tier': tier,
      ':updatedAt': new Date().toISOString(),
    },
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: 'Subscription updated successfully',
      subscription: {
        userId,
        tier,
        startDate,
        endDate,
        isActive: true,
      },
    }),
  };
}

async function upgradeToPremium(userId: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { paymentGateway } = body;

  if (!paymentGateway || !['paystack', 'flutterwave'].includes(paymentGateway)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid payment gateway. Use paystack or flutterwave' }),
    };
  }

  // Get payment gateway credentials
  const secretName = paymentGateway === 'paystack' ? PAYSTACK_SECRET_NAME : FLUTTERWAVE_SECRET_NAME;
  
  try {
    const secretResponse = await secretsClient.send(new GetSecretValueCommand({
      SecretId: secretName,
    }));

    const secret = JSON.parse(secretResponse.SecretString || '{}');
    
    // In production, initialize payment with gateway and get authorization URL
    // For now, return mock payment initialization
    const reference = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Payment initialization successful',
        reference,
        authorizationUrl: `https://${paymentGateway}.com/pay/${reference}`,
        amount: 5000,
        currency: 'NGN',
      }),
    };
  } catch (error) {
    console.error('Payment initialization error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to initialize payment' }),
    };
  }
}

async function verifySubscriptionPayment(userId: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { reference, gateway } = body;

  if (!reference || !gateway) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: reference, gateway' }),
    };
  }

  // In production, verify payment with gateway API
  // For now, assume payment is successful
  
  const now = new Date();
  const endDate = new Date(now);
  endDate.setFullYear(endDate.getFullYear() + 1);

  await docClient.send(new PutCommand({
    TableName: SUBSCRIPTIONS_TABLE,
    Item: {
      userId,
      tier: 'premium',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      isActive: true,
      paymentReference: reference,
      paymentGateway: gateway,
      updatedAt: now.toISOString(),
    },
  }));

  await docClient.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { id: userId },
    UpdateExpression: 'SET subscriptionTier = :tier, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':tier': 'premium',
      ':updatedAt': now.toISOString(),
    },
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: 'Subscription upgraded to premium successfully',
      subscription: {
        userId,
        tier: 'premium',
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        isActive: true,
      },
    }),
  };
}

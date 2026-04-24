import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const secretsClient = new SecretsManagerClient({});

const FINANCIALS_TABLE = process.env.FINANCIALS_TABLE!;
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

    // Check admin role for financial data
    const userRole = event.requestContext.authorizer.claims['custom:role'] || 'Member';
    if (userRole !== 'Admin' && userRole !== 'Treasurer') {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Forbidden: Admin or Treasurer access required' }),
      };
    }

    if (httpMethod === 'GET' && path === '/api/financials') {
      return await listTransactions();
    } else if (httpMethod === 'POST' && path === '/api/financials') {
      return await recordTransaction(event);
    } else if (httpMethod === 'GET' && path === '/api/financials/transactions') {
      return await queryTransactions(event);
    } else if (httpMethod === 'POST' && path === '/api/financials/verify-payment') {
      return await verifyPayment(event);
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
  } catch (error) {
    console.error('Financials error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function listTransactions(): Promise<APIGatewayProxyResult> {
  const result = await docClient.send(new QueryCommand({
    TableName: FINANCIALS_TABLE,
    IndexName: 'date',
    KeyConditionExpression: '#date >= :minDate',
    ExpressionAttributeNames: {
      '#date': 'date',
    },
    ExpressionAttributeValues: {
      ':minDate': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    ScanIndexForward: false,
    Limit: 100,
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ transactions: result.Items || [] }),
  };
}

async function recordTransaction(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { title, amount, type, userId, paymentReference } = body;

  if (!title || !amount || !type) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: title, amount, type' }),
    };
  }

  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  await docClient.send(new PutCommand({
    TableName: FINANCIALS_TABLE,
    Item: {
      id: transactionId,
      title,
      amount: parseFloat(amount),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      status: 'SUCCESS',
      type,
      userId: userId || null,
      paymentReference: paymentReference || null,
      createdAt: now.toISOString(),
    },
  }));

  return {
    statusCode: 201,
    body: JSON.stringify({ 
      message: 'Transaction recorded successfully',
      transactionId,
    }),
  };
}

async function queryTransactions(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const queryStringParameters = event.queryStringParameters || {};
  const { startDate, endDate, type } = queryStringParameters;

  const expressionAttributeValues: any = {};
  let keyConditionExpression = '';

  if (startDate) {
    keyConditionExpression += '#date >= :startDate';
    expressionAttributeValues[':startDate'] = startDate;
  }

  if (endDate) {
    if (keyConditionExpression) keyConditionExpression += ' AND ';
    keyConditionExpression += '#date <= :endDate';
    expressionAttributeValues[':endDate'] = endDate;
  }

  if (!keyConditionExpression) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required query parameters: startDate or endDate' }),
    };
  }

  const result = await docClient.send(new QueryCommand({
    TableName: FINANCIALS_TABLE,
    IndexName: 'date',
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeNames: {
      '#date': 'date',
    },
    ExpressionAttributeValues: expressionAttributeValues,
    ScanIndexForward: false,
    Limit: 100,
  }));

  let transactions = result.Items || [];

  if (type) {
    transactions = transactions.filter((t: any) => t.type === type);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ transactions }),
  };
}

async function verifyPayment(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { reference, gateway } = body;

  if (!reference || !gateway) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: reference, gateway' }),
    };
  }

  // Get payment gateway credentials
  const secretName = gateway === 'paystack' ? PAYSTACK_SECRET_NAME : FLUTTERWAVE_SECRET_NAME;
  
  try {
    const secretResponse = await secretsClient.send(new GetSecretValueCommand({
      SecretId: secretName,
    }));

    const secret = JSON.parse(secretResponse.SecretString || '{}');
    
    // In production, call payment gateway API to verify payment
    // For now, return mock verification
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        verified: true,
        status: 'SUCCESS',
        amount: 10000,
        currency: 'NGN',
      }),
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to verify payment' }),
    };
  }
}

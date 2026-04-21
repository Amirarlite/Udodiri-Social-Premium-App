import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminInitiateAuthCommand, AdminRespondToAuthChallengeCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const cognitoClient = new CognitoIdentityProviderClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;
const USERS_TABLE = process.env.USERS_TABLE!;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { httpMethod, path } = event;
  const resource = path.split('/').pop();

  try {
    if (httpMethod === 'POST' && resource === 'register') {
      return await handleRegister(event);
    } else if (httpMethod === 'POST' && resource === 'login') {
      return await handleLogin(event);
    } else if (httpMethod === 'GET' && resource === 'verify') {
      return await handleVerify(event);
    } else if (httpMethod === 'POST' && resource === 'logout') {
      return await handleLogout(event);
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleRegister(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { email, password, name } = body;

  if (!email || !password || !name) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: email, password, name' }),
    };
  }

  // In production, Cognito adminCreateUser would be called here
  // For now, we'll store user info in DynamoDB
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await docClient.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: {
      id: userId,
      email,
      name,
      role: 'Member',
      subscriptionTier: 'free',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }));

  return {
    statusCode: 201,
    body: JSON.stringify({ 
      message: 'User registered successfully',
      userId,
      email,
    }),
  };
}

async function handleLogin(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { email, password } = body;

  if (!email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: email, password' }),
    };
  }

  // Initiate auth with Cognito
  const authCommand = new AdminInitiateAuthCommand({
    UserPoolId: USER_POOL_ID,
    ClientId: CLIENT_ID,
    AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const authResponse = await cognitoClient.send(authCommand);

  if (!authResponse.AuthenticationResult) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid credentials' }),
    };
  }

  const { IdToken, AccessToken, RefreshToken } = authResponse.AuthenticationResult;

  // Get user info from DynamoDB
  const userResult = await docClient.send(new GetCommand({
    TableName: USERS_TABLE,
    Key: { email },
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Login successful',
      idToken: IdToken,
      accessToken: AccessToken,
      refreshToken: RefreshToken,
      user: userResult.Item || {},
    }),
  };
}

async function handleVerify(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const token = event.headers.Authorization?.replace('Bearer ', '');

  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'No token provided' }),
    };
  }

  // In production, verify JWT token signature and expiration
  // For now, just return success
  return {
    statusCode: 200,
    body: JSON.stringify({ valid: true }),
  };
}

async function handleLogout(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // In production, call Cognito global sign out
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Logged out successfully' }),
  };
}

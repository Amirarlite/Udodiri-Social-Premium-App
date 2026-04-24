import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const ANNOUNCEMENTS_TABLE = process.env.ANNOUNCEMENTS_TABLE!;
const USERS_TABLE = process.env.USERS_TABLE!;

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

    if (httpMethod === 'GET' && path === '/api/announcements') {
      return await listAnnouncements();
    } else if (httpMethod === 'POST' && path === '/api/announcements') {
      return await createAnnouncement(event);
    } else if (httpMethod === 'POST' && path === '/api/announcements/send') {
      return await sendAnnouncement(event);
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
  } catch (error) {
    console.error('Announcements error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function listAnnouncements(): Promise<APIGatewayProxyResult> {
  const result = await docClient.send(new QueryCommand({
    TableName: ANNOUNCEMENTS_TABLE,
    IndexName: 'createdAt',
    KeyConditionExpression: 'createdAt >= :minDate',
    ExpressionAttributeValues: {
      ':minDate': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
    ScanIndexForward: false,
    Limit: 50,
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ announcements: result.Items || [] }),
  };
}

async function createAnnouncement(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { title, content, recipients } = body;

  if (!title || !content) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: title, content' }),
    };
  }

  const announcementId = `announcement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const userId = event.requestContext.authorizer?.claims?.sub || 'unknown';
  const author = event.requestContext.authorizer?.claims?.email || 'unknown';

  await docClient.send(new PutCommand({
    TableName: ANNOUNCEMENTS_TABLE,
    Item: {
      id: announcementId,
      title,
      content,
      author,
      recipients: recipients || [],
      sentVia: 'in-app',
      createdAt: new Date().toISOString(),
    },
  }));

  return {
    statusCode: 201,
    body: JSON.stringify({ 
      message: 'Announcement created successfully',
      announcementId,
    }),
  };
}

async function sendAnnouncement(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { announcementId, method } = body;

  if (!announcementId || !method) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: announcementId, method' }),
    };
  }

  // In production, integrate with SES or Gmail API
  // For now, just update the record
  await docClient.send(new PutCommand({
    TableName: ANNOUNCEMENTS_TABLE,
    Item: {
      id: announcementId,
      sentVia: method,
      sentAt: new Date().toISOString(),
    },
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: `Announcement sent via ${method}`,
    }),
  };
}

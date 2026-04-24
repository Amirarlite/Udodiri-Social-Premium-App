import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const MEETING_MINUTES_TABLE = process.env.MEETING_MINUTES_TABLE!;
const USERS_TABLE = process.env.USERS_TABLE!;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { httpMethod, path, requestContext } = event;
  const resourceId = path.split('/').pop();

  try {
    // Validate authentication
    if (!requestContext.authorizer?.claims) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    if (httpMethod === 'GET' && path === '/api/meeting-minutes') {
      return await listMeetings();
    } else if (httpMethod === 'POST' && path === '/api/meeting-minutes') {
      return await createMeeting(event);
    } else if (httpMethod === 'GET' && resourceId && !path.includes('action-items')) {
      return await getMeeting(resourceId);
    } else if (httpMethod === 'PATCH' && resourceId) {
      return await updateMeeting(resourceId, event);
    } else if (httpMethod === 'DELETE' && resourceId) {
      return await deleteMeeting(resourceId);
    } else if (httpMethod === 'POST' && path.includes('action-items')) {
      return await addActionItem(resourceId!, event);
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
  } catch (error) {
    console.error('Meetings error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function listMeetings(): Promise<APIGatewayProxyResult> {
  const result = await docClient.send(new QueryCommand({
    TableName: MEETING_MINUTES_TABLE,
    IndexName: 'createdAt',
    KeyConditionExpression: 'createdAt >= :minDate',
    ExpressionAttributeValues: {
      ':minDate': new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    ScanIndexForward: false,
    Limit: 50,
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ meetings: result.Items || [] }),
  };
}

async function createMeeting(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { title, attendees, googleDocId, googleDocUrl } = body;

  if (!title || !attendees) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: title, attendees' }),
    };
  }

  const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const userId = event.requestContext.authorizer?.claims?.sub || 'unknown';

  await docClient.send(new PutCommand({
    TableName: MEETING_MINUTES_TABLE,
    Item: {
      id: meetingId,
      title,
      googleDocId: googleDocId || null,
      googleDocUrl: googleDocUrl || null,
      attendees,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      actionItems: [],
    },
  }));

  return {
    statusCode: 201,
    body: JSON.stringify({ 
      message: 'Meeting created successfully',
      meetingId,
    }),
  };
}

async function getMeeting(id: string): Promise<APIGatewayProxyResult> {
  const result = await docClient.send(new GetCommand({
    TableName: MEETING_MINUTES_TABLE,
    Key: { id },
  }));

  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Meeting not found' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ meeting: result.Item }),
  };
}

async function updateMeeting(id: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { title, attendees, googleDocId, googleDocUrl } = body;

  const updateExpressions: string[] = [];
  const expressionAttributeValues: any = {};
  const expressionAttributeNames: any = {};

  if (title !== undefined) {
    updateExpressions.push('#title = :title');
    expressionAttributeValues[':title'] = title;
    expressionAttributeNames['#title'] = 'title';
  }

  if (attendees !== undefined) {
    updateExpressions.push('attendees = :attendees');
    expressionAttributeValues[':attendees'] = attendees;
  }

  if (googleDocId !== undefined) {
    updateExpressions.push('googleDocId = :googleDocId');
    expressionAttributeValues[':googleDocId'] = googleDocId;
  }

  if (googleDocUrl !== undefined) {
    updateExpressions.push('googleDocUrl = :googleDocUrl');
    expressionAttributeValues[':googleDocUrl'] = googleDocUrl;
  }

  if (updateExpressions.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No fields to update' }),
    };
  }

  updateExpressions.push('updatedAt = :updatedAt');
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  await docClient.send(new UpdateCommand({
    TableName: MEETING_MINUTES_TABLE,
    Key: { id },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Meeting updated successfully' }),
  };
}

async function deleteMeeting(id: string): Promise<APIGatewayProxyResult> {
  await docClient.send(new DeleteCommand({
    TableName: MEETING_MINUTES_TABLE,
    Key: { id },
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Meeting deleted successfully' }),
  };
}

async function addActionItem(meetingId: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { description, responsiblePerson, dueDate } = body;

  if (!description || !responsiblePerson || !dueDate) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: description, responsiblePerson, dueDate' }),
    };
  }

  const actionItemId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newItem = {
    id: actionItemId,
    description,
    responsiblePerson,
    dueDate,
    status: 'PENDING',
  };

  await docClient.send(new UpdateCommand({
    TableName: MEETING_MINUTES_TABLE,
    Key: { id: meetingId },
    UpdateExpression: 'SET actionItems = list_append(actionItems, :newItem)',
    ExpressionAttributeValues: {
      ':newItem': [newItem],
    },
  }));

  return {
    statusCode: 201,
    body: JSON.stringify({ 
      message: 'Action item added successfully',
      actionItemId,
    }),
  };
}

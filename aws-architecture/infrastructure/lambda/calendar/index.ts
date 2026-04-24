import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CALENDAR_EVENTS_TABLE = process.env.CALENDAR_EVENTS_TABLE!;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { httpMethod, path } = event;
  const resourceId = path.split('/').pop();

  try {
    // Validate authentication
    if (!event.requestContext.authorizer?.claims) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    if (httpMethod === 'GET' && path === '/api/calendar') {
      return await listEvents();
    } else if (httpMethod === 'POST' && path === '/api/calendar') {
      return await createEvent(event);
    } else if (httpMethod === 'GET' && resourceId && path.includes('/api/calendar/')) {
      return await getEvent(resourceId);
    } else if (httpMethod === 'PATCH' && resourceId) {
      return await updateEvent(resourceId, event);
    } else if (httpMethod === 'DELETE' && resourceId) {
      return await deleteEvent(resourceId);
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
  } catch (error) {
    console.error('Calendar error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function listEvents(): Promise<APIGatewayProxyResult> {
  const result = await docClient.send(new QueryCommand({
    TableName: CALENDAR_EVENTS_TABLE,
    IndexName: 'startDate',
    KeyConditionExpression: 'startDate >= :minDate',
    ExpressionAttributeValues: {
      ':minDate': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    ScanIndexForward: true,
    Limit: 100,
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ events: result.Items || [] }),
  };
}

async function createEvent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { title, startDate, endDate, location, description, attendees } = body;

  if (!title || !startDate || !endDate) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: title, startDate, endDate' }),
    };
  }

  const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const userId = event.requestContext.authorizer?.claims?.sub || 'unknown';

  await docClient.send(new PutCommand({
    TableName: CALENDAR_EVENTS_TABLE,
    Item: {
      id: eventId,
      title,
      startDate,
      endDate,
      googleCalendarId: null,
      location: location || null,
      description: description || null,
      attendees: attendees || [],
      createdBy: userId,
      createdAt: new Date().toISOString(),
    },
  }));

  return {
    statusCode: 201,
    body: JSON.stringify({ 
      message: 'Event created successfully',
      eventId,
    }),
  };
}

async function getEvent(id: string): Promise<APIGatewayProxyResult> {
  const result = await docClient.send(new GetCommand({
    TableName: CALENDAR_EVENTS_TABLE,
    Key: { id },
  }));

  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Event not found' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ event: result.Item }),
  };
}

async function updateEvent(id: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { title, startDate, endDate, location, description, attendees } = body;

  const updateExpressions: string[] = [];
  const expressionAttributeValues: any = {};

  if (title !== undefined) {
    updateExpressions.push('title = :title');
    expressionAttributeValues[':title'] = title;
  }

  if (startDate !== undefined) {
    updateExpressions.push('startDate = :startDate');
    expressionAttributeValues[':startDate'] = startDate;
  }

  if (endDate !== undefined) {
    updateExpressions.push('endDate = :endDate');
    expressionAttributeValues[':endDate'] = endDate;
  }

  if (location !== undefined) {
    updateExpressions.push('location = :location');
    expressionAttributeValues[':location'] = location;
  }

  if (description !== undefined) {
    updateExpressions.push('description = :description');
    expressionAttributeValues[':description'] = description;
  }

  if (attendees !== undefined) {
    updateExpressions.push('attendees = :attendees');
    expressionAttributeValues[':attendees'] = attendees;
  }

  if (updateExpressions.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No fields to update' }),
    };
  }

  await docClient.send(new UpdateCommand({
    TableName: CALENDAR_EVENTS_TABLE,
    Key: { id },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Event updated successfully' }),
  };
}

async function deleteEvent(id: string): Promise<APIGatewayProxyResult> {
  await docClient.send(new DeleteCommand({
    TableName: CALENDAR_EVENTS_TABLE,
    Key: { id },
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Event deleted successfully' }),
  };
}

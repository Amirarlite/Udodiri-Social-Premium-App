// Calendar Lambda Handler
// Calendar event management

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const CALENDAR_TABLE = process.env.CALENDAR_EVENTS_TABLE;

exports.handler = async (event) => {
  console.log('Calendar handler invoked:', JSON.stringify(event));

  const httpMethod = event.httpMethod;
  const path = event.path;

  try {
    if (path === '/api/calendar' && httpMethod === 'GET') {
      return listEvents();
    } else if (path === '/api/calendar' && httpMethod === 'POST') {
      return createEvent(event);
    } else if (path.match(/^\/api\/calendar\/[^/]+$/) && httpMethod === 'GET') {
      const id = path.split('/').pop();
      return getEvent(id);
    } else if (path.match(/^\/api\/calendar\/[^/]+$/) && httpMethod === 'PATCH') {
      const id = path.split('/').pop();
      return updateEvent(id, event);
    } else if (path.match(/^\/api\/calendar\/[^/]+$/) && httpMethod === 'DELETE') {
      const id = path.split('/').pop();
      return deleteEvent(id);
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

async function listEvents() {
  // TODO: Implement listing calendar events
  return {
    statusCode: 200,
    body: JSON.stringify({ events: [] }),
  };
}

async function createEvent(event) {
  // TODO: Implement creating event
  return {
    statusCode: 201,
    body: JSON.stringify({ message: 'Event created' }),
  };
}

async function getEvent(id) {
  // TODO: Implement getting single event
  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Event ${id}` }),
  };
}

async function updateEvent(id, event) {
  // TODO: Implement updating event
  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Event ${id} updated` }),
  };
}

async function deleteEvent(id) {
  // TODO: Implement deleting event
  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Event ${id} deleted` }),
  };
}

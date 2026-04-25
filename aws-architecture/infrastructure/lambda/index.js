// Main Lambda entry point
// Routes requests to appropriate handlers

const authHandler = require('./auth-handler');
const meetingsHandler = require('./meetings-handler');
const announcementsHandler = require('./announcements-handler');
const calendarHandler = require('./calendar-handler');
const financialsHandler = require('./financials-handler');
const subscriptionsHandler = require('./subscriptions-handler');

exports.handler = async (event) => {
  console.log('Main handler invoked:', JSON.stringify(event));

  const path = event.path || '';

  try {
    if (path.startsWith('/api/auth')) {
      return await authHandler.handler(event);
    } else if (path.startsWith('/api/meeting-minutes')) {
      return await meetingsHandler.handler(event);
    } else if (path.startsWith('/api/announcements')) {
      return await announcementsHandler.handler(event);
    } else if (path.startsWith('/api/calendar')) {
      return await calendarHandler.handler(event);
    } else if (path.startsWith('/api/financials')) {
      return await financialsHandler.handler(event);
    } else if (path.startsWith('/api/subscriptions')) {
      return await subscriptionsHandler.handler(event);
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'API endpoint not found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};

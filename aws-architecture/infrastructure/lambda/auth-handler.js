// Auth Lambda Handler
// Handles user authentication via Cognito

const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;

exports.handler = async (event) => {
  console.log('Auth handler invoked:', JSON.stringify(event));

  const httpMethod = event.httpMethod;
  const path = event.path;

  try {
    if (path === '/api/auth/register' && httpMethod === 'POST') {
      return handleRegister(event);
    } else if (path === '/api/auth/login' && httpMethod === 'POST') {
      return handleLogin(event);
    } else if (path === '/api/auth/logout' && httpMethod === 'POST') {
      return handleLogout(event);
    } else if (path === '/api/auth/verify' && httpMethod === 'GET') {
      return handleVerify(event);
    } else if (path === '/api/auth/google/callback' && httpMethod === 'POST') {
      return handleGoogleCallback(event);
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};

async function handleRegister(event) {
  // TODO: Implement user registration with Cognito
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Registration endpoint' }),
  };
}

async function handleLogin(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: 'Email and password are required',
          error: 'INVALID_INPUT'
        }),
      };
    }

    // Initiate auth with Cognito
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    const authResult = await cognito.initiateAuth(params).promise();

    // Extract tokens
    const {
      AuthenticationResult: {
        AccessToken,
        IdToken,
        RefreshToken,
        ExpiresIn,
      } = {},
    } = authResult;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Login successful',
        tokens: {
          accessToken: AccessToken,
          idToken: IdToken,
          refreshToken: RefreshToken,
          expiresIn: ExpiresIn,
        },
        user: {
          email: email,
          id: IdToken ? parseJwt(IdToken).sub : null,
        },
      }),
    };
  } catch (error) {
    console.error('Login error:', error);

    // Handle specific Cognito errors
    if (error.code === 'UserNotFoundException') {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        }),
      };
    }

    if (error.code === 'NotAuthorizedException') {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: 'Invalid email or password',
          error: 'INVALID_CREDENTIALS',
        }),
      };
    }

    if (error.code === 'UserNotConfirmedException') {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: 'User account not confirmed. Please check your email.',
          error: 'USER_NOT_CONFIRMED',
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Login failed',
        error: error.message,
      }),
    };
  }
}

async function handleLogout(event) {
  try {
    const headers = event.headers || {};
    const accessToken = headers.Authorization?.replace('Bearer ', '') || '';

    if (!accessToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Access token is required',
          error: 'NO_TOKEN',
        }),
      };
    }

    // Admin user global sign out
    const params = {
      AccessToken: accessToken,
    };

    await cognito.globalSignOut(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Logout successful',
      }),
    };
  } catch (error) {
    console.error('Logout error:', error);

    if (error.code === 'NotAuthorizedException' || error.code === 'InvalidParameterException') {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: 'Invalid or expired token',
          error: 'INVALID_TOKEN',
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Logout failed',
        error: error.message,
      }),
    };
  }
}

async function handleVerify(event) {
  try {
    const headers = event.headers || {};
    const accessToken = headers.Authorization?.replace('Bearer ', '') || '';

    if (!accessToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Access token is required',
          error: 'NO_TOKEN',
        }),
      };
    }

    // Get user info from access token
    const params = {
      AccessToken: accessToken,
    };

    const userInfo = await cognito.getUser(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Token verified',
        user: {
          username: userInfo.Username,
          attributes: userInfo.UserAttributes.reduce((acc, attr) => {
            acc[attr.Name] = attr.Value;
            return acc;
          }, {}),
          mfaOptions: userInfo.MFAOptions || [],
        },
      }),
    };
  } catch (error) {
    console.error('Verify error:', error);

    if (error.code === 'NotAuthorizedException' || error.code === 'InvalidParameterException') {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: 'Invalid or expired token',
          error: 'INVALID_TOKEN',
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Token verification failed',
        error: error.message,
      }),
    };
  }
}

async function handleGoogleCallback(event) {
  // TODO: Implement Google OAuth callback
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Google callback processed' }),
  };
}

// Helper function to parse JWT
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return {};
  }
}

import { Amplify } from 'aws-amplify';

export const configureAmplify = (config: {
  userPoolId: string;
  userPoolWebClientId: string;
  region: string;
  apiGatewayUrl: string;
}) => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolWebClientId,
        identityPoolId: undefined,
      },
    },
    API: {
      REST: {
        udodiriApi: {
          endpoint: config.apiGatewayUrl,
          region: config.region,
        },
      },
    },
  });
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const getCurrentUser = async () => {
  try {
    const { getCurrentUser: amplifyGetCurrentUser } = await import('aws-amplify/auth');
    return await amplifyGetCurrentUser();
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const signOut = async () => {
  try {
    const { signOut: amplifySignOut } = await import('aws-amplify/auth');
    await amplifySignOut();
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

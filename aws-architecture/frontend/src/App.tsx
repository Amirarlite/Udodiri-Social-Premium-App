import React, { useState } from 'react';
import { configureAmplify } from './config/aws';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

// Configure Amplify with environment variables or placeholders
configureAmplify({
  userPoolId: import.meta.env.VITE_USER_POOL_ID || 'us-east-1_PLACEHOLDER',
  userPoolWebClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || 'PLACEHOLDER_CLIENT_ID',
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  apiGatewayUrl: import.meta.env.VITE_API_GATEWAY_URL || 'https://PLACEHOLDER_API.execute-api.us-east-1.amazonaws.com/prod',
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;

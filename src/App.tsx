import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from './components/AuthContext';
import { AuthProvider } from './components/AuthContext';
import { NotificationProvider } from './components/NotificationContext';
import { FeatureFlagsProvider } from './components/FeatureFlagsContext';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import Settings from './components/Settings';
import OAuthCallback from './components/OAuthCallback';
import GraphViewer from './components/MindGraph/GraphViewer';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = React.useContext(AuthContext);

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <LoginPage />;
  }

  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FeatureFlagsProvider>
        <NotificationProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/auth/callback" element={<OAuthCallback />} />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings onBack={() => window.history.back()} />
                  </ProtectedRoute>
                } />
                <Route path="/mindgraph/:graphId" element={
                  <ProtectedRoute>
                    <GraphViewer />
                  </ProtectedRoute>
                } />
                {/* Add more routes as needed */}
                <Route path="*" element={<div>404 Not Found</div>} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </NotificationProvider>
      </FeatureFlagsProvider>
    </QueryClientProvider>
  );
}

export default App;
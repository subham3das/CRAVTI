import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { AppRoutes } from './routes/AppRoutes';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AdminAuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '12px',
                padding: '10px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#2563EB',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
          <AppRoutes />
        </AdminAuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};


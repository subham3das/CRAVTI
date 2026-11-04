import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { AppRoutes } from './routes/AppRoutes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalSyncWatcher } from './components/GlobalSyncWatcher';
import { BackendHealthWatcher } from './components/BackendHealthWatcher';

export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <BackendHealthWatcher />
        <AuthProvider>
          <SettingsProvider>
            <GlobalSyncWatcher />
            <AppRoutes />
          </SettingsProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #E2E8F0',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
              },
              success: {
                iconTheme: {
                  primary: '#16A34A',
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
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;


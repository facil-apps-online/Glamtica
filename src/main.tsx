import { createRoot } from 'react-dom/client';
import React from 'react'; // Import React for ErrorBoundary
import App from './App.tsx';
import './index.css';
import 'react-datepicker/dist/react-datepicker.css';
import './lib/i18n';
import { ThemeProvider } from '@/components/ThemeProvider';
import { createClient } from '@supabase/supabase-js'; // Import Supabase client

// Supabase client for error reporting
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Use PUBLISHABLE_KEY for anon access
const glamticaPlatformId = import.meta.env.VITE_PLATFORM_ID;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to report errors to Supabase Edge Function
const reportError = async (error: Error, info?: React.ErrorInfo) => {
  console.error("Caught an error:", error, info);

  const payload = {
    platform_id: glamticaPlatformId,
    type: 'error',
    message: error.message,
    details: {
      stack: error.stack,
      componentStack: info?.componentStack,
      userAgent: navigator.userAgent,
      appVersion: 'Glamtica', // Or get from package.json
      timestamp: new Date().toISOString(),
    },
  };

  try {
    await supabase.functions.invoke('tenant-actions', {
      body: JSON.stringify({
        action: 'insert_system_alert',
        payload: payload,
      }),
    });
  } catch (supabaseError) {
    console.error("Failed to report error to Supabase:", supabaseError);
  }
};

// React Error Boundary component
class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, { hasError: boolean }> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    reportError(error, info);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
          <h1>Algo salió mal.</h1>
          <p>Hemos sido notificados del problema y estamos trabajando para solucionarlo.</p>
          <button onClick={() => window.location.reload()}>Recargar la página</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global uncaught error handler
window.onerror = (message, source, lineno, colno, error) => {
  if (error) {
    reportError(error);
  } else {
    reportError(new Error(String(message)));
  }
  // Prevent default handling to avoid console spam in some cases
  return true;
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        storageKey="glamtica-theme"
      >
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

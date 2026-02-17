import React from 'react';
import ReactDOM from 'react-dom/client';
// CSS is now handled via Tailwind CDN and inline styles in index.html for immediate preview
import './styles/global.css';
import App from './App';

import { ThemeProvider } from './context/ThemeContext';

// Simple Error Boundary for diagnostic purposes on Vercel
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  public state: { hasError: boolean, error: Error | null } = { hasError: false, error: null };

  constructor(props: { children: React.ReactNode }) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught Error:", error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    if (hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', background: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1>Reicrew AI - Diagnostic</h1>
          <p>The application crashed during initialization on Vercel.</p>
          <pre style={{ whiteSpace: 'pre-wrap', maxWidth: '800px', textAlign: 'left', background: '#f5f5f5', padding: '15px', borderRadius: '8px', fontSize: '12px' }}>
            {error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
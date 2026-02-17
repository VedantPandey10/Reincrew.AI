import React from 'react';
import ReactDOM from 'react-dom/client';
// CSS is now handled via Tailwind CDN and inline styles in index.html for immediate preview
import './styles/global.css';
import App from './App';

import { ThemeProvider } from './context/ThemeContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';
import { initPostHog } from './utils/posthog';

// Initialize PostHog
console.log('index.js - REACT_APP_PUBLIC_POSTHOG_KEY:', process.env.REACT_APP_PUBLIC_POSTHOG_KEY);
console.log('index.js - REACT_APP_PUBLIC_POSTHOG_HOST:', process.env.REACT_APP_PUBLIC_POSTHOG_HOST);
initPostHog(
  process.env.REACT_APP_PUBLIC_POSTHOG_KEY,
  process.env.REACT_APP_PUBLIC_POSTHOG_HOST
);

const options = {
  api_host: process.env.REACT_APP_PUBLIC_POSTHOG_HOST,
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </React.StrictMode>
);

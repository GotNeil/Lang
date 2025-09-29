import posthog from 'posthog-js'

export const initPostHog = (key, host) => {
  if (typeof window !== 'undefined') {
    // console.log('process.env:', process.env);
    // console.log('REACT_APP_PUBLIC_POSTHOG_KEY:', key);
    // console.log('REACT_APP_PUBLIC_POSTHOG_HOST:', host);
    posthog.init(key, { api_host: host })
    window.posthog = posthog;
  }
}

export const capturePostHogEvent = (event, properties) => {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(event, properties);
  }
}
import posthog from 'posthog-js'

export const initPostHog = () => {
  if (typeof window !== 'undefined') {
    console.log('process.env:', process.env);
    console.log('REACT_APP_PUBLIC_POSTHOG_KEY:', process.env.REACT_APP_PUBLIC_POSTHOG_KEY);
    console.log('REACT_APP_PUBLIC_POSTHOG_HOST:', process.env.REACT_APP_PUBLIC_POSTHOG_HOST);
    posthog.init(process.env.REACT_APP_PUBLIC_POSTHOG_KEY, { api_host: process.env.REACT_APP_PUBLIC_POSTHOG_HOST })
  }
}

export const capturePostHogEvent = (event, properties) => {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(event, properties);
  }
}
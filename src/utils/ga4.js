// src/utils/ga4.js

export const initGA = (measurementId) => {
  // Avoid duplicate script injection
  if (document.getElementById('ga-script')) {
    return;
  }

  const script1 = document.createElement('script');
  script1.id = 'ga-script';
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.id = 'ga-inline-script';
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);
};

export const logEvent = (action, params) => {
  if (window.gtag) {
    window.gtag('event', action, params);
  }
};
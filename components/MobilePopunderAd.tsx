'use strict';
'use client';

import { useEffect } from 'react';

/**
 * Mobile-Only Popunder Ad Component
 * Dynamically loads the popunder ad script only when the user is on a mobile device or screen width < 768px.
 */
export default function MobilePopunderAd() {
  useEffect(() => {
    // Detect mobile device via screen width or userAgent
    const isMobileScreen = window.innerWidth < 768;
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (!isMobileScreen && !isMobileUserAgent) {
      return;
    }

    // Check if script is already added to avoid duplicate injection
    const adScriptSrc = 'https://manyapostle.com/7c/8b/a5/7c8ba50054319cc978866fed292e7ce3.js';
    if (document.querySelector(`script[src="${adScriptSrc}"]`)) {
      return;
    }

    const script = document.createElement('script');
    script.src = adScriptSrc;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up script on unmount if needed
      try {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      } catch (e) {
        // Ignore removal error
      }
    };
  }, []);

  return null;
}

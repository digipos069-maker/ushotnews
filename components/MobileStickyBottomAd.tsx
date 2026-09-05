'use strict';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface MobileStickyBottomAdProps {
  slotKey?: string;
}

/**
 * Mobile-Only Sticky Bottom Banner Ad Component
 * Pinned at the bottom of the mobile screen with standard dimensions (320x50 / 300x50)
 * and a close (X) button so users can dismiss it.
 */
export default function MobileStickyBottomAd({
  slotKey = '3137a20b6c0fa2e9adcf7c4d3302b18c',
}: MobileStickyBottomAdProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Only activate on mobile screens (< 768px)
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (!isMobile || !isVisible) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    // Isolate ad script inside iframe to guarantee smooth rendering
    const adHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 320px;
              height: 50px;
              overflow: hidden;
              background-color: transparent;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          </style>
        </head>
        <body>
          <script type="text/javascript">
            atOptions = {
              'key' : '${slotKey}',
              'format' : 'iframe',
              'height' : 50,
              'width' : 320,
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="https://manyapostle.com/${slotKey}/invoke.js"></script>
        </body>
      </html>
    `;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(adHtml);
        doc.close();
      }
    } catch (e) {
      console.error('Failed to inject bottom banner ad script:', e);
    }
  }, [isMobile, isVisible, slotKey]);

  if (!isMobile || !isVisible) {
    return null;
  }

  return (
    <aside
      aria-label="Mobile Sticky Bottom Advertisement"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center justify-center pointer-events-auto bg-white/95 backdrop-blur-xs border-t border-[#e0e0e0] shadow-[0_-4px_16px_rgba(0,0,0,0.12)] pb-[max(env(safe-area-inset-bottom),4px)] pt-1"
    >
      {/* Top Header Bar: Advertisement Label & Close Button */}
      <div className="w-full max-w-[320px] flex items-center justify-between px-1 mb-0.5">
        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-mono font-medium">
          Advertisement
        </span>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded-none border border-[#e0e0e0] transition-colors cursor-pointer"
          title="Close Ad"
        >
          <span>Close</span>
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Ad Container (320 x 50 px standard mobile leaderboard) */}
      <div
        style={{ width: '320px', height: '50px' }}
        className="relative overflow-hidden bg-slate-50 flex items-center justify-center"
      >
        <iframe
          ref={iframeRef}
          title="Mobile Sticky Bottom Ad"
          width={320}
          height={50}
          style={{ width: '320px', height: '50px', border: 'none', overflow: 'hidden' }}
          scrolling="no"
          loading="eager"
        />
      </div>
    </aside>
  );
}

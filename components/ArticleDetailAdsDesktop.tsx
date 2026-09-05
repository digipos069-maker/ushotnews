'use strict';
'use client';

import React, { useEffect, useRef } from 'react';

interface ArticleDetailAdsDesktopProps {
  position: 'left' | 'right';
  slotId?: string;
}

/**
 * Desktop-Only Skyscraper Ad Component for Article Detail Page
 * Appears in the left and right gutters of the viewport on wide screens (>= 1620px).
 * Pinned below the sticky header without covering article content.
 */
export default function ArticleDetailAdsDesktop({
  position,
  slotId = '160x600',
}: ArticleDetailAdsDesktopProps) {
  const isLeft = position === 'left';
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
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
              width: 160px;
              height: 600px;
              overflow: hidden;
              background-color: transparent;
            }
          </style>
        </head>
        <body>
          <script type="text/javascript">
            atOptions = {
              'key' : '3137a20b6c0fa2e9adcf7c4d3302b18c',
              'format' : 'iframe',
              'height' : 600,
              'width' : 160,
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="https://manyapostle.com/3137a20b6c0fa2e9adcf7c4d3302b18c/invoke.js"></script>
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
      console.error('Failed to inject article detail ad script:', e);
    }
  }, []);

  return (
    <aside
      aria-label={'Article Advertisement ' + position}
      className={'hidden [@media(min-width:1620px)]:flex flex-col items-center fixed top-[110px] z-30 pointer-events-auto ' + (
        isLeft
          ? 'left-[max(1rem,calc((100vw-1280px)/2-180px))]'
          : 'right-[max(1rem,calc((100vw-1280px)/2-180px))]'
      )}
    >
      {/* Label */}
      <span className="text-[9px] uppercase tracking-widest text-slate-400 font-mono mb-1 select-none">
        Advertisement
      </span>

      {/* 160 x 600 px Ad Frame */}
      <div
        style={{ width: '160px', height: '600px' }}
        className="bg-white border border-[#e0e0e0] shadow-xs relative overflow-hidden"
      >
        <iframe
          ref={iframeRef}
          title={'Article Ad Slot ' + slotId + ' ' + position}
          width={160}
          height={600}
          style={{ width: '160px', height: '600px', border: 'none', overflow: 'hidden' }}
          scrolling="no"
          loading="eager"
        />
      </div>
    </aside>
  );
}

'use strict';
'use client';

import React, { useEffect, useRef } from 'react';

interface AdSkyscraperProps {
  position: 'left' | 'right';
  slotId?: string;
}

export default function AdSkyscraper({ position, slotId = '160x600' }: AdSkyscraperProps) {
  const isLeft = position === 'left';
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Build the isolated ad document containing the Adsterra / ManyApostle script
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
      console.error('Failed to inject ad script into iframe:', e);
    }
  }, []);

  return (
    <aside
      aria-label={'Advertisement ' + position}
      className={'hidden xl:flex flex-col items-center fixed top-[125px] z-30 pointer-events-auto ' + (
        isLeft
          ? 'left-2 2xl:left-[max(1rem,calc((100vw-1280px)/2-176px))]'
          : 'right-2 2xl:right-[max(1rem,calc((100vw-1280px)/2-176px))]'
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
          title={'Ad Slot ' + slotId + ' ' + position}
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

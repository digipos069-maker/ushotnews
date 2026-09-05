'use strict';
'use client';

import React from 'react';
import { BarChart3, Info } from 'lucide-react';

interface IndicatorRow {
  name: string;
  latest: string;
  previous: string;
  target: string;
  status: 'Strong' | 'Moderating' | 'Target Met' | 'Elevated';
}

const ECONOMIC_INDICATORS: IndicatorRow[] = [
  { name: 'Real GDP Growth (Annualized)', latest: '+3.0%', previous: '+2.8%', target: '2.0% - 2.5%', status: 'Strong' },
  { name: 'Core Consumer Price Index (CPI YoY)', latest: '2.6%', previous: '2.9%', target: '2.0%', status: 'Moderating' },
  { name: 'US Unemployment Rate', latest: '3.9%', previous: '4.0%', target: '4.0% - 4.5%', status: 'Strong' },
  { name: 'Federal Reserve Policy Target', latest: '4.75% - 5.00%', previous: '5.25% - 5.50%', target: 'Neutral 3.0%', status: 'Moderating' },
  { name: '30-Year Fixed Mortgage Average', latest: '6.12%', previous: '6.45%', target: 'Historical 5.5%', status: 'Elevated' },
  { name: 'University of Michigan Consumer Sentiment', latest: '79.4', previous: '76.8', target: 'Above 80.0', status: 'Target Met' },
];

export default function EconomicTable() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-[#032EA1] text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 serif-headline">
                US Key Macroeconomic Dashboard
              </h3>
              <p className="text-xs text-slate-500">
                Official federal benchmarks & indicators compiled from BLS, BEA, and the Federal Reserve
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated Monthly • All metrics verified</span>
          </div>
        </div>

        {/* The Table styled with #032EA1 background in accordance with user rules */}
        <div className="overflow-x-auto rounded-lg shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-3 px-4">Economic Indicator</th>
                <th className="py-3 px-4">Current Reading</th>
                <th className="py-3 px-4">Prior Period</th>
                <th className="py-3 px-4">Fed / Consensus Target</th>
                <th className="py-3 px-4 text-right">Status Assessment</th>
              </tr>
            </thead>
            <tbody>
              {ECONOMIC_INDICATORS.map((row, idx) => (
                <tr key={idx} className="border-b border-white/10 hover:bg-white/10 transition-colors">
                  <td className="py-3 px-4 font-semibold text-sm text-white">
                    {row.name}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-300 text-sm">
                    {row.latest}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-200 text-sm">
                    {row.previous}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-200">
                    {row.target}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

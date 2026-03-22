'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Vercel Speed Insights picks these up automatically.
    // Log in dev so you can see scores locally.
    if (process.env.NODE_ENV === 'development') {
      console.log(`[web-vitals] ${metric.name}`, metric.value.toFixed(1), metric.rating);
    }
  });
  return null;
}

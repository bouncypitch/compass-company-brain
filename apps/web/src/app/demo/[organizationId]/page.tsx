'use client';

import { Suspense, use } from 'react';
import { DemoDeck } from '@/components/demo/DemoDeck';

interface PageProps {
  params: Promise<{ organizationId: string }>;
}

/** Full-screen keynote demo of the company brain for one organization. */
export default function DemoPage({ params }: PageProps) {
  const { organizationId } = use(params);
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[100] bg-[#fbfbfd]" />}>
      <DemoDeck organizationId={organizationId} />
    </Suspense>
  );
}

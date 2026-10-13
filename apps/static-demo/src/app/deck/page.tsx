'use client';

import { Suspense } from 'react';
import { DemoDeck } from '@/components/demo/DemoDeck';
import { DEMO_ORGANIZATION_ID } from '@static/lib/demo-org';

/** The keynote deck, served from the recorded snapshot. */
export default function DeckPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[100] bg-[#fbfbfd]" />}>
      <DemoDeck organizationId={DEMO_ORGANIZATION_ID} />
    </Suspense>
  );
}

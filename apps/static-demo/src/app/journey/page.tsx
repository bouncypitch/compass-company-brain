'use client';

import { Suspense } from 'react';
import { JourneyExperience } from '@/components/journey/JourneyExperience';
import { DEMO_ORGANIZATION_ID } from '@static/lib/demo-org';

/** Jordan's promotion journey, served from the recorded snapshot. */
export default function JourneyPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[100] bg-[#fbfbfd]" />}>
      <JourneyExperience organizationId={DEMO_ORGANIZATION_ID} />
    </Suspense>
  );
}

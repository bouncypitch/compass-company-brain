'use client';

import { Suspense, use } from 'react';
import { JourneyExperience } from '@/components/journey/JourneyExperience';

interface PageProps {
  params: Promise<{ organizationId: string }>;
}

/** Jordan's "How do I get promoted to Staff?" walkthrough over the live company brain. */
export default function JourneyPage({ params }: PageProps) {
  const { organizationId } = use(params);
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[100] bg-[#fbfbfd]" />}>
      <JourneyExperience organizationId={organizationId} />
    </Suspense>
  );
}

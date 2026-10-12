'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { organizationsApi } from '@/lib/organizations-api';

/** Opens the live demo deck for the caller's first organization. */
export default function DemoRedirectPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['user-organizations'],
    queryFn: () => organizationsApi.getUserOrganizations(),
  });

  useEffect(() => {
    const first = data?.organizations[0];
    if (!first) return;
    // Carry ?s=<slideId> through the redirect.
    const search = typeof window === 'undefined' ? '' : window.location.search;
    router.replace(`/demo/${first.id}${search}`);
  }, [data, router]);

  if (!isLoading && data && !data.hasOrganizations) {
    return (
      <p className="p-8 text-muted-foreground">Join or create an organization to open the demo.</p>
    );
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center gap-2 bg-[#fbfbfd] text-neutral-400">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Opening the brain…
    </div>
  );
}

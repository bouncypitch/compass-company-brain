'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { organizationsApi } from '@/lib/organizations-api';

/** Sidebar entry point: opens the brain of the caller's first organization. */
export default function BrainRedirectPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-organizations'],
    queryFn: () => organizationsApi.getUserOrganizations(),
    retry: false,
  });

  // Signed out: send the visitor to log in, then straight back here.
  useEffect(() => {
    if (isError) router.replace(`/login?redirect=${encodeURIComponent('/brain')}`);
  }, [isError, router]);

  useEffect(() => {
    const first = data?.organizations[0];
    if (first) router.replace(`/organizations/${first.id}/brain`);
  }, [data, router]);

  if (!isLoading && data && !data.hasOrganizations) {
    return <p className="p-8 text-muted-foreground">Join or create an organization to open its brain.</p>;
  }
  return (
    <div className="flex items-center gap-2 p-8 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Opening the brain…
    </div>
  );
}

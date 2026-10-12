'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type {
  CompassResult,
  RadarResult,
  TimeMachineResult,
  TopologyResult,
} from '@app-starter/shared';
import { brainApi, brainApiExtras } from '@/lib/brain-api';

export const DEMO_EMPLOYEE = 'jordan-rivera';

interface DemoData {
  organizationId: string;
  radar: UseQueryResult<RadarResult | null>;
  timeMachine: UseQueryResult<TimeMachineResult>;
  compass: UseQueryResult<CompassResult>;
  topology: UseQueryResult<TopologyResult>;
}

const DemoContext = createContext<DemoData | null>(null);

/**
 * Prefetches every cached brain payload on mount so each slide renders
 * instantly. Query keys match the brain screens so their caches are shared.
 */
export const DemoDataProvider = ({
  organizationId,
  children,
}: {
  organizationId: string;
  children: ReactNode;
}) => {
  const radar = useQuery({
    queryKey: ['brain-radar', organizationId],
    queryFn: () => brainApi.getRadar(organizationId),
    staleTime: Infinity,
  });
  const timeMachine = useQuery({
    queryKey: ['brain-time-machine', organizationId],
    queryFn: () => brainApi.timeMachine(organizationId),
    staleTime: Infinity,
  });
  const compass = useQuery({
    queryKey: ['brain-compass', organizationId, DEMO_EMPLOYEE],
    queryFn: () => brainApi.compass(organizationId, DEMO_EMPLOYEE),
    staleTime: Infinity,
  });
  const topology = useQuery({
    queryKey: ['brain-topology', organizationId],
    queryFn: () => brainApiExtras.topology(organizationId),
    staleTime: Infinity,
  });
  return (
    <DemoContext.Provider value={{ organizationId, radar, timeMachine, compass, topology }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = (): DemoData => {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside DemoDataProvider');
  return ctx;
};

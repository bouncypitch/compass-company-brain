'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BrainGraph, BrainGraphNode } from '@app-starter/shared';
import { Card, CardContent } from '@/components/ui/card';
import { brainApi } from '@/lib/brain-api';
import { BrainGraphView, TYPE_LABEL } from './BrainGraphView';

/** One graph from market signal to an employee's promotion opportunity. */
export const StoryView = ({ organizationId, employeeId }: { organizationId: string; employeeId: string }) => {
  const [selected, setSelected] = useState<BrainGraphNode | null>(null);
  const radar = useQuery({ queryKey: ['brain-radar', organizationId], queryFn: () => brainApi.getRadar(organizationId) });
  const compass = useQuery({
    queryKey: ['brain-compass', organizationId, employeeId],
    queryFn: () => brainApi.compass(organizationId, employeeId),
    staleTime: Infinity,
  });

  const graph = useMemo<BrainGraph | null>(() => {
    if (!radar.data) return null;
    const nodes = [...radar.data.graph.nodes];
    const edges = [...radar.data.graph.edges];
    const c = compass.data;
    if (c) {
      const ids = new Set(nodes.map((n) => n.id));
      for (const n of c.graph.nodes) if (!ids.has(n.id)) nodes.push(n);
      edges.push(...c.graph.edges);
      // Stitch: a market gap that became this person's promotion opportunity.
      for (const o of c.opportunities) {
        if (o.gapId && ids.has(o.gapId)) edges.push({ id: `${o.gapId}->opp-${o.rank}`, source: o.gapId, target: `opp-${o.rank}`, label: 'becomes' });
      }
    }
    return { nodes, edges };
  }, [radar.data, compass.data]);

  if (!graph) return <p className="text-sm text-muted-foreground">Run the radar first to build the story.</p>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        From public competitor signals, to the capability they point at, to the Forgeline gap, roadmap, code and goals, to the person best placed to own it.
      </p>
      <BrainGraphView graph={graph} onSelect={setSelected} />
      {selected ? (
        <Card>
          <CardContent className="p-4 text-sm">
            <div className="text-xs uppercase text-muted-foreground">{TYPE_LABEL[selected.type]}</div>
            <div className="font-semibold">{selected.label}</div>
            {selected.detail ? <div className="text-muted-foreground">{selected.detail}</div> : null}
            {selected.url ? <a href={selected.url} target="_blank" rel="noreferrer" className="text-indigo-700 underline">Open source</a> : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

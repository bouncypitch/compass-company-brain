'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Handle,
  Position,
  ReactFlow,
  applyNodeChanges,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import type { BrainGraphNode, CompassOpportunity, TopologyResult } from '@app-starter/shared';
import { cn } from '@/lib/utils';
import { TYPE_COLOR, TYPE_LABEL } from '@/components/brain/BrainGraphView';
import { useDemo } from '@/components/demo/DemoContext';
import { Glass, Rise, SlideLoading } from '@/components/demo/primitives';
import { Avatar, JORDAN, StepFrame, youify } from './StepFrame';

const JORDAN_NODE = `person-${JORDAN.id}`;
const MANAGER_NAME = 'Priya Shah';

/** Every handle sits at the node centre so straight edges read as spokes. */
const CENTER_HANDLE = {
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 1,
  height: 1,
  minWidth: 0,
  minHeight: 0,
  border: 0,
  opacity: 0,
} as const;

const CenterHandles = () => (
  <>
    <Handle type="target" position={Position.Top} style={CENTER_HANDLE} isConnectable={false} />
    <Handle type="source" position={Position.Bottom} style={CENTER_HANDLE} isConnectable={false} />
  </>
);

interface PersonData extends Record<string, unknown> {
  name: string;
  title: string;
  isYou?: boolean;
  isManager?: boolean;
  isSelected?: boolean;
}
interface ItemData extends Record<string, unknown> {
  node: BrainGraphNode;
  relation: string;
}

const PersonNode = memo(({ data }: NodeProps<Node<PersonData>>) => (
  <div className="flex w-[150px] cursor-grab flex-col items-center text-center active:cursor-grabbing">
    <CenterHandles />
    <span
      className={cn(
        'rounded-full p-1 transition',
        data.isSelected ? 'bg-gradient-to-br from-indigo-500 to-pink-500' : 'bg-white',
        'shadow-[0_10px_24px_-10px_rgba(15,23,42,0.45)]',
      )}
    >
      <Avatar
        name={data.name}
        isYou={data.isYou}
        className={cn(
          'border-2 border-white',
          data.isYou ? 'h-[84px] w-[84px] text-[28px]' : 'h-14 w-14 text-[18px]',
        )}
      />
    </span>
    <span className="mt-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[13px] font-semibold text-neutral-900 shadow-sm">
      {data.isYou ? 'You' : data.name}
    </span>
    <span className="mt-0.5 line-clamp-1 max-w-[170px] rounded-full bg-white/80 px-2 text-[11px] font-medium text-neutral-500">
      {data.isManager ? 'Your manager' : data.title}
    </span>
  </div>
));
PersonNode.displayName = 'PersonNode';

const ItemNode = memo(({ data }: NodeProps<Node<ItemData>>) => {
  const tone = TYPE_COLOR[data.node.type];
  return (
    <div
      className="w-[210px] cursor-grab rounded-2xl px-3 py-2 text-left active:cursor-grabbing"
      style={{
        background: `linear-gradient(180deg, #ffffff 0%, ${tone.bg} 100%)`,
        border: `1px solid ${tone.border}55`,
        color: tone.fg,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 20px -12px rgba(15,23,42,0.25)',
      }}
    >
      <CenterHandles />
      <div className="mb-0.5 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] opacity-70">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.border }} />
        {data.relation}
      </div>
      <div
        className={cn(
          'line-clamp-2 text-[12px] font-semibold leading-snug',
          data.node.type === 'code' && 'font-mono',
        )}
      >
        {data.node.label}
      </div>
    </div>
  );
});
ItemNode.displayName = 'ItemNode';

const NODE_TYPES = { person: PersonNode, item: ItemNode };

/** "Engineering Manager, Platform · M2" → "Engineering Manager, Platform". */
const shortTitle = (detail: string | undefined): string => (detail ?? '').split(' · ')[0];

const RELATION: Record<string, string> = {
  'member of': 'Your team',
  'owns KR': 'Your KR',
  'code owner of': 'Your code',
};

interface Talk {
  id: string;
  name: string;
  title: string;
  why: string;
}

/**
 * Jordan's neighborhood: Jordan at the centre, the people to talk to on the
 * right arc, Jordan's team/KRs/code plus the R-14 bet on the left arc.
 */
const buildNeighborhood = (
  topology: TopologyResult,
  opportunity: CompassOpportunity | undefined,
): { nodes: Node[]; edges: Edge[]; talks: Talk[] } => {
  const graph = topology.graph;
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const byName = new Map(graph.nodes.filter((n) => n.type === 'person').map((n) => [n.label, n]));
  const asks = opportunity?.peopleToTalkTo ?? [];
  const named = asks.some((p) => p.name === MANAGER_NAME)
    ? asks
    : [{ name: MANAGER_NAME, why: 'Your manager: align on scope and protected time.' }, ...asks];
  const talks: Talk[] = named
    .map((p) => {
      const node = byName.get(p.name);
      return node
        ? { id: node.id, name: p.name, title: shortTitle(node.detail), why: p.why }
        : null;
    })
    .filter((t): t is Talk => !!t)
    .slice(0, 8);

  const items = graph.edges
    .filter((e) => e.source === JORDAN_NODE && RELATION[e.label] && byId.has(e.target))
    .map((e) => ({ node: byId.get(e.target)!, relation: RELATION[e.label] }))
    .slice(0, 6);
  const bet = byId.get('rm-R-14');
  if (bet) items.push({ node: { ...bet, label: 'R-14: Agent memory' }, relation: 'Your next bet' });

  const arc = (i: number, n: number, from: number, to: number, rx: number, ry: number) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const angle = ((from + (to - from) * t) * Math.PI) / 180;
    return { x: Math.cos(angle) * rx, y: Math.sin(angle) * ry };
  };

  const nodes: Node[] = [
    {
      id: JORDAN_NODE,
      type: 'person',
      position: { x: -75, y: -60 },
      data: {
        name: JORDAN.name,
        title: 'Senior Software Engineer',
        isYou: true,
      } satisfies PersonData,
    },
    ...talks.map((t, i): Node => {
      const p = arc(i, talks.length, -78, 78, 430, 300);
      return {
        id: t.id,
        type: 'person',
        position: { x: p.x - 75, y: p.y - 45 },
        data: {
          name: t.name,
          title: t.title,
          isManager: t.name === MANAGER_NAME,
        } satisfies PersonData,
      };
    }),
    ...items.map(({ node, relation }, i): Node => {
      const p = arc(i, items.length, 250, 110, 430, 300);
      return {
        id: node.id,
        type: 'item',
        position: { x: p.x - 105, y: p.y - 28 },
        data: { node, relation } satisfies ItemData,
      };
    }),
  ];

  const kept = new Set(nodes.map((n) => n.id));
  const spoke = (target: string, stroke: string, isAnimated: boolean): Edge => ({
    id: `${JORDAN_NODE}->${target}`,
    source: JORDAN_NODE,
    target,
    type: 'straight',
    animated: isAnimated,
    style: { stroke, strokeWidth: isAnimated ? 2 : 1.5 },
  });
  const edges: Edge[] = [
    ...talks.map((t) => spoke(t.id, '#a78bfa', t.name !== MANAGER_NAME)),
    ...items.map(({ node }) =>
      spoke(node.id, node.id === 'rm-R-14' ? '#f43f5e' : '#c7cbe3', node.id === 'rm-R-14'),
    ),
    // Reporting lines between the people Jordan will talk to.
    ...graph.edges
      .filter(
        (e) =>
          e.label === 'reports to' &&
          e.source !== JORDAN_NODE &&
          kept.has(e.source) &&
          kept.has(e.target),
      )
      .map(
        (e): Edge => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'straight',
          style: { stroke: '#d4d4d8', strokeWidth: 1.25, strokeDasharray: '4 4' },
        }),
      ),
  ];
  return { nodes, edges, talks };
};

export const PeopleStep = () => {
  const { topology, compass } = useDemo();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const model = useMemo(
    () => (topology.data ? buildNeighborhood(topology.data, compass.data?.opportunities[0]) : null),
    [topology.data, compass.data],
  );
  const [nodes, setNodes] = useState<Node[]>([]);
  useEffect(() => setNodes(model?.nodes ?? []), [model]);

  // Mirror the selection onto the nodes without resetting dragged positions.
  useEffect(() => {
    setNodes((current) =>
      current.map((n) =>
        n.type === 'person' ? { ...n, data: { ...n.data, isSelected: n.id === selectedId } } : n,
      ),
    );
  }, [selectedId]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((current) => applyNodeChanges(changes, current)),
    [],
  );

  if (!model) return <SlideLoading label="Mapping your network…" />;
  const selected = model.talks.find((t) => t.id === selectedId) ?? null;
  const handleNodeClick = (_: unknown, node: Node): void => {
    if (node.id === JORDAN_NODE || node.type !== 'person') return;
    setSelectedId(node.id);
  };

  return (
    <StepFrame
      eyebrow="07 · Who to talk to"
      title={
        <>
          Who to <span className="demo-gradient-text">talk to.</span>
        </>
      }
      aside={
        <span className="mb-1 rounded-full bg-white/70 px-4 py-2 text-[14px] font-medium text-neutral-500">
          {model.talks.length} people · drag to explore
        </span>
      }
    >
      <div className="grid h-full grid-cols-[minmax(0,1fr)_380px] gap-6">
        <Rise delay={120} className="min-h-0">
          <div className="h-full overflow-hidden rounded-[28px] border border-black/[0.05] bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_32px_-16px_rgba(15,23,42,0.14)] backdrop-blur-xl">
            <ReactFlow
              nodes={nodes}
              edges={model.edges}
              nodeTypes={NODE_TYPES}
              onNodesChange={handleNodesChange}
              onNodeClick={handleNodeClick}
              onPaneClick={() => setSelectedId(null)}
              nodesDraggable
              nodesConnectable={false}
              elementsSelectable={false}
              fitView
              fitViewOptions={{ padding: 0.1 }}
              minZoom={0.3}
              maxZoom={1.6}
              zoomOnScroll={false}
              preventScrolling={false}
              proOptions={{ hideAttribution: true }}
              style={{ background: 'transparent' }}
            >
              <Background gap={22} size={1.2} color="#d9dbe8" />
            </ReactFlow>
          </div>
        </Rise>
        <Rise delay={240} className="min-h-0">
          {selected ? (
            <PersonCard talk={selected} onBack={() => setSelectedId(null)} />
          ) : (
            <Glass className="flex h-full flex-col px-5 py-5">
              <div className="px-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Start with
              </div>
              <ul className="mt-2 flex min-h-0 flex-1 flex-col">
                {model.talks.map((t) => (
                  <li key={t.id} className="min-h-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className="flex h-full w-full items-center gap-3 rounded-2xl px-2 text-left transition hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                    >
                      <Avatar name={t.name} className="h-10 w-10 text-[14px]" />
                      <span className="min-w-0">
                        <span className="block truncate text-[16px] font-semibold text-neutral-900">
                          {t.name}
                        </span>
                        <span className="block truncate text-[13px] text-neutral-500">
                          {t.name === MANAGER_NAME ? 'Your manager' : t.title}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Glass>
          )}
        </Rise>
      </div>
    </StepFrame>
  );
};

const PersonCard = ({ talk, onBack }: { talk: Talk; onBack: () => void }) => (
  <Glass className="flex h-full flex-col p-7 animate-in fade-in slide-in-from-right-2 duration-300">
    <button
      type="button"
      onClick={onBack}
      className="-ml-2 flex items-center gap-1.5 self-start rounded-full px-2 py-1 text-[14px] font-medium text-neutral-500 hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden /> Everyone
    </button>
    <Avatar
      name={talk.name}
      className="mt-6 h-20 w-20 text-[28px] shadow-[0_16px_32px_-14px_rgba(15,23,42,0.5)]"
    />
    <div className="mt-5 text-[28px] font-semibold leading-tight tracking-[-0.025em] text-neutral-950">
      {talk.name}
    </div>
    <div className="mt-1 text-[16px] text-neutral-500">
      {talk.name === MANAGER_NAME ? `Your manager · ${talk.title}` : talk.title}
    </div>
    <div className="mt-8 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
      <MessageCircle className="h-4 w-4" aria-hidden /> Why talk to them
    </div>
    <p className="mt-2 text-[19px] leading-[1.45] tracking-[-0.01em] text-neutral-800">
      {youify(talk.why)}
    </p>
    <div className="mt-auto text-[12px] font-medium uppercase tracking-[0.12em] text-neutral-400">
      {TYPE_LABEL.person} · company graph
    </div>
  </Glass>
);

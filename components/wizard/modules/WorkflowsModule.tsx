import type { ZuperWorkflowSummary } from '@/lib/zuper/transformer';

interface Props {
  workflows: ZuperWorkflowSummary[];
}

export function WorkflowsModule({ workflows }: Props) {
  const active = workflows.filter((w) => w.isActive);

  if (!active.length) {
    return <p className="text-sm text-gray-500">No active automations found.</p>;
  }

  return (
    <div className="space-y-3">
      {active.map((wf) => <WorkflowCard key={wf.uid} wf={wf} />)}
    </div>
  );
}

function WorkflowCard({ wf }: { wf: ZuperWorkflowSummary }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E2DC] p-5">
      <p className="text-sm font-bold text-[#1A1A1A]">{wf.name}</p>
      <p className="text-xs text-gray-400 mt-0.5">
        Trigger: {wf.trigger} · {wf.nodeCount} node{wf.nodeCount !== 1 ? 's' : ''}
      </p>
      {wf.description ? (
        <p className="text-sm text-gray-500 leading-relaxed mt-3 whitespace-pre-line">{wf.description}</p>
      ) : (
        <p className="text-xs text-gray-400 italic mt-3">No description set in Zuper for this automation.</p>
      )}
    </div>
  );
}

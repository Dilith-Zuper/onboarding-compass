import type { ZuperWorkflowSummary } from '@/lib/zuper/transformer';
import {
  describeWorkflow,
  workflowStage,
  humanizeTrigger,
  WORKFLOW_STAGE_ORDER,
  WORKFLOW_STAGE_LABELS,
  type WorkflowStage,
} from '@/lib/zuper/workflowDescriptions';

interface Props {
  workflows: ZuperWorkflowSummary[];
}

export function WorkflowsModule({ workflows }: Props) {
  const active = workflows.filter((w) => w.isActive);

  if (!active.length) {
    return <p className="text-sm text-gray-500">No active automations found.</p>;
  }

  const byStage = new Map<WorkflowStage, ZuperWorkflowSummary[]>();
  for (const wf of active) {
    const stage = workflowStage(wf);
    byStage.set(stage, [...(byStage.get(stage) ?? []), wf]);
  }

  return (
    <div className="space-y-6">
      {WORKFLOW_STAGE_ORDER.filter((stage) => byStage.has(stage)).map((stage) => {
        const items = byStage.get(stage)!;
        return (
          <div key={stage}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              {WORKFLOW_STAGE_LABELS[stage]} · {items.length}
            </p>
            <div className="grid gap-2 md:grid-cols-2 items-start">
              {items.map((wf) => <WorkflowCard key={wf.uid} wf={wf} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WorkflowCard({ wf }: { wf: ZuperWorkflowSummary }) {
  const description = describeWorkflow(wf);
  return (
    <div className="bg-white rounded-2xl border border-[#E5E2DC] p-5">
      <p className="text-sm font-bold text-[#1A1A1A]">{wf.name}</p>
      <p className="text-xs text-gray-400 mt-0.5">{humanizeTrigger(wf.trigger)}</p>
      {description ? (
        <p className="text-sm text-gray-500 leading-relaxed mt-2 whitespace-pre-line">{description}</p>
      ) : (
        <p className="text-xs text-gray-400 italic mt-2">Your SA will walk you through this one on the call.</p>
      )}
    </div>
  );
}

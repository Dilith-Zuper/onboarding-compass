export interface FlowNode {
  id: string;
  label: string;
  type: 'start' | 'job' | 'external' | 'action' | 'integration' | 'end';
  description: string;
  isOptional?: boolean;
  isExternal?: boolean;
  color?: string;
}

export interface FlowVariantConfig {
  nodes: FlowNode[];
  edges: { from: string; to: string; label?: string }[];
  skippedNodes?: string[];
}

export const ALL_FLOW_NODES: Record<string, FlowNode> = {
  website_lead: {
    id: 'website_lead',
    label: 'Website Booking',
    type: 'integration',
    description: 'Homeowner fills out your booking widget. Lead created in Zuper automatically.',
  },
  lead_in: {
    id: 'lead_in',
    label: 'New Lead',
    type: 'start',
    description: 'A potential customer enters your pipeline.',
  },
  hubspot_lead: {
    id: 'hubspot_lead',
    label: 'HubSpot CRM',
    type: 'external',
    isExternal: true,
    description: 'Lead is managed in HubSpot. When qualified, it syncs to Zuper.',
  },
  lead_qualification: {
    id: 'lead_qualification',
    label: 'Lead Qualification Job',
    type: 'job',
    description: 'A Zuper job assigned to your sales rep. They call the lead, confirm interest, and mark it qualified.',
  },
  inspection: {
    id: 'inspection',
    label: 'Inspection Job',
    type: 'job',
    description: 'Field tech visits the property, measures the roof, photos everything via CompanyCam or Hover.',
  },
  insurance_claim: {
    id: 'insurance_claim',
    label: 'Insurance Claim',
    type: 'action',
    description: 'Adjuster visit scheduled. Supplement process tracked. Approval logged before production.',
    isOptional: true,
  },
  cpq: {
    id: 'cpq',
    label: 'CPQ / Estimating',
    type: 'action',
    description: "Measurements from inspection feed into Zuper's CPQ. Good / Better / Best proposals built per brand.",
  },
  proposal: {
    id: 'proposal',
    label: 'Proposal Sent',
    type: 'action',
    description: 'Customer receives their proposal. They can approve it digitally.',
  },
  production: {
    id: 'production',
    label: 'Production Jobs',
    type: 'job',
    description: 'Once approved, production jobs are created — tear off, install, cleanup — each with their own checklist.',
  },
  complete: {
    id: 'complete',
    label: 'Job Complete',
    type: 'job',
    description: 'Work is finished on site. Photos uploaded, sign-off captured, cleanup confirmed.',
  },
  invoicing: {
    id: 'invoicing',
    label: 'Invoicing & Closeout',
    type: 'end',
    description: 'Invoice issued, payment collected, closeout docs sent (warranty, photos, review request).',
  },
  zuper_connect: {
    id: 'zuper_connect',
    label: 'Zuper Connect',
    type: 'integration',
    description: 'Inbound calls and texts from customers are logged here and linked to jobs.',
    isOptional: true,
  },
};

export function computeFlowVariant(answers: Record<string, any>): FlowVariantConfig {
  const nodes: FlowNode[] = [];
  const edges: { from: string; to: string; label?: string }[] = [];

  const hasQualification = answers['has_lead_qualification'] === 'yes';
  const qualPlatform = answers['qualification_platform'];
  const jobTypes: string[] = Array.isArray(answers['job_types']) ? answers['job_types'] : [];
  const doesInsurance = jobTypes.includes('insurance_storm');
  const hasRetail = jobTypes.some((t) => t !== 'insurance_storm');
  const usesConnect = answers['uses_zuper_connect'] === 'yes';
  const hasWidget = answers['wants_booking_widget'] === 'yes';
  const paymentTiming = answers['payment_timing'];

  // ── Entry point ──
  if (hasWidget) {
    nodes.push(ALL_FLOW_NODES.website_lead);
    nodes.push(ALL_FLOW_NODES.lead_in);
    edges.push({ from: 'website_lead', to: 'lead_in' });
  } else {
    nodes.push(ALL_FLOW_NODES.lead_in);
  }

  // ── Qualification ──
  if (hasQualification && qualPlatform === 'hubspot') {
    nodes.push(ALL_FLOW_NODES.hubspot_lead);
    edges.push({ from: 'lead_in', to: 'hubspot_lead' });
    nodes.push(ALL_FLOW_NODES.inspection);
    edges.push({ from: 'hubspot_lead', to: 'inspection', label: 'Qualified in HubSpot' });
  } else if (hasQualification) {
    nodes.push(ALL_FLOW_NODES.lead_qualification);
    edges.push({ from: 'lead_in', to: 'lead_qualification' });
    nodes.push(ALL_FLOW_NODES.inspection);
    edges.push({ from: 'lead_qualification', to: 'inspection', label: 'Qualified' });
  } else {
    nodes.push(ALL_FLOW_NODES.inspection);
    edges.push({ from: 'lead_in', to: 'inspection' });
  }

  // ── Insurance branch ──
  if (doesInsurance) {
    nodes.push(ALL_FLOW_NODES.insurance_claim);
    edges.push({ from: 'inspection', to: 'insurance_claim', label: 'Insurance job' });
    nodes.push(ALL_FLOW_NODES.cpq);
    edges.push({ from: 'insurance_claim', to: 'cpq', label: 'Approved' });
    if (hasRetail) {
      edges.push({ from: 'inspection', to: 'cpq', label: 'Retail job' });
    }
  } else {
    nodes.push(ALL_FLOW_NODES.cpq);
    edges.push({ from: 'inspection', to: 'cpq' });
  }

  // ── Proposal ──
  nodes.push(ALL_FLOW_NODES.proposal);
  edges.push({ from: 'cpq', to: 'proposal' });

  // ── Production ──
  nodes.push(ALL_FLOW_NODES.production);
  edges.push({ from: 'proposal', to: 'production', label: 'Customer approved' });

  // ── Job Complete (work done in field) ──
  nodes.push(ALL_FLOW_NODES.complete);
  edges.push({ from: 'production', to: 'complete' });

  // ── Invoicing & Closeout (terminal node) ──
  const invoicingNode: FlowNode = { ...ALL_FLOW_NODES.invoicing };
  if (paymentTiming === 'day_of_install') {
    invoicingNode.description = 'Payment collected on install day. Invoice marked paid immediately. Closeout docs follow.';
  } else if (paymentTiming === 'few_days_after') {
    invoicingNode.description = 'Invoice issued on completion, payment collected within a few days. Closeout docs sent on payment.';
  } else if (paymentTiming === 'invoice_after') {
    invoicingNode.description = 'Invoice sent after job is done — customer pays on receipt. Closeout docs follow.';
  } else if (paymentTiming === 'varies') {
    invoicingNode.description = 'Billing rules vary by job type — set up per category. Closeout docs sent on payment.';
  }
  nodes.push(invoicingNode);
  edges.push({ from: 'complete', to: 'invoicing' });

  // ── Zuper Connect (parallel) ──
  if (usesConnect) {
    nodes.push(ALL_FLOW_NODES.zuper_connect);
    edges.push({ from: 'lead_in', to: 'zuper_connect', label: 'Calls & texts' });
  }

  return { nodes, edges };
}

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
  zuper_connect: {
    id: 'zuper_connect',
    label: 'Zuper Connect',
    type: 'integration',
    description: 'Inbound calls and texts from customers are logged here and linked to jobs.',
    isOptional: true,
  },
  complete: {
    id: 'complete',
    label: 'Job Complete ✓',
    type: 'end',
    description: 'Invoice sent. Payment collected. Review requested.',
  },
};

export function computeFlowVariant(answers: Record<string, any>): FlowVariantConfig {
  const nodes: FlowNode[] = [];
  const edges: { from: string; to: string; label?: string }[] = [];

  const hasQualification = answers['has_lead_qualification'] === 'yes';
  const qualPlatform = answers['qualification_platform'];
  const doesInsurance = answers['does_insurance'] !== 'no';
  const usesConnect = answers['uses_zuper_connect'] === 'yes';
  const hasWidget = answers['wants_booking_widget'] === 'yes';

  if (hasWidget) {
    nodes.push(ALL_FLOW_NODES.website_lead);
    nodes.push(ALL_FLOW_NODES.lead_in);
    edges.push({ from: 'website_lead', to: 'lead_in' });
  } else {
    nodes.push(ALL_FLOW_NODES.lead_in);
  }

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

  if (doesInsurance) {
    nodes.push(ALL_FLOW_NODES.insurance_claim);
    edges.push({ from: 'inspection', to: 'insurance_claim', label: 'Insurance job' });
    nodes.push(ALL_FLOW_NODES.cpq);
    edges.push({ from: 'insurance_claim', to: 'cpq', label: 'Approved' });
    edges.push({ from: 'inspection', to: 'cpq', label: 'Retail job' });
  } else {
    nodes.push(ALL_FLOW_NODES.cpq);
    edges.push({ from: 'inspection', to: 'cpq' });
  }

  nodes.push(ALL_FLOW_NODES.proposal);
  edges.push({ from: 'cpq', to: 'proposal' });

  nodes.push(ALL_FLOW_NODES.production);
  edges.push({ from: 'proposal', to: 'production', label: 'Customer approved' });

  nodes.push(ALL_FLOW_NODES.complete);
  edges.push({ from: 'production', to: 'complete' });

  if (usesConnect) {
    nodes.push(ALL_FLOW_NODES.zuper_connect);
    edges.push({ from: 'lead_in', to: 'zuper_connect', label: 'Calls & texts' });
  }

  return { nodes, edges };
}

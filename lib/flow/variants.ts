import { QUESTIONS } from '../questions';

// ── Lookup: questionId → (optionValue → label) ─────────────────────────────
const OPTION_LABELS: Record<string, Record<string, string>> = (() => {
  const out: Record<string, Record<string, string>> = {};
  for (const q of QUESTIONS) {
    if (q.options) {
      out[q.id] = {};
      for (const o of q.options) out[q.id][o.value] = o.label;
    }
  }
  return out;
})();

function labelFor(questionId: string, value: string): string {
  return OPTION_LABELS[questionId]?.[value] ?? value;
}

export interface FlowNode {
  id: string;
  label: string;
  type: 'start' | 'job' | 'external' | 'action' | 'integration' | 'end';
  description: string;
  isOptional?: boolean;
  isExternal?: boolean;
  position: { x: number; y: number };
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface FlowVariantConfig {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

// ── Layout constants ───────────────────────────────────────────────────────
const SPINE_X = 360;
const ROW_H = 140;
const SIDE_OFFSET = 240;

const Y_SOURCES           = 0;
const Y_LEAD_OR_CUSTOMER  = Y_SOURCES + ROW_H;
const Y_WEBSITE           = Y_LEAD_OR_CUSTOMER;        // parallel
const Y_ZUPER_CONNECT     = Y_LEAD_OR_CUSTOMER;        // parallel (other side)
const Y_QUALIFICATION     = Y_LEAD_OR_CUSTOMER + ROW_H;
const Y_INSPECTION        = Y_QUALIFICATION + ROW_H;
const Y_INSURANCE         = Y_INSPECTION + ROW_H / 2;  // mid-row
const Y_MEASUREMENT       = Y_INSPECTION;              // same row, off to the side
const Y_CPQ               = Y_INSPECTION + ROW_H;
const Y_PROPOSAL          = Y_CPQ + ROW_H;
const Y_MATERIAL_ORDERING = Y_PROPOSAL + ROW_H;
const Y_SUPPLIERS         = Y_MATERIAL_ORDERING;       // same row, off to the side
const Y_PRODUCTION        = Y_MATERIAL_ORDERING + ROW_H;
const Y_INVOICING         = Y_PRODUCTION + ROW_H;

// ── Variant computation ────────────────────────────────────────────────────
export function computeFlowVariant(answers: Record<string, any>): FlowVariantConfig {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  const hasQualification = answers['has_lead_qualification'] === 'yes';
  const qualPlatform     = answers['qualification_platform'];
  const jobTypes: string[] = Array.isArray(answers['job_types']) ? answers['job_types'] : [];
  const doesInsurance    = jobTypes.includes('insurance_storm');
  const hasRetail        = jobTypes.some((t) => t !== 'insurance_storm');
  const usesConnect      = answers['uses_zuper_connect'] === 'yes';
  const hasWidget        = answers['wants_booking_widget'] === 'yes';

  const paymentTiming: string[] = Array.isArray(answers['payment_timing'])
    ? answers['payment_timing']
    : (answers['payment_timing'] ? [answers['payment_timing']] : []);

  const leadSources: string[] = Array.isArray(answers['lead_sources'])
    ? answers['lead_sources'].filter((s: string) => s !== 'other')
    : [];

  const measurementProviders: string[] = Array.isArray(answers['measurement_providers'])
    ? answers['measurement_providers'].filter((s: string) => s !== 'other' && s !== 'manual')
    : [];

  const suppliers: string[] = Array.isArray(answers['suppliers'])
    ? answers['suppliers'].filter((s: string) => s !== 'other')
    : [];

  // ── Lead source nodes (fan into Lead/Customer Created) ───────────────────
  const sourcesToRender = leadSources.length > 0 ? leadSources : [];
  if (sourcesToRender.length > 0) {
    const count = sourcesToRender.length;
    const stride = 180;
    const startX = SPINE_X - ((count - 1) * stride) / 2;
    sourcesToRender.forEach((src, i) => {
      const id = `source_${src}`;
      const lbl = labelFor('lead_sources', src);
      nodes.push({
        id,
        label: lbl,
        type: 'integration',
        description: `Inbound lead from ${lbl}.`,
        position: { x: startX + i * stride, y: Y_SOURCES },
      });
      edges.push({ from: id, to: 'lead_or_customer' });
    });
  }

  // ── Lead or Customer Created (label depends on whether LQ exists) ────────
  nodes.push({
    id: 'lead_or_customer',
    label: hasQualification ? 'Lead created' : 'Customer created',
    type: 'start',
    description: hasQualification
      ? 'A new lead lands in Zuper and gets routed to qualification.'
      : 'A customer record + inspection job is created in Zuper directly.',
    position: { x: SPINE_X, y: Y_LEAD_OR_CUSTOMER },
  });

  // ── Website booking widget (right of spine, parallel entry) ──────────────
  if (hasWidget) {
    nodes.push({
      id: 'website_lead',
      label: 'Website booking',
      type: 'integration',
      description: 'Homeowner submits the booking form on your website.',
      position: { x: SPINE_X + SIDE_OFFSET, y: Y_WEBSITE },
    });
    edges.push({ from: 'website_lead', to: 'lead_or_customer', label: 'Form submit' });
  }

  // ── Zuper Connect (left of spine, parallel) ──────────────────────────────
  if (usesConnect) {
    nodes.push({
      id: 'zuper_connect',
      label: 'Zuper Connect',
      type: 'integration',
      description: 'Inbound calls and texts are logged here and linked to jobs.',
      isOptional: true,
      position: { x: SPINE_X - SIDE_OFFSET, y: Y_ZUPER_CONNECT },
    });
    edges.push({ from: 'lead_or_customer', to: 'zuper_connect', label: 'Calls & texts' });
  }

  // ── Qualification path ───────────────────────────────────────────────────
  if (hasQualification && qualPlatform === 'hubspot') {
    nodes.push({
      id: 'hubspot_lead',
      label: 'HubSpot CRM',
      type: 'external',
      isExternal: true,
      description: 'Lead is managed in HubSpot. When qualified, it syncs to Zuper.',
      position: { x: SPINE_X, y: Y_QUALIFICATION },
    });
    edges.push({ from: 'lead_or_customer', to: 'hubspot_lead' });
    edges.push({ from: 'hubspot_lead', to: 'inspection', label: 'Qualified in HubSpot' });
  } else if (hasQualification) {
    nodes.push({
      id: 'lead_qualification',
      label: 'Lead Qualification job',
      type: 'job',
      description: 'A Zuper job for your sales rep — call the lead, confirm interest, mark qualified.',
      position: { x: SPINE_X, y: Y_QUALIFICATION },
    });
    edges.push({ from: 'lead_or_customer', to: 'lead_qualification' });
    edges.push({ from: 'lead_qualification', to: 'inspection', label: 'Qualified' });
  } else {
    edges.push({ from: 'lead_or_customer', to: 'inspection' });
  }

  // ── Inspection ───────────────────────────────────────────────────────────
  nodes.push({
    id: 'inspection',
    label: 'Inspection job',
    type: 'job',
    description: 'Field tech visits the property, measures the roof, captures photos.',
    position: { x: SPINE_X, y: Y_INSPECTION },
  });

  // ── Measurement provider nodes (feed measurements into CPQ) ──────────────
  if (measurementProviders.length > 0) {
    const stride = 170;
    measurementProviders.forEach((p, i) => {
      const id = `provider_${p}`;
      const lbl = labelFor('measurement_providers', p);
      nodes.push({
        id,
        label: lbl,
        type: 'external',
        isExternal: true,
        description: `Roof measurements pulled from ${lbl} into the job for CPQ.`,
        position: { x: SPINE_X + SIDE_OFFSET + i * stride, y: Y_MEASUREMENT },
      });
      edges.push({ from: id, to: 'cpq', label: 'Measurements' });
    });
  }

  // ── Insurance branch ─────────────────────────────────────────────────────
  if (doesInsurance) {
    nodes.push({
      id: 'insurance_claim',
      label: 'Insurance claim',
      type: 'action',
      isOptional: true,
      description: 'Adjuster visit scheduled. Supplement process tracked. Approval logged before production.',
      position: { x: SPINE_X - SIDE_OFFSET, y: Y_INSURANCE },
    });
    edges.push({ from: 'inspection', to: 'insurance_claim', label: 'Insurance job' });
    edges.push({ from: 'insurance_claim', to: 'cpq', label: 'Approved' });
    if (hasRetail) edges.push({ from: 'inspection', to: 'cpq', label: 'Retail' });
  } else {
    edges.push({ from: 'inspection', to: 'cpq' });
  }

  // ── CPQ ──────────────────────────────────────────────────────────────────
  nodes.push({
    id: 'cpq',
    label: 'CPQ / Estimating',
    type: 'action',
    description: 'Measurements feed into Zuper CPQ. Good / Better / Best proposals built per brand.',
    position: { x: SPINE_X, y: Y_CPQ },
  });

  // ── Proposal ─────────────────────────────────────────────────────────────
  nodes.push({
    id: 'proposal',
    label: 'Proposal sent',
    type: 'action',
    description: 'Customer receives their proposal. Approval captured digitally.',
    position: { x: SPINE_X, y: Y_PROPOSAL },
  });
  edges.push({ from: 'cpq', to: 'proposal' });

  // ── Material ordering (pre-production milestone) ─────────────────────────
  nodes.push({
    id: 'material_ordering',
    label: 'Material ordering',
    type: 'action',
    description: 'Pre-production: materials list reviewed, POs raised to suppliers, delivery scheduled.',
    position: { x: SPINE_X, y: Y_MATERIAL_ORDERING },
  });
  edges.push({ from: 'proposal', to: 'material_ordering', label: 'Customer approved' });

  // ── Suppliers (POs go OUT to them) ───────────────────────────────────────
  if (suppliers.length > 0) {
    const stride = 170;
    suppliers.forEach((s, i) => {
      const id = `supplier_${s}`;
      const lbl = labelFor('suppliers', s);
      nodes.push({
        id,
        label: lbl,
        type: 'external',
        isExternal: true,
        description: `Purchase order sent to ${lbl}.`,
        position: { x: SPINE_X + SIDE_OFFSET + i * stride, y: Y_SUPPLIERS },
      });
      edges.push({ from: 'material_ordering', to: id, label: 'PO' });
    });
  }

  // ── Production ───────────────────────────────────────────────────────────
  nodes.push({
    id: 'production',
    label: 'Production',
    type: 'job',
    description: 'Tear off, install, cleanup — each with its own checklist and photos.',
    position: { x: SPINE_X, y: Y_PRODUCTION },
  });
  edges.push({ from: 'material_ordering', to: 'production' });

  // ── Invoicing & Closeout (terminal) ──────────────────────────────────────
  let invoicingDesc = 'Invoice issued, payment collected, closeout docs sent (warranty, photos, review request).';
  if (paymentTiming.length === 1) {
    const t = paymentTiming[0];
    if (t === 'day_of_install') invoicingDesc = 'Payment collected on install day. Invoice marked paid immediately. Closeout docs follow.';
    else if (t === 'few_days_after') invoicingDesc = 'Invoice issued on completion, payment collected within a few days.';
    else if (t === 'invoice_after') invoicingDesc = 'Invoice sent after the job is done — customer pays on receipt.';
    else if (t === 'varies') invoicingDesc = 'Billing rules vary by job type — configured per category.';
  } else if (paymentTiming.length > 1) {
    const lbls = paymentTiming.map((t) => labelFor('payment_timing', t)).join(' · ');
    invoicingDesc = `Multiple billing rules: ${lbls}.`;
  }
  nodes.push({
    id: 'invoicing',
    label: 'Invoicing & Closeout',
    type: 'end',
    description: invoicingDesc,
    position: { x: SPINE_X, y: Y_INVOICING },
  });
  edges.push({ from: 'production', to: 'invoicing' });

  return { nodes, edges };
}

export interface ZuperCategory {
  uid: string;
  name: string;
  color: string;
  statuses: ZuperStatus[];
  businessUnits: string[];
}

export interface ZuperStatus {
  uid: string;
  name: string;
  type: string;
  color: string;
  requireSignature: boolean;
  trackTime: boolean;
  enabledForField: boolean | null;
  enabledForManager: boolean | null;
}

export interface ZuperChecklistItem {
  uid: string;
  label: string;
  type: string;
  description: string;
  options: string[];
  isRequired: boolean;
  displayOrder: number;
}

export interface ZuperChecklist {
  categoryUid: string;
  categoryName: string;
  items: ZuperChecklistItem[];
}

export interface ZuperNotification {
  uid: string;
  name: string;
  type: string;
  categoryName: string;
  statusName: string;
  statusType: string;
  emailSubject: string;
  message: string;   // email body or SMS message content
  isActive: boolean;
}

export interface ZuperWorkflowSummary {
  uid: string;
  name: string;
  description: string;
  trigger: string;
  isActive: boolean;
  nodeCount: number;
  plainEnglish?: {
    headline: string;
    description: string;
    saves: string[];
  };
}

export interface ZuperSnapshot {
  categories: ZuperCategory[];
  checklists: ZuperChecklist[];
  notifications: ZuperNotification[];
  workflows: ZuperWorkflowSummary[];
}

export function transformCategories(raw: any): ZuperCategory[] {
  const data: any[] = raw?.data || [];
  return data
    .filter((c) => !c.is_deleted)
    .map((c) => ({
      uid: c.category_uid,
      name: c.category_name,
      color: c.category_color || '#cccccc',
      businessUnits: (c.business_unit || []).map((bu: any) => bu.bu_name),
      statuses: (c.job_statuses || []).map((s: any): ZuperStatus => ({
        uid: s.status_uid,
        name: s.status_name?.trim(),
        type: s.status_type || 'OTHER',
        color: s.status_color || '#cccccc',
        requireSignature: s.require_customer_signature ?? false,
        trackTime: s.track_time_in_status ?? false,
        enabledForField: s.enabled_for_field_executive ?? null,
        enabledForManager: s.enabled_for_manager ?? null,
      })),
    }));
}

export function transformChecklist(
  raw: any,
  categoryUid: string,
  categoryName: string
): ZuperChecklist {
  const items: any[] = raw?.data || [];
  return {
    categoryUid,
    categoryName,
    items: items
      .filter((i) => !i.is_deleted)
      .sort((a, b) => a.display_order - b.display_order)
      .map((i): ZuperChecklistItem => ({
        uid: i.checklist_uid,
        label: i.field_name,
        type: i.field_type,
        description: i.field_description || '',
        options: i.field_options || [],
        isRequired: i.is_required ?? false,
        displayOrder: i.display_order,
      })),
  };
}

export function transformNotifications(raw: any): ZuperNotification[] {
  const data: any[] = raw?.data || [];
  return data
    .filter((n) => !n.is_deleted)
    .map((n): ZuperNotification => ({
      uid: n.customer_notification_uid,
      name: n.notification_name,
      type: n.notification_type,
      categoryName: n.job_category?.category_name || 'General',
      statusName: n.job_status?.status_name || '',
      statusType: n.job_status?.status_type || '',
      emailSubject: n.email_subject || '',
      // Use type-specific body field (confirmed from API: email_body / sms_body)
      message: n.notification_type === 'SMS' ? (n.sms_body || '') : (n.email_body || ''),
      isActive: n.is_active ?? true,
    }));
}

export function transformWorkflows(raw: any): ZuperWorkflowSummary[] {
  const data: any[] = raw?.data || [];
  return data
    .filter((w) => !w.is_deleted)
    .map((w): ZuperWorkflowSummary => ({
      uid: w.workflow_uid,
      name: w.workflow_name,
      description: w.workflow_description || '',
      trigger: w.meta_data?.initial_nodes?.[0]?.data?.action_name || 'Unknown trigger',
      isActive: w.is_active ?? true,
      nodeCount: w.meta_data?.total_nodes || 0,
      plainEnglish: undefined,
    }));
}

export const FIELD_TYPE_LABELS: Record<string, string> = {
  RADIO: 'Yes / No choice',
  SINGLE_ITEM: 'Dropdown selection',
  TEXT: 'Text input',
  PHOTO: 'Photo capture',
  SIGNATURE: 'Customer signature',
  NUMBER: 'Number input',
  DATE: 'Date picker',
  CHECKBOX: 'Checkbox',
  MULTI_SELECT: 'Multiple choice',
};

export const STATUS_TYPE_LABELS: Record<string, string> = {
  NEW: 'Starting status',
  STARTED: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  OTHER: 'Custom step',
  ON_MY_WAY: 'On the way',
};

import {
  transformCategories,
  transformChecklist,
  transformNotifications,
  transformWorkflows,
  ZuperSnapshot,
} from './transformer';

export async function fetchZuperSnapshot(
  apiKey: string,
  dcRegion: string
): Promise<ZuperSnapshot> {
  const base = `https://${dcRegion}.zuperpro.com/api`;
  const wfBase = `https://${dcRegion}-workflow.zuperpro.com/api`;
  const headers = { 'x-api-key': apiKey };

  const [categoriesRes, notificationsRes, workflowsRes] = await Promise.allSettled([
    fetch(`${base}/jobs/category?populate_statuses=true`, { headers }).then((r) => r.json()),
    fetch(`${base}/customer_notification?count=100&page=1`, { headers }).then((r) => r.json()),
    fetch(`${wfBase}/workflows?sort=DESC&sort_by=created_at&limit=50&page=1`, { headers }).then((r) => r.json()),
  ]);

  const rawCategories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : { data: [] };
  const rawNotifications = notificationsRes.status === 'fulfilled' ? notificationsRes.value : { data: [] };
  const rawWorkflows = workflowsRes.status === 'fulfilled' ? workflowsRes.value : { data: [] };

  const categories = transformCategories(rawCategories);
  const notifications = transformNotifications(rawNotifications);
  const workflows = transformWorkflows(rawWorkflows);

  const checklistPromises = categories
    .filter((cat) => cat.statuses.length > 0)
    .map((cat) =>
      fetch(
        `${base}/settings/checklist?category_uid=${cat.uid}&job_status_uid=${cat.statuses[0].uid}`,
        { headers }
      )
        .then((r) => r.json())
        .then((raw) => transformChecklist(raw, cat.uid, cat.name))
        .catch(() => ({ categoryUid: cat.uid, categoryName: cat.name, items: [] }))
    );

  const checklists = await Promise.all(checklistPromises);

  return { categories, checklists, notifications, workflows };
}

export async function fetchWorkflowDetail(
  apiKey: string,
  dcRegion: string,
  workflowUid: string
): Promise<object> {
  const url = `https://${dcRegion}-workflow.zuperpro.com/api/workflows/${workflowUid}`;
  const res = await fetch(url, { headers: { 'x-api-key': apiKey } });
  const json = await res.json();
  return json?.data || json;
}

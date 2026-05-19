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

  // Fetch checklists for ALL statuses per category, merge and deduplicate items.
  // Using only statuses[0] missed checklists attached to other statuses.
  const checklistPromises = categories.map(async (cat) => {
    if (cat.statuses.length === 0) {
      return { categoryUid: cat.uid, categoryName: cat.name, items: [] };
    }
    const results = await Promise.allSettled(
      cat.statuses.map((s) =>
        fetch(
          `${base}/settings/checklist?category_uid=${cat.uid}&job_status_uid=${s.uid}`,
          { headers }
        )
          .then((r) => r.json())
          .then((raw) => transformChecklist(raw, cat.uid, cat.name))
          .catch(() => ({ categoryUid: cat.uid, categoryName: cat.name, items: [] as any[] }))
      )
    );
    const allItems = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .flatMap((r) => r.value.items);
    // Deduplicate by uid, keep display_order sort
    const seen = new Set<string>();
    const uniqueItems = allItems
      .filter((i) => { if (seen.has(i.uid)) return false; seen.add(i.uid); return true; })
      .sort((a, b) => a.displayOrder - b.displayOrder);
    return { categoryUid: cat.uid, categoryName: cat.name, items: uniqueItems };
  });

  const checklists = await Promise.all(checklistPromises);

  return { categories, checklists, notifications, workflows };
}

export type ConfigLevel = 'renameable' | 'sa_managed' | 'fixed';

export interface ModuleConfig {
  module: string;
  label: string;
  emoji: string;
  configLevel: ConfigLevel;
  configNote: string;
  changeRequestPrompt: string;
  changeRequestPlaceholder: string;
}

export const CONFIG_MATRIX: ModuleConfig[] = [
  {
    module: 'categories',
    label: 'Job Categories',
    emoji: '📂',
    configLevel: 'renameable',
    configNote: 'You can rename these to match how your team talks about job types.',
    changeRequestPrompt: 'Want to rename any categories or add new ones?',
    changeRequestPlaceholder: 'E.g. "Rename Lead Qualification to Canvassing" or "Add a category for Commercial jobs"',
  },
  {
    module: 'statuses',
    label: 'Job Statuses',
    emoji: '🚦',
    configLevel: 'renameable',
    configNote: "Status names can be personalised. The flow between them is configured by your SA.",
    changeRequestPrompt: "Want to rename any statuses to match your team's language?",
    changeRequestPlaceholder: 'E.g. "Rename In Progress to Crew on Site" or "Rename Complete to Invoiced"',
  },
  {
    module: 'checklists',
    label: 'Checklists',
    emoji: '✅',
    configLevel: 'renameable',
    configNote: 'Checklist names and items can be updated to match your inspection and production process.',
    changeRequestPrompt: 'Want to update any checklist names or items?',
    changeRequestPlaceholder: 'E.g. "Add a photo requirement to every checklist item" or "Rename the inspection checklist to Site Assessment"',
  },
  {
    module: 'notifications',
    label: 'Notifications',
    emoji: '🔔',
    configLevel: 'sa_managed',
    configNote: 'Notification triggers are configured by your SA. You can request changes to message content or who gets notified.',
    changeRequestPrompt: 'Any changes to who gets notified and when?',
    changeRequestPlaceholder: 'E.g. "Notify the homeowner by SMS when the crew is on the way" or "CC our office manager on all job completion emails"',
  },
  {
    module: 'workflows',
    label: 'Automations',
    emoji: '⚡',
    configLevel: 'sa_managed',
    configNote: 'Automations are set up by your SA and run in the background. You can request adjustments.',
    changeRequestPrompt: "Any automations you'd like adjusted or added?",
    changeRequestPlaceholder: 'E.g. "Automatically assign new leads to our sales rep John" or "Send a reminder SMS if a job hasn\'t been scheduled within 48 hours"',
  },
  {
    module: 'cpq',
    label: 'Proposals (CPQ)',
    emoji: '💰',
    configLevel: 'sa_managed',
    configNote: 'Your Good / Better / Best proposal structure will be built per brand you selected. Your SA handles this setup.',
    changeRequestPrompt: 'Anything specific about how you want your proposals structured?',
    changeRequestPlaceholder: 'E.g. "Our Good tier should always include 10-year labor warranty" or "We always upsell ice & water shield in the Better tier"',
  },
];

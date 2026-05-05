export const WORKFLOW_EXPLANATION_PROMPT = `
You are explaining a Zuper field service automation to a roofing business owner.
They are NOT technical. They know roofing — not software.

Here is a Zuper workflow configuration in JSON format:
{WORKFLOW_JSON}

Your job:
1. Write a SHORT headline (max 10 words) describing what this automation does in plain English.
   Example: "Reschedules follow-up calls when a lead doesn't pick up"
2. Write 2-3 sentences explaining: WHEN does this run, WHAT does it do, and WHY it helps their business.
   Use roofing business language. No technical terms. No JSON. No mention of APIs, nodes, or code.
3. List up to 3 bullet points of what this automation saves them from doing manually.

Format your response as JSON only:
{
  "headline": "...",
  "description": "...",
  "saves": ["...", "...", "..."]
}
`;

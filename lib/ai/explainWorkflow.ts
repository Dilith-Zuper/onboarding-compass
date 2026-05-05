import Anthropic from '@anthropic-ai/sdk';
import { WORKFLOW_EXPLANATION_PROMPT } from './prompts';

const client = new Anthropic();

export async function explainWorkflow(workflowJson: object): Promise<{
  headline: string;
  description: string;
  saves: string[];
}> {
  const prompt = WORKFLOW_EXPLANATION_PROMPT.replace(
    '{WORKFLOW_JSON}',
    JSON.stringify(workflowJson, null, 2)
  );

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const clean = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    return {
      headline: (workflowJson as any)['workflow_name'] || 'Automation',
      description: 'This automation helps manage your workflow automatically.',
      saves: [],
    };
  }
}

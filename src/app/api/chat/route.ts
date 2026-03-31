import { createAgentUIStreamResponse, ToolLoopAgent } from 'ai';
import { philosopherAgent } from '@/agents/philosopher';
import { createJournalAgent } from '@/agents/journal';
import { orchestratorAgent } from '@/agents/orchestrator';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, agentId } = body;

    let selectedAgent: ToolLoopAgent<any, any>;

    switch (agentId) {
      case 'journal':
        selectedAgent = createJournalAgent();
        break;
      case 'orchestrator':
        selectedAgent = orchestratorAgent;
        break;
      case 'philosopher':
      default:
        // Default to philosopher if unknown or empty
        selectedAgent = philosopherAgent;
        break;
    }

    return createAgentUIStreamResponse({
      agent: selectedAgent,
      uiMessages: messages,
    });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

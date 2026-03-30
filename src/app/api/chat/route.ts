import { anthropic } from '@ai-sdk/anthropic';
import { ToolLoopAgent, tool, jsonSchema, createAgentUIStreamResponse } from 'ai';
import { searchNotes, readNote, getSmartConnections } from '@/lib/obsidian';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const architectAgent = new ToolLoopAgent({
      model: anthropic('claude-sonnet-4-6'),
      instructions: `You are the Knowledge Architect for the user's Obsidian Vault. 
Your goal is to help them navigate their thoughts and synthesize their daily journals.

AGENT WORKFLOW:
1. SEARCH: If the user asks about a topic, search the vault first.
2. CONNECT: Use 'getNearbyNotes' to find semantically related concepts for any note you are viewing.
3. SELECT: Pick the 2-3 most relevant notes.
4. READ: Use the 'readNote' tool to see content.
5. SYNTHESIZE: Provide a final, detailed summary.

CRITICAL RULES:
- BE DIRECT. Skip preambles.
- ALWAYS provide a final text summary after tool calls.
- Use 'getNearbyNotes' to discover non-obvious connections between their thoughts.`,
      tools: {
        searchNotes: tool({
          description: 'Search for notes in the Obsidian vault.',
          inputSchema: jsonSchema({
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query.' },
            },
            required: ['query'],
          }),
          execute: async ({ query }) => {
            console.log(`[Agent] Searching for: "${query}"`);
            return await searchNotes(query as string);
          },
        }),
        readNote: tool({
          description: 'Read the full content of a specific note.',
          inputSchema: jsonSchema({
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Relative path to the note.' },
            },
            required: ['path'],
          }),
          execute: async ({ path }) => {
            console.log(`[Agent] Reading: "${path}"`);
            return await readNote(path as string);
          },
        }),
        getNearbyNotes: tool({
          description: 'Find semantically related notes based on the Smart Connections plugin data.',
          inputSchema: jsonSchema({
            type: 'object',
            properties: {
              path: { type: 'string', description: 'The path of the note to find connections for.' },
            },
            required: ['path'],
          }),
          execute: async ({ path }) => {
            console.log(`[Agent] Finding connections for: "${path}"`);
            return await getSmartConnections(path as string);
          },
        }),
      },
    });

    return createAgentUIStreamResponse({
      agent: architectAgent,
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

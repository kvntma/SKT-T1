// @ts-nocheck
import { tool, jsonSchema } from 'ai';
import { 
  searchNotes, 
  readNote, 
  writeNote,
  appendToNote,
  updateFrontmatter,
  patchNote,
  batchAutoLink,
  getSmartConnections,
  listFiles,
  listAllNoteTitles
} from '@/lib/obsidian';
import { scheduleCalendarEvent } from '@/lib/calendar';
import path from 'path';
import { promises as fs } from 'fs';

const CONTEXT_PATH = path.join(process.cwd(), 'docs/active-context.json');

// --- Shared Tools ---

export const readNoteTool = tool({
  description: 'Read the full content of a specific note.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: { path: { type: 'string', description: 'Relative path to the note.' } },
    required: ['path'],
  }),
  execute: async ({ path }) => {
    console.log(`[Tool] Reading: "${path}"`);
    return await readNote(path as string);
  },
});

export const searchNotesTool = tool({
  description: 'Search for notes in the Obsidian vault.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: { query: { type: 'string', description: 'Search query.' } },
    required: ['query'],
  }),
  execute: async ({ query }) => {
    console.log(`[Tool] Searching for: "${query}"`);
    return await searchNotes(query as string);
  },
});

export const writeNoteTool = tool({
  description: 'Create a new note or completely overwrite an existing one.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: { 
      targetPath: { type: 'string' },
      content: { type: 'string' }
    },
    required: ['targetPath', 'content'],
  }),
  execute: async ({ targetPath, content }) => {
    console.log(`[Tool] Writing to: "${targetPath}"`);
    await writeNote(targetPath as string, content as string);
    return `Successfully wrote to ${targetPath}`;
  },
});

export const appendNoteTool = tool({
  description: 'Add content to the bottom of a note.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: { 
      targetPath: { type: 'string' },
      content: { type: 'string' }
    },
    required: ['targetPath', 'content'],
  }),
  execute: async ({ targetPath, content }) => {
    console.log(`[Tool] Appending to: "${targetPath}"`);
    await appendToNote(targetPath as string, content as string);
    return `Successfully appended to ${targetPath}`;
  },
});

// --- Philosopher Specific Tools ---

export const getNearbyNotesTool = tool({
  description: 'Find semantically related notes.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: { targetPath: { type: 'string' } },
    required: ['targetPath'],
  }),
  execute: async ({ targetPath }) => {
    console.log(`[Tool] Finding connections for: "${targetPath}"`);
    return await getSmartConnections(targetPath as string);
  },
});

export const createBacklinksTool = tool({
  description: 'Scans a note and adds [[wikilinks]] to recognized concepts.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: { targetPath: { type: 'string' } },
    required: ['targetPath'],
  }),
  execute: async ({ targetPath }) => {
    console.log(`[Tool] Creating backlinks in: "${targetPath}"`);
    const result = await batchAutoLink(targetPath as string);
    return `Backlinking complete. Modified ${result.modified} files, added ${result.linksAdded} links.`;
  },
});

export const discoverGhostLinksTool = tool({
  description: 'Identify potential new notes. ONLY use this if the user explicitly asks for a vault audit.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: {},
    required: [],
  }),
  execute: async () => {
    const journals = await listFiles('Zettelkasten/Journal');
    const permanent = await listAllNoteTitles();
    const lastJournals = journals.slice(-5);
    const wordFreq: Record<string, number> = {};
    for (const j of lastJournals) {
      const content = await readNote(path.join('Zettelkasten/Journal', j));
      if (!content) continue;
      const words = content.match(/\b[A-Z][a-z]{3,}\b|\b(?:dopamine|adhd|neuro|react|typescript|focus)\b/gi);
      if (words) {
        words.forEach((w: string) => {
          const normalized = w.toLowerCase();
          if (!permanent.some(p => p.toLowerCase() === normalized)) {
            wordFreq[normalized] = (wordFreq[normalized] || 0) + 1;
          }
        });
      }
    }
    return Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word, count]) => ({ concept: word, occurrences: count }));
  },
});

// --- Journal Specific Tools ---

export const updateMetadataTool = tool({
  description: 'Update a specific YAML frontmatter key in a note.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: {
      targetPath: { type: 'string' },
      key: { type: 'string' },
      value: { type: 'string' },
    },
    required: ['targetPath', 'key', 'value'],
  }),
  execute: async ({ targetPath, key, value }) => {
    console.log(`[Tool] Updating metadata in: "${targetPath}" - ${key}: ${value}`);
    await updateFrontmatter(targetPath as string, key as string, value as string);
    return `Successfully updated metadata ${key} in ${targetPath}`;
  },
});

export const patchJournalTool = tool({
  description: 'Surgically replace a placeholder or specific text in a note.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: {
      targetPath: { type: 'string' },
      search: { type: 'string' },
      replacement: { type: 'string' },
    },
    required: ['targetPath', 'search', 'replacement'],
  }),
  execute: async ({ targetPath, search, replacement }) => {
    console.log(`[Tool] Patching: "${targetPath}"`);
    const success = await patchNote(targetPath as string, search as string, replacement as string);
    return success ? `Successfully patched ${targetPath}` : `Failed to find exact match for "${search}" in ${targetPath}`;
  },
});

// --- Orchestrator Specific Tools ---

export const scheduleTaskTool = tool({
  description: 'Schedule a fixed time block in Google Calendar.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: {
      title: { type: 'string' },
      startTime: { type: 'string' },
      endTime: { type: 'string' },
      description: { type: 'string' },
    },
    required: ['title', 'startTime', 'endTime'],
  }),
  execute: async ({ title, startTime, endTime, description }) => {
    console.log(`[Tool] Scheduling event: "${title}"`);
    try {
      const result = await scheduleCalendarEvent(title as string, new Date(startTime as string), new Date(endTime as string), (description as string) || '');
      return `Scheduled "${title}". Event link: ${result.htmlLink}`;
    } catch (error: any) {
      return `Failed to schedule. Error: ${error.message}`;
    }
  },
});

// --- Context Tools ---

export const readGlobalContextTool = tool({
  description: 'Read the shared global context file.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: {},
    required: []
  }),
  execute: async () => {
    try {
      const data = await fs.readFile(CONTEXT_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (e: any) {
      if (e.code === 'ENOENT') return { bigIdeas: [], tacticalAdjustments: [], cognitiveLoad: "Normal" };
      throw e;
    }
  }
});

export const writeGlobalContextTool = tool({
  description: 'Write/update the shared global context file.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: {
      bigIdeas: { type: 'array', items: { type: 'string' } },
      tacticalAdjustments: { type: 'array', items: { type: 'string' } },
      cognitiveLoad: { type: 'string', enum: ['Low', 'Normal', 'High'] }
    },
    required: ['bigIdeas', 'tacticalAdjustments', 'cognitiveLoad']
  }),
  execute: async ({ bigIdeas, tacticalAdjustments, cognitiveLoad }) => {
    const data = JSON.stringify({ bigIdeas, tacticalAdjustments, cognitiveLoad }, null, 2);
    await fs.mkdir(path.dirname(CONTEXT_PATH), { recursive: true });
    await fs.writeFile(CONTEXT_PATH, data, 'utf-8');
    return 'Context updated successfully';
  }
});

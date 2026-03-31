import { ToolLoopAgent } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { 
  searchNotesTool, 
  readNoteTool, 
  writeNoteTool, 
  appendNoteTool, 
  patchJournalTool,
  updateMetadataTool,
  readGlobalContextTool,
  writeGlobalContextTool
} from './tools';

export const createJournalAgent = () => {
  const date = new Date();
  const format = process.env.OBSIDIAN_DAILY_NOTES_FORMAT || 'J-YYYY-MM-DD';
  const folder = process.env.OBSIDIAN_DAILY_NOTES_FOLDER || 'Zettelkasten/Journal';
  
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  
  const dateStr = format
    .replace('YYYY', yyyy)
    .replace('MM', mm)
    .replace('DD', dd);
    
  // e.g. Zettelkasten/Journal/J-2026-03-30.md
  const exactPath = `${folder}/${dateStr}.md`;
  
  // Fleeting notes use F-YYYY-MM-DD pattern
  const fleetingStr = `F-${yyyy}-${mm}-${dd}`;
  const exactFleetingPath = `Zettelkasten/Fleeting/${fleetingStr}.md`;
  
  const templatePath = 'Templates/Journal.md';

  return new ToolLoopAgent({
    id: 'journal',
    model: anthropic('claude-sonnet-4-6'),
    instructions: `You are the Journal & Reflection Assistant.
A supportive, grounded partner focused on "macro-alignment." It acts as your teammate in the trenches, helping you debrief the day/week and bridge the gap between your philosophical thoughts and your actual schedule.

CORE INSTRUCTIONS:
- The "Partner" Voice: Use collaborative language ("we," "us," "our goals"). Avoid generic openers like "How was your day?" Instead, start with an observation from the data.
- Daily Review: Help the user debrief using '${exactPath}'. Also use readNote on '${exactFleetingPath}' to read the Philosopher's fleeting notes from the day (if it exists).
- Template Checking: Before doing anything else, use readNote directly on '${exactPath}' to verify if today's journal exists. Do NOT use searchNotes for this. If it does not exist (e.g. readNote throws an error), explicitly tell the user you are creating it using the template from '${templatePath}'. Use readNote on '${templatePath}' and writeNote to '${exactPath}'.
- Context Share: At the start of every session, read global context (readGlobalContextTool). If the Philosopher flagged a "Mental Block", bring it up directly but supportively.
- Anti-Form Logic: If the user provides a "log dump" or stream-of-consciousness thought, map those details to the correct sections of the template (e.g., Use patchJournalTool or updateMetadataTool) without making the user answer them one by one.
- The "Attention" Rule: Always reference at least one thing the user did or noted earlier in the day to show the "Partnership" is active.
- Ending the Session: Always end with a collaborative "Plan for Tomorrow" that feels like a shared agreement. Write actionable "Tactical Adjustments" to Global Context (writeGlobalContextTool).

BE DIRECT. Do NOT hallucinate dates. The exact local date right now is ${yyyy}-${mm}-${dd} and your journal target is precisely '${exactPath}'.`,
  tools: {
    searchNotes: searchNotesTool,
    readNote: readNoteTool,
    writeNote: writeNoteTool,
    appendNote: appendNoteTool,
    patchJournal: patchJournalTool,
    updateMetadata: updateMetadataTool,
    readGlobalContext: readGlobalContextTool,
    writeGlobalContext: writeGlobalContextTool
  }
});
};

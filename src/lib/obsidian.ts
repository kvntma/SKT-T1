import fs from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || '';
const DAILY_NOTES_FOLDER = process.env.OBSIDIAN_DAILY_NOTES_FOLDER || 'Zettelkasten/Journal';
const DAILY_NOTES_FORMAT = process.env.OBSIDIAN_DAILY_NOTES_FORMAT || 'J-yyyy-MM-dd';

export interface ObsidianTask {
  id: string;
  text: string;
  completed: boolean;
  lineIndex: number;
  grade?: string; // e.g., "5.10b"
}

export interface DailyNote {
  date: string;
  path: string;
  content: string;
  tasks: ObsidianTask[];
  totalDifficulty?: number;
}

// Map YDS grades to numeric difficulty for "Daily Capacity" calculations
export const GRADE_POINTS: Record<string, number> = {
  '5.6': 1, '5.7': 2, '5.8': 3, '5.9': 4,
  '5.10a': 5, '5.10b': 6, '5.10c': 7, '5.10d': 8,
  '5.11a': 9, '5.11b': 10, '5.11c': 11, '5.11d': 12,
  '5.12a': 13, '5.12b': 14, '5.12c': 15, '5.12d': 16,
  '5.13a': 17, '5.13b': 18, '5.13c': 19, '5.13d': 20,
};

export async function getDailyNotePath(date: Date = new Date()): Promise<string> {
  const escapedFormat = DAILY_NOTES_FORMAT
    .replace('YYYY', 'yyyy')
    .replace('DD', 'dd')
    .replace(/^J-/, "'J'-");
  
  const fileName = format(date, escapedFormat) + '.md';
  return path.join(VAULT_PATH, DAILY_NOTES_FOLDER, fileName);
}

export async function readDailyNote(date: Date = new Date()): Promise<DailyNote | null> {
  const filePath = await getDailyNotePath(date);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const tasks = parseTasks(content);
    
    // Calculate total difficulty
    const totalDifficulty = tasks.reduce((sum, task) => {
      if (task.grade && GRADE_POINTS[task.grade]) {
        return sum + GRADE_POINTS[task.grade];
      }
      return sum;
    }, 0);

    return {
      date: format(date, 'yyyy-MM-dd'),
      path: filePath,
      content,
      tasks,
      totalDifficulty,
    };
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error(`Error reading daily note at ${filePath}:`, error);
    }
    return null;
  }
}

export async function writeDailyNote(date: Date, content: string): Promise<void> {
  const filePath = await getDailyNotePath(date);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

export function parseTasks(content: string): ObsidianTask[] {
  const lines = content.split('\n');
  const tasks: ObsidianTask[] = [];

  lines.forEach((line, index) => {
    const taskMatch = line.match(/^\s*-\s*\[([ xX])\]\s*(.*)$/);
    if (taskMatch) {
      const fullText = taskMatch[2].trim();
      
      // Extract grade if present (e.g., "#5.10b")
      const gradeMatch = fullText.match(/#(5\.\d+[a-d]?)/);
      const grade = gradeMatch ? gradeMatch[1] : undefined;
      
      // Remove grade tag from clean text for the UI
      const cleanText = gradeMatch 
        ? fullText.replace(gradeMatch[0], '').trim() 
        : fullText;

      tasks.push({
        id: `task-${index}`,
        text: cleanText,
        completed: taskMatch[1].toLowerCase() === 'x',
        lineIndex: index,
        grade,
      });
    }
  });

  return tasks;
}

export async function updateTaskStatus(date: Date, lineIndex: number, completed: boolean): Promise<void> {
  const note = await readDailyNote(date);
  if (!note) return;

  const lines = note.content.split('\n');
  if (lines[lineIndex]) {
    const mark = completed ? 'x' : ' ';
    lines[lineIndex] = lines[lineIndex].replace(/-\s*\[([ xX])\]/, `- [${mark}]`);
    await writeDailyNote(date, lines.join('\n'));
  }
}

export async function addTaskToNote(date: Date, taskText: string): Promise<void> {
  const note = await readDailyNote(date);
  const newTaskLine = `- [ ] ${taskText}`;
  
  if (!note) {
    const dateStr = format(date, 'yyyy-MM-dd');
    await writeDailyNote(date, `---\ntype: journal\n---\n\n# Daily Note ${dateStr}\n\n## Goals\n${newTaskLine}\n`);
  } else {
    await writeDailyNote(date, `${note.content}\n${newTaskLine}`);
  }
}

export async function readNote(relativePath: string): Promise<string | null> {
  const filePath = path.join(VAULT_PATH, relativePath);
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading note at ${filePath}:`, error);
    return null;
  }
}

export async function listFiles(relativeDir: string): Promise<string[]> {
  const dirPath = path.join(VAULT_PATH, relativeDir);
  try {
    const files = await fs.readdir(dirPath);
    return files.filter(f => f.endsWith('.md'));
  } catch (error) {
    console.error(`Error listing files in ${dirPath}:`, error);
    return [];
  }
}

export async function searchNotes(query: string): Promise<{ path: string; excerpt: string }[]> {
  const results: { path: string; excerpt: string }[] = [];
  
  async function walk(dir: string) {
    const files = await fs.readdir(path.join(VAULT_PATH, dir), { withFileTypes: true });
    for (const file of files) {
      const relativePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        if (file.name === '.obsidian' || file.name === 'node_modules') continue;
        await walk(relativePath);
      } else if (file.name.endsWith('.md')) {
        const content = await fs.readFile(path.join(VAULT_PATH, relativePath), 'utf-8');
        if (content.toLowerCase().includes(query.toLowerCase())) {
          // Grab a small excerpt around the first match
          const index = content.toLowerCase().indexOf(query.toLowerCase());
          const excerpt = content.substring(Math.max(0, index - 50), Math.min(content.length, index + 150))
            .replace(/\n/g, ' ') + '...';
          results.push({ path: relativePath, excerpt });
        }
      }
    }
  }

  try {
    await walk('');
    console.log(`Vault Search: Found ${results.length} matches for "${query}"`);
    return results.slice(0, 5); // Limit to top 5 results for better context management
  } catch (error) {
    console.error('Error searching notes:', error);
    return [];
  }
}

export async function listAllNoteTitles(): Promise<string[]> {
  const titles: string[] = [];
  
  async function walk(dir: string) {
    const files = await fs.readdir(path.join(VAULT_PATH, dir), { withFileTypes: true });
    for (const file of files) {
      const relativePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        if (file.name === '.obsidian' || file.name === 'node_modules' || file.name === '.git') continue;
        await walk(relativePath);
      } else if (file.name.endsWith('.md')) {
        // Just the filename without .md for linking
        titles.push(file.name.replace('.md', ''));
      }
    }
  }

  try {
    await walk('');
    return titles;
  } catch (error) {
    console.error('Error listing note titles:', error);
    return [];
  }
}

export async function getSmartConnections(relativePath: string): Promise<string[]> {
  // Convert path to the plugin's ajson format: Folder_Subfolder_Filename_md.ajson
  const fileName = relativePath.replace(/\//g, '_').replace('.md', '_md.ajson');
  const ajsonPath = path.join(VAULT_PATH, '.smart-env/multi', fileName);
  
  try {
    const data = await fs.readFile(ajsonPath, 'utf-8');
    // The format is a bit weird, it's often a key-value pair where the key is the full path
    const parsed = JSON.parse(data);
    const key = Object.keys(parsed)[0];
    const connections = parsed[key]?.nearby || [];
    
    // Return the paths of the top 5 connections
    return connections.slice(0, 5).map((c: any) => c.path);
  } catch (error) {
    console.error(`Error reading smart connections for ${relativePath}:`, error);
    return [];
  }
}

export async function batchAutoLink(relativePath: string): Promise<{ modified: number; linksAdded: number }> {
  const titles = await listAllNoteTitles();
  // Sort titles by length descending to avoid partial matches (e.g., "Dopamine" before "Dopamine Detox")
  titles.sort((a, b) => b.length - a.length);
  
  const filePath = path.join(VAULT_PATH, relativePath);
  let modifiedCount = 0;
  let linksAddedCount = 0;

  async function processFile(currentPath: string) {
    const stat = await fs.stat(currentPath);
    if (stat.isDirectory()) {
      const files = await fs.readdir(currentPath);
      for (const file of files) {
        await processFile(path.join(currentPath, file));
      }
    } else if (currentPath.endsWith('.md')) {
      let content = await fs.readFile(currentPath, 'utf-8');
      let originalContent = content;
      
      // Don't link titles to themselves
      const fileName = path.basename(currentPath, '.md');
      const otherTitles = titles.filter(t => t !== fileName && t.length > 3);

      for (const title of otherTitles) {
        // Regex to find the title as a whole word, not already inside brackets [[ ]] or part of a link
        const regex = new RegExp(`(?<!\\[\\[|\\w)${title}(?!\\w|\\]\\])`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, `[[${title}]]`);
          linksAddedCount++;
        }
      }

      if (content !== originalContent) {
        await fs.writeFile(currentPath, content, 'utf-8');
        modifiedCount++;
      }
    }
  }

  await processFile(filePath);
  return { modified: modifiedCount, linksAdded: linksAddedCount };
}

export async function generateVaultAudit(): Promise<string> {
  const auditPath = 'ADMIN/VAULT_AUDIT.md';
  let auditContent = `# Vault Audit - ${format(new Date(), 'yyyy-MM-dd HH:mm')}\n\n`;
  
  const folders = await fs.readdir(VAULT_PATH, { withFileTypes: true });
  for (const folder of folders) {
    if (folder.isDirectory() && !folder.name.startsWith('.')) {
      const files = await fs.readdir(path.join(VAULT_PATH, folder.name));
      const mdFiles = files.filter(f => f.endsWith('.md'));
      auditContent += `## ${folder.name}\n`;
      auditContent += `- **File Count**: ${mdFiles.length}\n`;
      auditContent += `- **Sample Notes**: ${mdFiles.slice(0, 3).join(', ')}\n\n`;
    }
  }

  await writeNote(auditPath, auditContent);
  return auditPath;
}

export async function writeNote(relativePath: string, content: string): Promise<void> {
  const filePath = path.join(VAULT_PATH, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function updateFrontmatter(relativePath: string, key: string, value: string | number | boolean): Promise<void> {
  const filePath = path.join(VAULT_PATH, relativePath);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const frontmatterStart = lines.indexOf('---');
    const frontmatterEnd = lines.indexOf('---', frontmatterStart + 1);

    if (frontmatterStart !== -1 && frontmatterEnd !== -1) {
      const frontmatterLines = lines.slice(frontmatterStart + 1, frontmatterEnd);
      const keyIndex = frontmatterLines.findIndex(line => line.startsWith(`${key}:`));

      if (keyIndex !== -1) {
        frontmatterLines[keyIndex] = `${key}: ${value}`;
        const newContent = [
          ...lines.slice(0, frontmatterStart + 1),
          ...frontmatterLines,
          ...lines.slice(frontmatterEnd)
        ].join('\n');
        await fs.writeFile(filePath, newContent, 'utf-8');
      } else {
        // Key doesn't exist, add it
        frontmatterLines.push(`${key}: ${value}`);
        const newContent = [
          ...lines.slice(0, frontmatterStart + 1),
          ...frontmatterLines,
          ...lines.slice(frontmatterEnd)
        ].join('\n');
        await fs.writeFile(filePath, newContent, 'utf-8');
      }
    }
  } catch (error) {
    console.error(`Error updating frontmatter at ${filePath}:`, error);
  }
}

export async function appendToNote(relativePath: string, content: string): Promise<void> {
  const filePath = path.join(VAULT_PATH, relativePath);
  try {
    const existingContent = await fs.readFile(filePath, 'utf-8');
    await fs.writeFile(filePath, `${existingContent}\n${content}`, 'utf-8');
  } catch (error) {
    // If file doesn't exist, create it
    await writeNote(relativePath, content);
  }
}

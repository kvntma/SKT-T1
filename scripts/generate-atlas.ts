import fs from 'fs/promises';
import path from 'path';

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || '/mnt/c/Users/Myles/Documents/meteoric-cloud';

async function listAllFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((res) => {
    const resPath = path.join(dir, res.name);
    return res.isDirectory() ? listAllFiles(resPath) : resPath;
  }));
  return files.flat().filter(f => f.endsWith('.md'));
}

async function generateAtlas() {
  const allFiles = await listAllFiles(VAULT_PATH);
  const tagMap: Record<string, string[]> = {};
  const connections: Record<string, string[]> = {};

  for (const filePath of allFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    const title = path.basename(filePath, '.md');
    
    // 1. Extract Tags
    const tagMatch = content.match(/tags:\s*\n((?:\s*-\s*.*\n?)*)/);
    if (tagMatch) {
      const tags = tagMatch[1].split('\n')
        .map(t => t.replace(/^\s*-\s*/, '').trim())
        .filter(t => t.length > 0);
      
      for (const tag of tags) {
        if (!tagMap[tag]) tagMap[tag] = [];
        tagMap[tag].push(title);
      }
    }

    // 2. Extract Related Links
    const relatedMatch = content.match(/related:\s*\n((?:\s*-\s*.*\n?)*)/);
    if (relatedMatch) {
      const related = relatedMatch[1].split('\n')
        .map(r => r.replace(/^\s*-\s*\[\[/, '').replace(/\]\]\s*$/, '').trim())
        .filter(r => r.length > 0);
      connections[title] = related;
    }
  }

  let atlasContent = `# Knowledge Atlas\n\n*Generated on: ${new Date().toISOString().split('T')[0]}*\n\n`;
  
  atlasContent += `## 🏷️ Thematic Clusters (Tags)\n`;
  for (const [tag, notes] of Object.entries(tagMap)) {
    atlasContent += `### #${tag}\n`;
    notes.forEach(note => atlasContent += `- [[${note}]]\n`);
    atlasContent += `\n`;
  }

  atlasContent += `## 🕸️ High-Connectivity Hubs\n`;
  const sortedHubs = Object.entries(connections)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);

  for (const [title, links] of sortedHubs) {
    atlasContent += `- [[${title}]] (${links.length} connections)\n`;
  }

  const atlasPath = path.join(VAULT_PATH, 'ADMIN/KNOWLEDGE_ATLAS.md');
  await fs.writeFile(atlasPath, atlasContent, 'utf-8');
  console.log(`Atlas generated at: ${atlasPath}`);
}

generateAtlas();

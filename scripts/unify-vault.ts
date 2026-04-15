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

async function runUnification() {
  const allFiles = await listAllFiles(VAULT_PATH);
  const noteTitles = allFiles.map(f => path.basename(f, '.md')).filter(t => t.length > 3);
  
  // Sort titles by length descending
  noteTitles.sort((a, b) => b.length - a.length);

  for (const filePath of allFiles) {
    let content = await fs.readFile(filePath, 'utf-8');
    const currentTitle = path.basename(filePath, '.md');
    const relatedLinks = new Set<string>();

    // 1. Find mentions and collect for 'related' property
    for (const title of noteTitles) {
      if (title === currentTitle) continue;
      
      // Look for title as whole word, not already linked
      const regex = new RegExp(`(?<!\\[\\[|\\w)${title}(?!\\w|\\]\\])`, 'gi');
      if (regex.test(content)) {
        relatedLinks.add(`[[${title}]]`);
      }
    }

    if (relatedLinks.size > 0) {
      console.log(`Updating ${currentTitle}: Found ${relatedLinks.size} connections.`);
      
      const lines = content.split('\n');
      const frontmatterStart = lines.indexOf('---');
      const frontmatterEnd = lines.indexOf('---', frontmatterStart + 1);

      const newRelatedLines = ['related:'];
      relatedLinks.forEach(link => newRelatedLines.push(`  - ${link}`));

      if (frontmatterStart === 0 && frontmatterEnd !== -1) {
        // Update existing frontmatter
        const frontmatter = lines.slice(frontmatterStart + 1, frontmatterEnd);
        const relatedIndex = frontmatter.findIndex(l => l.startsWith('related:'));
        
        if (relatedIndex !== -1) {
          // Find where the list ends
          let lastIndex = relatedIndex;
          while (frontmatter[lastIndex + 1]?.startsWith('  - ')) {
            lastIndex++;
          }
          frontmatter.splice(relatedIndex, lastIndex - relatedIndex + 1, ...newRelatedLines);
        } else {
          frontmatter.push(...newRelatedLines);
        }
        
        content = ['---', ...frontmatter, '---', ...lines.slice(frontmatterEnd + 1)].join('\n');
      } else {
        // Create new frontmatter
        content = ['---', ...newRelatedLines, '---', '', ...lines].join('\n');
      }

      await fs.writeFile(filePath, content, 'utf-8');
    }
  }
  console.log('Unification complete.');
}

runUnification();

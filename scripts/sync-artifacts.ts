import fs from 'fs/promises';
import path from 'path';

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || '/mnt/c/Users/Myles/Documents/meteoric-cloud';
const ARTIFACTS_DIR = path.join(VAULT_PATH, 'Zettelkasten/Artifacts');

const ARTIFACT_FILES = [
  'IMPLEMENTATION_PLAN.md',
  'README.md',
  'pushtostart.md'
];

const ARTIFACT_DIRS = [
  'docs'
];

async function syncFile(src: string, dest: string) {
  try {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    let content = await fs.readFile(src, 'utf-8');
    
    // Add specific frontmatter for Obsidian if not present
    if (!content.startsWith('---')) {
      const fileName = path.basename(src, '.md');
      const frontmatter = [
        '---',
        `title: ${fileName}`,
        `synced_from: ${src}`,
        `updated: ${new Date().toISOString()}`,
        'type: artifact',
        'tags:',
        '  - skt-t1',
        '  - artifact',
        '---',
        ''
      ].join('\n');
      content = frontmatter + content;
    }

    await fs.writeFile(dest, content, 'utf-8');
    console.log(`Synced ${src} -> ${dest}`);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, skip
      return;
    }
    console.error(`Error syncing ${src}:`, error);
  }
}

async function syncJsonToMd(src: string, dest: string) {
  try {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    const jsonData = await fs.readFile(src, 'utf-8');
    const parsed = JSON.parse(jsonData);
    
    const fileName = path.basename(src, '.json');
    const content = [
      '---',
      `title: ${fileName}`,
      `synced_from: ${src}`,
      `updated: ${new Date().toISOString()}`,
      'type: artifact',
      'format: json-as-md',
      'tags:',
      '  - skt-t1',
      '  - artifact',
      '  - data',
      '---',
      '',
      '```json',
      JSON.stringify(parsed, null, 2),
      '```'
    ].join('\n');

    await fs.writeFile(dest, content, 'utf-8');
    console.log(`Synced ${src} -> ${dest} (as Markdown)`);
  } catch (error: any) {
    if (error.code === 'ENOENT') return;
    console.error(`Error syncing JSON ${src}:`, error);
  }
}

async function runSync() {
  console.log(`Starting artifact sync to ${ARTIFACTS_DIR}...`);

  // Sync top-level files
  for (const file of ARTIFACT_FILES) {
    const src = path.join(process.cwd(), file);
    const dest = path.join(ARTIFACTS_DIR, file);
    await syncFile(src, dest);
  }

  // Sync directories
  for (const dir of ARTIFACT_DIRS) {
    const srcDir = path.join(process.cwd(), dir);
    try {
      const files = await fs.readdir(srcDir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const src = path.join(srcDir, file);
          const dest = path.join(ARTIFACTS_DIR, dir, file);
          await syncFile(src, dest);
        } else if (file.endsWith('.json')) {
          const src = path.join(srcDir, file);
          const dest = path.join(ARTIFACTS_DIR, dir, file.replace('.json', '.md'));
          await syncJsonToMd(src, dest);
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Error reading directory ${dir}:`, error);
      }
    }
  }

  console.log('Artifact sync complete.');
}

runSync();

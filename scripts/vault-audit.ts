import fs from 'fs/promises';
import path from 'path';

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || '/mnt/c/Users/Myles/Documents/meteoric-cloud';

async function generateAudit() {
  const folders = await fs.readdir(VAULT_PATH, { withFileTypes: true });
  let auditContent = `# Vault Audit - ${new Date().toISOString().split('T')[0]}\n\n`;
  
  auditContent += `## Structure Overview\n`;
  
  for (const folder of folders) {
    if (folder.isDirectory() && !folder.name.startsWith('.')) {
      const folderPath = path.join(VAULT_PATH, folder.name);
      const files = await fs.readdir(folderPath, { withFileTypes: true });
      const mdFiles = files.filter(f => f.name.endsWith('.md'));
      const subdirs = files.filter(f => f.isDirectory());

      auditContent += `### ${folder.name}\n`;
      auditContent += `- **MD Files:** ${mdFiles.length}\n`;
      auditContent += `- **Subdirectories:** ${subdirs.length}\n`;
      
      // Look for connectivity in a sample
      if (mdFiles.length > 0) {
        const sampleFile = path.join(folderPath, mdFiles[0].name);
        const content = await fs.readFile(sampleFile, 'utf-8');
        const hasRelated = content.includes('related:');
        auditContent += `- **Connectivity Check (Sample):** ${hasRelated ? '✅ Standardized' : '❌ Needs Update'}\n`;
      }
      auditContent += `\n`;
    }
  }

  const adminDir = path.join(VAULT_PATH, 'ADMIN');
  await fs.mkdir(adminDir, { recursive: true });
  const auditPath = path.join(adminDir, 'VAULT_AUDIT.md');
  await fs.writeFile(auditPath, auditContent, 'utf-8');
  console.log(`Audit generated at: ${auditPath}`);
}

generateAudit();

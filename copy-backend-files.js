import fs from 'fs';
import path from 'path';

// Copy all API files
const apiFiles = ['courses.js', 'rooms.js', 'schedules.js'];
for (const file of apiFiles) {
  const sourcePath = `./api/${file}`;
  const targetPath = `./backend/api/${file}`;
  
  if (fs.existsSync(sourcePath)) {
    let content = fs.readFileSync(sourcePath, 'utf8');
    // Update import paths
    content = content.replace(/from '\.\.\/config\/database\.js'/g, "from '../config/database.js'");
    content = content.replace(/from '\.\.\/utils\//g, "from '../utils/");
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content);
    console.log(`Copied ${file}`);
  }
}

// Copy scripts
const scriptsDir = './scripts';
const backendScriptsDir = './backend/scripts';

if (fs.existsSync(scriptsDir)) {
  fs.mkdirSync(backendScriptsDir, { recursive: true });
  
  const scripts = fs.readdirSync(scriptsDir);
  for (const script of scripts) {
    const sourcePath = path.join(scriptsDir, script);
    const targetPath = path.join(backendScriptsDir, script);
    
    let content = fs.readFileSync(sourcePath, 'utf8');
    // Update import paths
    content = content.replace(/from '\.\.\/config\/database\.js'/g, "from '../config/database.js'");
    content = content.replace(/from '\.\.\/utils\//g, "from '../utils/");
    
    fs.writeFileSync(targetPath, content);
    console.log(`Copied script: ${script}`);
  }
}

console.log('Backend files copied successfully!');
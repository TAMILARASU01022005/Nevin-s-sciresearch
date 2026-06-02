// db/replace-name.js — Script to replace "Arivan" with "Arivan" across the project
const fs = require('fs');
const path = require('path');

const targetDirectories = [
  'db',
  'public/css',
  'public/js',
  'routes',
  'views'
];

const targetFiles = [
  'server.js',
  'package.json',
  'package-lock.json',
  'CLAUDE.md'
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Perform replacements preserving case
    content = content.replace(/Arivan/g, 'Arivan');
    content = content.replace(/tamilarivujournal@gmail\.com/g, 'arivanjournal@gmail.com');
    content = content.replace(/arivan_lang/g, 'arivan_lang');
    content = content.replace(/arivan-journal/g, 'arivan-journal');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ Error updating ${filePath}:`, err.message);
  }
}

function runReplacement() {
  console.log('🔄 Starting text replacement: "Arivan" -> "Arivan"...');
  
  let filesToProcess = [...targetFiles.map(f => path.join(__dirname, '..', f))];

  targetDirectories.forEach(dir => {
    const fullDirPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(fullDirPath)) {
      filesToProcess = filesToProcess.concat(getAllFiles(fullDirPath));
    }
  });

  // Filter unique paths
  filesToProcess = [...new Set(filesToProcess)].filter(f => fs.existsSync(f));

  filesToProcess.forEach(replaceInFile);

  console.log('🎉 Replacement completed successfully!');
}

runReplacement();

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Building Inno Setup 7 Release Installer for WinClean Analyzer...');

const possibleIsccPaths = [
  'C:\\Program Files\\Inno Setup 7\\ISCC.exe',
  'C:\\Program Files (x86)\\Inno Setup 7\\ISCC.exe',
  'C:\\Program Files\\Inno Setup 6\\ISCC.exe',
  'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe'
];

let isccExe = possibleIsccPaths.find(p => fs.existsSync(p));

if (!isccExe) {
  // Try checking in PATH
  try {
    const which = spawnSync('where', ['ISCC'], { encoding: 'utf8' });
    if (which.status === 0 && which.stdout.trim()) {
      isccExe = which.stdout.trim().split('\r\n')[0];
    }
  } catch (e) {}
}

if (!isccExe) {
  console.error('❌ Error: Inno Setup compiler (ISCC.exe) was not found.');
  console.error('Please ensure Inno Setup 7 is installed at "C:\\Program Files\\Inno Setup 7".');
  process.exit(1);
}

const issPath = path.resolve(__dirname, '../installer/winclean-analyzer.iss');

console.log(`Using Inno Setup Compiler: ${isccExe}`);
console.log(`Compiling script: ${issPath}`);

const result = spawnSync(isccExe, [issPath], { stdio: 'inherit' });

if (result.status !== 0) {
  console.error(`❌ Inno Setup compilation failed with exit code ${result.status}`);
  process.exit(result.status || 1);
}

console.log('✅ Inno Setup 7 release installer created successfully in dist/ !');

// Generate portable zip from dist/win-unpacked
console.log('📦 Generating portable ZIP release...');
const distDir = path.resolve(__dirname, '../dist');
const unpackedDir = path.join(distDir, 'win-unpacked');
const zipPath = path.join(distDir, 'WinClean-Analyzer-v1.0.0-Portable.zip');

if (fs.existsSync(unpackedDir)) {
  const psZipCmd = `Compress-Archive -Path "${unpackedDir}\\*" -DestinationPath "${zipPath}" -Force`;
  const zipResult = spawnSync('powershell', ['-NoProfile', '-Command', psZipCmd], { stdio: 'inherit' });
  if (zipResult.status === 0) {
    console.log(`✅ Portable ZIP release created successfully: ${zipPath}`);
  } else {
    console.warn('⚠️ Warning: Could not create portable zip archive.');
  }
}


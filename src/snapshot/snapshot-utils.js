const fs = require('fs');
const path = require('path');

function generateTimestamp() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}${mo}${d}-${h}${mi}${s}`;
}

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function copyFile(src, dest) {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await fs.promises.copyFile(src, dest);
}

async function copyDirectory(src, dest) {
  await ensureDir(dest);
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function removeDirectory(dirPath) {
  await fs.promises.rm(dirPath, { recursive: true, force: true });
}

async function readJson(filePath) {
  const raw = await fs.promises.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

async function writeJson(filePath, obj) {
  await fs.promises.writeFile(filePath, JSON.stringify(obj, null, 2), 'utf-8');
}

async function pathExists(dirPath) {
  try {
    await fs.promises.access(dirPath);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  generateTimestamp,
  ensureDir,
  copyFile,
  copyDirectory,
  removeDirectory,
  readJson,
  writeJson,
  pathExists,
};

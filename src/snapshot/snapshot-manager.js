const path = require('path');
const { generateTimestamp, ensureDir, copyDirectory, removeDirectory, readJson, writeJson, pathExists } = require('./snapshot-utils');
const { buildMetadata } = require('./metadata-builder');
const { generateDocSite } = require('../doc-site-generator');

const TIMESTAMP_PATTERN = /^\d{8}-\d{6}$/;

class SnapshotManager {
  constructor(options) {
    options = options || {};
    this.outputRoot = path.resolve(options.outputRoot || './output');
    this.snapshotsDir = path.join(this.outputRoot, 'snapshots');
    this.latestDir = path.join(this.outputRoot, 'latest');
    this.projectName = options.projectName || 'untitled';
  }

  async createSnapshot(spec) {
    const timestamp = generateTimestamp();
    const snapshotDir = path.join(this.snapshotsDir, timestamp);

    await ensureDir(path.join(snapshotDir, 'assets'));

    generateDocSite(spec, snapshotDir);

    const metadata = buildMetadata(timestamp, spec, {
      projectName: this.projectName,
    });
    await writeJson(path.join(snapshotDir, 'metadata.json'), metadata);

    await this._updateLatest(snapshotDir);

    console.log(`\nSnapshot: ${timestamp}`);
    console.log(`  Location: ${snapshotDir}`);

    return { snapshotId: timestamp, metadata };
  }

  async _updateLatest(sourceDir) {
    const tmpDir = path.join(this.outputRoot, '.latest-tmp');
    const latestDir = this.latestDir;

    await removeDirectory(tmpDir);
    await copyDirectory(sourceDir, tmpDir);

    await removeDirectory(latestDir);

    try {
      await fsRename(tmpDir, latestDir);
    } catch (err) {
      await removeDirectory(tmpDir);
      throw new Error(`Failed to update latest directory: ${err.message}`);
    }

    console.log(`  Latest:    ${latestDir}`);
  }

  async listSnapshots() {
    await ensureDir(this.snapshotsDir);

    const entries = await readdirSafe(this.snapshotsDir);
    const dirs = entries.filter(function(e) {
      return e.isDirectory && TIMESTAMP_PATTERN.test(e.name);
    }).sort(function(a, b) {
      return b.name.localeCompare(a.name);
    });

    const result = [];
    for (const dir of dirs) {
      const metaPath = path.join(this.snapshotsDir, dir.name, 'metadata.json');
      try {
        const meta = await readJson(metaPath);
        result.push({
          id: dir.name,
          generatedAt: meta.generatedAt || '',
          totalEndpoints: meta.totalEndpoints || 0,
          totalSchemas: meta.totalSchemas || 0,
          aiEnabled: meta.aiEnabled || false,
          maturityEnabled: meta.maturityEnabled || false,
        });
      } catch (e) {
        console.warn(`  Warning: snapshot ${dir.name} is missing metadata.json`);
        result.push({
          id: dir.name,
          generatedAt: null,
          totalEndpoints: 0,
          totalSchemas: 0,
          aiEnabled: false,
          maturityEnabled: false,
        });
      }
    }

    return result;
  }

  async getLatestSnapshot() {
    const latestMeta = path.join(this.latestDir, 'metadata.json');
    if (!(await pathExists(latestMeta))) return null;

    try {
      return await readJson(latestMeta);
    } catch {
      return null;
    }
  }

  async snapshotExists(id) {
    if (!TIMESTAMP_PATTERN.test(id)) return false;
    const dir = path.join(this.snapshotsDir, id);
    return pathExists(dir);
  }

  async deleteSnapshot(id) {
    if (!TIMESTAMP_PATTERN.test(id)) {
      throw new Error(`Invalid snapshot ID format: ${id}`);
    }
    const dir = path.join(this.snapshotsDir, id);
    if (!(await pathExists(dir))) {
      throw new Error(`Snapshot not found: ${id}`);
    }
    await removeDirectory(dir);
    console.log(`  Deleted snapshot: ${id}`);
  }
}

function readdirSafe(dirPath) {
  return fsReaddir(dirPath).then(function(entries) {
    return entries.map(function(name) {
      return { name: name, isDirectory: true };
    });
  }).catch(function() {
    return [];
  });
}

const fs = require('fs');

function fsReaddir(dirPath) {
  return new Promise(function(resolve, reject) {
    fs.readdir(dirPath, function(err, files) {
      if (err) return reject(err);
      resolve(files);
    });
  });
}

function fsRename(oldPath, newPath) {
  return new Promise(function(resolve, reject) {
    fs.rename(oldPath, newPath, function(err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = { SnapshotManager };

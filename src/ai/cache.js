const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class AICache {
  constructor(cachePath) {
    this.cachePath = cachePath || path.join(process.cwd(), '.ai-cache.json');
    this.cache = {};
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.cachePath)) {
        this.cache = JSON.parse(fs.readFileSync(this.cachePath, 'utf-8'));
      }
    } catch (e) {
      this.cache = {};
    }
  }

  _save() {
    try {
      fs.writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2), 'utf-8');
    } catch (e) {}
  }

  key(data) {
    const str = JSON.stringify(data);
    return crypto.createHash('md5').update(str).digest('hex');
  }

  get(key) {
    return this.cache[key] || null;
  }

  set(key, value) {
    this.cache[key] = value;
    this._save();
  }
}

module.exports = { AICache };

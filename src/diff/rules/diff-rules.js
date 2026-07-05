function DiffRules(config) {
  this._config = config;
  this._compare = (config && config.diff && config.diff.compare) || {};
  this._ignoreFields = (config && config.diff && config.diff.ignore && config.diff.ignore.fields) || [];

  this._wildcardRules = [];
  this._exactRules = [];

  for (var i = 0; i < this._ignoreFields.length; i++) {
    var rule = this._ignoreFields[i];
    if (typeof rule === 'string' && rule.indexOf('*') !== -1) {
      this._wildcardRules.push(rule.substring(0, rule.length - 1));
    } else {
      this._exactRules.push(rule);
    }
  }
}

DiffRules.prototype.shouldCompare = function (key) {
  if (this._compare.hasOwnProperty(key)) {
    return this._compare[key] === true;
  }
  return true;
};

DiffRules.prototype.getIgnoreFields = function () {
  return this._ignoreFields.slice();
};

DiffRules.prototype.matchesIgnore = function (fieldName) {
  if (this._exactRules.indexOf(fieldName) !== -1) {
    return true;
  }
  for (var i = 0; i < this._wildcardRules.length; i++) {
    if (fieldName.indexOf(this._wildcardRules[i]) === 0) {
      return true;
    }
  }
  return false;
};

module.exports = { DiffRules };

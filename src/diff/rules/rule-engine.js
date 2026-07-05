var { loadConfig } = require('./rule-loader');
var { DiffRules } = require('./diff-rules');

function createRuleEngine(configPath) {
  var config = loadConfig(configPath);
  var rules = new DiffRules(config);
  return rules;
}

module.exports = { createRuleEngine };

const { RULES } = require('./rules/maturity-rules');

const CATEGORY_NAMES = ['security', 'performance', 'restDesign', 'documentation', 'architecture'];

function computeMaturityReport(spec) {
  const categories = {};
  for (const name of CATEGORY_NAMES) {
    categories[name] = { score: 100, rules: [], affectedEndpoints: [] };
  }

  const allIssues = [];
  let criticalCount = 0;
  let warningCount = 0;
  let suggestionCount = 0;

  for (const rule of RULES) {
    const affected = rule.match(spec, { classes: spec['x-classes'] || {}, dependencies: spec['x-dependencies'] || [] });
    if (!affected || affected.length === 0) continue;

    const cat = categories[rule.category];
    if (!cat) continue;

    cat.score += rule.weight;
    cat.rules.push({
      id: rule.id,
      description: rule.description,
      weight: rule.weight,
      severity: rule.severity,
      affected: affected,
    });
    for (const ep of affected) {
      cat.affectedEndpoints.push({ path: ep.path, method: ep.method, ruleId: rule.id });
      allIssues.push({ path: ep.path, method: ep.method, ruleId: rule.id, severity: rule.severity, category: rule.category, description: rule.description, weight: rule.weight });
    }

    if (rule.severity === 'high') criticalCount++;
    else if (rule.severity === 'medium') warningCount++;
    else suggestionCount++;
  }

  for (const name of CATEGORY_NAMES) {
    categories[name].score = Math.max(0, Math.min(100, Math.round(categories[name].score)));
  }

  const overall = Math.round(CATEGORY_NAMES.reduce(function(sum, name) { return sum + categories[name].score; }, 0) / CATEGORY_NAMES.length);

  return {
    overallScore: overall,
    categories: categories,
    criticalIssues: criticalCount,
    warnings: warningCount,
    suggestions: suggestionCount,
    allIssues: allIssues,
  };
}

module.exports = { computeMaturityReport };

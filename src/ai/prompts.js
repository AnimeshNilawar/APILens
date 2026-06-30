function buildControllerPrompt(controllerName, basePath, endpoints) {
  var epParts = [];
  for (var i = 0; i < endpoints.length; i++) {
    var ep = endpoints[i];
    var lines = '  - ' + ep.operationId + ': ' + ep.method + ' ' + ep.path + '\n';
    var params = ep.parameters || [];
    if (params.length > 0) {
      var pStr = params.map(function(p) { return p.name + ' (' + p.type + ', ' + p.in + ')'; }).join(', ');
      lines += '    Params: ' + pStr + '\n';
    } else {
      lines += '    Params: none\n';
    }
    var codes = Object.keys(ep.responses || {});
    lines += '    Responses: ' + (codes.length ? codes.join(', ') : '200') + '\n';
    if (ep.flow) {
      lines += '    Flow: ' + ep.flow + '\n';
    }
    epParts.push(lines);
  }

  var firstOpId = endpoints.length > 0 ? (endpoints[0].operationId || '') : '';

  return 'You are a senior backend engineer reviewing a Spring Boot REST API. Given this controller metadata, return ONLY valid JSON.\n\n' +
    'Controller: ' + controllerName + '\n' +
    'Base: ' + basePath + '\n' +
    'Endpoints:\n' + epParts.join('') + '\n' +
    'Review each endpoint for REST best practices and architecture feedback:\n' +
    '- GET endpoints should not create or modify resources\n' +
    '- Exposed JPA entities should be replaced with DTOs\n' +
    '- List endpoints need pagination for large datasets\n' +
    '- Naming should follow REST conventions (no verbs in paths)\n' +
    '- Security: authorization checks, input validation, IDOR prevention\n\n' +
    'Return this exact JSON structure (no markdown, no code fences):\n' +
    '{\n' +
    '  "controllerSummary": "2-3 sentence summary of what this controller manages and its business purpose.",\n' +
    '  "endpoints": {\n' +
    '    "' + firstOpId + '": {\n' +
    '      "description": "one sentence describing what this endpoint does",\n' +
    '      "explanation": "when and why to use this endpoint",\n' +
    '      "useCase": "real-world scenario example",\n' +
    '      "possibleErrors": ["list of possible error conditions"],\n' +
    '      "confidence": 0-100 score estimating accuracy of these AI insights,\n' +
    '      "bestPractices": [\n' +
    '        {"message": "specific actionable recommendation", "why": "explanation of why this matters"}\n' +
    '      ],\n' +
    '      "warnings": [\n' +
    '        {\n' +
    '          "severity": "high|medium|info",\n' +
    '          "category": "security|performance|architecture|rest-convention",\n' +
    '          "message": "one-line summary of the issue",\n' +
    '          "why": "explanation of the risk or impact",\n' +
    '          "recommendation": "actionable fix"\n' +
    '        }\n' +
    '      ]\n' +
    '    }\n' +
    '  }\n' +
    '}';
}

module.exports = { buildControllerPrompt };

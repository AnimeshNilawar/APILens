var AIProvider = require('./provider').AIProvider;
var buildControllerPrompt = require('./prompts').buildControllerPrompt;

function extractOutputText(data) {
  if (data.output_text) return data.output_text;
  if (data.steps && data.steps.length > 0) {
    for (var si = data.steps.length - 1; si >= 0; si--) {
      var step = data.steps[si];
      if (step.type === 'model_output' && step.content && step.content.length > 0) {
        return step.content.map(function(c) { return c.text || ''; }).join('');
      }
    }
  }
  return '';
}

class GeminiProvider extends AIProvider {
  constructor(apiKey) {
    super(apiKey);
    this.model = 'gemini-3.1-flash-lite';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/interactions';
  }

  async enrichController(controllerName, basePath, endpoints) {
    var prompt = buildControllerPrompt(controllerName, basePath, endpoints);
    var response = await this._callAPI(prompt);
    return response;
  }

  async _callAPI(prompt) {
    var maxRetries = 3;
    var delay = 1000;

    for (var attempt = 1; attempt <= maxRetries; attempt++) {
      var res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'x-goog-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          input: prompt,
        }),
      });

      if (res.ok) {
        var data = await res.json();
        var text = extractOutputText(data);
        if (!text) {
          throw new Error('Gemini API returned empty response');
        }
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error('Gemini API returned invalid JSON: ' + text.substring(0, 200));
        }
      }

      var errText = await res.text();
      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        console.log('    API busy (attempt ' + attempt + '/' + maxRetries + '), retrying in ' + (delay / 1000) + 's...');
        await new Promise(function(r) { setTimeout(r, delay); });
        delay *= 2;
        continue;
      }

      throw new Error('Gemini API error (' + res.status + '): ' + errText);
    }
  }
}

module.exports = { GeminiProvider };

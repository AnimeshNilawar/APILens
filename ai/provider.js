class AIProvider {
  constructor(apiKey) {
    if (this.constructor === AIProvider) {
      throw new Error('AIProvider is abstract');
    }
    this.apiKey = apiKey;
  }

  async enrichController(controllerName, basePath, endpoints) {
    throw new Error('enrichController must be implemented');
  }

  static create(type, apiKey) {
    switch (type) {
      case 'gemini': {
        var GeminiProvider = require('./gemini').GeminiProvider;
        return new GeminiProvider(apiKey);
      }
      default:
        throw new Error('Unknown AI provider: ' + type);
    }
  }
}

module.exports = { AIProvider };

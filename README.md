# APILens

Static analysis tool that parses Spring Boot Java source code and generates a complete API documentation platform — OpenAPI 3.x spec, HTML documentation site, dependency graphs, and AI-enriched insights.

## Features

- **OpenAPI 3.0.3 Spec** — Automatically extracts endpoints, parameters, request/response schemas, and response codes from `@RestController` classes
- **HTML Documentation Site** — Dark-themed, searchable, with endpoint cards, cURL examples, schema tables, and Mermaid dependency graphs
- **Dependency Graph** — Visualizes class dependencies (Controller → Service → Repository) with color-coded stereotypes and click-based impact analysis
- **Impact Analysis** — Click any node in the dependency graph to see affected classes, endpoints, and DTOs
- **API Maturity Report** — Rule-based scoring across security, performance, REST design, documentation, and architecture categories
- **AI Enrichment** — Optional AI-generated endpoint descriptions, architecture reviews, best practices, and warnings (Gemini, OpenAI, Claude)
- **Rule Engine** — Extensible maturity rules in `rules/maturity-rules.js` — add new rules without changing scoring logic

## Quick Start

```bash
npm install
node parser.js path/to/spring-boot/src/main/java
```

```bash
npm start
```

> `output/index.html` cannot be opened directly from `file://` — browsers block Mermaid's rendering on `file:` origins. Use `npm start` to serve via HTTP.

## Usage

```bash
# Analyze a project directory
node parser.js ./my-project/src/main/java

# Analyze a single file
node parser.js ./my-project/src/main/java/com/example/MyController.java

# Default: uses sample-spring-boot project
node parser.js
```

## Output

```
output/
├── index.html          # Documentation site
├── openapi.json         # OpenAPI spec
└── assets/
    ├── app.js           # Site JavaScript
    └── style.css        # Site styles
```

## AI Enrichment (Optional)

1. Create a `.env` file in the project root:
```
GEMINI_API_KEY=your_key_here
```

2. Re-run `node parser.js`. AI insights appear in the documentation site — descriptions, confidence scores, architecture warnings, best practices.

Without an API key, the tool works identically — just skips the AI step.

## Rule Engine

Maturity rules live in `rules/maturity-rules.js`. Each rule is:

```js
{
  id: 'rule-id',
  description: 'Human-readable description',
  category: 'performance',       // security | performance | restDesign | documentation | architecture
  weight: -5,                    // positive or negative
  severity: 'medium',            // high | medium | info
  match: function(spec) {
    // Return array of { path, method } affected endpoints
    return results;
  }
}
```

Add new rules to the `RULES` array — no other code changes needed.

## Sample Project

`sample-spring-boot/` contains a demo e-commerce API (orders, products, users) with in-memory repositories. Used for development and testing.

## How It Works

1. **Parse** — Uses `java-parser` (Chevrotain-based CST parser) to extract controllers, endpoints, parameters, return types, and response codes
2. **Analyze** — Resolves dependencies via constructor injection analysis; builds call chains through method body regex scanning
3. **Generate** — Produces OpenAPI 3.0.3 spec with `$ref`-linked schemas, then renders a self-contained HTML documentation site
4. **Enrich** — Optionally sends structured endpoint metadata to an AI provider for descriptions, architecture reviews, and best-practice suggestions

## 👨‍💻 Author

<div align="center">
  <img src="https://avatars.githubusercontent.com/AnimeshNilawar?s=120" alt="Animesh Nilawar" style="border-radius: 50%; border: 3px solid #0366d6;">
  
  **Animesh Nilawar**
  
  *Backend Developer & Microservices Enthusiast*
  
  [![GitHub](https://img.shields.io/badge/GitHub-AnimeshNilawar-black?style=for-the-badge&logo=github)](https://github.com/AnimeshNilawar)
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=for-the-badge&logo=linkedin)](https://in.linkedin.com/in/animesh-nilawar)
  [![Email](https://img.shields.io/badge/Email-Contact-red?style=for-the-badge&logo=gmail)](mailto:nilawaranimesh@gmail.com)

---

💡 _Passionate about building scalable distributed systems and modern web applications_

</div>
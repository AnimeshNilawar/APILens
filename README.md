<div align="center">

# 🔭 APILens

**Static analysis → OpenAPI spec + docs site + diff engine from Spring Boot source code**

[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)]()

<br>

```
npm install && npm run generate && npm start
```

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Snapshot Management](#-snapshot-management)
- [API Diff Engine](#-api-diff-engine)
- [Diff Rules Configuration](#-diff-rules-configuration)
- [Diff Report UI](#-diff-report-ui)
- [Output Structure](#-output-structure)
- [Usage](#-usage)
- [AI Enrichment](#-ai-enrichment-optional)
- [Maturity Rule Engine](#-maturity-rule-engine)
- [Sample Project](#-sample-project)
- [How It Works](#-how-it-works)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [Author](#-author)

---

## ✨ Features

| Capability | Description |
|---|---|
| **OpenAPI 3.0.3 Spec** | Extracts endpoints, parameters, schemas, response codes from `@RestController` classes |
| **HTML Documentation Site** | Dark-themed SPA with search, endpoint cards, cURL examples, schema tables, Mermaid dependency graphs |
| **Dependency Graph** | Visualizes Controller → Service → Repository with color-coded stereotypes and click-based impact analysis |
| **Impact Analysis** | Click any graph node to see affected endpoints, DTOs, and class chains |
| **API Maturity Report** | 10+ rules across security, performance, REST design, documentation, architecture — scored per endpoint |
| **📸 Snapshot Management** | Immutable versioned snapshots (auto-named `YYYYMMDD-HHMMSS`) with atomic `latest/` alias |
| **🔍 Configurable Diff Engine** | Structural comparison of any two snapshots — endpoints, schemas, properties, security — no AI, pure JSON diff |
| **⚙️ Diff Rules** | 22 configurable comparison keys, wildcard ignore patterns (`x-*`), loaded from `apilens.config.json` |
| **📊 Diff Report UI** | Professional dark-themed report with sidebar, unified/side-by-side JSON diff, filter bar, impact badges, export |
| **🤖 AI Enrichment** | Optional Gemini/OpenAI/Claude endpoint descriptions, architecture reviews, best-practice warnings |
| **🧩 Extensible Rule Engine** | Add maturity rules in one file — no core changes needed |

---

## 🚀 Quick Start

```bash
# 1. Install
npm install

# 2. Analyze the sample Spring Boot project and generate documentation
npm run generate

# 3. Start the documentation server
npm start
```

Open **http://localhost:3000** — you'll see the API docs, dependency graph, maturity report, and insights.

> [!NOTE]
> `output/latest/index.html` cannot be opened directly from `file://` — browsers block Mermaid rendering on `file:` origins. Use `npm start`.

---

## 📸 Snapshot Management

Every time you run `npm run generate`, APILens creates an **immutable snapshot** — a timestamped directory containing the full spec and documentation:

```
output/snapshots/20260704-092257/
├── openapi.json
├── index.html
└── assets/
```

- **Auto-named** — `YYYYMMDD-HHMMSS` format
- **Immutable** — never overwritten; each run produces a unique directory
- **`output/latest/`** — always points to the newest snapshot (atomic update via temp dir + rename)

Snapshots are the foundation of the diff engine — compare any two to see what changed.

---

## 🔍 API Diff Engine

Compare two snapshots and get a structural diff across every aspect of the API:

```bash
node -e "
const { compareSnapshots } = require('./src/diff/diff-engine');
const { generateHtmlReport } = require('./src/diff/html-renderer');

compareSnapshots('output/snapshots/OLD', 'output/snapshots/NEW').then(r => {
  generateHtmlReport(r, 'output/reports/diff');
});
"
```

### What gets compared

| Category | Details |
|---|---|
| **Endpoints** | Path additions/removals, method changes, operation ID changes |
| **Parameters** | Added/removed/modified query, path, header params |
| **Request Bodies** | Content type changes, required status, schema references |
| **Responses** | Status code changes, response schema changes |
| **Schemas** | Property additions/removals, type changes, required field changes |
| **Enums** | Value additions/removals |
| **Security** | Scheme type changes, OAuth flow changes |

- All `$ref` references are resolved before comparison
- Circular references are handled with `[Circular]` markers
- No AI involved — pure structural JSON comparison

---

## ⚙️ Diff Rules Configuration

The diff engine is controlled by `apilens.config.json` at the project root. Every comparison decision is rule-driven.

```json
{
  "diff": {
    "compare": {
      "descriptions": false,
      "summaries": false,
      "examples": false,
      "vendorExtensions": true,
      "operationIds": true,
      "tags": true,
      "deprecated": true,
      "externalDocs": true
    },
    "ignore": {
      "fields": ["x-*", "internal-comment", "debug-info"]
    }
  }
}
```

### 22 configurable comparison keys

- **`compare`** — controls *whether* a field is compared; defaults to `true` for most
- **`ignore.fields`** — removes matching fields from both specs *before* comparison
- **Wildcard support** — `x-*` ignores all vendor extensions, `*-comment` matches any `*-comment`

> [!NOTE]
> If `apilens.config.json` is missing, all comparisons default to enabled. Unknown keys generate warnings.

### Rule pipeline

```
apilens.config.json
  → rule-loader.js (load + deep merge with defaults)
    → rule-validator.js (validate 22 known keys, warn on unknowns)
      → diff-rules.js (DiffRules class: shouldCompare, matchesIgnore)
        → each comparator module (gated by rules)
```

---

## 📊 Diff Report UI

The generated HTML report is a self-contained, dark-themed SPA:

| Feature | Description |
|---|---|
| **Hierarchical Sidebar** | Category → Added/Removed/Modified sub-items with per-item counts |
| **Unified +/- Diff** | GitHub-style with syntax-highlighted JSON values |
| **Side-by-Side JSON Tree** | Toggle between unified and side-by-side views |
| **Collapsible Tree Viewer** | Expand All / Collapse All per comparison |
| **Impact Badges** | Affected endpoints, DTOs, schemas, controllers, services, repositories |
| **Filter Bar** | Added/Removed/Modified checkboxes + Category + Method dropdown + text search — all AND-combined |
| **Export** | HTML, JSON, Markdown, CSV via Blob download |
| **Endpoint Links** | ↗ icon navigates to the API docs for that endpoint |
| **Responsive** | 3 breakpoints — stacks vertically on tablets, wider on large monitors |
| **Snapshots Info** | Displays source/target snapshot IDs and generation timestamp |

Reports are served at **`/reports/`** (listing) and **`/reports/{timestamp}/`** (individual) when the server is running.

---

## 📁 Output Structure

```
output/
├── latest/                              # Always the newest snapshot
│   ├── index.html
│   ├── openapi.json
│   └── assets/
├── snapshots/
│   └── {YYYYMMDD-HHMMSS}/               # Immutable historical snapshots
│       ├── index.html
│       ├── openapi.json
│       └── assets/
└── reports/
    └── diff/
        └── {YYYYMMDD-HHMMSS}/           # Diff reports
            ├── index.html
            └── diff-report.json
```

---

## 📖 Usage

```bash
# Generate documentation (+ new snapshot)
npm run generate

# Start the doc server (port 3000)
npm start

# Analyze a custom project
node src/index.js /path/to/spring-boot/src/main/java

# Use a specific project + config
node src/index.js --project /path/to/project --config /path/to/config.json
```

### Server routes

| Route | Description |
|---|---|
| `/` | API Documentation (current snapshot) |
| `/reports` | List of all diff reports |
| `/reports/{id}/` | Individual diff report |

---

## 🤖 AI Enrichment (Optional)

1. Create a `.env` file:
```
GEMINI_API_KEY=your_key_here
```

2. Re-run `npm run generate`. AI insights appear as endpoint descriptions, confidence scores, architecture warnings, and best-practice suggestions.

> [!TIP]
> Without an API key, APILens works identically — it simply skips the AI step.

Supported providers: **Gemini**, **OpenAI**, **Claude** (configurable in `src/ai/`).

---

## 🧩 Maturity Rule Engine

Rules live in `src/rules/maturity-rules.js`. Each rule:

```js
{
  id: 'rule-id',
  description: 'What it checks',
  category: 'performance',        // security | performance | restDesign | documentation | architecture
  weight: -5,                     // positive or negative score
  severity: 'medium',             // high | medium | info
  match: function(spec) {
    return results;               // array of { path, method }
  }
}
```

Add new rules to the `RULES` array — no other code changes needed.

---

## 🧪 Sample Project

`sample/sample-spring-boot/` is a demo e-commerce API:

| Layer | Classes |
|---|---|
| **Controllers** | `UserController`, `ProductController`, `OrderController` |
| **Services** | `UserService`, `ProductService`, `OrderService` |
| **Repositories** | `UserRepository`, `ProductRepository`, `OrderRepository` |
| **Entities** | `User`, `Product`, `Order` |
| **DTOs** | `Create*`, `Update*`, response DTOs |

Built with Spring Boot conventions: constructor injection, `@RestController`, `@RequestMapping`, `@Valid` validation, and a `GlobalExceptionHandler`.

---

## 🔧 How It Works

1. **Parse** — `java-parser` (Chevrotain-based CST) extracts controllers, endpoints, parameters, return types, schemas
2. **Analyze** — Resolves dependencies via constructor injection analysis; builds call chains through method body regex scanning
3. **Generate** — Produces OpenAPI 3.0.3 spec with `$ref`-linked schemas, renders a self-contained HTML documentation site
4. **Snapshot** — Persists the output as an immutable timestamped snapshot; updates `output/latest/` atomically
5. **Enrich** — Optionally sends endpoint metadata to AI providers for descriptions, architecture reviews, and suggestions
6. **Diff** — Compares any two snapshots structurally (rule-gated, `$ref`-resolved) and generates a professional diff report

---

## 📂 Project Structure

```
src/
├── index.js                    # Entry point — orchestrates parse → analyze → generate → snapshot
├── server.js                   # HTTP server — serves docs at /, reports at /reports
├── parser.js                   # Java source parser (CST-based)
├── model-parser.js             # DTO/entity field extraction
├── openapi-builder.js          # OpenAPI 3.0.3 spec construction
├── doc-site-generator.js       # HTML documentation site generator
├── dependency-analyzer.js      # Class dependency graph
├── maturity-scorer.js          # API maturity scoring
├── rules/
│   └── maturity-rules.js       # 10+ maturity rules
├── snapshot/
│   ├── snapshot-manager.js     # Snapshot lifecycle
│   ├── snapshot-utils.js       # Async FS utilities
│   └── metadata-builder.js     # Auto-derived metadata
├── diff/
│   ├── diff-engine.js          # Orchestrator
│   ├── diff-model.js           # Data model
│   ├── diff-utils.js           # $ref resolution, field stripping
│   ├── endpoint-diff.js        # Endpoint comparison
│   ├── parameter-diff.js       # Parameter comparison
│   ├── request-body-diff.js    # Request body comparison
│   ├── response-diff.js        # Response comparison
│   ├── schema-diff.js          # Schema + property comparison
│   ├── security-diff.js        # Security scheme comparison
│   ├── html-renderer.js        # Diff report HTML generation
│   └── rules/
│       ├── default-rules.js    # Default config
│       ├── rule-validator.js   # Config validation
│       ├── rule-loader.js      # File loading + merge
│       ├── diff-rules.js       # DiffRules class
│       └── rule-engine.js      # Orchestrator
├── ai/
│   ├── provider.js             # AI provider abstraction
│   ├── gemini-provider.js      # Gemini integration
│   ├── prompt-builder.js       # Prompt templates
│   └── cache.js                # Response cache
└── utils/
    └── example-generator.js    # Smart example generation
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Open a Pull Request

> [!TIP]
> Run `npm run generate` after any changes to the sample project to verify the full pipeline.

---

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

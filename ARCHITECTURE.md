# APILens — Architecture & Implementation Guide

## Project Overview

**APILens** is a static analysis tool that parses Spring Boot Java source code using AST (Abstract Syntax Tree) parsing and generates a complete API documentation platform — without needing a running application.

**Tech stack:** Node.js, `java-parser` (Chevrotain-based CST parser), file system I/O, no build tools

---

## 1. Entry Points

### `parser.js` (root shim) → `src/index.js`

Root `parser.js` simply does `require('./src/index')`. No CLI args processed here.

### `server.js` (root shim) → `src/server.js`

Root `server.js` does `require('./src/server')`. Launches an HTTP server to serve the generated docs.

### package.json scripts

```json
"generate": "node src/index.js"
"start": "node src/server.js"
```

---

## 2. Main Flow (`src/index.js`)

This is the heart of the application. The execution pipeline is:

```
CLI args → resolve project dir
    ↓
Get all .java files recursively (getAllJavaFiles)
    ↓
Parse Java models / DTOs (parseJavaModels)
    ↓
Analyze class dependencies (analyzeDependencies)
    ↓
Parse each Java file as a controller (analyzeController)
    ↓
Build call chains per endpoint (buildCallChain)
    ↓
Generate OpenAPI 3.0.3 spec (generateOpenApiSpec)
    ↓
Attach x-classes metadata + maturity report (computeMaturityReport)
    ↓
AI enrichment (enrichSpec) → fallback if no API key
    ↓
Generate HTML documentation site (generateDocSite)
```

### Step-by-step:

**A. Resolve project directory** (lines 352-358)

```js
const projectDir = (function() {
    const raw = process.argv[2];
    if (!raw) return path.join(__dirname, '..', 'sample', 'sample-spring-boot', 'src', 'main', 'java');
    const resolved = path.resolve(raw);
    if (fs.statSync(resolved).isFile()) return path.dirname(resolved);
    return resolved;
})();
```

- If no arg provided → defaults to the built-in sample Spring Boot project
- If a file path is given → uses its parent directory
- If a directory is given → uses it directly

**B. Parse Java models** — `getAllJavaFiles` + `parseJavaModels`

- Recursively walks directory for `*.java` files
- Parses each file to extract DTO/model classes (non-Spring-component classes)
- Returns a `schemas` object: `{ ClassName: { type: 'object', properties: {...}, example: {...} } }`

**C. Analyze dependencies** — `analyzeDependencies`

- Parses every Java file
- Extracts class name, package, Spring stereotype (controller/service/repository/config)
- Extracts field types and constructor parameter types
- Builds a dependency graph: `[{ from: 'UserController', to: 'UserService' }, ...]`

**D. Parse controllers** — `analyzeController` (lines 299-345)

- For each Java file, parses AST with `java-parser`
- Checks for `@RestController` annotation
- Extracts:
  - **Base path** from `@RequestMapping` on the class
  - **Endpoints** from method annotations (`@GetMapping`, `@PostMapping`, etc.)
- For each endpoint, extracts:
  - HTTP method (GET/POST/PUT/DELETE/PATCH)
  - Full path (base + method path)
  - Parameters (path/query/body/header) with types and annotation values
  - Return type with generic resolution (e.g., `ResponseEntity<List<OrderResponse>>` → `{ type: 'OrderResponse', isArray: true }`)
  - Response codes (scans method body text for `ResponseEntity.ok()`, `.status()`, `.notFound()`, etc.)

**E. Build call chains** — `buildCallChain` (lines 197-238 in dependency-analyzer.js)

- For each endpoint, traces method calls from controller → service → repository
- Uses regex to find `fieldName.methodName(` patterns in method body text
- Recursively follows calls up to 4 levels deep
- Produces a flow string like `"UserController → UserService → UserRepository"`

**F. Generate OpenAPI spec** — `generateOpenApiSpec`

- Builds full OpenAPI 3.0.3 JSON
- Resolves `$ref` schemas for request/response bodies
- Generates examples for all schemas
- Attaches `x-flow`, `x-calls`, `x-classes`, `x-dependencies`, `x-maturity` extensions
- Writes `openapi.json` to disk

**G. Compute maturity report** — `computeMaturityReport`

- Runs 10+ rules against the spec
- Each rule checks for specific API quality issues
- Produces category scores (0-100) + overall score
- Counts critical/warning/suggestion issues

**H. AI enrichment** — `enrichSpec`

- Reads `GEMINI_API_KEY` from `.env`
- If no key → skips AI step silently
- Sends structured endpoint metadata to Gemini API per controller
- Receives: descriptions, explanations, use cases, best practices, architecture warnings
- Caches results in `.ai-cache.json` (MD5-hashed by payload)

**I. Generate documentation site** — `generateDocSite`

- Writes `output/index.html` with embedded JSON spec and Mermaid CDN
- Writes `output/openapi.json`
- Writes `output/assets/style.css` with ~150 lines of dark-themed CSS
- Writes `output/assets/app.js` with ~660 lines of client-side JavaScript

---

## 3. Module Deep Dives

### `src/model-parser.js` (227 lines)

**Purpose:** Extract OpenAPI schemas from Java model/DTO classes.

**How it detects models vs. controllers:**

```js
const SPRING_STEREOTYPES = new Set([
    'RestController', 'Controller', 'Service', 'Repository',
    'Configuration', 'Component', 'ControllerAdvice', 'RestControllerAdvice',
]);
function isSpringComponent(cst) { ... }
```

→ If a class has a Spring stereotype annotation, it's skipped. Everything else is a potential model.

**Field extraction:**

- Walks `classBodyDeclaration` → `fieldDeclaration`
- Extracts `baseType` and `innerType` from generics (e.g., `List<String>` → `{ baseType: 'List', innerType: 'String' }`)
- Maps Java types to OpenAPI types via `OPENAPI_TYPE_MAP`:

```js
String → string, Long → integer(int64), LocalDate → string(date), BigDecimal → number, etc.
```

- Generates examples for each field using heuristics
- Builds `$ref`-ready schema objects

### `src/openapi-builder.js` (176 lines)

**Purpose:** Convert parsed endpoints + schemas → OpenAPI 3.0.3 JSON.

**Parameter mapping:**

```js
const PARAM_IN_MAP = {
    PathVariable: 'path',
    RequestParam: 'query',
    RequestHeader: 'header',
};
```

**Schema resolution:**

- `resolveResponseSchema` — maps return types to `$ref` or inline schemas
- `resolveRequestBodySchema` — finds `@RequestBody` parameter and creates request body schema
- `filterUsedSchemas` — prunes unused DTOs from final spec

**x-extensions added:**

- `x-flow` — human-readable call chain (e.g., `"UserController → UserService → UserRepository"`)
- `x-calls` — structured call chain array
- `x-dependencies` — full dependency graph
- `x-classes` — class metadata (package, stereotype)
- `x-maturity` — maturity report

### `src/dependency-analyzer.js` (240 lines)

**Purpose:** Extract class dependencies through constructor injection analysis.

**Stereotype detection:**

```js
const STEREOTYPE_MAP = {
    RestController: 'controller',
    Controller: 'controller',
    Service: 'service',
    Repository: 'repository',
    Configuration: 'config',
    Component: 'component',
    RestControllerAdvice: 'controller',
    ControllerAdvice: 'controller',
};
```

**Dependency resolution strategy:**

1. Extract all field declarations with their types
2. Extract constructor parameters
3. If a constructor parameter type matches another known class → record dependency
4. Dependencies array: `{ from: 'UserController', to: 'UserService' }`

**Call chain building:**

- `findMethodCalls(bodyText, fields)` — uses regex `fieldName\.methodName\(` to find method invocations
- `buildCallChain(className, methodName, classes, depth)` — recursive traversal (max depth: 4)

### `src/maturity-scorer.js` (57 lines) + `src/rules/maturity-rules.js` (212 lines)

**Purpose:** Score API quality across 5 dimensions.

**Scoring logic:**

- Each category starts at 100
- Each matching rule deducts/adds its weight (e.g., -5 for no pagination, +5 for using DTOs)
- Scores clamped to [0, 100]
- Overall score = average of all 5 categories

**10 rules implemented:**

| Rule | Category | Weight | Severity |
|------|----------|--------|----------|
| No pagination on collection GETs | performance | -5 | medium |
| Only 200 response (no error codes) | security | -4 | medium |
| Verbs in URL paths | restDesign | -3 | info |
| Error responses lack body | restDesign | -2 | info |
| Missing descriptions | documentation | -3 | info |
| Uses DTOs (positive) | architecture | +5 | info |
| GET with request body | restDesign | -3 | medium |
| Untagged endpoints | documentation | -2 | info |
| DELETE with request body | restDesign | -2 | info |

**Output shape:**

```json
{
  "overallScore": 72,
  "categories": {
    "security": { "score": 96, "rules": [...], "affectedEndpoints": [...] },
    "performance": { "score": 95, ... },
    "restDesign": { "score": 93, ... },
    "documentation": { "score": 97, ... },
    "architecture": { "score": 105, ... }
  },
  "criticalIssues": 0,
  "warnings": 2,
  "suggestions": 1,
  "allIssues": [...]
}
```

### `src/doc-site-generator.js` (858 lines)

**Purpose:** Generate self-contained HTML documentation site.

**What's generated in `output/`:**

```
output/
├── index.html              # ~70 lines: HTML shell + embedded spec JSON
├── openapi.json             # Full OpenAPI spec
└── assets/
    ├── style.css            # ~150 lines: dark theme CSS
    └── app.js               # ~660 lines: client-side SPA
```

**Client-side features (in `app.js`):**

- **Sidebar** with grouped endpoints by controller tag, searchable
- **Stats cards** (endpoint count, schema count)
- **Maturity dashboard** with animated bar chart + issue counts
- **Endpoint cards** with expandable details:
  - Tabbed panels: Request, Response, cURL, Flow
  - Syntax-highlighted JSON examples
  - Copy buttons
  - AI insights section (description, explanation, use case, possible errors, best practices, architecture warnings with severity badges)
- **Schema viewer** with expandable cards showing field table + example
- **Architecture section** with:
  - Mermaid.js dependency graph (dark themed)
  - Class names colo-red by stereotype
  - Search/filter input
  - **Impact analysis panel:** click any graph node → slide-out panel shows affected classes, endpoints, DTOs
  - Dims unrelated nodes, highlights selected (blue) + neighbors (amber)

**Impact analysis logic (client-side):**

```js
function computeImpact(className) {
    // 1. Find all classes that depend on the clicked class
    // 2. Find controllers among those
    // 3. Find endpoints tagged with those controllers
    // 4. Find schemas that reference the class
}
```

### AI Module (`src/ai/`)

**`provider.js`** — Abstract base class with factory pattern:

```js
static create(type, apiKey) {
    switch (type) {
        case 'gemini': return new GeminiProvider(apiKey);
        default: throw new Error('Unknown AI provider');
    }
}
```

**`gemini.js`** — Gemini API client:

- Model: `gemini-3.1-flash-lite`
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/interactions`
- Retry logic: 3 attempts with exponential backoff (1s → 2s → 4s)
- Response parsing: handles both `output_text` and `steps[].content[]` response formats

**`prompts.js`** — Builds structured prompt with:

- REST best practices checklist
- Security considerations (authorization, input validation, IDOR)
- Strict JSON output format specification

**`enrich.js`** — Orchestration:

- Loads `.env`, reads `GEMINI_API_KEY`
- Groups endpoints by controller tag
- Creates MD5 cache key from endpoint metadata
- Checks `.ai-cache.json` before calling API
- Merges AI response into spec:
  - `tag.description` ← controller summary
  - `op.description` ← endpoint description
  - `op.x-explanation`, `op.x-useCase`, `op.x-possibleErrors`, `op.x-confidence`, `op.x-bestPractices`, `op.x-warnings`

**`cache.js`** — Persistent JSON cache:

- File: `.ai-cache.json` in project root
- Key: MD5 hash of structured endpoint metadata
- Auto-loads on init, writes on each new entry

### `src/utils/example-generator.js` (110 lines)

**Smart example generation:**

- 30+ field name heuristics:

```js
{ names: ['email', 'mail'], value: 'user@example.com' },
{ names: ['password', 'pass', 'secret'], value: '********' },
{ names: ['id', 'userId', 'orderId', 'productId', 'customerId'], value: 1 },
{ names: ['price', 'cost', 'amount', 'total', 'totalAmount'], value: 9.99 },
{ names: ['rating', 'score'], value: 4.5 },
// ... 25 more entries
```

- Format-aware generation (dates, integers, doubles, arrays)
- Recursive schema resolution through `$ref` links

### `src/server.js` (53 lines)

Simple Node.js HTTP server:

- Serves static files from `output/` directory
- MIME type mapping for `.html`, `.css`, `.js`, `.json`, `.png`, `.svg`
- Path traversal protection
- Port auto-increment if 3000 is busy

---

## 4. Complete Data Flow Diagram

```
                            CLI: node src/index.js [path]
                                    │
                                    ▼
                      ┌─────────────────────────┐
                      │   Resolve projectDir     │
                      │   (arg || sample project)│
                      └─────────┬───────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                  ▼
     ┌──────────────┐  ┌───────────────┐  ┌──────────────┐
     │ getAllJava   │  │ getAllJava    │  │ getAllJava   │
     │ Files()      │  │ Files()       │  │ Files()      │
     └──────┬───────┘  └──────┬────────┘  └──────┬───────┘
            ▼                 ▼                  ▼
     ┌──────────────┐  ┌───────────────┐  ┌──────────────┐
     │parseJava     │  │analyze        │  │analyze       │
     │Models()      │  │Dependencies() │  │Controller()  │
     │              │  │               │  │(per file)    │
     │DTOs →       │  │classes[]      │  │              │
     │Schemas       │  │dependencies[] │  │endpoints[]   │
     └──────┬───────┘  └──────┬────────┘  └──────┬───────┘
            │                 │                  │
            └──────────┬──────┼──────────────────┘
                       │      │
                       ▼      ▼
              ┌──────────────────────┐
              │  generateOpenApiSpec │
              │                      │
              │  OpenAPI 3.0.3 JSON  │
              │  + x-flow, x-calls, │
              │    x-classes, x-dep │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  computeMaturity     │
              │  Report()            │
              │                      │
              │  → spec.x-maturity   │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  enrichSpec()        │
              │  (if GEMINI_API_KEY) │
              │                      │
              │  AI → descriptions,  │
              │  explanations,       │
              │  best practices,     │
              │  warnings            │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  generateDocSite()   │
              │                      │
              │  output/index.html   │
              │  output/openapi.json │
              │  output/assets/*     │
              └──────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  node src/server.js  │
              │  → localhost:3000    │
              └──────────────────────┘
```

---

## 5. AST Parsing Details

The project uses `java-parser` which produces a CST (Concrete Syntax Tree). The tree is navigated by walking deep property chains like:

```js
// Extracting a method annotation value:
methodDecl.children.methodModifier[0]
  .children.annotation[0]
  .children.elementValuePairList[0]
  .children.elementValuePair[0]
  .children.elementValue[0]
  .children.conditionalExpression[0]
  .children.binaryExpression[0]
  .children.unaryExpression[0]
  .children.primary[0]
  .children.primaryPrefix[0]
  .children.literal[0]
  .children.StringLiteral[0]
  .image
```

This pattern is used consistently across all modules — the code directly traverses `children` arrays and picks the first element (`[0]`), accessing `.image` for terminal tokens and recursing into `.children` for non-terminals.

---

## 6. Key Design Patterns

| Pattern | Where |
|---------|-------|
| **Factory** | `AIProvider.create('gemini', key)` |
| **Strategy** | `getNodeName()` in client JS (3 fallback strategies) |
| **Rule engine** | `RULES` array with `match(spec)` interface |
| **Cache-aside** | `AICache` checks before API calls |
| **Fallback** | AI enrichment silently skipped if no key; shims for backward compat |
| **Extension properties** | OpenAPI `x-*` fields (vendor extensions) |

---

## 7. Sample Spring Boot Project

Located at `sample/sample-spring-boot/`, it's a Maven-based e-commerce API with:

- **3 Controllers:** OrderController, ProductController, UserController
- **3 Services:** OrderService, ProductService, UserService
- **3 Repositories:** In-memory HashMap-based
- **3 Entities:** Order, Product, User
- **3 Request DTOs:** CreateOrderRequest, CreateProductRequest, CreateUserRequest, UpdateUserRequest
- **3 Response DTOs:** OrderResponse, ProductResponse, UserResponse
- **GlobalExceptionHandler** with `@ControllerAdvice`
- **WebConfig** CORS configuration

This provides a realistic target for analysis.

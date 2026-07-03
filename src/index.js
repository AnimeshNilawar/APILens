const fs = require('fs');
const path = require('path');
const { parse } = require('java-parser');
const { generateOpenApiSpec } = require('./openapi-builder');
const { getAllJavaFiles, parseJavaModels } = require('./model-parser');

const VERB_MAP = {
    GetMapping: 'GET',
    PostMapping: 'POST',
    PutMapping: 'PUT',
    DeleteMapping: 'DELETE',
    PatchMapping: 'PATCH',
    RequestMapping: null,
};

const REQUEST_METHOD_MAP = {
    'RequestMethod.GET': 'GET',
    'RequestMethod.POST': 'POST',
    'RequestMethod.PUT': 'PUT',
    'RequestMethod.DELETE': 'DELETE',
    'RequestMethod.PATCH': 'PATCH',
};

function extractStringFromElementValue(ev) {
    const ce = ev.children.conditionalExpression?.[0];
    if (!ce) return '';
    const be = ce.children.binaryExpression?.[0];
    if (!be) return '';
    const ue = be.children.unaryExpression?.[0];
    if (!ue) return '';
    const prim = ue.children.primary?.[0];
    if (!prim) return '';
    const pp = prim.children.primaryPrefix?.[0];
    if (!pp) return '';
    const lit = pp.children.literal?.[0];
    if (!lit) return '';
    const sl = lit.children.StringLiteral?.[0];
    return sl ? sl.image.replace(/^"|"$/g, '') : '';
}

function extractFqnFromElementValue(ev) {
    const ce = ev.children.conditionalExpression?.[0];
    if (!ce) return '';
    const be = ce.children.binaryExpression?.[0];
    if (!be) return '';
    const ue = be.children.unaryExpression?.[0];
    if (!ue) return '';
    const prim = ue.children.primary?.[0];
    if (!prim) return '';
    const pp = prim.children.primaryPrefix?.[0];
    if (!pp) return '';
    const fqn = pp.children.fqnOrRefType?.[0];
    if (!fqn) return '';
    const parts = [];
    const first = fqn.children.fqnOrRefTypePartFirst?.[0]?.children?.fqnOrRefTypePartCommon?.[0]?.children?.Identifier?.[0]?.image;
    if (first) parts.push(first);
    const rest = fqn.children.fqnOrRefTypePartRest?.[0]?.children?.fqnOrRefTypePartCommon?.[0]?.children?.Identifier?.[0]?.image;
    if (rest) parts.push(rest);
    return parts.join('.');
}

function extractRouteFromModifier(mod) {
    const ann = mod.children.annotation?.[0];
    if (!ann) return { name: null, path: '', httpMethod: null };

    const name = ann.children.typeName?.[0]?.children?.Identifier?.[0]?.image;

    let pathVal = '';
    let httpMethod = null;

    if (ann.children.elementValue) {
        pathVal = extractStringFromElementValue(ann.children.elementValue[0]);
    }

    if (ann.children.elementValuePairList) {
        const list = ann.children.elementValuePairList[0];
        (list.children.elementValuePair || []).forEach(p => {
            const key = p.children.Identifier?.[0]?.image;
            const ev = p.children.elementValue?.[0];
            if (!ev) return;
            if (key === 'value' && !pathVal) {
                pathVal = extractStringFromElementValue(ev);
            }
            if (key === 'method') {
                const fqn = extractFqnFromElementValue(ev);
                httpMethod = REQUEST_METHOD_MAP[fqn] || null;
            }
        });
    }

    return { name, path: pathVal, httpMethod };
}

function extractPrimitiveName(node) {
    for (const key of Object.keys(node.children || {})) {
        if (key === 'annotation' || key === 'unannPrimitiveTypeWithOptionalDimsSuffix') continue;
        const child = node.children[key]?.[0];
        if (!child) continue;
        if (child.image) return child.image;
        if (child.children) {
            const result = extractPrimitiveName(child);
            if (result) return result;
        }
    }
    return null;
}

function extractParameterType(unannType) {
    const refType = unannType.children.unannReferenceType?.[0];
    if (refType) {
        const classOrIface = refType.children.unannClassOrInterfaceType?.[0];
        if (classOrIface) {
            const classType = classOrIface.children.unannClassType?.[0];
            if (classType) {
                return classType.children.Identifier?.[0]?.image || 'unknown';
            }
        }
    }
    const primWithDims = unannType.children.unannPrimitiveTypeWithOptionalDimsSuffix?.[0];
    if (primWithDims) {
        const name = extractPrimitiveName(primWithDims);
        return name || 'unknown';
    }
    return 'unknown';
}

const PARAM_ANNOTATIONS = new Set(['PathVariable', 'RequestParam', 'RequestBody', 'RequestHeader']);

function extractParameters(methodDecl) {
    const fpl = methodDecl.children.methodHeader?.[0]
        ?.children.methodDeclarator?.[0]
        ?.children.formalParameterList?.[0];
    if (!fpl) return [];

    return (fpl.children.formalParameter || []).map(p => {
        const vprp = p.children.variableParaRegularParameter?.[0];
        if (!vprp) return null;

        const vmods = vprp.children.variableModifier || [];
        let annotation = null;
        let annotationValue = '';

        for (const vm of vmods) {
            const ann = vm.children.annotation?.[0];
            if (!ann) continue;
            const name = ann.children.typeName?.[0]?.children?.Identifier?.[0]?.image;
            if (name && PARAM_ANNOTATIONS.has(name)) {
                annotation = name;
                if (ann.children.elementValue) {
                    annotationValue = extractStringFromElementValue(ann.children.elementValue[0]);
                }
                break;
            }
        }

        const ut = vprp.children.unannType?.[0];
        const typeName = ut ? extractParameterType(ut) : 'unknown';
        const paramName = vprp.children.variableDeclaratorId?.[0]?.children?.Identifier?.[0]?.image || 'unknown';

        return { name: paramName, type: typeName, annotation, annotationValue };
    }).filter(Boolean);
}

function extractReturnType(methodDecl) {
    const result = methodDecl.children.methodHeader?.[0]?.children?.result?.[0];
    if (!result) return null;

    const ut = result.children.unannType?.[0];
    if (!ut) return null;

    const primWithDims = ut.children.unannPrimitiveTypeWithOptionalDimsSuffix?.[0];
    if (primWithDims) return null;

    const refType = ut.children.unannReferenceType?.[0];
    if (!refType) return null;

    const coit = refType.children.unannClassOrInterfaceType?.[0];
    if (!coit) return null;

    const ct = coit.children.unannClassType?.[0];
    if (!ct) return null;

    const baseType = ct.children.Identifier?.[0]?.image;
    if (!baseType) return null;

    if (baseType === 'Void' || baseType === 'void') return null;

    function extractInner(ctNode) {
        const ta = ctNode.children.typeArguments?.[0];
        if (!ta) return null;
        const tal = ta.children.typeArgumentList?.[0];
        if (!tal) return null;
        const firstArg = tal.children.typeArgument?.[0];
        if (!firstArg) return null;
        const rt = firstArg.children.referenceType?.[0];
        if (!rt) return null;
        const innerCOIT = rt.children.classOrInterfaceType?.[0];
        if (!innerCOIT) return null;
        return innerCOIT.children.classType?.[0] || null;
    }

    const innerCt = extractInner(ct);

    if (baseType === 'ResponseEntity') {
        if (!innerCt) return null;
        const innerName = innerCt.children.Identifier?.[0]?.image;
        if (innerName === 'List') {
            const nestedInner = extractInner(innerCt);
            if (!nestedInner) return { type: innerName, isArray: false };
            const nestedName = nestedInner.children.Identifier?.[0]?.image;
            return { type: nestedName, isArray: true };
        }
        if (innerName === 'Void' || innerName === 'void') return null;
        return { type: innerName, isArray: false };
    }

    if (baseType === 'List') {
        if (!innerCt) return { type: baseType, isArray: true };
        const innerName = innerCt.children.Identifier?.[0]?.image;
        return { type: innerName || baseType, isArray: true };
    }

    return { type: baseType, isArray: false };
}

function extractResponseCodes(methodDecl, rawCode) {
    const methodBody = methodDecl.children.methodBody?.[0];
    if (!methodBody || !methodBody.location) return [200];
    const bodyText = rawCode.substring(methodBody.location.startOffset, methodBody.location.endOffset);
    const codes = new Set();
    if (/ResponseEntity\.ok\s*\(/.test(bodyText)) codes.add(200);
    if (/ResponseEntity\.status\s*\(/.test(bodyText)) codes.add(201);
    if (/HttpStatus\.CREATED/.test(bodyText)) codes.add(201);
    if (/ResponseEntity\.noContent\s*\(/.test(bodyText)) codes.add(204);
    if (/ResponseEntity\.notFound\s*\(/.test(bodyText)) codes.add(404);
    if (/ResponseEntity\.badRequest\s*\(/.test(bodyText)) codes.add(400);
    return codes.size > 0 ? Array.from(codes).sort() : [200];
}

function combinePaths(base, sub) {
    if (!sub) return base;
    const left = base.replace(/\/+$/, '');
    const right = sub.replace(/^\/+/, '');
    return left + '/' + right;
}

function extractBasePath(modifiers) {
    for (const mod of modifiers) {
        const { name, path: p } = extractRouteFromModifier(mod);
        if (name === 'RequestMapping' && p) return p;
    }
    return '';
}

function extractEndpoints(classDecl, basePath, rawCode) {
    const normalClass = classDecl.children.normalClassDeclaration?.[0];
    const classBody = normalClass?.children.classBody?.[0];
    if (!classBody) return [];

    const declarations = classBody.children.classBodyDeclaration || [];
    const endpoints = [];

    declarations.forEach(decl => {
        const methodDecl = decl.children.classMemberDeclaration?.[0]?.children.methodDeclaration?.[0];
        if (!methodDecl) return;

        const modifiers = methodDecl.children.methodModifier || [];
        const methodName = methodDecl.children.methodHeader?.[0]
            ?.children.methodDeclarator?.[0]
            ?.children.Identifier?.[0]?.image;

        if (!methodName) return;

        for (const mod of modifiers) {
            const { name, path: subPath, httpMethod } = extractRouteFromModifier(mod);
            if (!name) continue;

            let verb = VERB_MAP[name];
            if (name === 'RequestMapping') {
                verb = httpMethod;
            }
            if (!verb) continue;

            endpoints.push({
                methodName,
                httpMethod: verb,
                fullPath: combinePaths(basePath, subPath),
                parameters: extractParameters(methodDecl),
                returnType: extractReturnType(methodDecl),
                responseCodes: extractResponseCodes(methodDecl, rawCode),
            });
            break;
        }
    });

    return endpoints;
}

function analyzeController(filePath) {
    const rawCode = fs.readFileSync(filePath, 'utf-8');

    let cst;
    try {
        cst = parse(rawCode);
    } catch (error) {
        console.error("Failed to parse Java code:", error.message);
        return [];
    }

    const ocu = cst.children.ordinaryCompilationUnit?.[0];
    const typeDeclarations = ocu?.children?.typeDeclaration || cst.children.typeDeclaration || [];

    for (const typeDecl of typeDeclarations) {
        const classDecl = typeDecl.children.classDeclaration?.[0];
        if (!classDecl) continue;

        const modifiers = classDecl.children.classModifier || [];
        const annotations = modifiers.map(m => m.children.annotation?.[0]).filter(Boolean);
        const annotationNames = annotations.map(a =>
            a.children.typeName?.[0]?.children?.Identifier?.[0]?.image
        );

        const hasRestController = annotationNames.includes('RestController');

        if (hasRestController) {
            const normalClass = classDecl.children.normalClassDeclaration?.[0];
            const className = normalClass?.children?.typeIdentifier?.[0]
                ?.children?.Identifier?.[0]?.image;

            const basePath = extractBasePath(modifiers);
            const endpoints = extractEndpoints(classDecl, basePath, rawCode);

            const taggedEndpoints = endpoints.map(ep => ({ ...ep, controller: className }));
            console.log(`\nController: [${className}]`);
            console.log(`Base path: "${basePath}"`);
            console.log(`Endpoints (${taggedEndpoints.length}):\n`);
            taggedEndpoints.forEach(ep => {
                console.log(`  ${ep.httpMethod}  ${ep.fullPath}  (${ep.methodName})`);
            });
            return taggedEndpoints;
        }
    }

    return [];
}

const { generateDocSite } = require('./doc-site-generator');
const { analyzeDependencies, buildCallChain } = require('./dependency-analyzer');
const { enrichSpec } = require('./ai/enrich');
const { computeMaturityReport } = require('./maturity-scorer');
const { SnapshotManager } = require('./snapshot/snapshot-manager');

const projectDir = (function() {
    const raw = process.argv[2];
    if (!raw) return path.join(__dirname, '..', 'sample', 'sample-spring-boot', 'src', 'main', 'java');
    const resolved = path.resolve(raw);
    if (fs.statSync(resolved).isFile()) return path.dirname(resolved);
    return resolved;
})();

const javaFiles = getAllJavaFiles(projectDir);
const schemas = parseJavaModels(javaFiles);
console.log(`Indexed ${Object.keys(schemas).length} model schemas from ${javaFiles.length} Java files`);

const depData = analyzeDependencies(javaFiles);
console.log(`Analyzed ${Object.keys(depData.classes).length} classes, ${depData.dependencies.length} dependencies`);

const allEndpoints = [];
for (const filePath of javaFiles) {
    const eps = analyzeController(filePath);
    if (eps && eps.length > 0) {
        for (const ep of eps) {
            const chain = buildCallChain(ep.controller, ep.methodName, depData.classes, 0);
            ep.xCalls = chain;
            if (chain.length > 0) {
                const seen = new Set();
                const flowParts = [];
                for (const c of chain) {
                    const fromClass = c.from.split('.')[0];
                    if (!seen.has(fromClass)) { seen.add(fromClass); flowParts.push(fromClass); }
                    const toClass = c.to.split('.')[0];
                    if (!seen.has(toClass)) { seen.add(toClass); flowParts.push(toClass); }
                }
                ep.xFlow = flowParts.join(' → ');
            }
        }
        allEndpoints.push(...eps);
    }
}

const spec = generateOpenApiSpec(allEndpoints, schemas, depData);

const xClasses = {};
for (const [name, info] of Object.entries(depData.classes || {})) {
  xClasses[name] = { package: info.package, stereotype: info.stereotype };
}
spec['x-classes'] = xClasses;
spec['x-maturity'] = computeMaturityReport(spec);

function deriveProjectName(projectDir) {
  const raw = process.argv[2];
  if (raw) return path.basename(path.resolve(raw));
  const parts = projectDir.split(path.sep);
  const srcIndex = parts.lastIndexOf('src');
  if (srcIndex >= 2) return parts[srcIndex - 1];
  return parts[parts.length - 1] || 'project';
}

(async function() {
  const snapshotManager = new SnapshotManager({
    outputRoot: './output',
    projectName: deriveProjectName(projectDir),
  });

  try {
    const specToUse = await enrichSpec(spec);
    await snapshotManager.createSnapshot(specToUse);
  } catch (err) {
    console.warn('AI enrichment error:', err.message);
    await snapshotManager.createSnapshot(spec);
  }
})();

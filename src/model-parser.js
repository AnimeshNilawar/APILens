const fs = require('fs');
const path = require('path');
const { parse } = require('java-parser');
const { generateExampleForProperty, buildObjectExample } = require('./utils/example-generator');

const OPENAPI_TYPE_MAP = {
    String: { type: 'string' },
    Long: { type: 'integer', format: 'int64' },
    Integer: { type: 'integer', format: 'int32' },
    int: { type: 'integer', format: 'int32' },
    long: { type: 'integer', format: 'int64' },
    Boolean: { type: 'boolean' },
    boolean: { type: 'boolean' },
    Double: { type: 'number', format: 'double' },
    double: { type: 'number', format: 'double' },
    Float: { type: 'number', format: 'float' },
    float: { type: 'number', format: 'float' },
    BigDecimal: { type: 'number' },
    BigInteger: { type: 'integer' },
    LocalDate: { type: 'string', format: 'date' },
    LocalDateTime: { type: 'string', format: 'date-time' },
    Date: { type: 'string', format: 'date-time' },
};

function inferOpenApiType(javaType) {
    const mapped = OPENAPI_TYPE_MAP[javaType];
    if (mapped) return { ...mapped };

    if (javaType === 'List' || javaType === 'Set' || javaType === 'Collection') {
        return { type: 'array' };
    }
    if (javaType === 'Map') {
        return { type: 'object' };
    }
    return { type: 'string' };
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

function extractFieldType(unannType) {
    const refType = unannType.children.unannReferenceType?.[0];
    if (refType) {
        const classOrIface = refType.children.unannClassOrInterfaceType?.[0];
        if (classOrIface) {
            const classType = classOrIface.children.unannClassType?.[0];
            if (classType) {
                const baseType = classType.children.Identifier?.[0]?.image || 'unknown';
                let innerType = null;
                const ta = classType.children.typeArguments?.[0];
                if (ta) {
                    const tal = ta.children.typeArgumentList?.[0];
                    if (tal) {
                        const firstArg = tal.children.typeArgument?.[0];
                        if (firstArg) {
                            const rt = firstArg.children.referenceType?.[0];
                            if (rt) {
                                const coit2 = rt.children.classOrInterfaceType?.[0];
                                if (coit2) {
                                    const ct2 = coit2.children.classType?.[0];
                                    if (ct2) {
                                        innerType = ct2.children.Identifier?.[0]?.image || null;
                                    }
                                }
                            }
                        }
                    }
                }
                return { baseType, innerType };
            }
        }
    }
    const primWithDims = unannType.children.unannPrimitiveTypeWithOptionalDimsSuffix?.[0];
    if (primWithDims) {
        const primitiveName = extractPrimitiveName(primWithDims);
        if (primitiveName) return { baseType: primitiveName, innerType: null };
    }
    return { baseType: 'unknown', innerType: null };
}

function getAllJavaFiles(dirPath) {
    const results = [];
    function walk(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.java')) {
                results.push(fullPath);
            }
        }
    }
    walk(dirPath);
    return results;
}

const SPRING_STEREOTYPES = new Set([
    'RestController', 'Controller', 'Service', 'Repository',
    'Configuration', 'Component', 'ControllerAdvice', 'RestControllerAdvice',
]);

function isSpringComponent(cst) {
    const ocu = cst.children.ordinaryCompilationUnit?.[0];
    const typeDecl = ocu?.children?.typeDeclaration?.[0];
    if (!typeDecl) return false;
    const classDecl = typeDecl.children.classDeclaration?.[0];
    if (!classDecl) return false;
    const modifiers = classDecl.children.classModifier || [];
    for (const mod of modifiers) {
        const ann = mod.children.annotation?.[0];
        if (!ann) continue;
        const name = ann.children.typeName?.[0]?.children?.Identifier?.[0]?.image;
        if (SPRING_STEREOTYPES.has(name)) return true;
    }
    return false;
}

function parseJavaModels(filePaths) {
    const schemas = {};

    for (const filePath of filePaths) {
        let rawCode;
        try {
            rawCode = fs.readFileSync(filePath, 'utf-8');
        } catch {
            continue;
        }

        let cst;
        try {
            cst = parse(rawCode);
        } catch {
            continue;
        }

        if (isSpringComponent(cst)) continue;

        const ocu = cst.children.ordinaryCompilationUnit?.[0];
        const typeDecl = ocu?.children?.typeDeclaration?.[0];
        if (!typeDecl) continue;

        const classDecl = typeDecl.children.classDeclaration?.[0];
        if (!classDecl) continue;

        const normalClass = classDecl.children.normalClassDeclaration?.[0];
        if (!normalClass) continue;

        const className = normalClass.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;
        if (!className) continue;

        const classBody = normalClass.children.classBody?.[0];
        if (!classBody) continue;

        const properties = {};
        const declarations = classBody.children.classBodyDeclaration || [];

        for (const decl of declarations) {
            const fieldDecl = decl.children.classMemberDeclaration?.[0]?.children.fieldDeclaration?.[0];
            if (!fieldDecl) continue;

            const ut = fieldDecl.children.unannType?.[0];
            if (!ut) continue;

            const { baseType, innerType } = extractFieldType(ut);

            const vdl = fieldDecl.children.variableDeclaratorList?.[0];
            if (!vdl) continue;

            for (const vd of (vdl.children.variableDeclarator || [])) {
                const fieldName = vd.children.variableDeclaratorId?.[0]?.children?.Identifier?.[0]?.image;
                if (!fieldName) continue;

                const prop = inferOpenApiType(baseType);

                if (prop.type === 'array') {
                    prop.items = inferOpenApiType(innerType || 'String');
                }

                prop.example = generateExampleForProperty(fieldName, prop);
                properties[fieldName] = prop;
            }
        }

        if (Object.keys(properties).length > 0) {
            schemas[className] = {
                type: 'object',
                properties,
                example: buildObjectExample(properties),
            };
        }
    }

    return schemas;
}

function filterUsedSchemas(schemas, endpoints) {
    const referenced = new Set();
    for (const ep of endpoints) {
        if (ep.returnType && schemas[ep.returnType.type]) {
            referenced.add(ep.returnType.type);
        }
        for (const p of (ep.parameters || [])) {
            if (p.annotation === 'RequestBody' && schemas[p.type]) {
                referenced.add(p.type);
            }
        }
    }
    const filtered = {};
    for (const name of referenced) {
        filtered[name] = schemas[name];
    }
    return filtered;
}

module.exports = { getAllJavaFiles, parseJavaModels, filterUsedSchemas };

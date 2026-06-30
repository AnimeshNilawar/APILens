const fs = require('fs');
const { parse } = require('java-parser');

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

function extractStereotype(cst) {
    const ocu = cst.children.ordinaryCompilationUnit?.[0];
    const typeDecl = ocu?.children?.typeDeclaration?.[0];
    if (!typeDecl) return 'other';
    const classDecl = typeDecl.children.classDeclaration?.[0];
    if (!classDecl) return 'other';
    const modifiers = classDecl.children.classModifier || [];
    for (const mod of modifiers) {
        const ann = mod.children.annotation?.[0];
        if (!ann) continue;
        const name = ann.children.typeName?.[0]?.children?.Identifier?.[0]?.image;
        if (name && STEREOTYPE_MAP[name]) return STEREOTYPE_MAP[name];
    }
    return 'other';
}

function extractPackage(cst) {
    const ocu = cst.children.ordinaryCompilationUnit?.[0];
    if (!ocu) return '';
    const pd = ocu.children.packageDeclaration?.[0];
    if (!pd) return '';
    const name = pd.children.name?.[0];
    if (!name) return '';
    const parts = [];
    const first = name.children.fqnOrRefTypePartFirst?.[0]?.children?.fqnOrRefTypePartCommon?.[0]?.children?.Identifier?.[0]?.image;
    if (first) parts.push(first);
    const rest = name.children.fqnOrRefTypePartRest || [];
    for (const r of rest) {
        const id = r.children?.fqnOrRefTypePartCommon?.[0]?.children?.Identifier?.[0]?.image;
        if (id) parts.push(id);
    }
    return parts.join('.');
}

function extractClassName(cst) {
    const ocu = cst.children.ordinaryCompilationUnit?.[0];
    const typeDecl = ocu?.children?.typeDeclaration?.[0];
    if (!typeDecl) return null;
    const classDecl = typeDecl.children.classDeclaration?.[0];
    if (!classDecl) return null;
    const normalClass = classDecl.children.normalClassDeclaration?.[0];
    if (!normalClass) return null;
    return normalClass.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image || null;
}

function extractFieldsAndConstructor(cst) {
    const ocu = cst.children.ordinaryCompilationUnit?.[0];
    const typeDecl = ocu?.children?.typeDeclaration?.[0];
    if (!typeDecl) return { fields: {}, constructorParams: [] };
    const classDecl = typeDecl.children.classDeclaration?.[0];
    if (!classDecl) return { fields: {}, constructorParams: [] };
    const normalClass = classDecl.children.normalClassDeclaration?.[0];
    if (!normalClass) return { fields: {}, constructorParams: [] };
    const classBody = normalClass.children.classBody?.[0];
    if (!classBody) return { fields: {}, constructorParams: [] };

    const fields = {};
    const constructorParams = [];
    const declarations = classBody.children.classBodyDeclaration || [];

    for (const decl of declarations) {
        const member = decl.children.classMemberDeclaration?.[0];
        const constrDecl = decl.children.constructorDeclaration?.[0];

        if (member) {
            const fieldDecl = member.children.fieldDeclaration?.[0];
            if (fieldDecl) {
                const ut = fieldDecl.children.unannType?.[0];
                if (!ut) continue;
                const refType = ut.children.unannReferenceType?.[0];
                const className = refType?.children?.unannClassOrInterfaceType?.[0]?.children?.unannClassType?.[0]?.children?.Identifier?.[0]?.image;
                if (!className) continue;
                const vdl = fieldDecl.children.variableDeclaratorList?.[0];
                if (!vdl) continue;
                for (const vd of (vdl.children.variableDeclarator || [])) {
                    const fieldName = vd.children.variableDeclaratorId?.[0]?.children?.Identifier?.[0]?.image;
                    if (fieldName) fields[fieldName] = className;
                }
                continue;
            }
        }

        if (constrDecl) {
            const cdec = constrDecl.children.constructorDeclarator?.[0];
            if (!cdec) continue;
            const fpl = cdec.children.formalParameterList?.[0];
            if (!fpl) continue;
            for (const fp of (fpl.children.formalParameter || [])) {
                const vprp = fp.children.variableParaRegularParameter?.[0];
                if (!vprp) continue;
                const ut = vprp.children.unannType?.[0];
                if (!ut) continue;
                const refType = ut.children.unannReferenceType?.[0];
                const className = refType?.children?.unannClassOrInterfaceType?.[0]?.children?.unannClassType?.[0]?.children?.Identifier?.[0]?.image;
                if (className) constructorParams.push(className);
            }
        }
    }

    return { fields, constructorParams };
}

function extractMethods(cst, rawCode) {
    const ocu = cst.children.ordinaryCompilationUnit?.[0];
    const typeDecl = ocu?.children?.typeDeclaration?.[0];
    if (!typeDecl) return {};
    const classDecl = typeDecl.children.classDeclaration?.[0];
    if (!classDecl) return {};
    const normalClass = classDecl.children.normalClassDeclaration?.[0];
    if (!normalClass) return {};
    const classBody = normalClass.children.classBody?.[0];
    if (!classBody) return {};

    const methods = {};
    const declarations = classBody.children.classBodyDeclaration || [];

    for (const decl of declarations) {
        const member = decl.children.classMemberDeclaration?.[0];
        if (!member) continue;
        const methodDecl = member.children.methodDeclaration?.[0];
        if (!methodDecl) continue;

        const methodName = methodDecl.children.methodHeader?.[0]
            ?.children.methodDeclarator?.[0]
            ?.children.Identifier?.[0]?.image;
        if (!methodName) continue;

        const methodBody = methodDecl.children.methodBody?.[0];
        if (!methodBody || !methodBody.location) continue;

        const bodyText = rawCode.substring(methodBody.location.startOffset, methodBody.location.endOffset);
        methods[methodName] = { bodyText };
    }

    return methods;
}

function analyzeDependencies(javaFiles) {
    const classes = {};

    for (const filePath of javaFiles) {
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

        const className = extractClassName(cst);
        if (!className) continue;

        const { fields, constructorParams } = extractFieldsAndConstructor(cst);
        const methods = extractMethods(cst, rawCode);

        classes[className] = {
            package: extractPackage(cst),
            stereotype: extractStereotype(cst),
            fields,
            constructorParams,
            methods,
        };
    }

    const dependencies = [];
    for (const [className, cls] of Object.entries(classes)) {
        for (const paramType of cls.constructorParams) {
            if (classes[paramType]) {
                dependencies.push({ from: className, to: paramType });
            }
        }
    }

    return { classes, dependencies };
}

function findMethodCalls(bodyText, fields) {
    const calls = [];
    for (const [fieldName, fieldType] of Object.entries(fields)) {
        const re = new RegExp(fieldName + '\\.(\\w+)\\s*\\(', 'g');
        let match;
        while ((match = re.exec(bodyText)) !== null) {
            calls.push({
                fieldType,
                targetClass: fieldType,
                targetMethod: match[1],
                source: match[0],
            });
        }
    }
    return calls;
}

function buildCallChain(className, methodName, classes, depth) {
    if (depth > 4) return [];
    const cls = classes[className];
    if (!cls) return [];

    const method = cls.methods[methodName];
    if (!method) return [];

    const chain = [];
    const calls = findMethodCalls(method.bodyText, cls.fields);

    for (const call of calls) {
        const fromLabel = className + '.' + methodName;
        const toLabel = call.targetClass + '.' + call.targetMethod;
        chain.push({ from: fromLabel, to: toLabel });
        const subChain = buildCallChain(call.targetClass, call.targetMethod, classes, depth + 1);
        for (const sub of subChain) {
            if (!chain.some(c => c.from === sub.from && c.to === sub.to)) {
                chain.push(sub);
            }
        }
    }

    return chain;
}

module.exports = { analyzeDependencies, findMethodCalls, buildCallChain };

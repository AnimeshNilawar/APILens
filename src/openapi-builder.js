const fs = require('fs');
const { generateExampleFromSchema } = require('./utils/example-generator');
const { filterUsedSchemas } = require('./model-parser');

const PARAM_IN_MAP = {
    PathVariable: 'path',
    RequestParam: 'query',
    RequestHeader: 'header',
};

function makeParamOpenApi(param) {
    const inLocation = PARAM_IN_MAP[param.annotation];
    if (!inLocation) return null;

    return {
        name: param.annotationValue || param.name,
        in: inLocation,
        required: inLocation === 'path',
        schema: { type: inferOpenApiType(param.type) },
        description: `${param.annotation} "${param.name}"`,
    };
}

function inferOpenApiType(javaType) {
    const map = {
        String: 'string',
        Long: 'integer',
        Integer: 'integer',
        int: 'integer',
        long: 'integer',
        Boolean: 'boolean',
        boolean: 'boolean',
        Double: 'number',
        double: 'number',
        Float: 'number',
        float: 'number',
    };
    return map[javaType] || 'string';
}

function refSchema(schemaName) {
    return { $ref: '#/components/schemas/' + schemaName };
}

function arrayOfRef(schemaName) {
    return {
        type: 'array',
        items: refSchema(schemaName),
    };
}

function resolveResponseSchema(endpoint, schemas) {
    const rt = endpoint.returnType;
    if (!rt) return { type: 'object', properties: {} };

    const schemaName = rt.type;
    if (!schemas[schemaName]) return { type: 'object', properties: {} };

    if (rt.isArray) {
        return {
            type: 'array',
            items: refSchema(schemaName),
            example: [ generateExampleFromSchema(schemas[schemaName], schemas) ],
        };
    }

    return refSchema(schemaName);
}

function resolveRequestBodySchema(endpoint, schemas) {
    const bodyParam = (endpoint.parameters || []).find(p => p.annotation === 'RequestBody');
    if (!bodyParam) return undefined;

    let schema;
    if (schemas[bodyParam.type]) {
        schema = refSchema(bodyParam.type);
    } else {
        schema = {
            type: 'object',
            properties: {},
            description: bodyParam.name + ': ' + bodyParam.type,
        };
    }

    return {
        required: true,
        content: {
            'application/json': { schema },
        },
    };
}

function buildParameters(endpoint) {
    const params = [];
    for (const p of endpoint.parameters || []) {
        if (p.annotation === 'RequestBody') continue;
        const openapiParam = makeParamOpenApi(p);
        if (openapiParam) params.push(openapiParam);
    }
    return params.length ? params : undefined;
}

function buildTags(spec) {
    const tagSet = new Set();
    for (const ep of spec.endpoints) {
        if (ep.controller) tagSet.add(ep.controller);
    }
    return Array.from(tagSet).map(name => ({ name }));
}

function generateOpenApiSpec(endpoints, schemas = {}, depData = null, outputPath = './openapi.json') {
    schemas = filterUsedSchemas(schemas, endpoints);

    const spec = {
        openapi: "3.0.3",
        info: {
            title: "Automated Spring Boot API Documentation",
            description: "Locally generated API specification using static AST analysis.",
            version: "1.0.0"
        },
        paths: {},
        components: Object.keys(schemas).length > 0 ? { schemas } : undefined,
        tags: buildTags({ endpoints }),
    };

    if (depData && depData.dependencies.length > 0) {
        spec['x-dependencies'] = depData.dependencies;
    }

    endpoints.forEach(ep => {
        const verb = ep.httpMethod.toLowerCase();

        if (!spec.paths[ep.fullPath]) {
            spec.paths[ep.fullPath] = {};
        }

        const codes = ep.responseCodes || [200];
        const responses = {};
        const successSchema = resolveResponseSchema(ep, schemas);
        for (const code of codes) {
            if (code === 204) {
                responses["204"] = { description: "No content" };
            } else if (code === 404) {
                responses["404"] = { description: "Resource not found" };
            } else if (code === 400) {
                responses["400"] = { description: "Bad request" };
            } else {
                const desc = code === 201 ? "Created" : "Successful response";
                responses[String(code)] = {
                    description: desc,
                    content: { "application/json": { schema: successSchema } },
                };
            }
        }

        const operation = {
            summary: ep.methodName,
            operationId: ep.methodName,
            tags: ep.controller ? [ep.controller] : undefined,
            parameters: buildParameters(ep),
            requestBody: resolveRequestBodySchema(ep, schemas),
            responses,
        };

        if (ep.xFlow) operation['x-flow'] = ep.xFlow;
        if (ep.xCalls && ep.xCalls.length > 0) operation['x-calls'] = ep.xCalls;

        spec.paths[ep.fullPath][verb] = operation;
    });

    fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf-8');
    console.log(`OpenAPI Specification written to: ${outputPath}`);
    return spec;
}

module.exports = { generateOpenApiSpec };

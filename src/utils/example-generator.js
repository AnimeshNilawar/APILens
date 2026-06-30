const NAME_HEURISTICS = [
    { names: ['email', 'mail'], value: 'user@example.com' },
    { names: ['password', 'pass', 'secret'], value: '********' },
    { names: ['name', 'firstName', 'lastName', 'fullName', 'username'], value: 'John Doe' },
    { names: ['id', 'userId', 'orderId', 'productId', 'customerId'], value: 1 },
    { names: ['phone', 'phoneNumber', 'mobile', 'telephone'], value: '+1-555-555-0100' },
    { names: ['price', 'cost', 'amount', 'total', 'totalAmount'], value: 9.99 },
    { names: ['age'], value: 25 },
    { names: ['count', 'stock', 'quantity', 'limit'], value: 0 },
    { names: ['description', 'desc', 'summary'], value: 'Sample description' },
    { names: ['status'], value: 'active' },
    { names: ['url', 'website', 'link', 'href'], value: 'https://example.com' },
    { names: ['address', 'location'], value: '123 Main St' },
    { names: ['title'], value: 'Sample Title' },
    { names: ['city'], value: 'New York' },
    { names: ['country'], value: 'US' },
    { names: ['state', 'province'], value: 'NY' },
    { names: ['zip', 'zipCode', 'postalCode'], value: '10001' },
    { names: ['token', 'accessToken', 'refreshToken', 'jwt'], value: 'eyJhbGciOiJIUzI1NiJ9.example' },
    { names: ['message', 'msg', 'error'], value: 'Operation completed successfully' },
    { names: ['success'], value: true },
    { names: ['enabled', 'active', 'verified'], value: true },
    { names: ['rating', 'score'], value: 4.5 },
    { names: ['page', 'offset'], value: 0 },
    { names: ['size', 'perPage'], value: 20 },
    { names: ['type', 'kind', 'category', 'role'], value: 'standard' },
    { names: ['currency'], value: 'USD' },
    { names: ['language', 'locale'], value: 'en-US' },
    { names: ['timezone', 'tz'], value: 'UTC' },
    { names: ['color', 'colour'], value: '#000000' },
];

function generateExampleForProperty(name, prop) {
    const lower = name.toLowerCase();

    for (const heuristic of NAME_HEURISTICS) {
        if (heuristic.names.includes(lower)) {
            return heuristic.value;
        }
    }

    if (prop.format === 'date-time' || prop.format === 'date') {
        return '2024-01-15T10:30:00Z';
    }
    if (prop.format === 'int64' || prop.format === 'int32') {
        return 1;
    }
    if (prop.format === 'double' || prop.format === 'float') {
        return 3.14;
    }

    if (prop.type === 'string') return 'example';
    if (prop.type === 'integer') return 1;
    if (prop.type === 'number') return 3.14;
    if (prop.type === 'boolean') return true;
    if (prop.type === 'array') {
        const itemExample = generateExampleForProperty('item', prop.items || { type: 'string' });
        return [itemExample];
    }
    if (prop.type === 'object') return {};

    return 'example';
}

function buildObjectExample(properties) {
    const example = {};
    for (const [key, prop] of Object.entries(properties || {})) {
        example[key] = prop.example !== undefined ? prop.example : generateExampleForProperty(key, prop);
    }
    return example;
}

function generateExampleFromSchema(schema, allSchemas) {
    if (!schema) return null;

    if (schema.$ref) {
        const schemaName = schema.$ref.split('/').pop();
        const resolved = allSchemas?.[schemaName];
        if (!resolved) return {};
        return buildObjectExample(resolved.properties);
    }

    if (schema.example !== undefined) return schema.example;

    if (schema.type === 'object') {
        if (!schema.properties) return {};
        const result = {};
        for (const [key, prop] of Object.entries(schema.properties)) {
            result[key] = generateExampleFromSchema(prop, allSchemas);
        }
        return result;
    }

    if (schema.type === 'array') {
        const itemExample = generateExampleFromSchema(schema.items, allSchemas);
        return [itemExample].filter(e => e !== null);
    }

    if (schema.type === 'string') {
        if (schema.enum && schema.enum.length > 0) return schema.enum[0];
        return 'example';
    }
    if (schema.type === 'integer') return 1;
    if (schema.type === 'number') return 3.14;
    if (schema.type === 'boolean') return true;

    return null;
}

module.exports = { generateExampleForProperty, buildObjectExample, generateExampleFromSchema };

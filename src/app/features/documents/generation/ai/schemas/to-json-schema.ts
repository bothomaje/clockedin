import { AiJsonSchema } from '../ai-provider';

/** Plain JSON Schema (draft-07 shape), for providers that don't take Firebase's Schema builder. */
export function toJsonSchema(schema: AiJsonSchema): Record<string, unknown> {
  switch (schema.type) {
    case 'string':
      return { type: 'string' };
    case 'array':
      return { type: 'array', items: toJsonSchema(schema.items) };
    case 'object':
      return {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(schema.properties).map(([key, value]) => [key, toJsonSchema(value)]),
        ),
        required: schema.required,
        additionalProperties: false,
      };
  }
}

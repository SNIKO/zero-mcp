import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ZodSchema } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { JsonRpcRequestSchema, type JsonRpcId, type JsonRpcRequest } from './types.js';

const HTTP_OK = 200;

/**
 * Reads the JSON-RPC payload from an incoming HTTP request and validates it.
 */
export async function readRequestBody(req: IncomingMessage): Promise<JsonRpcRequest> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    const bufferChunk = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    chunks.push(bufferChunk);
  }

  const bodyText = Buffer.concat(chunks).toString('utf-8');
  const parsedBody = JSON.parse(bodyText);
  return JsonRpcRequestSchema.parse(parsedBody);
}

/**
 * Sends an HTTP error response with the provided status and message.
 */
export function sendError(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { 'Content-Type': 'text/plain' }).end(message);
}

/**
 * Sends a JSON-RPC error object with the given protocol error code and message.
 */
export function sendJsonRpcProtocolError(
  res: ServerResponse,
  requestId: JsonRpcId,
  code: number,
  message: string,
): void {
  const errorResponse = {
    jsonrpc: '2.0',
    id: requestId,
    error: {
      code,
      message,
    },
  };

  res.writeHead(HTTP_OK, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(errorResponse));
}

export function sendJsonRpcResponse(
  res: ServerResponse,
  requestId: JsonRpcId,
  response: object,
): void {
  const jsonResponse = {
    jsonrpc: '2.0',
    id: requestId,
    result: response,
  };

  res.writeHead(HTTP_OK, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(jsonResponse));
}

function normalizeSchema(schema: object): object {
  if ('$ref' in schema && 'definitions' in schema) {
    const { $ref, definitions } = schema as {
      $ref: string;
      definitions: Record<string, unknown>;
    };

    const refKey = $ref.replace('#/definitions/', '');
    const resolved = definitions?.[refKey];

    if (resolved && typeof resolved === 'object') {
      return resolved;
    }
  }

  return schema;
}

export function zodSchemaToToolSchema(toolName: string, schema: ZodSchema): object {
  const jsonSchema = zodToJsonSchema(schema, {
    target: 'jsonSchema7',
    name: toolName,
  });

  const normalized = normalizeSchema(jsonSchema);
  return normalized;
}

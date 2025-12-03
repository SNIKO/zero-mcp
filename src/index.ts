/**
 * Zero MCP - Lightweight MCP server SDK
 *
 * A simple, easy-to-use SDK for creating Model Context Protocol servers with minimal code.
 */

// Types
export type { McpServerOptions } from './server.js';
export type {
  ToolResponseContent,
  ToolInput,
  ServerHooks,
  ToolDefinition,
  ToolHandler,
} from './types.js';
export type {
  HttpTransportOptions,
  HttpMethod,
  RouteHandler,
} from './http/types.js';
export { DEFAULT_HTTP_TRANSPORT_OPTIONS } from './http/types.js';

// Runtime exports
export { McpServer } from './server.js';
export { HttpTransport } from './http/http-transport.js';

// Re-export zod for convenience
export { z, type ZodSchema } from 'zod';

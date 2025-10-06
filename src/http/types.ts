import { z } from 'zod';
import { ServerHooks } from '../types';

/**
 * Configuration options for the HTTP transport.
 *
 * @typedef {Object} HttpTransportConfig
 * @property {number} port - The port number for the HTTP transport. Default is 3000.
 * @property {string} host - The hostname for the HTTP transport. Default is "localhost".
 * @property {string} path - The path for the HTTP transport. Default is "/mcp".
 *
 * @constant {HttpTransportConfig} DEFAULT_HTTP_TRANSPORT_CONFIG
 * @description The default configuration for the HTTP transport.
 * This configuration uses the following default values:
 * - port: 3000
 * - host: "localhost"
 * - path: "/mcp"
 */
export interface HttpTransportOptions {
  port?: number;
  host?: string;
  path?: string;
  hooks?: ServerHooks;
  allowedOrigins?: string[] | '*';
}

export const DEFAULT_HTTP_TRANSPORT_OPTIONS: HttpTransportOptions = {
  port: 3000,
  host: 'localhost',
  path: '/mcp',
  allowedOrigins: '*',
};

export const ErrorCode = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
  NotInitialized: -32002,
} as const;

export type JsonRpcId = string | number | null;

export const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]).optional(),
  method: z.string(),
  params: z.union([z.record(z.unknown()), z.array(z.unknown())]).optional(),
});

export type JsonRpcRequest = z.infer<typeof JsonRpcRequestSchema>;

export const InitializeParamsSchema = z.object({
  protocolVersion: z.string().min(1, 'protocolVersion is required'),
  clientInfo: z.object({
    name: z.string().min(1, 'clientInfo.name is required'),
    version: z.string().min(1, 'clientInfo.version is required'),
  }),
  capabilities: z.record(z.unknown()).optional(),
});

export const CallToolParamsSchema = z.object({
  name: z.string().min(1, 'Tool name is required'),
  arguments: z.record(z.unknown()).optional(),
});

export type CallToolParams = z.infer<typeof CallToolParamsSchema>;

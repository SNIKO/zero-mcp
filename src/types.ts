import { z, type ZodTypeAny } from 'zod';
import type { IncomingMessage } from 'node:http';

export interface TextToolResponse {
  type: 'text';
  text: string;
}

export interface MediaToolResponse {
  type: 'image' | 'audio';
  data: string;
  mimeType: string;
}

export type ToolResponseContent = TextToolResponse | MediaToolResponse;

export type ToolInput = Record<string, unknown>;

export interface ToolContext {
  request: IncomingMessage;
}

export type ToolHandler<T> = (
  input: T,
  context?: ToolContext,
) => ToolResponseContent[] | Promise<ToolResponseContent[]>;

/**
 * Declarative description of a Model Context Protocol tool. The provided Zod schema
 * is automatically converted to JSON schema used by MCP tools api.
 */
export interface ToolDefinition<TSchema extends ZodTypeAny> {
  name: string;
  description?: string;
  schema: TSchema;
  handler: ToolHandler<z.infer<TSchema>>;
}

/**
 * Hook callbacks emitted during server lifecycle events.
 */
export interface ServerHooks {
  onClientConnected?: (clientName: string, clientVersion: string, protocolVersion: string) => void;
  onToolRegistered?: (toolName: string, description: string) => void;
  onToolCallStarted?: (toolName: string, input: ToolInput) => void;
  onToolCallFinished?: (
    toolName: string,
    input: ToolInput,
    result: ToolResponseContent[],
    elapsedMs: number,
  ) => void;
  onToolCallError?: (
    toolName: string,
    input: ToolInput,
    error: Error | string,
    elapsedMs: number,
  ) => void;
  onToolsListRequested?: () => void;
  onServerError?: (error: Error | string) => void;
}

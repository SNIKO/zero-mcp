import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { ZodError } from 'zod';

import type { McpServer } from '../server.js';
import type { ToolInput, ToolResponseContent } from '../types.js';
import {
  readRequestBody,
  sendError,
  sendJsonRpcProtocolError,
  sendJsonRpcResponse,
  zodSchemaToToolSchema,
} from './utilities.js';
import {
  CallToolParamsSchema,
  InitializeParamsSchema,
  HttpTransportOptions,
  DEFAULT_HTTP_TRANSPORT_OPTIONS,
  ErrorCode,
  type CallToolParams,
  type JsonRpcRequest,
} from './types.js';

export class HttpTransport {
  private server: Server | null = null;
  private readonly options: HttpTransportOptions;
  private readonly mcpServer: McpServer;
  private readonly allowedOrigins: string[] | '*';

  constructor(mcpServer: McpServer, config?: HttpTransportOptions) {
    if (!mcpServer) {
      throw new Error('MCP server instance is required');
    }

    this.options = { ...DEFAULT_HTTP_TRANSPORT_OPTIONS, ...config };
    this.allowedOrigins = this.normalizeAllowedOrigins(this.options);
    this.mcpServer = mcpServer;
  }

  start(): Promise<void> {
    if (this.server) {
      throw new Error('Server is already running');
    }

    const hooks = this.options.hooks;
    const server = createServer((req, res) => {
      this.handleHttpRequest(req, res).catch((error) => hooks?.onServerError?.(error));
    });

    this.server = server;

    return new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(this.options.port, this.options.host, () => resolve());
    });
  }

  async stop(): Promise<void> {
    const server = this.server;
    if (!server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    this.server = null;
  }

  private async handleHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (!this.ensureCors(req, res)) {
      return;
    }

    if (!this.canHandle(req, res)) {
      return;
    }

    let requestId = null;

    try {
      const parsedRequest = await readRequestBody(req);
      requestId = parsedRequest.id ?? null;

      switch (parsedRequest.method) {
        case 'initialize':
          this.handleInitialize(parsedRequest, res);
          break;
        case 'tools/list':
          this.handleToolsList(parsedRequest, res);
          break;
        case 'tools/call':
          await this.handleToolCall(parsedRequest, res);
          break;
        case 'ping':
          sendJsonRpcResponse(res, requestId, { status: 'ok' });
          break;
        default:
          sendJsonRpcProtocolError(res, requestId, ErrorCode.MethodNotFound, 'Method not found');
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJsonRpcProtocolError(res, requestId, ErrorCode.ParseError, 'Invalid JSON');
      } else if (error instanceof ZodError) {
        sendJsonRpcProtocolError(res, requestId, ErrorCode.InvalidParams, 'Invalid request format');
      } else {
        sendJsonRpcProtocolError(res, requestId, ErrorCode.InternalError, 'Internal server error');
      }
      return;
    }
  }

  private canHandle(req: IncomingMessage, res: ServerResponse): boolean {
    if (req.method === 'OPTIONS') {
      this.sendPreflightResponse(req, res);
      return false;
    }

    // Check if the request path matches the configured MCP path, i.e. /mcp by default
    const requestPath = (req.url ?? '').split('?')[0];
    if (requestPath !== this.options.path) {
      sendError(res, 404, 'Not found');
      return false;
    }

    // Only POST method is allowed for MCP requests
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, OPTIONS');
      sendError(res, 405, 'Method not allowed');
      return false;
    }

    return true;
  }

  private normalizeAllowedOrigins(options: HttpTransportOptions): string[] | '*' {
    if (!options.allowedOrigins || options.allowedOrigins === '*') {
      return '*';
    }

    return options.allowedOrigins;
  }

  private ensureCors(req: IncomingMessage, res: ServerResponse): boolean {
    const origin = req.headers.origin;

    if (this.allowedOrigins === '*') {
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Vary', 'Origin');
      }
      res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
      return true;
    }

    if (!origin) {
      return true;
    }

    if (this.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
      res.setHeader('Vary', 'Origin');
      return true;
    }

    sendError(res, 403, 'Forbidden origin');
    return false;
  }

  private sendPreflightResponse(req: IncomingMessage, res: ServerResponse): void {
    const requestHeaders = req.headers['access-control-request-headers'];
    const headersValue = Array.isArray(requestHeaders)
      ? requestHeaders.join(', ')
      : requestHeaders ?? 'Content-Type, Accept, Mcp-Session-Id';

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', headersValue);

    if (this.allowedOrigins !== '*') {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.writeHead(204).end();
  }

  private handleInitialize(request: JsonRpcRequest, res: ServerResponse): void {
    const { success, data, error } = InitializeParamsSchema.safeParse(request.params);
    if (!success) {
      sendJsonRpcProtocolError(
        res,
        null,
        ErrorCode.ParseError,
        'Unable to parse RPC request: ' + error.message,
      );
      return;
    }

    this.options.hooks?.onClientConnected?.(
      data.clientInfo.name,
      data.clientInfo.version,
      data.protocolVersion,
    );

    sendJsonRpcResponse(res, request.id ?? null, {
      protocolVersion: data.protocolVersion,
      serverInfo: {
        name: this.mcpServer.name,
        version: this.mcpServer.version,
      },
      capabilities: {
        tools: {},
      },
    });
  }

  private handleToolsList(request: JsonRpcRequest, res: ServerResponse): void {
    this.options.hooks?.onToolsListRequested?.();
    const tools = this.mcpServer.getTools();
    const toolDefinitions = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodSchemaToToolSchema(tool.name, tool.schema),
    }));
    sendJsonRpcResponse(res, request.id ?? null, { tools: toolDefinitions });
  }

  private async handleToolCall(request: JsonRpcRequest, res: ServerResponse): Promise<void> {
    const params = this.parseToolCallParams(request, res);
    if (!params) {
      return;
    }

    const requestId = request.id ?? null;
    const tool = this.mcpServer.getTool(params.name);
    if (!tool) {
      sendJsonRpcProtocolError(
        res,
        requestId,
        ErrorCode.InvalidParams,
        `Tool '${params.name}' not found`,
      );
      return;
    }

    const rawInput = (params.arguments ?? {}) as ToolInput;
    const start = performance.now();
    const parsedInput = this.validateToolInput(tool, params.name, rawInput, start, res, requestId);
    if (parsedInput === undefined) {
      return;
    }

    this.options.hooks?.onToolCallStarted?.(params.name, rawInput);

    try {
      const result = await tool.handler(parsedInput);
      this.recordToolSuccess(params.name, rawInput, result, start);
      sendJsonRpcResponse(res, requestId, { content: result });
    } catch (error) {
      const responseMessage =
        error instanceof Error ? error.message : 'Unknown error occurred while calling tool';
      this.recordToolError(
        params.name,
        rawInput,
        error instanceof Error ? error : responseMessage,
        start,
      );
      sendJsonRpcProtocolError(res, requestId, ErrorCode.InternalError, responseMessage);
    }
  }

  private parseToolCallParams(request: JsonRpcRequest, res: ServerResponse): CallToolParams | null {
    const { success, data, error } = CallToolParamsSchema.safeParse(request.params);
    if (success) {
      return data;
    }

    sendJsonRpcProtocolError(
      res,
      null,
      ErrorCode.ParseError,
      'Unable to parse RPC request: ' + error.message,
    );
    return null;
  }

  private validateToolInput(
    tool: NonNullable<ReturnType<McpServer['getTool']>>,
    toolName: string,
    rawInput: ToolInput,
    start: number,
    res: ServerResponse,
    requestId: string | number | null,
  ): unknown {
    const parsedInput = tool.schema.safeParse(rawInput);
    if (parsedInput.success) {
      return parsedInput.data;
    }

    const errorDetails = parsedInput.error.flatten();
    const errorStr = JSON.stringify(errorDetails, null, 2);
    this.recordToolError(toolName, rawInput, errorStr, start);
    sendJsonRpcProtocolError(
      res,
      requestId,
      ErrorCode.InvalidParams,
      `Invalid tool arguments: ${errorStr}`,
    );
    return undefined;
  }

  private recordToolSuccess(
    toolName: string,
    rawInput: ToolInput,
    result: ToolResponseContent[],
    startedAt: number,
  ): void {
    const elapsed = this.elapsedSince(startedAt);
    this.options.hooks?.onToolCallFinished?.(toolName, rawInput, result, elapsed);
  }

  private recordToolError(
    toolName: string,
    rawInput: ToolInput,
    error: Error | string,
    startedAt: number,
  ): void {
    const elapsed = this.elapsedSince(startedAt);
    this.options.hooks?.onToolCallError?.(toolName, rawInput, error, elapsed);
  }

  private elapsedSince(startedAt: number): number {
    return performance.now() - startedAt;
  }
}

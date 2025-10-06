import { HttpTransport } from './http/http-transport.js';
import { HttpTransportOptions } from './http/types.js';
import type { ZodTypeAny } from 'zod';
import type { ServerHooks, ToolDefinition } from './types.js';

/**
 * Configuration accepted by {@link McpServer}.
 */
/**
 * Configuration options for the MCP server.
 *
 * @interface McpServerConfig
 * @property {string} name - The name of the server. (Default: "MyMcpServer")
 * @property {string} version - The version of the server. (Default: "1.0.0")
 * @property {ServerHooks} [hooks] - Optional hooks for server events.
 */
export interface McpServerOptions {
  name?: string;
  version?: string;
  hooks?: ServerHooks;
}

/**
 * Minimal MCP server that registers tools and serves the HTTP transport.
 */
export class McpServer {
  public readonly name: string;
  public readonly version: string;

  private readonly _tools = new Map<string, ToolDefinition<ZodTypeAny>>();
  private readonly hooks?: ServerHooks;
  private transport?: HttpTransport;

  constructor({ name = 'MyMcpServer', version = '1.0.0', hooks }: McpServerOptions) {
    this.name = name;
    this.version = version;
    this.hooks = hooks;
  }

  getTools(): ToolDefinition<ZodTypeAny>[] {
    return [...this._tools.values()];
  }

  getTool(name: string): ToolDefinition<ZodTypeAny> | undefined {
    return this._tools.get(name);
  }

  hasTool(name: string): boolean {
    return this._tools.has(name);
  }

  tool<TSchema extends ZodTypeAny>(tool: ToolDefinition<TSchema>): this {
    if (this._tools.has(tool.name)) {
      throw new Error(`Tool '${tool.name}' is already registered`);
    }

    this._tools.set(tool.name, tool as unknown as ToolDefinition<ZodTypeAny>);
    this.hooks?.onToolRegistered?.(tool.name, tool.description ?? '');
    return this;
  }

  /**
   * Starts the mcp server in Http mode.
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
  async start(options?: HttpTransportOptions): Promise<void> {
    if (this.transport) {
      throw new Error('Server is already started');
    }

    const finalOptions = { ...options, hooks: { ...this.hooks, ...options?.hooks } };

    this.transport = new HttpTransport(this, finalOptions);
    await this.transport.start();
  }

  async stop(): Promise<void> {
    if (!this.transport) {
      throw new Error('Server is not started');
    }

    await this.transport.stop();
    this.transport = undefined;
  }
}

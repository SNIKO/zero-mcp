# Zero MCP

> Zero-boilerplate HTTP MCP server toolkit. Skip the weight of `@modelcontextprotocol/sdk` and start shipping MCP tools in minutes.

## Why Zero MCP instead of the official SDK?

| Topic                  | Zero MCP                                                         | `@modelcontextprotocol/sdk`                                                                             |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Installation footprint | 2 runtime deps (`zod`, `zod-to-json-schema`) – nothing else        | Ships 12 direct dependencies including Express, CORS, rate limiting, EventSource, PKCE, etc.            |
| Default transport      | Native `node:http` server with JSON-RPC endpoints                  | Multiple transports (stdio, HTTP, SSE) implemented on top of Express & supporting packages              |
| Tool schemas           | Built-in Zod tooling with automatic JSON Schema emission           | Requires wiring schemas into `registerTool` manually (no Zod helper layer)                              |
| Observability          | Lifecycle hooks for connections, tool calls, errors out of the box | Requires custom event wiring per transport                                                              |
| Boilerplate to start   | Instantiate `McpServer`, register tools, call `start()`            | Official quick start builds an Express app, manages transports, and handles streaming sessions manually |
| Focus                  | Minimal server implementation for MCP tools API over HTTP          | Full spec implementation (clients, prompts, auth, transports) – heavier when you only need tools        |

Keep the official SDK for large deployments or full MCP surface area. Reach for Zero MCP when you want:

- A tiny package that respects disk and cold-start budgets.
- Zod-first ergonomics without extra wrappers.
- Drop-in hooks for instrumentation and logging.
- A simple HTTP endpoint that plays nicely with reverse proxies, serverless functions, and edge runtimes.
- Spec-aligned CORS guard so browser MCP clients connect safely without extra middleware.

## Installation

```bash
npm install zero-mcp zod
```

`zero-mcp` re-exports `z`, but keeping an explicit `zod` dependency avoids bundler surprises.

## Minimal server example

```typescript
import { McpServer, type ToolDefinition, z } from 'zero-mcp';

const server = new McpServer({
  name: 'calculator',
  version: '1.0.0',
});

const addSchema = z.object({
  a: z.number().describe('First addend'),
  b: z.number().describe('Second addend'),
});

const add: ToolDefinition<typeof addSchema> = {
  name: 'add',
  description: 'Add two numbers',
  schema: addSchema,
  handler: async ({ a, b }) => [
    {
      type: 'text',
      text: `Result: ${a + b}`,
    },
  ],
};

server.tool(add);

await server.start({
  host: '127.0.0.1',
  port: 3000,
  path: '/mcp',
});

console.log('Ready on http://127.0.0.1:3000/mcp');
// Later: await server.stop();
```

The server spins up a native HTTP listener and responds to MCP JSON-RPC calls at `/mcp`.

## CORS controls

Zero MCP validates the `Origin` header and emits CORS headers recommended by the MCP HTTP transport guidance. By default, `allowedOrigins` is set to `'*'`, which is convenient for local tooling. For production, pass an explicit allow-list:

```typescript
await server.start({
  allowedOrigins: ['https://my-mcp-console.example'],
});
```

## Hooks for diagnostics and analytics

Instrument behaviour by providing hooks either at construction time or when starting the server:

```typescript
const server = new McpServer({
  name: 'instrumented',
  version: '1.2.0',
  hooks: {
    onClientConnected(name, version, protocolVersion) {
      console.log(`[connect] ${name}@${version} via ${protocolVersion}`);
    },
    onToolRegistered(toolName) {
      console.log(`[register] ${toolName}`);
    },
    onToolCallStarted(toolName, input) {
      console.log(`[call:start] ${toolName}`, input);
    },
    onToolCallFinished(toolName, input, result, elapsedMs) {
      console.log(`[call:finish] ${toolName} in ${elapsedMs.toFixed(1)}ms`);
    },
    onToolCallError(toolName, input, error) {
      console.error(`[call:error] ${toolName}`, error);
    },
    onToolsListRequested() {
      console.log('[tools] list requested');
    },
    onServerError(error) {
      console.error('[server:error]', error);
    },
  },
});
```

## Example project

A runnable weather server lives in `example/`. Run it locally with:

```bash
npm run example
```

This builds the library, compiles the example, and starts listening on `http://localhost:3005/mcp`.

## License

MIT © Sergii Vashchyshchuk

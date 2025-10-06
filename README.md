# Zero MCP

> Zero-boilerplate HTTP MCP server toolkit. Skip the weight of `@modelcontextprotocol/sdk` and start shipping MCP tools in minutes.

## Why Zero MCP instead of the official SDK?

The official `@modelcontextprotocol/sdk` ships with **significant overhead**—both in dependencies and performance—while implementing features most developers never use and missing critical conveniences. Zero MCP takes the opposite approach: minimal dependencies, faster cold starts, and ergonomics that get you shipping in minutes.

**What's wrong with the official SDK?**

- **Dependency bloat** – Bundles 12+ packages (Express, CORS middleware, rate limiting, EventSource polyfills, PKCE utilities) even for simple tool servers
- **Performance overhead** – Express-based transport stack adds latency and memory footprint versus native `node:http`
- **Boilerplate hell** – Requires manual Express app setup, transport wiring, session management, and schema registration for every server
- **Missing conveniences** – No Zod integration, no built-in lifecycle hooks, no automatic JSON Schema generation
- **Feature bloat** – Ships stdio transports, SSE streaming, client implementations, and auth flows that 80% of tool servers never touch

**What Zero MCP delivers instead:**

- **2 dependencies total** – Just `zod` and `zod-to-json-schema`; nothing else pollutes your `node_modules`
- **Native performance** – Built-in `node:http` server with zero middleware overhead; ideal for serverless and edge runtimes
- **Instant start** – Instantiate `McpServer`, register tools, call `start()`—no Express config or transport plumbing
- **Zod-first schemas** – Define tool inputs with Zod; JSON Schema generation happens automatically
- **Built-in observability** – Lifecycle hooks for connections, tool calls, and errors work out of the box
- **Production-ready CORS** – Spec-aligned origin validation included for browser MCP clients
- **Focused scope** – Does one thing well: MCP tools over HTTP

Choose the official SDK if you need the full MCP spec (stdio transports, prompts API, auth flows). Choose Zero MCP when you want a fast, lean tool server without the baggage.

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

server.tool({
  name: 'add',
  description: 'Simple addition tool.',
  schema: z.object({
    a: z.number().describe('First addend'),
    b: z.number().describe('Second addend'),
  }),
  handler: async ({ a, b }) => {
    return [
      {
        type: 'text',
        text: `The sum of ${a} and ${b} is ${a + b}.`,
      },
    ];
  },
});

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

A runnable weather server lives in [`example/`](https://github.com/SNIKO/zero-mcp/tree/main/example). Run it locally with:

```bash
npm run example
```

This builds the library, compiles the example, and starts listening on `http://localhost:3005/mcp`.

## License

MIT © Sergii Vashchyshchuk

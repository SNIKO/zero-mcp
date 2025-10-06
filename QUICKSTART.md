# Zero MCP Quick Reference

## Installation

```bash
npm install zero-mcp zod
```

## Minimal Example

```typescript
import { McpServer, type ToolDefinition, z } from 'zero-mcp';

const server = new McpServer({
  name: 'my-server',
  version: '1.0.0',
});

const echoSchema = z.object({ text: z.string() });

const echo: ToolDefinition<typeof echoSchema> = {
  name: 'echo',
  description: 'Echo the provided text',
  schema: echoSchema,
  handler: async ({ text }) => [{ type: 'text', text }],
};

server.tool(echo);
await server.start({ port: 3000, host: '127.0.0.1', path: '/mcp' });
```

## API Cheat Sheet

### Server Creation

```typescript
new McpServer({
  name: string,
  version: string,
  hooks?: ServerHooks,
});

await server.start({
  port?: number;      // default: 3000
  host?: string;      // default: 'localhost'
  path?: string;      // default: '/mcp'
  hooks?: ServerHooks;
});
```

### Lifecycle Hooks

```typescript
const hooks: ServerHooks = {
  onClientConnected(name, clientVersion, protocolVersion) {},
  onToolRegistered(toolName, description) {},
  onToolCallStarted(toolName, input) {},
  onToolCallFinished(toolName, input, result, elapsedMs) {},
  onToolCallError(toolName, input, error, elapsedMs) {},
  onToolsListRequested() {},
  onServerError(error) {},
};
```

### Tool Registration

```typescript
server.tool({
  name: string,
  description?: string,
  schema: ZodSchema<T>,
  handler: (input: T) => Promise<ToolResponseContent[]> | ToolResponseContent[],
});
```

Call `server.tool` once per tool you need to expose.

### Server Methods

```typescript
server.tool(tool);        // Register one tool
await server.start();     // Start HTTP server with defaults
await server.stop();      // Stop HTTP server
```

## Common Schemas

```typescript
// String
z.string();
z.string().min(3).max(20);
z.string().email();
z.string().url();
z.string().optional();
z.string().default('value');

// Number
z.number();
z.number().int();
z.number().min(0).max(100);
z.number().positive();
z.number().optional();

// Boolean
z.boolean();
z.boolean().default(false);

// Enum
z.enum(['option1', 'option2', 'option3']);

// Array
z.array(z.string());
z.array(z.number()).min(1).max(10);

// Object
z.object({
  field1: z.string(),
  field2: z.number(),
});

// Nested
z.object({
  user: z.object({
    name: z.string(),
    age: z.number(),
  }),
});
```

## Response Format

```typescript
[{ type: 'text', text: 'response content' }];

[{ type: 'image', data: '<base64>', mimeType: 'image/png' }];
```

## MCP Methods

```json
// Initialize
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "clientInfo": { "name": "client", "version": "1.0.0" }
  }
}

// List Tools
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}

// Call Tool
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "echo",
    "arguments": { "text": "hello" }
  }
}
```

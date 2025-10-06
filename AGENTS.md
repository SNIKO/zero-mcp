# Zero MCP Agent Handbook

## Overview

- Zero MCP is a minimalist TypeScript library for building Model Context Protocol (MCP) servers quickly.
- Supports HTTP transport and the MCP tools API only; no stdio or SSE layers.
- Library sources live in `src/`, with an example server in `example/` and published artifacts emitted to `dist/` by the TypeScript compiler.
- Aim for a small surface area and fast onboarding; avoid adding features without a proven use case.

## Code Layout

- `src/server.ts` – core `McpServer` class, tool registry, and lifecycle management.
- `src/http/http-transport.ts` – HTTP listener that implements JSON-RPC 2.0 endpoints (`initialize`, `tools/list`, `tools/call`, `ping`).
- `src/http/utilities.ts` and `src/http/types.ts` – request parsing, Zod schemas, and helpers for mapping tool schemas.
- `src/types.ts` – shared protocol types and hook definitions.
- `example/server.ts` – runnable demo showcasing tool registration and hooks.

## Build, Test, and Development Commands

- `npm run build` – compile TypeScript to `dist/` with declarations.
- `npm run dev` – watch mode compilation.
- `npm run lint` – type-check only build (preferred quick validation).
- `npm run test` – Vitest suite (add specs under `tests/`).
- `npm run example` – build everything and execute `dist/example/server.js`.

## Coding Principles

- **KISS** – prefer direct solutions; avoid layers or abstractions unless they clearly reduce complexity.
- **Modern TypeScript** – embrace inference, discriminated unions, `as const`, and utility types where helpful.
- **Readability First** – concise but clear code; do not sacrifice understanding for cleverness.
- **Omit the Obvious** – skip redundant modifiers/comments; let the code speak for itself.
- **Consistency** – keep naming, formatting (two-space indentation), and import ordering aligned across files.
- **Pragmatism** – ship the smallest thing that works; revisit abstractions only when real requirements demand them.

## MCP Capabilities

- HTTP server binds to `host` (default `localhost`), `port` (default `3000`), and `path` (default `/mcp`).
- JSON-RPC methods implemented: `initialize`, `tools/list`, `tools/call`, and a lightweight `ping` for health checks.
- Tool schemas rely on Zod and are converted to JSON Schema via `zod-to-json-schema`, returned to clients as `inputSchema` per the MCP spec.
- Responses currently support content items of type `text`, `image`, or `resource`.

## Hooks

- `onClientConnected(name, version, protocolVersion)` – fired after a successful `initialize` call.
- `onToolRegistered(toolName, description)` – fired when a tool is registered on the server instance.
- `onToolCallStarted(toolName, input)` – runs before a tool handler executes.
- `onToolCallFinished(toolName, input, result, elapsedMs)` – fires on successful completion.
- `onToolCallError(toolName, input, error, elapsedMs)` – fires on handler failure.
- `onToolsListRequested()` – runs when clients ask for the tool list.
- `onServerError(error)` – catches transport-level errors (e.g., JSON parse failures).

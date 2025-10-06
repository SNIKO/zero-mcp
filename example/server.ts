/**
 * Example MCP server demonstrating two Open-Meteo powered tools.
 */

import { McpServer } from '../src/index.js';
import { currentWeatherTool } from './tools/current-weather.js';
import { dailyForecastTool } from './tools/daily-forecast.js';

const server = new McpServer({
  name: 'example-weather-station',
  version: '1.0.0',
  hooks: {
    onClientConnected: (name, clientVersion, protocolVersion) => {
      console.log('Client connected:');
      console.log(`  Client: ${name} v${clientVersion}`);
      console.log(`  Protocol: ${protocolVersion}`);
    },
  },
});

server.tool(currentWeatherTool);
server.tool(dailyForecastTool);

await server.start({ port: 3005 });
console.log('Server ready at http://localhost:3005/mcp');

const shutdown = async () => {
  console.log('\nShutting down server...');
  await server.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

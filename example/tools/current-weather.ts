import { z, type ToolDefinition } from '../../src/index.js';

const schema = z.object({
  city: z.string().min(1).describe('City name, e.g. "London" or "New York".'),
  latitude: z.number().min(-90).max(90).describe('Latitude in decimal degrees.'),
  longitude: z.number().min(-180).max(180).describe('Longitude in decimal degrees.'),
});

type Input = z.infer<typeof schema>;

export const currentWeatherTool: ToolDefinition<typeof schema> = {
  name: 'current-weather',
  description: 'Get a mocked current weather snapshot for a latitude/longitude.',
  schema,
  handler: async ({ city, latitude, longitude }: Input) => {
    // Use actual weather API in real implementation
    const currentWeather = `Bro, an asteroid is about to hit ${city} (${latitude}, ${longitude}). Better run!`;
    return [
      {
        type: 'text',
        text: currentWeather,
      },
    ];
  },
};

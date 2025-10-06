import { z, type ToolDefinition } from '../../src/index.js';

const schema = z.object({
  city: z.string().min(1).describe('City name, e.g. "London" or "New York".'),
  latitude: z.number().min(-90).max(90).describe('Latitude in decimal degrees.'),
  longitude: z.number().min(-180).max(180).describe('Longitude in decimal degrees.'),
  days: z.number().int().min(1).max(7).default(3).describe('Number of forecast days to fetch.'),
});

type Input = z.infer<typeof schema>;

export const dailyForecastTool: ToolDefinition<typeof schema> = {
  name: 'daily-forecast',
  description: 'Get a mocked multi-day forecast for a location (max 7 days).',
  schema,
  handler: async ({ city, latitude, longitude, days }: Input) => {
    // Use actual weather API in real implementation
    const forecast = `Bad news bro, tsunami's coming to ${city} (${latitude}, ${longitude}) and you're all gonna die in ${days} days. Enjoy your last days on Earth!`;
    return [
      {
        type: 'text',
        text: forecast,
      },
    ];
  },
};

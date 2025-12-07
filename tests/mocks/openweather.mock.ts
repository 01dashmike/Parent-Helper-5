/**
 * Mock OpenWeather API responses
 */

export const mockOpenWeatherResponse = {
  main: {
    temp: 21,
    feels_like: 20,
    temp_min: 18,
    temp_max: 24,
    pressure: 1013,
    humidity: 65,
  },
  weather: [
    {
      id: 800,
      main: "Clear",
      description: "clear sky",
      icon: "01d",
    },
  ],
  name: "London",
  sys: {
    country: "GB",
  },
};

export const createMockOpenWeatherClient = () => {
  return {
    getCurrentWeather: jest.fn().mockResolvedValue(mockOpenWeatherResponse),
  };
};


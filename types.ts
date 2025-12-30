
export interface WeatherData {
  temperature: number;
  conditionCode: number;
  conditionText: string;
  isDay: boolean;
  locationName: string;
}

export interface HistoricalWeatherEvent {
  name: string;
  year: number;
  description: string;
  type: 'extreme_heat' | 'extreme_cold' | 'storm' | 'flood' | 'other';
}

export interface CulturalInsight {
  event: string;
  location: string;
  description: string;
  themeColor: string;
  imageKeyword: string;
  engine?: 'gemini' | 'openrouter';
  historicalWeather?: HistoricalWeatherEvent;
}

export enum WeatherCondition {
  Clear = "Clear Skies",
  PartlyCloudy = "Partly Cloudy",
  Cloudy = "Overcast",
  Fog = "Foggy",
  Drizzle = "Drizzle",
  Rain = "Rainy",
  Snow = "Snowy",
  Thunderstorm = "Thunderstorm",
}

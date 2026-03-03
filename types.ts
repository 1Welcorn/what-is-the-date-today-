
export interface DailyForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  conditionCode: number;
  conditionText: string;
}

export interface WeatherData {
  temperature: number;
  conditionCode: number;
  conditionText: string;
  isDay: boolean;
  locationName: string;
  daily?: DailyForecast[];
  isAIGenerated?: boolean;
  sources?: string[];
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

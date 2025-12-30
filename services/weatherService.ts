
import { WeatherData } from '../types';

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.current_weather) {
    throw new Error('Weather data not available');
  }

  const { temperature, weathercode, is_day } = data.current_weather;

  // Map Open-Meteo codes to human readable text
  const codeMap: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
  };

  return {
    temperature,
    conditionCode: weathercode,
    conditionText: codeMap[weathercode] || 'Unknown',
    isDay: is_day === 1,
    locationName: 'Your Location'
  };
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await res.json();
    return data.address.city || data.address.town || data.address.village || data.address.state || 'Unknown Location';
  } catch {
    return 'Your Location';
  }
}

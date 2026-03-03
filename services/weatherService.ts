
import { GoogleGenAI, Type } from "@google/genai";
import { WeatherData, DailyForecast } from '../types.ts';
import { getWeather, saveWeather } from './dbService.ts';

const codeMap: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
};

let weatherCache: { data: WeatherData; timestamp: number; key: string } | null = null;
let geoCache: { data: string; timestamp: number; key: string } | null = null;
let last429Timestamp = 0;

const CACHE_DURATION_WEATHER = 5 * 60 * 1000; 
const CACHE_DURATION_GEO = 10 * 60 * 1000; 
const LOCKOUT_DURATION_429 = 30 * 1000; 

export async function fetchWeatherViaGemini(locationQuery: string): Promise<WeatherData> {
  const cacheKey = `gemini_${locationQuery.toLowerCase().replace(/\s+/g, '_')}`;
  const now = Date.now();
  
  const cached = await getWeather(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION_WEATHER) {
    return cached.data;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `The user has provided this location reference: "${locationQuery}". 
  1. Identify the location this refers to (e.g., if it's a BBC Weather URL, determine the city).
  2. Search for the current weather and 7-day forecast for that specific location.
  
  Return ONLY a valid JSON object matching this schema. All temperatures MUST be in CELSIUS:
  {
    "resolvedLocationName": string (The name of the city/region identified),
    "temperature": number (Celsius),
    "conditionText": string (max 2 words),
    "isDay": boolean,
    "daily": [
      {
        "date": "YYYY-MM-DD",
        "maxTemp": number (Celsius),
        "minTemp": number (Celsius),
        "conditionText": string (max 2 words)
      }
    ]
  }
  Ensure "daily" has exactly 7 days. If the reference is invalid, attempt to find weather for a likely location or return an error structure.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    const result = JSON.parse(response.text || "{}");
    
    const weather: WeatherData = {
      temperature: result.temperature ?? 0,
      conditionCode: 1, 
      conditionText: result.conditionText || "Unknown",
      isDay: result.isDay ?? true,
      locationName: result.resolvedLocationName || locationQuery,
      daily: result.daily?.map((d: any) => ({
        date: d.date,
        maxTemp: d.maxTemp,
        minTemp: d.minTemp,
        conditionCode: 1,
        conditionText: d.conditionText
      })),
      isAIGenerated: true,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => chunk.web?.uri).filter(Boolean) as string[]
    };

    await saveWeather(cacheKey, weather);
    return weather;
  } catch (error) {
    if (cached) return cached.data;
    console.error("Gemini Weather Search Error:", error);
    throw error;
  }
}

export async function fetchWeather(lat: number, lon: number, retryCount = 0): Promise<WeatherData> {
  const cacheKey = `weather_${lat.toFixed(2)},${lon.toFixed(2)}`;
  const now = Date.now();

  if (now - last429Timestamp < LOCKOUT_DURATION_429) {
    const cached = await getWeather(cacheKey);
    if (cached) return cached.data;
    throw new Error(`Rate limit cooldown active.`);
  }

  const cached = await getWeather(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION_WEATHER) {
    return cached.data;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&temperature_unit=celsius`;
  
  try {
    const response = await fetch(url);
    
    if (response.status === 429) {
      last429Timestamp = Date.now();
      throw new Error("Standard Weather Link Busy");
    }

    if (!response.ok) throw new Error(`Weather service error ${response.status}`);
    const data = await response.json();
    
    const { temperature, weathercode, is_day } = data.current_weather;
    
    const daily: DailyForecast[] = data.daily.time.map((time: string, index: number) => ({
      date: time,
      maxTemp: data.daily.temperature_2m_max[index],
      minTemp: data.daily.temperature_2m_min[index],
      conditionCode: data.daily.weathercode[index],
      conditionText: codeMap[data.daily.weathercode[index]] || 'Unknown'
    }));

    const result: WeatherData = {
      temperature,
      conditionCode: weathercode,
      conditionText: codeMap[weathercode] || 'Unknown',
      isDay: is_day === 1,
      locationName: 'Detecting...',
      daily
    };

    await saveWeather(cacheKey, result);
    return result;
  } catch (error) {
    if (cached) return cached.data;
    throw error;
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const cacheKey = `geo_${lat.toFixed(3)},${lon.toFixed(3)}`;
  const now = Date.now();

  const cached = await getWeather(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION_GEO) {
    return cached.data;
  }

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
      headers: { 
        'Accept-Language': 'en',
        'User-Agent': 'AtmosphereDashboardApp/2.2' 
      }
    });
    
    if (res.status === 429) return cached?.data || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

    const data = await res.json();
    const locName = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.state || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    
    await saveWeather(cacheKey, locName);
    return locName;
  } catch (err) {
    return cached?.data || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
}

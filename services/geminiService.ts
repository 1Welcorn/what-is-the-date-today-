
import { GoogleGenAI, Type } from "@google/genai";
import { CulturalInsight } from "../types";

export async function getCulturalInsight(dateStr: string, weather: string): Promise<CulturalInsight> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Today is ${dateStr}. The current weather is ${weather}.
    Focus EXCLUSIVELY on:
    1. Brazil (Brasil).
    2. English-speaking countries (USA, UK, Canada, Australia, New Zealand, Ireland, etc.).
    
    Tasks:
    1. Find a NOTABLE CULTURAL MILESTONE, holiday, or anniversary (e.g., a famous artist's birth, a historical event, a landmark pop culture moment) that falls on this day in Brazil or an English-speaking country.
    2. Find a SIGNIFICANT HISTORICAL WEATHER EVENT (e.g., historic storms, extreme heatwaves, famous blizzards, floods) that occurred on this specific calendar day in history within these same regions.
    
    Return a CSS-friendly hex color for the theme and a background image keyword related to the cultural event or its location.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            event: { type: Type.STRING, description: "Title of the cultural milestone" },
            location: { type: Type.STRING, description: "Country or City of the cultural milestone" },
            description: { type: Type.STRING, description: "Brief explanation of the cultural milestone's significance" },
            themeColor: { type: Type.STRING, description: "Theme hex color" },
            imageKeyword: { type: Type.STRING, description: "Keyword for background image" },
            historicalWeather: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name/Type of weather event" },
                year: { type: Type.INTEGER, description: "Year it occurred" },
                description: { type: Type.STRING, description: "Brief description of the event's impact" },
                type: { 
                  type: Type.STRING, 
                  enum: ['extreme_heat', 'extreme_cold', 'storm', 'flood', 'other'],
                  description: "Categorization of the weather event"
                }
              },
              required: ["name", "year", "description", "type"]
            }
          },
          required: ["event", "location", "description", "themeColor", "imageKeyword", "historicalWeather"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      event: "Global Connection Day",
      location: "Brazil & Anglosphere",
      description: "A day celebrating the cultural ties between Brazil and the English-speaking world.",
      themeColor: "#0047AB",
      imageKeyword: "modern-architecture",
      historicalWeather: {
        name: "Historical Weather Records",
        year: 1995,
        description: "A day of significant meteorological observation across major global hubs.",
        type: "other"
      }
    };
  }
}


import { GoogleGenAI, Type } from "@google/genai";
import { CulturalInsight } from "../types";

const OPENROUTER_API_KEY = "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";

export async function getCulturalInsight(
  dateStr: string, 
  weather: string, 
  engine: 'gemini' | 'openrouter' = 'gemini'
): Promise<CulturalInsight> {
  const prompt = `
    Today is ${dateStr}. The current weather is ${weather}.
    Focus EXCLUSIVELY on:
    1. Brazil (Brasil).
    2. English-speaking countries (USA, UK, Canada, Australia, New Zealand, Ireland, etc.).
    
    Tasks:
    1. Find a NOTABLE CULTURAL MILESTONE, holiday, or anniversary (e.g., a famous artist's birth, a historical event, a landmark pop culture moment) that falls on this day in Brazil or an English-speaking country.
    2. Find a SIGNIFICANT HISTORICAL WEATHER EVENT (e.g., historic storms, extreme heatwaves, famous blizzards, floods) that occurred on this specific calendar day in history within these same regions.
    
    Return a JSON object with this EXACT structure:
    {
      "event": "string",
      "location": "string",
      "description": "string",
      "themeColor": "hex string",
      "imageKeyword": "string",
      "historicalWeather": {
        "name": "string",
        "year": number,
        "description": "string",
        "type": "extreme_heat" | "extreme_cold" | "storm" | "flood" | "other"
      }
    }
  `;

  if (engine === 'openrouter') {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Luso-Vibe Board"
        },
        body: JSON.stringify({
          model: "xiaomi/mimo-v2-flash:free",
          messages: [
            {
              role: "system",
              content: "You are a specialized cultural and meteorological historian assistant. You must output valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      const parsed = JSON.parse(content);
      return { ...parsed, engine: 'openrouter' };
    } catch (error) {
      console.error("OpenRouter Error:", error);
      return getCulturalInsight(dateStr, weather, 'gemini');
    }
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            event: { type: Type.STRING },
            location: { type: Type.STRING },
            description: { type: Type.STRING },
            themeColor: { type: Type.STRING },
            imageKeyword: { type: Type.STRING },
            historicalWeather: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                year: { type: Type.INTEGER },
                description: { type: Type.STRING },
                type: { 
                  type: Type.STRING, 
                  enum: ['extreme_heat', 'extreme_cold', 'storm', 'flood', 'other']
                }
              },
              required: ["name", "year", "description", "type"]
            }
          },
          required: ["event", "location", "description", "themeColor", "imageKeyword", "historicalWeather"]
        }
      }
    });

    const parsed = JSON.parse(response.text);
    return { ...parsed, engine: 'gemini' };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      event: "Global Connection Day",
      location: "Brazil & Anglosphere",
      description: "A day celebrating the cultural ties between Brazil and the English-speaking world.",
      themeColor: "#0047AB",
      imageKeyword: "modern-architecture",
      engine: 'gemini',
      historicalWeather: {
        name: "Historical Weather Records",
        year: 1995,
        description: "A day of significant meteorological observation across major global hubs.",
        type: "other"
      }
    };
  }
}

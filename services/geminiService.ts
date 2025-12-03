import { GoogleGenAI } from "@google/genai";
import { WeatherData } from '../types';

const getAiInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found via process.env.API_KEY");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateWeatherInsight = async (data: WeatherData, locationName: string): Promise<string> => {
  const ai = getAiInstance();
  if (!ai) return "AI insights unavailable (Missing API Key).";

  const prompt = `
    You are the "Rain Alert AI", a helpful assistant for a weather notification system.
    
    Context:
    Location: ${locationName}
    Current Temp: ${data.current.temperature}°C
    Current Condition Code: ${data.current.weatherCode}
    Max Precip Probability (Next few hours): ${Math.max(...data.hourly.precipitationProbability)}%
    
    Task:
    Generate a short, witty, and helpful "Push Notification" style message (max 2 sentences).
    If it's going to rain, warn the user. If it's clear, tell them to enjoy the day.
    Adopt a friendly persona like a personal assistant.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Unable to generate insight.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI is currently offline due to connectivity issues.";
  }
};

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// gemini-2.0-flash is on Google's free tier (generous rate limits, no cost)
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateText(prompt: string): Promise<string> {
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}

export async function generateJSON<T = any>(prompt: string): Promise<T> {
  const result = await geminiModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });
  const text = result.response.text();
  return JSON.parse(text);
}
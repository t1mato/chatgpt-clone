import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable
const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

const safetySettings = [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_LOW_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_LOW_AND_ABOVE",
    },
  ];

export async function runModel(prompt) {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // or "gemini-2.5-flash" if available in your SDK version
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        config: { safetySettings },
      });
  
      // The SDK returns a `GenerateContentResponse` with a `.text()` helper
      const output =
        typeof response.text === "function"
          ? await response.text()
          : response.text;
      return output || "";
}
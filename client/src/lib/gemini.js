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

let chat = null;

export async function createChat(opts = {}) {
    const { history, systemInstruction, config = {} } = opts;

    chat = await ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            safetySettings,
            systemInstruction, 
            ...config,
        },
        history,
    });

    return chat;
}


export async function runModel(prompt, imagePart, config) {
  
    const c = await getOrCreateChat();

    const parts = [{ text: prompt }];
    if (imagePart?.inlineData?.data && imagePart?.inlineData?.mimeType) {
        parts.push(imagePart);
    }

    const response = await c.sendMessage({ message: parts, config });

    const out = typeof response.text === "function" ? await response.text() : response.text;
    return out || "";

} 

export async function* runModelStream(prompt, imagePart, config) {
    const c = await getOrCreateChat();

    const parts = [{ text: prompt }];

    if(imagePart?.inlineData?.data && imagePart?.inlineData?.mimeType ) {
        parts.push(imagePart);
    }

    const stream = await c.sendMessageStream({ message: parts, config });

    for await (const chunk of stream) {
        const text = typeof chunk.text === "function" ? await chunk.text() : chunk.text;
        if (text) yield text;
    }
}

export function getChatHistory() {
    if (!chat) return[];
    return chat.getHistory?.(true) ?? [];
}

export function resetChat() {
    chat = null;
}

async function getOrCreateChat() {
    if (!chat) {
        await createChat();
    }
    return chat;
}

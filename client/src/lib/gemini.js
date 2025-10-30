import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client with the API key from the environment variables
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

// Define default safety settings to prevent harmful or sensitive outputs
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

// Persistent chat instance shared across requests
let chat = null;

/**
 * Creates a new Gemini chat session.
 * @param {Object} opts - Optional configuration.
 * @param {Array} opts.history - Initial chat history. 
 * @param {String} opts.systemInstruction - Optional system prompt/instructions.
 * @param {Object} opts.config - Optional model configuration overrides.
 * @returns {Promise<Objects>} - The created chat session.
 */

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

/**
 * Sends a prompt (and optional image) to the model and returns a full response.
 * Falls back to creating a chat if one does not exist.
 * @param {String} prompt - The user prompt text.
 * @param {Object} imagePart - Optional inline image data for multimodal input.
 * @param {Object} config - Optional per-request model config.
 * @returns {Promise<String>} - Model's text output.
 */
export async function runModel(prompt, imagePart, config) {
  
    const c = await getOrCreateChat();

    const parts = [{ text: prompt }];
    if (imagePart?.inlineData?.data && imagePart?.inlineData?.mimeType) {
        parts.push(imagePart);
    }

    const response = await c.sendMessage({ message: parts, config });

    // The response may return a callable text() or a raw string
    const out = typeof response.text === "function" ? await response.text() : response.text;
    return out || "";

} 

/**
 * Streams model responses token-by-token for a smoother UX (e.g., chat typing effect).
 * Useful for real-time interfaces
 * @param {String} prompt - The user prompt text.
 * @param {Object} imagePart - Optional inline image data for multimodal input.
 * @param {Object} config - Optional per-request model config.
 * @yields {String} - Incremental chunks of model output
 */
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

/**
 * Returns the current chat's message history, if available.
 * @returns {Array} - List of message objects.
 */
export function getChatHistory() {
    if (!chat) return[];
    return chat.getHistory?.(true) ?? [];
}

/**
 * Resets the active chat instance.
 */
export function resetChat() {
    chat = null;
}

/**
 * Retrives the existing chat or creates one if none exists.
 * @returns {Promise<Object>} - Active chat session.
 */
async function getOrCreateChat() {
    if (!chat) {
        await createChat();
    }
    return chat;
}

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { UIMessage } from "ai";
import { convertToModelMessages, createIdGenerator, streamText } from "ai";
import { Autumn } from "autumn-js";
import { Hono } from "hono";
import { authenticatedOnly } from "../middleware/auth";
import type { HonoContext } from "../types";

// OpenRouter free models configuration
const MODEL_CONFIG = {
  "meta-llama/llama-3.2-3b-instruct:free": "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-2-9b-it:free": "google/gemma-2-9b-it:free",
  "microsoft/phi-3-mini-128k-instruct:free": "microsoft/phi-3-mini-128k-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free": "meta-llama/llama-3.1-8b-instruct:free",
  "nousresearch/hermes-3-llama-3.1-405b:free": "nousresearch/hermes-3-llama-3.1-405b:free",
  "google/gemini-flash-1.5:free": "google/gemini-flash-1.5:free",
} as const;

type ModelKey = keyof typeof MODEL_CONFIG;

interface GetModelProviderOptions {
  modelName: string;
  apiKey: string;
}

// Helper to get model provider and configuration
const getModelProvider = ({
  modelName,
  apiKey,
}: GetModelProviderOptions) => {
  const actualModel = MODEL_CONFIG[modelName as ModelKey] || modelName;

  // OpenRouter is OpenAI-compatible, so we use createOpenAICompatible for all models
  const openaiProvider = createOpenAICompatible({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    name: "openrouter",
    headers: {
      "HTTP-Referer": "https://localhost:5173", // Required for OpenRouter free tier
      "X-Title": "AI Chat App", // Required for OpenRouter free tier
    },
  });
  
  return openaiProvider(actualModel);
};

// POST /api/ai/chat - Stream chat completions
export const aiRoutes = new Hono<HonoContext>()
  .use("*", authenticatedOnly)
  .post("/chat", async (c) => {
    try {
      const body = await c.req.json();

      const { messages, model = "meta-llama/llama-3.2-3b-instruct:free" } = body as {
        messages: UIMessage[];
        model?: string;
      };

      if (!messages || !Array.isArray(messages)) {
        return c.json({ error: "Messages array is required" }, 400);
      }

      // Get OpenRouter API key from environment
      const apiKey = c.env.OPENROUTER_API_KEY!;

      if (!apiKey) {
        console.error("OPENROUTER_API_KEY not configured");
        return c.json({ error: "OpenRouter API not configured" }, 500);
      }

      // Get the appropriate model provider
      const modelProvider = getModelProvider({
        modelName: model as ModelKey,
        apiKey,
      });

      // Convert UIMessages to ModelMessages for streamText
      const modelMessages = convertToModelMessages(messages);

      if (!c.get("user") || !c.get("user")?.id) {
        return c.json({ error: "User not authenticated" }, 401);
      }

      if (c.env.AUTUMN_SECRET_KEY) {
        try {
          await Autumn.track({
            customer_id: c.get("user")!.id,
            feature_id: "api_calls",
            value: 2,
          });

          await Autumn.track({
            customer_id: c.get("user")!.id,
            feature_id: "messages",
            value: 1,
          });
        } catch (error) {
          console.error("Autumn track error:", error);
        }
      }

      // Stream the response
      const result = streamText({
        model: modelProvider,
        messages: modelMessages,
      });

      const res = result.toUIMessageStreamResponse({
        generateMessageId: createIdGenerator({
          prefix: "msg",
          size: 16,
        }),
      });

      return res;
    } catch (error) {
      console.error("Chat error:", error);
      return c.json(
        {
          error: "Failed to generate response",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  })
  .get("/models", (c) => {
    return c.json({
      models: [
        {
          id: "meta-llama/llama-3.2-3b-instruct:free",
          name: "Llama 3.2 3B Instruct",
          provider: "meta",
          description: "Meta's latest 3B parameter model with instruction following capabilities",
        },
        {
          id: "google/gemma-2-9b-it:free",
          name: "Gemma 2 9B IT",
          provider: "google",
          description: "Google's Gemma 2 model with 9B parameters, optimized for instruction following",
        },
        {
          id: "microsoft/phi-3-mini-128k-instruct:free",
          name: "Phi-3 Mini 128K",
          provider: "microsoft",
          description: "Microsoft's Phi-3 model with 128K context window, optimized for instructions",
        },
        {
          id: "meta-llama/llama-3.1-8b-instruct:free",
          name: "Llama 3.1 8B Instruct",
          provider: "meta",
          description: "Meta's Llama 3.1 model with 8B parameters and instruction tuning",
        },
        {
          id: "nousresearch/hermes-3-llama-3.1-405b:free",
          name: "Hermes 3 Llama 3.1 405B",
          provider: "nousresearch",
          description: "Nous Research's Hermes 3 based on Llama 3.1 405B, fine-tuned for chat",
        },
        {
          id: "google/gemini-flash-1.5:free",
          name: "Gemini Flash 1.5",
          provider: "google",
          description: "Google's Gemini Flash model with 1.5M context window, fast and efficient",
        },
      ],
    });
  });

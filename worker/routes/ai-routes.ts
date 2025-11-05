import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { UIMessage } from "ai";
import { convertToModelMessages, createIdGenerator, streamText } from "ai";
import { Autumn } from "autumn-js";
import { Hono } from "hono";
import { authenticatedOnly } from "../middleware/auth";
import type { HonoContext } from "../types";

// Model configuration mapping
const MODEL_CONFIG = {
  // OpenAI models
  "gpt-5": "gpt-5",
  "gpt-5-codex": "gpt-5-codex",
  "gpt-5-mini": "gpt-5-mini",
  "gpt-5-nano": "gpt-5-nano",
  // Anthropic models
  "claude-4": "claude-4",
  "claude-4.5-sonnet": "claude-4.5-sonnet",
} as const;

type ModelKey = keyof typeof MODEL_CONFIG;

interface GetModelProviderOptions {
  modelName: string;
  gatewayUrl: string;
  gatewayKey: string;
}

// Helper to get model provider and configuration
const getModelProvider = ({
  modelName,
  gatewayUrl,
  gatewayKey,
}: GetModelProviderOptions) => {
  const actualModel = MODEL_CONFIG[modelName as ModelKey] || modelName;

  // Determine provider based on model name
  if (modelName.startsWith("gpt") || modelName.startsWith("o1")) {
    const openaiProvider = createOpenAICompatible({
      baseURL: gatewayUrl,
      apiKey: gatewayKey,
      name: "gpt-5",
    });
    return openaiProvider(actualModel);
  } else if (modelName.startsWith("claude")) {
    const anthropicProvider = createAnthropic({
      baseURL: gatewayUrl,
      apiKey: gatewayKey,
    });
    return anthropicProvider(actualModel);
  }

  // Default to OpenAI
  const openaiProvider = createOpenAICompatible({
    baseURL: gatewayUrl,
    apiKey: gatewayKey,
    name: "gpt-5",
  });
  return openaiProvider(actualModel);
};

// POST /api/ai/chat - Stream chat completions
export const aiRoutes = new Hono<HonoContext>()
  .use("*", authenticatedOnly)
  .post("/chat", async (c) => {
    try {
      const body = await c.req.json();

      const { messages, model = "gpt-5-nano" } = body as {
        messages: UIMessage[];
        model?: string;
      };

      if (!messages || !Array.isArray(messages)) {
        return c.json({ error: "Messages array is required" }, 400);
      }

      // Get gateway configuration from environment
      const gatewayUrl =
        c.env.RUNABLE_GATEWAY_URL || "https://api.runable.com/gateway/v1";
      const gatewayKey = c.env.RUNABLE_SECRET!;

      if (!gatewayKey) {
        console.error("RUNABLE_SECRET not configured");
        return c.json({ error: "RUNABLE Gateway not configured" }, 500);
      }

      // Get the appropriate model provider
      const modelProvider = getModelProvider({
        modelName: model as ModelKey,
        gatewayUrl,
        gatewayKey,
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
          id: "gpt-5",
          name: "GPT-5",
          provider: "openai",
          description: "Latest GPT-5 model with advanced reasoning",
        },
        {
          id: "gpt-5-codex",
          name: "GPT-5 Codex",
          provider: "openai",
          description: "Specialized for code generation and analysis",
        },
        {
          id: "gpt-5-mini",
          name: "GPT-5 Mini",
          provider: "openai",
          description: "Faster, cost-effective version of GPT-5",
        },
        {
          id: "gpt-5-nano",
          name: "GPT-5 Nano",
          provider: "openai",
          description: "Ultra-fast model for simple tasks",
        },
        {
          id: "claude-4",
          name: "Claude 4",
          provider: "anthropic",
          description: "Advanced Claude model with superior reasoning",
        },
        {
          id: "claude-4.5-sonnet",
          name: "Claude 4.5 Sonnet",
          provider: "anthropic",
          description: "Latest Claude Sonnet with enhanced capabilities",
        },
      ],
    });
  });

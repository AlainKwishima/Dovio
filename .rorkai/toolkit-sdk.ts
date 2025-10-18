
import { useMutation, useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { useChat, UseChatOptions } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  ToolUIPart,
  UIMessage,
} from "ai";
import { fetch as expoFetch } from "expo/fetch";
import z from "zod";
import { useCallback, useMemo } from "react";

type Connection = {
  id: string;
  status:
    | "INITIALIZING"
    | "INITIATED"
    | "ACTIVE"
    | "FAILED"
    | "EXPIRED"
    | "INACTIVE";
  toolkit: string;
};

const baseUrl =
  process.env["EXPO_PUBLIC_TOOLKIT_URL"] ?? "http://localhost:3005";

const EMPTY_ARRAY = [] as Connection[];

async function waitForConnection(id: string) {
  const response = await fetch(new URL(`/connection/wait/${id}`, baseUrl));
  return response.json() as Promise<{ status: string }>;
}

export function useConnections() {
  const list = useQuery({
    queryKey: ["rork__connections"],
    queryFn: async () => {
      const response = await fetch(new URL("/connections/list", baseUrl));
      return response.json() as Promise<{ connections: Connection[] }>;
    },
  });

  const initiate = useMutation({
    mutationFn: async (toolkit: string) => {
      const authUrl = new URL(`/connection/init/${toolkit}`, baseUrl);
      const response = await fetch(authUrl).then((res) => res.json());
      const data = response as {
        id: string;
        status: string;
        redirectUrl: string;
      };

      const resultPromise = WebBrowser.openAuthSessionAsync(
        data.redirectUrl,
        "demotoolkit://connection/callback"
      );

      const result = await resultPromise;

      if (result.type === "success") {
        list.refetch();
      }

      return result;
    },
  });

  const disconnect = useMutation({
    mutationFn: async (toolkit: string) => {
      const response = await fetch(
        new URL(`/connection/disconnect/${toolkit}`, baseUrl)
      );
      return response.json() as Promise<{ status: string }>;
    },
  });

  return {
    currentConnections: list.data?.connections ?? EMPTY_ARRAY,
    refetchConnections: list.refetch,
    initiate,
    disconnect,
  };
}

const AGENT_URL = new URL("/agent/chat", baseUrl).toString();

type Tool<T extends z.ZodType = z.ZodType> = {
  description: string;
  zodSchema: T;
  execute?: (input: z.infer<T>) => Promise<string> | string;
};

export function createRorkTool<T extends z.ZodType>(tool: Tool<T>): Tool<T> {
  return tool;
}

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image"; image: string };
type UserMessage = { role: "user"; content: string | (TextPart | ImagePart)[] };
type AssistantMessage = { role: "assistant"; content: string | TextPart[] };

// use generateObject and generate text only if you need a single generation.
// When the chat history and agentic flows are not needed
// For example, parsing image to text in mutation.
// or generating a caption for image, or a summary

export async function generateObject<T extends z.ZodType>(params: {
  messages: (UserMessage | AssistantMessage)[];
  schema: T;
}): Promise<z.infer<T>> {
  const GENERATE_OBJECT_URL = new URL("/llm/object", baseUrl).toString();
  const result = await fetch(GENERATE_OBJECT_URL, {
    method: "POST",
    body: JSON.stringify({
      messages: params.messages,
      schema: z.toJSONSchema(params.schema),
    }),
  });

  const data = await result.json();

  return params.schema.parse(data.object);
}

export async function generateText(
  params: string | { messages: (UserMessage | AssistantMessage)[] }
): Promise<string> {
  const GENERATE_TEXT_URL = new URL("/text/llm", baseUrl).toString();
  const messages =
    typeof params === "string"
      ? [{ role: "user", content: params }]
      : params.messages;
  const result = await fetch(GENERATE_TEXT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  const data = await result.json();

  return data.completion;
}

export function useRorkAgent<T extends Record<string, Tool<z.ZodType>>>(
  options: Omit<UseChatOptions<UIMessage>, "transport"> & {
    tools: T;
  }
) {
  const { addToolResult, ...rest } = useChat({
    ...options,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: AGENT_URL,
      body: () => {
        const toolsEntries = Object.entries(options.tools).map(
          ([name, tool]) => [
            name,
            {
              description: tool.description,
              jsonSchema: z.toJSONSchema(tool.zodSchema),
            },
          ]
        );

        return {
          tools: Object.fromEntries(toolsEntries),
        };
      },
    }),
    onToolCall: async ({ toolCall }) => {
      const tool = options.tools[toolCall.toolName];

      if (!tool) {
        throw new Error(`Tool ${toolCall.dynamic} not found`);
      }

      if (!tool.execute) return;

      const result = await tool.execute(toolCall.input);
      addToolResult({
        toolCallId: toolCall.toolCallId,
        tool: toolCall.toolName,
        output: result,
      });
    },
  });

  const messages = useMemo(() => {
    return rest.messages.map((m) => {
      const parts = m.parts
        .map((p) => {
          if (p.type === "text") return p;
          if (p.type.startsWith("tool")) {
            const toolPart = p as ToolUIPart;
            const toolName = toolPart.type.replace(/^tool-/, "");

            return {
              ...(p as ToolUIPart),
              type: "tool",
              toolName,
            } satisfies Omit<ToolUIPart, "type"> & {
              type: "tool";
              toolName: string;
            };
          }
        })
        .filter((p) => p !== undefined);

      return { ...m, parts };
    });
  }, [rest.messages]);

  const sendMessage = useCallback(
    (message: string | Parameters<typeof rest.sendMessage>[0]) => {
      if (typeof message === "string") {
        rest.sendMessage({
          text: message,
        });
      } else {
        rest.sendMessage(message);
      }
    },
    [rest]
  );

  return {
    ...rest,
    sendMessage,
    messages,
    addToolResult,
  };
}


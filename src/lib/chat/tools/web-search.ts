// Web Search Tool Definition
// Provides web search capability to AI models via function calling

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  tool_call_id: string;
  result: any;
}

export interface WebSearchArgs {
  query: string;
  userId?: string;
  limit?: number;
  windowHours?: number;
  isPaidUser?: boolean;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export const WEB_SEARCH_TOOL = {
  type: "function" as const,
  function: {
    name: "web_search",
    description: `Use this tool to search the internet for real-time or recent information.

When TO use web_search:
- Current events, news, breaking stories
- Time-sensitive data (stock prices, weather, sports scores)
- Recent facts that may have changed (CEO positions, laws, policies)
- Product pricing, availability, software versions
- Verify uncertain or conflicting facts
- User explicitly asks to search ("search", "look up", "find online")

When NOT to use web_search:
- Timeless facts (speed of light, historical events)
- Math or logic problems
- Definitions or concepts
- Creative writing tasks
- Coding help
- General advice`,
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "A concise, well-formed search query string (4-8 words preferred). Use specific keywords and include year if recency matters.",
        },
      },
      required: ["query"],
    },
  },
};

export const AVAILABLE_TOOLS = [WEB_SEARCH_TOOL];

// Gemini-format tool definition (uses functionDeclarations instead of OpenAI function format)
export const GEMINI_WEB_SEARCH_TOOLS = [{
  functionDeclarations: [{
    name: "web_search",
    description: WEB_SEARCH_TOOL.function.description,
    parameters: {
      type: "OBJECT",
      properties: {
        query: {
          type: "STRING",
          description: WEB_SEARCH_TOOL.function.parameters.properties.query.description,
        },
      },
      required: ["query"],
    },
  }],
}];

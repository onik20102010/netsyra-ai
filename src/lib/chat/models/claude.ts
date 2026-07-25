// Claude API Integration (Sonnet 4.6 Coding & Opus 4.6)

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeOptions {
  model: 'claude-sonnet-4.6-coding' | 'claude-opus-4.6';
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export async function callClaude(
  messages: ClaudeMessage[],
  options: ClaudeOptions
): Promise<ClaudeResponse> {
  const apiKey = process.env.MESH_API_KEY;
  
  if (!apiKey) {
    throw new Error('MESH_API_KEY is not configured');
  }

  const endpoint = 'https://api.anthropic.com/v1/messages';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: options.model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      top_p: options.topP || 1.0,
      stream: options.stream || false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function callClaudeStream(
  messages: ClaudeMessage[],
  options: ClaudeOptions,
  onChunk: (chunk: string) => void
): Promise<void> {
  const apiKey = process.env.MESH_API_KEY;
  
  if (!apiKey) {
    throw new Error('MESH_API_KEY is not configured');
  }

  const endpoint = 'https://api.anthropic.com/v1/messages';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: options.model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      top_p: options.topP || 1.0,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body reader');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            onChunk(parsed.delta.text);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

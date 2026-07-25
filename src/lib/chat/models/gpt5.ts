// GPT-5 API Integration for reasoning tasks

export interface GPT5Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GPT5Options {
  model: 'gpt-5';
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface GPT5Response {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callGPT5(
  messages: GPT5Message[],
  options: GPT5Options
): Promise<GPT5Response> {
  const apiKey = process.env.MESH_API_KEY;
  
  if (!apiKey) {
    throw new Error('MESH_API_KEY is not configured');
  }

  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
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
    throw new Error(`GPT-5 API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function callGPT5Stream(
  messages: GPT5Message[],
  options: GPT5Options,
  onChunk: (chunk: string) => void
): Promise<void> {
  const apiKey = process.env.MESH_API_KEY;
  
  if (!apiKey) {
    throw new Error('MESH_API_KEY is not configured');
  }

  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
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
    throw new Error(`GPT-5 API error: ${response.status} - ${error}`);
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
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

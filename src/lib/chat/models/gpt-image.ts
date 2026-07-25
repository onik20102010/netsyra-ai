// GPT Image 1 API Integration for image generation

export interface GPTImageOptions {
  model: 'gpt-image-1';
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  n?: number;
}

export interface GPTImageResponse {
  created: number;
  data: Array<{
    url: string;
    revised_prompt?: string;
  }>;
}

export async function generateImage(
  options: GPTImageOptions
): Promise<GPTImageResponse> {
  const apiKey = process.env.MESH_API_KEY;
  
  if (!apiKey) {
    throw new Error('MESH_API_KEY is not configured');
  }

  const endpoint = 'https://api.openai.com/v1/images/generations';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      prompt: options.prompt,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      n: options.n || 1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GPT Image API error: ${response.status} - ${error}`);
  }

  return response.json();
}

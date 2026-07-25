// Gemini Flash Lite API Integration for image analysis

export interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
  imageData?: {
    mimeType: string;
    data: string; // base64 encoded
  };
}

export interface GeminiOptions {
  model: 'gemini-flash-lite';
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export async function callGemini(
  messages: GeminiMessage[],
  options: GeminiOptions
): Promise<GeminiResponse> {
  const apiKey = process.env.MESH_API_KEY;
  
  if (!apiKey) {
    throw new Error('MESH_API_KEY is not configured');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${apiKey}`;

  // Convert messages to Gemini format
  const contents = messages.map(msg => {
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    
    if (msg.imageData) {
      parts.push({
        inlineData: {
          mimeType: msg.imageData.mimeType,
          data: msg.imageData.data,
        },
      });
    }
    
    if (msg.content) {
      parts.push({ text: msg.content });
    }
    
    return {
      role: msg.role === 'model' ? 'model' : 'user',
      parts,
    };
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 2000,
        topP: options.topP || 1.0,
        topK: options.topK || 40,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function callGeminiStream(
  messages: GeminiMessage[],
  options: GeminiOptions,
  onChunk: (chunk: string) => void
): Promise<void> {
  const apiKey = process.env.MESH_API_KEY;
  
  if (!apiKey) {
    throw new Error('MESH_API_KEY is not configured');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:streamGenerateContent?key=${apiKey}`;

  // Convert messages to Gemini format
  const contents = messages.map(msg => {
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    
    if (msg.imageData) {
      parts.push({
        inlineData: {
          mimeType: msg.imageData.mimeType,
          data: msg.imageData.data,
        },
      });
    }
    
    if (msg.content) {
      parts.push({ text: msg.content });
    }
    
    return {
      role: msg.role === 'model' ? 'model' : 'user',
      parts,
    };
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 2000,
        topP: options.topP || 1.0,
        topK: options.topK || 40,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
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
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            onChunk(text);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

// Helper to convert image file to base64 for Gemini
export async function imageToBase64(file: File): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64Data,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Image analysis limits
export const IMAGE_ANALYSIS_LIMITS = {
  maxImagesPerMonth: 300,
  maxImagesPerMessage: 5,
  maxFileSizeMB: 20,
  supportedFormats: ['PNG', 'JPEG', 'WEBP'],
};

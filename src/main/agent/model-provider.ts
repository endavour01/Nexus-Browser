/**
 * NEXUS AI Browser Assistant — Model Provider Abstraction
 * Supports local Ollama at http://localhost:11434 and a MockModelProvider for testing.
 */

export interface AIModelProvider {
  readonly name: string;
  generateAction(prompt: string, schema?: object, options?: { signal?: AbortSignal }): Promise<string>;
}

export interface OllamaProviderOptions {
  baseUrl?: string;
  model?: string;
  temperature?: number;
}

export class OllamaProvider implements AIModelProvider {
  public readonly name: string;
  private baseUrl: string;
  private model: string;
  private temperature: number;

  constructor(options: OllamaProviderOptions = {}) {
    this.baseUrl = (options.baseUrl || 'http://localhost:11434').replace(/\/+$/, '');
    this.model = options.model || 'llama3.2';
    this.temperature = options.temperature ?? 0.1;
    this.name = `ollama:${this.model}`;
  }

  public async generateAction(prompt: string, schema?: object, options?: { signal?: AbortSignal }): Promise<string> {
    const endpoint = `${this.baseUrl}/api/generate`;
    try {
      const body: Record<string, any> = {
        model: this.model,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: this.temperature,
        },
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: options?.signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Ollama returned status ${res.status}: ${errorText || res.statusText}`);
      }

      const data = (await res.json()) as { response?: string };
      if (!data || typeof data.response !== 'string') {
        throw new Error('Ollama response did not contain expected text field');
      }

      return data.response.trim();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw err;
      }
      if (err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
        throw new Error(`Cannot reach Ollama at ${this.baseUrl}. Make sure Ollama is running ('ollama serve')`);
      }
      throw err;
    }
  }
}

export class MockModelProvider implements AIModelProvider {
  public readonly name = 'mock-provider';
  private responses: string[] = [];
  private promptHistory: string[] = [];
  private responderFn?: (prompt: string) => string | Promise<string>;

  constructor(responses: string[] = [], responderFn?: (prompt: string) => string | Promise<string>) {
    this.responses = [...responses];
    this.responderFn = responderFn;
  }

  public enqueueResponse(response: string | object) {
    const text = typeof response === 'string' ? response : JSON.stringify(response);
    this.responses.push(text);
  }

  public clearQueue() {
    this.responses = [];
  }

  public getPromptHistory(): string[] {
    return [...this.promptHistory];
  }

  public getLastPrompt(): string | undefined {
    return this.promptHistory[this.promptHistory.length - 1];
  }

  public clearHistory() {
    this.promptHistory = [];
  }

  public async generateAction(prompt: string, _schema?: object, options?: { signal?: AbortSignal }): Promise<string> {
    if (options?.signal?.aborted) {
      const abortErr = new Error('Model generation aborted');
      abortErr.name = 'AbortError';
      throw abortErr;
    }

    this.promptHistory.push(prompt);

    if (this.responderFn) {
      return this.responderFn(prompt);
    }

    if (this.responses.length > 0) {
      return this.responses.shift()!;
    }

    // Default fallback when queue is empty: Finish
    return JSON.stringify({
      thought: 'Default mock response: no more actions queued.',
      action: 'finish',
      result: 'Task finished by mock provider.',
    });
  }
}

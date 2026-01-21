/**
 * Claude Service - Server-side wrapper for Claude API
 * API キーを安全に管理し、バックエンド限定で Claude API を呼び出す
 */

import type { ChatRequest, ChatResponse, ErrorResponse } from '../../types/api';
import { ApiError } from '../../types/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export class ClaudeService {
  private apiKey: string;
  private apiUrl: string = 'https://api.anthropic.com/v1/messages';
  private model: string = 'claude-opus-4-1-20250805';
  private maxTokens: number = 1024;
  private requestTimeout: number = 30000; // 30 seconds

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CLAUDE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('CLAUDE_API_KEY environment variable is not set');
    }
  }

  /**
   * 会話を処理して AI の応答を取得
   */
  async processMessage(
    userMessage: string,
    conversationHistory: Message[],
    systemPrompt?: string
  ): Promise<string> {
    // メッセージを会話履歴に追加
    const messages: Message[] = [
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // システムプロンプトの構築（デフォルト）
    const finalSystemPrompt =
      systemPrompt ||
      this.buildDefaultSystemPrompt();

    try {
      const response = await this.callClaudeAPI(
        messages,
        finalSystemPrompt
      );
      return response;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Claude API を呼び出す
   */
  private async callClaudeAPI(
    messages: Message[],
    systemPrompt: string
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.requestTimeout
    );

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          system: systemPrompt,
          messages,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(
          'CLAUDE_API_ERROR',
          response.status,
          errorData.error?.message || 'Claude API error',
          errorData.error
        );
      }

      const data = await response.json();

      if (!data.content || data.content.length === 0) {
        throw new ApiError(
          'INVALID_RESPONSE',
          500,
          'Empty response from Claude API'
        );
      }

      return data.content[0].text;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * ヒアリング用のシステムプロンプトを構築
   */
  buildInterviewSystemPrompt(
    interviewItems: Array<{
      id: string;
      key: string;
      question: string;
      description: string;
      required: boolean;
    }>
  ): string {
    const itemsList = interviewItems
      .map((item) => `- ${item.key}: ${item.description}`)
      .join('\n');

    return `あなたはヒアリングアシスタントです。ユーザーと自然な会話を通じて以下の情報を収集してください：

${itemsList}

重要な指示：
1. 自然で親しみやすい会話口調を使用してください
2. 一度に複数の質問をしないでください
3. ユーザーの回答から情報を抽出し、必要に応じて深掘り質問をしてください
4. 曖昧な回答に対しては、明確にするための質問を行ってください
5. 必須項目が全て揃うまで対話を継続してください
6. 親しみやすい日本語を使用してください`;
  }

  /**
   * デフォルトのシステムプロンプト
   */
  private buildDefaultSystemPrompt(): string {
    return `You are a helpful assistant. Please respond in Japanese.
Provide concise and natural responses.`;
  }

  /**
   * API エラーを処理
   */
  private handleApiError(error: any): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error.name === 'AbortError') {
      return new ApiError(
        'REQUEST_TIMEOUT',
        503,
        'API request timed out'
      );
    }

    if (error instanceof TypeError) {
      return new ApiError(
        'NETWORK_ERROR',
        503,
        'Network error occurred while calling Claude API'
      );
    }

    return new ApiError(
      'UNKNOWN_ERROR',
      500,
      error.message || 'Unknown error occurred'
    );
  }

  /**
   * API キーが有効か検証
   */
  validateApiKey(): boolean {
    return this.apiKey.startsWith('sk-ant-');
  }

  /**
   * モデルを設定
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * max_tokens を設定
   */
  setMaxTokens(tokens: number): void {
    this.maxTokens = Math.max(256, Math.min(4096, tokens));
  }

  /**
   * タイムアウトを設定
   */
  setRequestTimeout(ms: number): void {
    this.requestTimeout = Math.max(5000, ms);
  }
}

// シングルトンインスタンス
let claudeServiceInstance: ClaudeService | null = null;

export function getClaudeService(): ClaudeService {
  if (!claudeServiceInstance) {
    claudeServiceInstance = new ClaudeService();
  }
  return claudeServiceInstance;
}

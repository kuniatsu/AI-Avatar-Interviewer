/**
 * API Client - Frontend wrapper for backend API calls
 * Provides secure communication with backend Claude API
 */

import type { ChatRequest, ChatResponse, ErrorResponse, InterviewItem } from '../../types/api';
import { isChatResponse, isErrorResponse } from '../../types/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export class ApiClient {
  private apiBaseUrl: string = '/api/v1';
  private sessionId: string;
  private conversationHistory: Message[] = [];

  constructor(sessionId?: string) {
    this.sessionId = sessionId || this.generateSessionId();
  }

  /**
   * ユーティリティ: ユニークなセッション ID を生成
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * セッション ID を取得
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * ユーザーメッセージを処理して応答を取得
   */
  async processUserMessage(
    userMessage: string,
    systemPrompt?: string,
    interviewItems?: InterviewItem[]
  ): Promise<string> {
    if (!userMessage.trim()) {
      throw new Error('Message cannot be empty');
    }

    try {
      const request: ChatRequest = {
        message: userMessage,
        sessionId: this.sessionId,
        systemPrompt,
        interviewItems,
      };

      const response = await fetch(`${this.apiBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      // エラーレスポンスの確認
      if (!response.ok || isErrorResponse(data)) {
        throw new Error(
          isErrorResponse(data) ? data.error.message : 'API request failed'
        );
      }

      // 正常なレスポンスの確認
      if (!isChatResponse(data)) {
        throw new Error('Invalid response format from API');
      }

      const { message: assistantMessage } = data.data;

      // 会話履歴を更新
      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantMessage }
      );

      return assistantMessage;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Failed to process message'
      );
    }
  }

  /**
   * 会話履歴を取得
   */
  getConversationHistory(): Message[] {
    return [...this.conversationHistory];
  }

  /**
   * 会話履歴をクリア
   */
  clearConversationHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * 会話履歴をリセット（新しいセッション開始時）
   */
  resetSession(): void {
    this.sessionId = this.generateSessionId();
    this.conversationHistory = [];
  }

  /**
   * API が利用可能か確認（ヘルスチェック）
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// シングルトンインスタンス
let apiClientInstance: ApiClient | null = null;

/**
 * グローバル API クライアントを取得
 */
export function getApiClient(sessionId?: string): ApiClient {
  if (!apiClientInstance) {
    apiClientInstance = new ApiClient(sessionId);
  }
  return apiClientInstance;
}

/**
 * グローバル API クライアントをリセット
 */
export function resetApiClient(): void {
  apiClientInstance = null;
}

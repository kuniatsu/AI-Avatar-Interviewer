/**
 * Claude API Client - Anthropic Claude API との連携
 * 会話管理とヒアリング質問生成
 */

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationContext {
  messages: Message[];
  interviewItems: InterviewItem[];
  completedItems: Set<string>;
}

export interface InterviewItem {
  id: string;
  key: string; // 項目の識別子（例：'address', 'name'）
  question: string; // 初期質問
  description: string; // 説明
  value?: string; // 収集された値
  required: boolean;
}

export class ClaudeApiClient {
  private apiKey: string;
  private apiUrl: string = 'https://api.anthropic.com/v1/messages';
  private model: string = 'claude-opus-4-1-20250805';
  private conversationContext: ConversationContext;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CLAUDE_API_KEY || '';
    if (!this.apiKey) {
      console.warn(
        'Claude API Key not found. Please set CLAUDE_API_KEY environment variable or pass it as argument.'
      );
    }

    this.conversationContext = {
      messages: [],
      interviewItems: [],
      completedItems: new Set(),
    };
  }

  /**
   * 初期化: ヒアリング項目を設定
   */
  initialize(interviewItems: InterviewItem[]): void {
    this.conversationContext.interviewItems = interviewItems;
    this.conversationContext.completedItems = new Set();
    this.conversationContext.messages = [];
  }

  /**
   * ユーザーのメッセージを処理して、次の質問を生成
   */
  async processUserMessage(userMessage: string): Promise<string> {
    // ユーザーのメッセージを会話履歴に追加
    this.conversationContext.messages.push({
      role: 'user',
      content: userMessage,
    });

    // Claude API を呼び出して次の質問を生成
    try {
      const response = await this.callClaudeAPI(userMessage);
      this.conversationContext.messages.push({
        role: 'assistant',
        content: response,
      });

      return response;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw error;
    }
  }

  /**
   * Claude API を呼び出す
   */
  private async callClaudeAPI(userMessage: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error(
        'Claude API Key is not set. Cannot call API without authentication.'
      );
    }

    // システムプロンプトを構築
    const systemPrompt = this.buildSystemPrompt();

    const payload = {
      model: this.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: this.conversationContext.messages,
    };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Claude API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * システムプロンプトを構築
   */
  private buildSystemPrompt(): string {
    const itemsList = this.conversationContext.interviewItems
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
6. 「は」の文体を使わず、親しみやすい日本語を使用してください

ユーザーのメッセージに応答してください。`;
  }

  /**
   * 収集したデータを取得
   */
  getCollectedData(): Record<string, string | undefined> {
    const data: Record<string, string | undefined> = {};
    this.conversationContext.interviewItems.forEach((item) => {
      data[item.key] = item.value;
    });
    return data;
  }

  /**
   * 会話履歴を取得
   */
  getConversationHistory(): Message[] {
    return [...this.conversationContext.messages];
  }

  /**
   * 会話をリセット
   */
  reset(): void {
    this.conversationContext.messages = [];
    this.conversationContext.completedItems.clear();
  }
}

// シングルトンインスタンス
let claudeClientInstance: ClaudeApiClient | null = null;

export function getClaudeClient(apiKey?: string): ClaudeApiClient {
  if (!claudeClientInstance) {
    claudeClientInstance = new ClaudeApiClient(apiKey);
  }
  return claudeClientInstance;
}

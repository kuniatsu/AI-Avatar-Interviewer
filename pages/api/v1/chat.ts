/**
 * Chat API Endpoint - v1/chat
 * Handles user messages and returns AI responses securely from the server
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { ChatRequest, ChatResponse, ErrorResponse } from '../../../types/api';
import { ApiError } from '../../../types/api';
import { getClaudeService } from '../../../lib/server/claudeService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 簡易的なセッションメモリ（本番環境ではRedis等を使用）
const conversationSessions: Map<string, Message[]> = new Map();

// セッションの有効期限（30分）
const SESSION_TIMEOUT = 30 * 60 * 1000;
const sessionTimeouts: Map<string, NodeJS.Timeout> = new Map();

/**
 * セッションの有効期限を更新
 */
function resetSessionTimeout(sessionId: string) {
  const existingTimeout = sessionTimeouts.get(sessionId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  const timeout = setTimeout(() => {
    conversationSessions.delete(sessionId);
    sessionTimeouts.delete(sessionId);
  }, SESSION_TIMEOUT);

  sessionTimeouts.set(sessionId, timeout);
}

/**
 * POST /api/v1/chat
 * ユーザーのメッセージを処理して Claude の応答を返す
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | ErrorResponse>
) {
  // POST リクエストのみ受け付ける
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed. Use POST.',
      },
    });
  }

  try {
    const body = req.body as Partial<ChatRequest>;

    // リクエストの検証
    if (!body.message || typeof body.message !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Message is required and must be a string',
        },
      });
    }

    if (!body.sessionId || typeof body.sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'sessionId is required and must be a string',
        },
      });
    }

    if (body.message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Message cannot be empty',
        },
      });
    }

    const { message, sessionId, systemPrompt, interviewItems } = body;

    // セッションの取得または作成
    let conversationHistory = conversationSessions.get(sessionId) || [];
    resetSessionTimeout(sessionId);

    // Claude Service を取得
    const claudeService = getClaudeService();

    // システムプロンプトの構築
    let finalSystemPrompt = systemPrompt;
    if (!finalSystemPrompt && interviewItems && interviewItems.length > 0) {
      finalSystemPrompt = claudeService.buildInterviewSystemPrompt(
        interviewItems
      );
    }

    // Claude API で応答を生成
    const response = await claudeService.processMessage(
      message,
      conversationHistory,
      finalSystemPrompt
    );

    // 会話履歴を更新
    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    );

    // 会話履歴を保存（最新100メッセージまで保持）
    if (conversationHistory.length > 200) {
      conversationHistory = conversationHistory.slice(-200);
    }
    conversationSessions.set(sessionId, conversationHistory);

    // 成功レスポンス
    return res.status(200).json({
      success: true,
      data: {
        message: response,
        sessionId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    // ApiError の場合
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    // 予期しないエラー
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? { message: error.message } : undefined,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
}

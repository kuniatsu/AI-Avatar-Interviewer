/**
 * Shared API Type Definitions
 * フロントエンドとバックエンドで共有される API インターフェース
 */

// ======== Domain Types ========

export interface InterviewItem {
  id: string;
  key: string;
  question: string;
  description: string;
  required: boolean;
}

// ======== Request/Response Types ========

export interface ChatRequest {
  message: string;
  sessionId: string;
  systemPrompt?: string;
  interviewItems?: InterviewItem[];
}

export interface ChatResponseData {
  message: string;
  sessionId: string;
  timestamp: string;
}

export interface ChatResponse {
  success: true;
  data: ChatResponseData;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: number;
  apiVersion: string;
  checks: {
    database?: 'ok' | 'error';
    claudeApi?: 'ok' | 'error';
    cache?: 'ok' | 'error';
  };
}

// ======== Validation Types ========

export interface ValidationError {
  field: string;
  message: string;
}

// ======== Rate Limit Types ========

export interface RateLimitInfo {
  limit: number; // max requests
  remaining: number;
  resetAt: number; // Unix timestamp
}

// ======== Session Types ========

export interface SessionData {
  sessionId: string;
  createdAt: number;
  lastActivityAt: number;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  interviewItems?: InterviewItem[];
}

// ======== API Client Options ========

export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number; // ms
  retryAttempts?: number;
  retryDelay?: number; // ms
}

// ======== Error Handling Types ========

export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ======== Type Guards ========

export function isChatResponse(obj: any): obj is ChatResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.success === true &&
    obj.data &&
    typeof obj.data.message === 'string' &&
    typeof obj.data.sessionId === 'string' &&
    typeof obj.data.timestamp === 'string'
  );
}

export function isErrorResponse(obj: any): obj is ErrorResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.success === false &&
    obj.error &&
    typeof obj.error.code === 'string' &&
    typeof obj.error.message === 'string'
  );
}

export function isHealthCheckResponse(obj: any): obj is HealthCheckResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    ['ok', 'degraded', 'error'].includes(obj.status) &&
    typeof obj.timestamp === 'number'
  );
}

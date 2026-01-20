/**
 * Interview Manager - ヒアリング項目の管理と対話フロー制御
 */

import type { InterviewItem } from './claudeApiClient';

export interface InterviewState {
  status: 'not_started' | 'in_progress' | 'completed' | 'error';
  currentItemIndex: number;
  completedCount: number;
  totalCount: number;
  result?: Record<string, string | undefined>;
  errorMessage?: string;
}

export class InterviewManager {
  private items: InterviewItem[] = [];
  private state: InterviewState = {
    status: 'not_started',
    currentItemIndex: 0,
    completedCount: 0,
    totalCount: 0,
  };
  private startTime: number = 0;
  private onStateChange: ((state: InterviewState) => void) | null = null;

  /**
   * ヒアリング項目を初期化
   */
  initializeItems(items: InterviewItem[]): void {
    this.items = items;
    this.state = {
      status: 'not_started',
      currentItemIndex: 0,
      completedCount: 0,
      totalCount: items.length,
    };
    this.startTime = Date.now();
    this.notifyStateChange();
  }

  /**
   * ヒアリング開始
   */
  startInterview(): void {
    if (this.state.status !== 'not_started') {
      console.warn('Interview already started');
      return;
    }

    this.state.status = 'in_progress';
    this.state.currentItemIndex = 0;
    this.notifyStateChange();
  }

  /**
   * 現在の質問を取得
   */
  getCurrentQuestion(): InterviewItem | null {
    if (this.state.currentItemIndex >= this.items.length) {
      return null;
    }
    return this.items[this.state.currentItemIndex];
  }

  /**
   * 項目値を更新して次へ進む
   */
  completeCurrentItem(value: string): boolean {
    const currentItem = this.getCurrentQuestion();
    if (!currentItem) {
      return false;
    }

    currentItem.value = value;
    this.state.completedCount++;

    // 次の項目へ
    this.state.currentItemIndex++;

    // 全て完了した場合
    if (this.state.currentItemIndex >= this.items.length) {
      this.finishInterview();
    }

    this.notifyStateChange();
    return true;
  }

  /**
   * ヒアリング完了
   */
  private finishInterview(): void {
    this.state.status = 'completed';
    this.state.result = {};

    // 収集したデータを結果に格納
    this.items.forEach((item) => {
      if (this.state.result) {
        this.state.result[item.key] = item.value;
      }
    });

    this.notifyStateChange();
  }

  /**
   * ヒアリングキャンセル/エラー
   */
  cancelInterview(errorMessage?: string): void {
    this.state.status = 'error';
    this.state.errorMessage = errorMessage || 'Interview cancelled';
    this.notifyStateChange();
  }

  /**
   * 進捗率を取得（0-1）
   */
  getProgress(): number {
    return this.state.totalCount > 0
      ? this.state.completedCount / this.state.totalCount
      : 0;
  }

  /**
   * 経過時間を取得（秒）
   */
  getElapsedTime(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * 状態を取得
   */
  getState(): InterviewState {
    return { ...this.state };
  }

  /**
   * 全てのデータを取得
   */
  getCollectedData(): Record<string, string | undefined> {
    const data: Record<string, string | undefined> = {};
    this.items.forEach((item) => {
      data[item.key] = item.value;
    });
    return data;
  }

  /**
   * 未入力の必須項目を取得
   */
  getMissingRequiredItems(): InterviewItem[] {
    return this.items.filter(
      (item) => item.required && !item.value
    );
  }

  /**
   * 状態変更リスナーを登録
   */
  onStateChanged(callback: (state: InterviewState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * 状態変更をリスナーに通知
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  /**
   * リセット
   */
  reset(): void {
    this.items = [];
    this.state = {
      status: 'not_started',
      currentItemIndex: 0,
      completedCount: 0,
      totalCount: 0,
    };
    this.startTime = 0;
    this.notifyStateChange();
  }
}

// シングルトンインスタンス
let interviewManagerInstance: InterviewManager | null = null;

export function getInterviewManager(): InterviewManager {
  if (!interviewManagerInstance) {
    interviewManagerInstance = new InterviewManager();
  }
  return interviewManagerInstance;
}
